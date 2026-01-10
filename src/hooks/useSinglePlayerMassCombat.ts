// ========================
// HOOK: useSinglePlayerMassCombat
// Gerencia o estado do jogo Single Player
// ========================

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { BotDifficulty } from '@/lib/botEngine';
import type {
  SinglePlayerMassCombatState,
  SinglePlayerPhase,
  CombatSubPhase,
  SPPlayerState,
  SPTacticalCard,
  SPCommander,
  ArmyAttributes,
  SPActionLogEntry,
  SinglePlayerSetupConfig,
} from '@/types/singleplayer-mass-combat';
import {
  getBotName,
  getBotThinkingDelay,
  chooseBotCulture,
  chooseBotScenario,
  buildBotDeck,
  makeBotCombatDecision,
  shouldBotReact,
  chooseBotFormation,
  createInitialBotState,
} from '@/lib/massCombatBotEngine';

// ========================
// ESTADO INICIAL
// ========================

function createInitialPlayerState(nickname: string): SPPlayerState {
  return {
    isBot: false,
    nickname,
    
    culture: null,
    cultureConfirmed: false,
    
    logisticsBid: 0,
    logisticsConfirmed: false,
    
    attributes: { attack: 0, defense: 0, mobility: 0 },
    commanders: [],
    generalId: null,
    deck: { offensive: [], defensive: [], initiative: [], reactions: [] },
    deckConfirmed: false,
    
    hp: 0,
    hand: [],
    discardPile: [],
    drawPile: [],
    
    roundCardsPlayed: [],
    cmdSpentThisRound: 0,
  };
}

function createInitialState(config: SinglePlayerSetupConfig): SinglePlayerMassCombatState {
  return {
    gameId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    
    difficulty: config.difficulty,
    vetBudget: config.vetBudget ?? 100,
    
    phase: 'setup',
    combatRound: 0,
    
    player: createInitialPlayerState(config.playerNickname ?? 'Jogador'),
    bot: createInitialBotState(config.difficulty, config.vetBudget ?? 100),
    
    scenarioOptions: null,
    chosenScenario: null,
    scenarioWinner: null,
    
    currentAttacker: 'player',
    firstAttacker: null,
    
    winner: null,
    
    actionLog: [],
  };
}

// ========================
// HOOK PRINCIPAL
// ========================

export function useSinglePlayerMassCombat() {
  const [gameState, setGameState] = useState<SinglePlayerMassCombatState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  
  // Dados do banco
  const [cultures, setCultures] = useState<Array<{ id: string; name: string }>>([]);
  const [terrains, setTerrains] = useState<Array<{ id: string; name: string }>>([]);
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string }>>([]);
  const [tacticalCards, setTacticalCards] = useState<SPTacticalCard[]>([]);
  const [commanderTemplates, setCommanderTemplates] = useState<Array<{
    id: string;
    numero: number;
    especializacao: string;
    comando: number;
    estrategia: number;
    guarda: number;
    custo_vet: number;
  }>>([]);
  
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ========================
  // CARREGAR DADOS
  // ========================
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar culturas
        const { data: culturesData } = await supabase
          .from('mass_combat_cultures')
          .select('id, name')
          .order('name');
        if (culturesData) setCultures(culturesData);
        
        // Carregar terrenos
        const { data: terrainsData } = await supabase
          .from('mass_combat_primary_terrains')
          .select('id, name')
          .order('name');
        if (terrainsData) setTerrains(terrainsData);
        
        // Carregar estações
        const { data: seasonsData } = await supabase
          .from('mass_combat_seasons')
          .select('id, name')
          .order('name');
        if (seasonsData) setSeasons(seasonsData);
        
        // Carregar cartas táticas
        const { data: cardsData } = await supabase
          .from('mass_combat_tactical_cards')
          .select('*')
          .order('name');
        if (cardsData) {
          setTacticalCards(cardsData.map(card => ({
            id: card.id,
            name: card.name,
            card_type: (card.card_type || 'ofensiva') as SPTacticalCard['card_type'],
            attack_bonus: card.attack_bonus || 0,
            defense_bonus: card.defense_bonus || 0,
            mobility_bonus: card.mobility_bonus || 0,
            command_required: card.command_required || 0,
            strategy_required: card.strategy_required || 0,
            vet_cost: card.vet_cost || 0,
            description: card.description || undefined,
            culture: card.culture || undefined,
            effect_tag: card.effect_tag || undefined,
          })));
        }
        
        // Carregar templates de comandantes
        const { data: cmdData } = await supabase
          .from('mass_combat_commander_templates')
          .select('*')
          .order('numero');
        if (cmdData) setCommanderTemplates(cmdData);
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados do jogo');
      }
    };
    
    loadData();
  }, []);

  // ========================
  // LOGGING
  // ========================
  
  const addLog = useCallback((
    actor: 'player' | 'bot' | 'system',
    action: string,
    details?: string
  ) => {
    setGameState(prev => {
      if (!prev) return prev;
      const entry: SPActionLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor,
        action,
        details,
      };
      return {
        ...prev,
        actionLog: [...prev.actionLog, entry],
      };
    });
  }, []);

  // ========================
  // INICIAR JOGO
  // ========================
  
  const startGame = useCallback((config: SinglePlayerSetupConfig) => {
    setIsLoading(true);
    
    const state = createInitialState(config);
    state.phase = 'culture_selection';
    
    setGameState(state);
    addLog('system', 'Jogo iniciado', `Dificuldade: ${config.difficulty}`);
    
    setIsLoading(false);
  }, [addLog]);

  // ========================
  // SELEÇÃO DE CULTURA
  // ========================
  
  const selectPlayerCulture = useCallback((cultureId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const cultureName = cultures.find(c => c.id === cultureId)?.name || cultureId;
      return {
        ...prev,
        player: { ...prev.player, culture: cultureId, cultureConfirmed: true },
      };
    });
    addLog('player', 'Cultura selecionada', cultures.find(c => c.id === cultureId)?.name);
  }, [cultures, addLog]);
  
  const confirmCulturePhase = useCallback(() => {
    if (!gameState?.player.cultureConfirmed) {
      toast.error('Selecione uma cultura primeiro');
      return;
    }
    
    setIsBotThinking(true);
    
    // Bot escolhe cultura
    const delay = getBotThinkingDelay(gameState.difficulty);
    botTimeoutRef.current = setTimeout(() => {
      const botCulture = chooseBotCulture(gameState.difficulty);
      const botCultureName = cultures.find(c => c.id === botCulture)?.name || botCulture;
      
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          bot: { ...prev.bot, culture: botCulture, cultureConfirmed: true },
          phase: 'scenario_selection',
          scenarioOptions: generateScenarioOptions(),
        };
      });
      
      addLog('bot', 'Cultura selecionada', botCultureName);
      addLog('system', 'Avançando para seleção de cenário');
      setIsBotThinking(false);
    }, delay);
  }, [gameState, cultures, addLog]);
  
  const generateScenarioOptions = useCallback(() => {
    // Sortear 3 terrenos e 3 estações
    const shuffledTerrains = [...terrains].sort(() => Math.random() - 0.5).slice(0, 3);
    const shuffledSeasons = [...seasons].sort(() => Math.random() - 0.5).slice(0, 3);
    
    return {
      terrains: shuffledTerrains.map((t, i) => ({ id: t.id, name: t.name, order: i + 1 })),
      seasons: shuffledSeasons.map((s, i) => ({ id: s.id, name: s.name, order: i + 1 })),
    };
  }, [terrains, seasons]);

  // ========================
  // SELEÇÃO DE CENÁRIO
  // ========================
  
  const submitLogisticsBid = useCallback((terrainId: string, seasonId: string, bid: number) => {
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        player: { ...prev.player, logisticsBid: bid, logisticsConfirmed: true },
      };
    });
    
    addLog('player', 'Aposta de logística confirmada', `${bid} pontos`);
    
    // Bot faz sua escolha
    setIsBotThinking(true);
    const delay = getBotThinkingDelay(gameState?.difficulty || 'medium');
    
    botTimeoutRef.current = setTimeout(() => {
      if (!gameState?.scenarioOptions) return;
      
      const botChoice = chooseBotScenario(
        gameState.scenarioOptions.terrains,
        gameState.scenarioOptions.seasons,
        gameState.difficulty
      );
      
      // Determinar vencedor (maior bid ganha)
      const playerWins = bid >= botChoice.logisticsBid;
      const chosenTerrainId = playerWins ? terrainId : botChoice.terrainId;
      const chosenSeasonId = playerWins ? seasonId : botChoice.seasonId;
      
      const chosenTerrain = gameState.scenarioOptions.terrains.find(t => t.id === chosenTerrainId);
      const chosenSeason = gameState.scenarioOptions.seasons.find(s => s.id === chosenSeasonId);
      
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          bot: { ...prev.bot, logisticsBid: botChoice.logisticsBid, logisticsConfirmed: true },
          chosenScenario: {
            terrainId: chosenTerrainId,
            terrainName: chosenTerrain?.name || 'Desconhecido',
            seasonId: chosenSeasonId,
            seasonName: chosenSeason?.name || 'Desconhecido',
          },
          scenarioWinner: playerWins ? 'player' : 'bot',
          phase: 'deckbuilding',
        };
      });
      
      addLog('bot', 'Aposta de logística', `${botChoice.logisticsBid} pontos`);
      addLog('system', playerWins ? 'Jogador venceu a logística!' : 'Bot venceu a logística!');
      addLog('system', 'Cenário definido', `${chosenTerrain?.name} - ${chosenSeason?.name}`);
      
      setIsBotThinking(false);
    }, delay);
  }, [gameState, addLog]);

  // ========================
  // DECKBUILDING
  // ========================
  
  const setPlayerAttributes = useCallback((attributes: ArmyAttributes) => {
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        player: { ...prev.player, attributes },
      };
    });
  }, []);
  
  const addPlayerCommander = useCallback((template: typeof commanderTemplates[0]) => {
    setGameState(prev => {
      if (!prev) return prev;
      
      const newCommander: SPCommander = {
        instance_id: `player_cmd_${Date.now()}`,
        template_id: template.id,
        numero: template.numero,
        especializacao: template.especializacao,
        comando_base: template.comando,
        cmd_free: template.comando,
        estrategia: template.estrategia,
        guarda_max: template.guarda,
        guarda_current: template.guarda,
        is_general: prev.player.commanders.length === 0,
        custo_vet: template.custo_vet,
      };
      
      return {
        ...prev,
        player: {
          ...prev.player,
          commanders: [...prev.player.commanders, newCommander],
          generalId: prev.player.commanders.length === 0 ? newCommander.instance_id : prev.player.generalId,
        },
      };
    });
    
    addLog('player', 'Comandante adicionado', `#${template.numero} ${template.especializacao}`);
  }, [addLog]);
  
  const removePlayerCommander = useCallback((instanceId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const filtered = prev.player.commanders.filter(c => c.instance_id !== instanceId);
      return {
        ...prev,
        player: {
          ...prev.player,
          commanders: filtered,
          generalId: prev.player.generalId === instanceId 
            ? (filtered[0]?.instance_id || null)
            : prev.player.generalId,
        },
      };
    });
  }, []);
  
  const setPlayerGeneral = useCallback((instanceId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        player: {
          ...prev.player,
          generalId: instanceId,
          commanders: prev.player.commanders.map(c => ({
            ...c,
            is_general: c.instance_id === instanceId,
          })),
        },
      };
    });
  }, []);
  
  const addCardToDeck = useCallback((card: SPTacticalCard, category: keyof SPPlayerState['deck']) => {
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        player: {
          ...prev.player,
          deck: {
            ...prev.player.deck,
            [category]: [...prev.player.deck[category], card],
          },
        },
      };
    });
  }, []);
  
  const removeCardFromDeck = useCallback((cardId: string, category: keyof SPPlayerState['deck']) => {
    setGameState(prev => {
      if (!prev) return prev;
      const cardIndex = prev.player.deck[category].findIndex(c => c.id === cardId);
      if (cardIndex === -1) return prev;
      const newCards = [...prev.player.deck[category]];
      newCards.splice(cardIndex, 1);
      return {
        ...prev,
        player: {
          ...prev.player,
          deck: { ...prev.player.deck, [category]: newCards },
        },
      };
    });
  }, []);
  
  const confirmDeckbuilding = useCallback(() => {
    if (!gameState) return;
    
    // Validar deck do jogador
    const { player, vetBudget } = gameState;
    const attrCost = (player.attributes.attack + player.attributes.defense + player.attributes.mobility) * 5;
    const cmdCost = player.commanders.reduce((sum, c) => sum + c.custo_vet, 0);
    const cardsCost = [...player.deck.offensive, ...player.deck.defensive, ...player.deck.initiative, ...player.deck.reactions]
      .reduce((sum, c) => sum + (c.vet_cost || 0), 0);
    
    if (attrCost + cmdCost + cardsCost > vetBudget) {
      toast.error('Custo do deck excede o orçamento VET');
      return;
    }
    
    if (player.commanders.length === 0) {
      toast.error('Adicione pelo menos um comandante');
      return;
    }
    
    if (!player.generalId) {
      toast.error('Defina um general');
      return;
    }
    
    setIsBotThinking(true);
    addLog('player', 'Deckbuilding confirmado');
    
    // Bot constrói seu deck
    const delay = getBotThinkingDelay(gameState.difficulty);
    
    botTimeoutRef.current = setTimeout(() => {
      const botDeck = buildBotDeck(
        gameState.difficulty,
        gameState.vetBudget,
        tacticalCards,
        commanderTemplates
      );
      
      // Calcular HP (10% do VET)
      const playerHp = Math.floor(gameState.vetBudget * 0.1);
      const botHp = Math.floor(gameState.vetBudget * 0.1);
      
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          player: { ...prev.player, deckConfirmed: true, hp: playerHp },
          bot: {
            ...prev.bot,
            attributes: botDeck.attributes,
            commanders: botDeck.commanders,
            generalId: botDeck.generalId,
            deck: botDeck.deck,
            deckConfirmed: true,
            hp: botHp,
          },
          phase: 'deployment',
        };
      });
      
      addLog('bot', 'Deckbuilding confirmado');
      addLog('system', 'Avançando para posicionamento');
      setIsBotThinking(false);
    }, delay);
  }, [gameState, tacticalCards, commanderTemplates, addLog]);

  // ========================
  // DEPLOYMENT
  // ========================
  
  const confirmDeployment = useCallback((formation: 'aggressive' | 'balanced' | 'defensive') => {
    if (!gameState) return;
    
    setIsBotThinking(true);
    addLog('player', 'Formação escolhida', formation);
    
    const delay = getBotThinkingDelay(gameState.difficulty);
    
    botTimeoutRef.current = setTimeout(() => {
      const botFormation = chooseBotFormation(gameState.difficulty);
      
      // Preparar mãos iniciais (comprar 7 cartas)
      const prepareHand = (state: SPPlayerState): SPPlayerState => {
        const allCards = [
          ...state.deck.offensive,
          ...state.deck.defensive,
          ...state.deck.initiative,
          ...state.deck.reactions,
        ];
        const shuffled = [...allCards].sort(() => Math.random() - 0.5);
        const hand = shuffled.slice(0, 7);
        const drawPile = shuffled.slice(7);
        
        return { ...state, hand, drawPile };
      };
      
      // Determinar primeiro atacante (quem ganhou cenário ataca primeiro)
      const firstAttacker = gameState.scenarioWinner || 'player';
      
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          player: prepareHand(prev.player),
          bot: prepareHand(prev.bot),
          phase: 'combat',
          combatSubPhase: 'initiative_maneuver',
          combatRound: 1,
          firstAttacker,
          currentAttacker: firstAttacker,
        };
      });
      
      addLog('bot', 'Formação escolhida', botFormation);
      addLog('system', 'Batalha iniciada!', `${firstAttacker === 'player' ? 'Jogador' : 'Bot'} ataca primeiro`);
      setIsBotThinking(false);
    }, delay);
  }, [gameState, addLog]);

  // ========================
  // COMBATE
  // ========================
  
  const playCard = useCallback((card: SPTacticalCard, commanderId: string) => {
    if (!gameState || gameState.phase !== 'combat') return;
    
    // Remover carta da mão
    setGameState(prev => {
      if (!prev) return prev;
      
      const handIndex = prev.player.hand.findIndex(c => c.id === card.id);
      if (handIndex === -1) return prev;
      
      const newHand = [...prev.player.hand];
      newHand.splice(handIndex, 1);
      
      // Gastar CMD do comandante
      const newCommanders = prev.player.commanders.map(cmd => 
        cmd.instance_id === commanderId
          ? { ...cmd, cmd_free: cmd.cmd_free - (card.command_required || 0) }
          : cmd
      );
      
      return {
        ...prev,
        player: {
          ...prev.player,
          hand: newHand,
          commanders: newCommanders,
          roundCardsPlayed: [...prev.player.roundCardsPlayed, card],
        },
      };
    });
    
    addLog('player', 'Carta jogada', card.name);
  }, [gameState, addLog]);
  
  const passPhase = useCallback(() => {
    if (!gameState || gameState.phase !== 'combat') return;
    
    addLog('player', 'Passou a fase');
    advanceCombatPhase();
  }, [gameState, addLog]);
  
  const advanceCombatPhase = useCallback(() => {
    if (!gameState) return;
    
    const phaseOrder: CombatSubPhase[] = [
      'initiative_maneuver',
      'initiative_reaction',
      'attack_maneuver',
      'attack_reaction',
      'defense_maneuver',
      'defense_reaction',
      'resolution',
    ];
    
    const currentIndex = phaseOrder.indexOf(gameState.combatSubPhase!);
    const nextPhase = phaseOrder[currentIndex + 1];
    
    if (nextPhase === 'resolution') {
      // Resolver o round
      resolveRound();
    } else {
      setGameState(prev => {
        if (!prev) return prev;
        return { ...prev, combatSubPhase: nextPhase };
      });
      
      // Se for fase do bot, executar ação do bot
      const isReactionPhase = nextPhase.includes('reaction');
      if (isReactionPhase) {
        executeBotReaction(nextPhase);
      }
    }
  }, [gameState]);
  
  const resolveRound = useCallback(() => {
    if (!gameState) return;
    
    // Calcular dano simplificado
    const playerAttackBonus = gameState.player.roundCardsPlayed
      .reduce((sum, c) => sum + (c.attack_bonus || 0), 0);
    const playerDefenseBonus = gameState.player.roundCardsPlayed
      .reduce((sum, c) => sum + (c.defense_bonus || 0), 0);
    
    const botAttackBonus = gameState.bot.roundCardsPlayed
      .reduce((sum, c) => sum + (c.attack_bonus || 0), 0);
    const botDefenseBonus = gameState.bot.roundCardsPlayed
      .reduce((sum, c) => sum + (c.defense_bonus || 0), 0);
    
    // Dano = Ataque - Defesa (mínimo 0)
    const playerDamage = Math.max(0, playerAttackBonus - botDefenseBonus);
    const botDamage = Math.max(0, botAttackBonus - playerDefenseBonus);
    
    const newBotHp = Math.max(0, gameState.bot.hp - playerDamage);
    const newPlayerHp = Math.max(0, gameState.player.hp - botDamage);
    
    addLog('system', 'Round resolvido', 
      `Jogador causa ${playerDamage} de dano. Bot causa ${botDamage} de dano.`);
    
    // Verificar vitória
    let winner: 'player' | 'bot' | null = null;
    if (newBotHp <= 0 && newPlayerHp <= 0) {
      winner = 'player'; // Empate vai para o jogador
    } else if (newBotHp <= 0) {
      winner = 'player';
    } else if (newPlayerHp <= 0) {
      winner = 'bot';
    }
    
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        player: {
          ...prev.player,
          hp: newPlayerHp,
          roundCardsPlayed: [],
          discardPile: [...prev.player.discardPile, ...prev.player.roundCardsPlayed],
        },
        bot: {
          ...prev.bot,
          hp: newBotHp,
          roundCardsPlayed: [],
          discardPile: [...prev.bot.discardPile, ...prev.bot.roundCardsPlayed],
        },
        combatRound: prev.combatRound + 1,
        combatSubPhase: 'initiative_maneuver',
        currentAttacker: prev.currentAttacker === 'player' ? 'bot' : 'player',
        winner,
        phase: winner ? 'finished' : 'combat',
      };
    });
    
    if (winner) {
      addLog('system', winner === 'player' ? 'VITÓRIA!' : 'DERROTA!');
    }
  }, [gameState, addLog]);
  
  const executeBotReaction = useCallback((phase: CombatSubPhase) => {
    if (!gameState) return;
    
    setIsBotThinking(true);
    const delay = getBotThinkingDelay(gameState.difficulty);
    
    botTimeoutRef.current = setTimeout(() => {
      const decision = shouldBotReact(gameState.bot, phase, gameState.difficulty);
      
      if (decision.action === 'play_card' && decision.card) {
        setGameState(prev => {
          if (!prev) return prev;
          
          const handIndex = prev.bot.hand.findIndex(c => c.id === decision.card!.id);
          if (handIndex === -1) return prev;
          
          const newHand = [...prev.bot.hand];
          newHand.splice(handIndex, 1);
          
          const newCommanders = prev.bot.commanders.map(cmd =>
            cmd.instance_id === decision.commanderId
              ? { ...cmd, cmd_free: cmd.cmd_free - (decision.card!.command_required || 0) }
              : cmd
          );
          
          return {
            ...prev,
            bot: {
              ...prev.bot,
              hand: newHand,
              commanders: newCommanders,
              roundCardsPlayed: [...prev.bot.roundCardsPlayed, decision.card!],
            },
          };
        });
        
        addLog('bot', 'Reação jogada', decision.card.name);
      } else {
        addLog('bot', 'Passou reação');
      }
      
      setIsBotThinking(false);
    }, delay);
  }, [gameState, addLog]);

  // ========================
  // RESET
  // ========================
  
  const resetGame = useCallback(() => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
    }
    setGameState(null);
  }, []);

  // ========================
  // CLEANUP
  // ========================
  
  useEffect(() => {
    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
      }
    };
  }, []);

  // ========================
  // RETURN
  // ========================
  
  return {
    // Estado
    gameState,
    isLoading,
    isBotThinking,
    
    // Dados
    cultures,
    terrains,
    seasons,
    tacticalCards,
    commanderTemplates,
    
    // Ações
    startGame,
    selectPlayerCulture,
    confirmCulturePhase,
    submitLogisticsBid,
    setPlayerAttributes,
    addPlayerCommander,
    removePlayerCommander,
    setPlayerGeneral,
    addCardToDeck,
    removeCardFromDeck,
    confirmDeckbuilding,
    confirmDeployment,
    playCard,
    passPhase,
    resetGame,
  };
}
