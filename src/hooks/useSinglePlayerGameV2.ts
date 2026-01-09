// ========================
// SINGLE PLAYER GAME HOOK V2
// Sistema completo com todas as fases do multiplayer
// ========================

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BotDifficulty, getBotName, getBotDelayMs, makeBotCultureChoice, makeBotLogisticsBid } from '@/lib/botEngine';
import {
  SPGameState,
  SPGamePhase,
  SPCombatPhase,
  SPCard,
  SPCommander,
  SPManeuver,
  SPScenarioOption,
  SPBasicCardsUsed,
  createInitialBoard,
  createInitialBasicCards,
  resetBoardForNewRound,
  resolveInitiativeRoll,
  resolveCombatRoll,
  calculateBaseHp,
  calculateBotHp,
  getNextCombatPhase,
  getPlayableCards,
  canCommanderPlayCard,
  botDecideInitiativeManeuver,
  botDecideReaction,
  botDecideAttackManeuvers,
  botDecideDefenseManeuvers,
  botChooseSecondaryTerrain,
  botChooseFirstAttacker,
} from '@/lib/singlePlayerCombatEngine';
import { StrategicArmy } from '@/types/combat/strategic-army';

// ========================
// INITIAL STATE
// ========================

const createInitialState = (): SPGameState => ({
  phase: 'army_selection',
  combatPhase: 'initiative_maneuver',
  round: 1,
  
  playerCulture: null,
  playerCultureName: null,
  playerHand: [],
  playerDeck: [],
  playerDiscard: [],
  playerCommanders: [],
  playerGeneralId: null,
  playerHp: 10,
  playerMaxHp: 10,
  playerAttributes: { attack: 0, defense: 0, mobility: 0 },
  playerVetBudget: 0,
  playerVetSpent: 0,
  playerBasicCardsUsed: createInitialBasicCards(),
  playerBasicCardsBonuses: {},
  
  botDifficulty: 'medium',
  botName: 'Bot',
  botCulture: null,
  botCultureName: null,
  botHand: [],
  botDeck: [],
  botDiscard: [],
  botCommanders: [],
  botGeneralId: null,
  botHp: 10,
  botMaxHp: 10,
  botAttributes: { attack: 0, defense: 0, mobility: 0 },
  botBasicCardsUsed: createInitialBasicCards(),
  botBasicCardsBonuses: {},
  
  scenarioOptions: [],
  playerLogisticsBid: null,
  botLogisticsBid: null,
  scenarioWinner: null,
  selectedTerrainId: null,
  selectedTerrainName: null,
  selectedSeasonId: null,
  selectedSeasonName: null,
  secondaryTerrainId: null,
  secondaryTerrainName: null,
  
  board: createInitialBoard(),
  
  battleLog: [],
  isLoading: false,
  winner: null,
  awaitingPlayer: true,
});

// ========================
// HOOK
// ========================

export function useSinglePlayerGameV2() {
  const [state, setState] = useState<SPGameState>(createInitialState());
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // ========================
  // HELPERS
  // ========================
  
  const addLog = useCallback((message: string, type: 'info' | 'damage' | 'effect' | 'phase' = 'info') => {
    setState(prev => ({
      ...prev,
      battleLog: [...prev.battleLog, { message, timestamp: Date.now(), type }].slice(-100),
    }));
  }, []);
  
  const clearBotTimer = useCallback(() => {
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }
  }, []);
  
  // ========================
  // INICIALIZAÇÃO
  // ========================
  
  const startGameWithArmy = useCallback(async (army: StrategicArmy, difficulty: BotDifficulty) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Buscar cultura do jogador
      let playerCultureName = army.cultureName || army.culture || 'Desconhecida';
      if (army.culture) {
        const { data: cultureData } = await supabase
          .from('mass_combat_cultures')
          .select('name')
          .eq('id', army.culture)
          .single();
        if (cultureData) playerCultureName = cultureData.name;
      }
      
      // Bot escolhe cultura
      const botCultureName = makeBotCultureChoice(difficulty);
      let botCultureId: string | null = null;
      
      const { data: botCultureData } = await supabase
        .from('mass_combat_cultures')
        .select('id, name')
        .eq('name', botCultureName)
        .single();
      if (botCultureData) {
        botCultureId = botCultureData.id;
      }
      
      // Converter comandantes do exército para SPCommander
      const armyCommanders = army.commanders || [];
      
      const playerCommanders: SPCommander[] = armyCommanders.map((cmd, i) => ({
        instance_id: `player-cmd-${i}`,
        template_id: cmd.templateId,
        numero: i + 1,
        especializacao: cmd.especializacao,
        comando_base: cmd.comando,
        cmd_free: cmd.comando,
        estrategia: cmd.estrategia,
        guarda_base: cmd.guarda,
        guarda_current: cmd.guarda,
        is_general: cmd.isGeneral || false,
        vet_cost: cmd.custoVet,
      }));
      
      const playerGeneralId = playerCommanders.find(c => c.is_general)?.instance_id || null;
      
      // Converter cartas do exército
      const armyCards = army.tacticalCards || [];
      
      // Buscar detalhes completos das cartas
      const cardIds = armyCards.map(c => c.cardId);
      const { data: cardsData } = await supabase
        .from('mass_combat_tactical_cards')
        .select('*')
        .in('id', cardIds);
      
      const playerDeck: SPCard[] = (cardsData || []).map(c => ({
        id: c.id,
        name: c.name,
        card_type: c.card_type as SPCard['card_type'],
        unit_type: c.unit_type,
        attack_bonus: c.attack_bonus,
        defense_bonus: c.defense_bonus,
        mobility_bonus: c.mobility_bonus,
        command_required: c.command_required,
        strategy_required: c.strategy_required,
        vet_cost: c.vet_cost,
        minor_effect: c.minor_effect || undefined,
        major_effect: c.major_effect || undefined,
        culture: c.culture || undefined,
      }));
      
      // Criar comandantes do bot
      const { data: cmdTemplates } = await supabase
        .from('mass_combat_commander_templates')
        .select('*')
        .order('numero', { ascending: true })
        .limit(3);
      
      const botCommanders: SPCommander[] = (cmdTemplates || []).map((t, i) => ({
        instance_id: `bot-cmd-${i}`,
        template_id: t.id,
        numero: t.numero,
        especializacao: t.especializacao,
        comando_base: t.comando,
        cmd_free: t.comando,
        estrategia: t.estrategia,
        guarda_base: t.guarda,
        guarda_current: t.guarda,
        is_general: i === 0, // Primeiro é general
        vet_cost: t.custo_vet,
      }));
      
      const botGeneralId = botCommanders[0]?.instance_id || null;
      
      // Buscar cartas para o bot - garantir pelo menos uma de cada tipo
      const { data: botCardsData } = await supabase
        .from('mass_combat_tactical_cards')
        .select('*')
        .or(`culture.eq.${botCultureName},culture.is.null`)
        .limit(30);
      
      // Organizar cartas por tipo para garantir cobertura
      const cardsByType: Record<string, typeof botCardsData> = {
        ofensiva: [],
        defensiva: [],
        movimentacao: [],
        reacao: [],
      };
      
      (botCardsData || []).forEach(c => {
        if (cardsByType[c.card_type]) {
          cardsByType[c.card_type]!.push(c);
        }
      });
      
      // Garantir pelo menos 2 cartas de cada tipo
      const guaranteedCards: typeof botCardsData = [];
      Object.values(cardsByType).forEach(cards => {
        if (cards && cards.length > 0) {
          guaranteedCards.push(cards[0]);
          if (cards.length > 1) guaranteedCards.push(cards[1]);
        }
      });
      
      // Adicionar mais cartas aleatórias
      const remainingCards = (botCardsData || []).filter(c => 
        !guaranteedCards.some(g => g.id === c.id)
      ).slice(0, 8);
      
      const allBotCards = [...guaranteedCards, ...remainingCards];
      
      const botDeck: SPCard[] = allBotCards.map(c => ({
        id: c.id,
        name: c.name,
        card_type: c.card_type as SPCard['card_type'],
        unit_type: c.unit_type,
        attack_bonus: c.attack_bonus,
        defense_bonus: c.defense_bonus,
        mobility_bonus: c.mobility_bonus,
        command_required: c.command_required,
        strategy_required: c.strategy_required,
        vet_cost: c.vet_cost,
        minor_effect: c.minor_effect || undefined,
        major_effect: c.major_effect || undefined,
        culture: c.culture || undefined,
      }));
      
      // Gerar opções de cenário
      const { data: terrains } = await supabase
        .from('mass_combat_primary_terrains')
        .select('id, name')
        .limit(3);
      
      const { data: seasons } = await supabase
        .from('mass_combat_seasons')
        .select('id, name')
        .limit(4);
      
      const scenarioOptions: SPScenarioOption[] = [];
      (terrains || []).forEach((t, i) => {
        const season = seasons?.[i % (seasons?.length || 1)];
        if (season) {
          scenarioOptions.push({
            terrain_id: t.id,
            terrain_name: t.name,
            season_id: season.id,
            season_name: season.name,
            draw_order: i + 1,
          });
        }
      });
      
      // Calcular HP
      const playerMaxHp = calculateBaseHp(army.totalVet);
      const botMaxHp = calculateBotHp(difficulty, army.totalVet);
      
      // Bot atributos (baseado na dificuldade)
      const botAttrs = {
        attack: difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1,
        defense: difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1,
        mobility: difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1 : 0,
      };
      
      // Comprar mão inicial (5 cartas)
      const playerHand = playerDeck.slice(0, 5);
      const playerDeckRemaining = playerDeck.slice(5);
      const botHand = botDeck.slice(0, 5);
      const botDeckRemaining = botDeck.slice(5);
      
      // Deploy de comandantes no board
      const board = createInitialBoard();
      board.player.deployed_commanders = playerCommanders;
      board.bot.deployed_commanders = botCommanders;
      
      setState({
        ...createInitialState(),
        phase: 'scenario_selection',
        
        playerCulture: army.culture,
        playerCultureName,
        playerHand,
        playerDeck: playerDeckRemaining,
        playerCommanders,
        playerGeneralId,
        playerHp: playerMaxHp,
        playerMaxHp,
        playerAttributes: {
          attack: army.attack,
          defense: army.defense,
          mobility: army.mobility,
        },
        playerVetBudget: army.totalVet,
        playerVetSpent: army.totalVet,
        
        botDifficulty: difficulty,
        botName: getBotName(difficulty),
        botCulture: botCultureId,
        botCultureName,
        botHand,
        botDeck: botDeckRemaining,
        botCommanders,
        botGeneralId,
        botHp: botMaxHp,
        botMaxHp,
        botAttributes: botAttrs,
        
        scenarioOptions,
        board,
        
        isLoading: false,
        awaitingPlayer: true,
      });
      
      addLog(`⚔️ Batalha: ${army.name} (${playerCultureName}) vs ${getBotName(difficulty)} (${botCultureName})`, 'phase');
      addLog('Fase de Seleção de Cenário - Faça seu lance de logística', 'info');
      
    } catch (err) {
      console.error('Erro ao iniciar jogo:', err);
      toast.error('Erro ao iniciar batalha');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [addLog]);
  
  // ========================
  // CENÁRIO
  // ========================
  
  const submitLogisticsBid = useCallback((bid: number) => {
    const botBid = makeBotLogisticsBid(state.botDifficulty, 5);
    
    addLog(`Você apostou ${bid} de logística`, 'info');
    addLog(`${state.botName} apostou ${botBid} de logística`, 'info');
    
    const playerWins = bid >= botBid;
    const winner: 'player' | 'bot' = playerWins ? 'player' : 'bot';
    
    addLog(`${playerWins ? 'Você' : state.botName} venceu a disputa de cenário!`, 'effect');
    
    setState(prev => ({
      ...prev,
      playerLogisticsBid: bid,
      botLogisticsBid: botBid,
      scenarioWinner: winner,
      awaitingPlayer: playerWins, // Se jogador venceu, aguarda escolha
    }));
    
    // Se bot venceu, ele escolhe automaticamente
    if (!playerWins) {
      const delay = getBotDelayMs(state.botDifficulty);
      botTimerRef.current = setTimeout(() => {
        const option = state.scenarioOptions[Math.floor(Math.random() * state.scenarioOptions.length)];
        if (option) {
          setState(prev => ({
            ...prev,
            selectedTerrainId: option.terrain_id,
            selectedTerrainName: option.terrain_name,
            selectedSeasonId: option.season_id,
            selectedSeasonName: option.season_name,
            phase: 'combat',
            awaitingPlayer: true,
          }));
          addLog(`${state.botName} escolheu: ${option.terrain_name} + ${option.season_name}`, 'info');
          addLog('🗡️ Fase de Combate iniciada!', 'phase');
        }
      }, delay);
    }
  }, [state.botDifficulty, state.botName, state.scenarioOptions, addLog]);
  
  const selectScenario = useCallback((terrainId: string, seasonId: string) => {
    const option = state.scenarioOptions.find(o => o.terrain_id === terrainId && o.season_id === seasonId);
    if (!option) return;
    
    addLog(`Você escolheu: ${option.terrain_name} + ${option.season_name}`, 'info');
    addLog('🗡️ Fase de Combate iniciada!', 'phase');
    
    setState(prev => ({
      ...prev,
      selectedTerrainId: option.terrain_id,
      selectedTerrainName: option.terrain_name,
      selectedSeasonId: option.season_id,
      selectedSeasonName: option.season_name,
      phase: 'combat',
      combatPhase: 'initiative_maneuver',
      awaitingPlayer: true,
    }));
  }, [state.scenarioOptions, addLog]);
  
  // ========================
  // COMBATE: INICIATIVA
  // ========================
  
  const playInitiativeManeuver = useCallback((cardIndex: number, commanderId: string) => {
    const card = state.playerHand[cardIndex];
    const commander = state.playerCommanders.find(c => c.instance_id === commanderId);
    
    if (!card || !commander) {
      toast.error('Carta ou comandante inválido');
      return;
    }
    
    const { canPlay, reason } = canCommanderPlayCard(commander, card, commander.is_general);
    if (!canPlay) {
      toast.error(reason || 'Não pode jogar esta carta');
      return;
    }
    
    // Atualizar estado
    const newHand = state.playerHand.filter((_, i) => i !== cardIndex);
    const updatedCommanders = state.playerCommanders.map(c =>
      c.instance_id === commanderId
        ? { ...c, cmd_free: c.cmd_free - (card.command_required || 0) }
        : c
    );
    
    const maneuver: SPManeuver = {
      card,
      commander_id: commanderId,
      confirmed: false,
    };
    
    addLog(`Você jogou ${card.name} com ${commander.especializacao}`, 'effect');
    
    setState(prev => ({
      ...prev,
      playerHand: newHand,
      playerCommanders: updatedCommanders,
      board: {
        ...prev.board,
        player: {
          ...prev.board.player,
          maneuver,
        },
      },
    }));
  }, [state.playerHand, state.playerCommanders, addLog]);
  
  const confirmInitiativeManeuver = useCallback(() => {
    addLog('Você confirmou sua manobra de iniciativa', 'info');
    
    setState(prev => ({
      ...prev,
      board: {
        ...prev.board,
        player: {
          ...prev.board.player,
          confirmed_maneuver: true,
        },
      },
      awaitingPlayer: false,
    }));
    
    // Bot joga
    const delay = getBotDelayMs(state.botDifficulty);
    botTimerRef.current = setTimeout(() => {
      const decision = botDecideInitiativeManeuver(state.botHand, state.botCommanders, state.botDifficulty);
      
      if (decision) {
        const card = state.botHand[decision.cardIndex];
        const commander = state.botCommanders.find(c => c.instance_id === decision.commanderId);
        
        if (card && commander) {
          const newBotHand = state.botHand.filter((_, i) => i !== decision.cardIndex);
          const updatedBotCommanders = state.botCommanders.map(c =>
            c.instance_id === decision.commanderId
              ? { ...c, cmd_free: c.cmd_free - (card.command_required || 0) }
              : c
          );
          
          const maneuver: SPManeuver = {
            card,
            commander_id: decision.commanderId,
            confirmed: true,
          };
          
          addLog(`${state.botName} jogou ${card.name}`, 'effect');
          
          setState(prev => ({
            ...prev,
            botHand: newBotHand,
            botCommanders: updatedBotCommanders,
            board: {
              ...prev.board,
              bot: {
                ...prev.board.bot,
                maneuver,
                confirmed_maneuver: true,
              },
            },
            combatPhase: 'initiative_reaction',
            awaitingPlayer: true,
          }));
        }
      } else {
        addLog(`${state.botName} passou a manobra`, 'info');
        setState(prev => ({
          ...prev,
          board: {
            ...prev.board,
            bot: {
              ...prev.board.bot,
              confirmed_maneuver: true,
            },
          },
          combatPhase: 'initiative_reaction',
          awaitingPlayer: true,
        }));
      }
    }, delay);
  }, [state.botDifficulty, state.botHand, state.botCommanders, state.botName, addLog]);
  
  const playReaction = useCallback((cardIndex: number | null) => {
    if (cardIndex === null) {
      addLog('Você passou a reação', 'info');
      setState(prev => ({
        ...prev,
        board: {
          ...prev.board,
          player: {
            ...prev.board.player,
            confirmed_reaction: true,
          },
        },
        awaitingPlayer: false,
      }));
    } else {
      const card = state.playerHand[cardIndex];
      if (!card) return;
      
      const newHand = state.playerHand.filter((_, i) => i !== cardIndex);
      addLog(`Você jogou reação: ${card.name}`, 'effect');
      
      setState(prev => ({
        ...prev,
        playerHand: newHand,
        board: {
          ...prev.board,
          player: {
            ...prev.board.player,
            reaction: { card },
            confirmed_reaction: true,
          },
        },
        awaitingPlayer: false,
      }));
    }
    
    // Bot joga reação
    const delay = getBotDelayMs(state.botDifficulty);
    botTimerRef.current = setTimeout(() => {
      const botGeneral = state.botCommanders.find(c => c.is_general);
      const decision = botDecideReaction(state.botHand, botGeneral, state.botDifficulty);
      
      if (decision !== null) {
        const card = state.botHand[decision];
        if (card) {
          const newBotHand = state.botHand.filter((_, i) => i !== decision);
          addLog(`${state.botName} jogou reação: ${card.name}`, 'effect');
          
          setState(prev => ({
            ...prev,
            botHand: newBotHand,
            board: {
              ...prev.board,
              bot: {
                ...prev.board.bot,
                reaction: { card },
                confirmed_reaction: true,
              },
            },
            combatPhase: 'initiative_roll',
            awaitingPlayer: true,
          }));
          return;
        }
      }
      
      addLog(`${state.botName} passou a reação`, 'info');
      setState(prev => ({
        ...prev,
        board: {
          ...prev.board,
          bot: {
            ...prev.board.bot,
            confirmed_reaction: true,
          },
        },
        combatPhase: 'initiative_roll',
        awaitingPlayer: true,
      }));
    }, delay);
  }, [state.playerHand, state.botHand, state.botCommanders, state.botDifficulty, state.botName, addLog]);
  
  const resolveInitiative = useCallback(() => {
    const result = resolveInitiativeRoll(
      state.playerAttributes,
      state.playerCommanders,
      state.board.player.maneuver,
      state.botAttributes,
      state.botCommanders,
      state.board.bot.maneuver
    );
    
    addLog(`🎲 Rolagem de Iniciativa`, 'phase');
    addLog(`Você: d20(${result.player.d20}) + ${result.player.strategy} EST + ${result.player.mobility} MOB = ${result.player.total}`, 'info');
    addLog(`${state.botName}: d20(${result.bot.d20}) + ${result.bot.strategy} EST + ${result.bot.mobility} MOB = ${result.bot.total}`, 'info');
    addLog(`${result.winner === 'player' ? 'Você venceu' : state.botName + ' venceu'} a iniciativa!`, 'effect');
    
    setState(prev => ({
      ...prev,
      board: {
        ...prev.board,
        initiative_result: result,
      },
      combatPhase: 'initiative_post',
      awaitingPlayer: result.winner === 'player',
    }));
    
    // Se bot venceu, ele escolhe
    if (result.winner === 'bot') {
      const delay = getBotDelayMs(state.botDifficulty);
      botTimerRef.current = setTimeout(() => {
        const botAttacks = botChooseFirstAttacker(
          state.botDifficulty,
          state.botAttributes.attack,
          state.botAttributes.defense
        );
        
        const attacker: 'player' | 'bot' = botAttacks ? 'bot' : 'player';
        const defender: 'player' | 'bot' = botAttacks ? 'player' : 'bot';
        
        addLog(`${state.botName} escolheu ${botAttacks ? 'atacar' : 'defender'}`, 'info');
        
        setState(prev => ({
          ...prev,
          board: {
            ...prev.board,
            current_attacker: attacker,
            current_defender: defender,
          },
          combatPhase: 'attack_maneuver',
          awaitingPlayer: attacker === 'player',
        }));
      }, delay);
    }
  }, [state.playerAttributes, state.playerCommanders, state.botAttributes, state.botCommanders, state.board, state.botDifficulty, state.botName, addLog]);
  
  const chooseFirstAttacker = useCallback((playerAttacks: boolean) => {
    const attacker: 'player' | 'bot' = playerAttacks ? 'player' : 'bot';
    const defender: 'player' | 'bot' = playerAttacks ? 'bot' : 'player';
    
    addLog(`Você escolheu ${playerAttacks ? 'atacar' : 'defender'}`, 'info');
    
    setState(prev => ({
      ...prev,
      board: {
        ...prev.board,
        current_attacker: attacker,
        current_defender: defender,
      },
      combatPhase: 'attack_maneuver',
      awaitingPlayer: attacker === 'player',
    }));
    
    // Se bot é atacante, ele joga
    if (!playerAttacks) {
      triggerBotAttackPhase();
    }
  }, [addLog]);
  
  // ========================
  // COMBATE: ATAQUE
  // ========================
  
  const playAttackManeuver = useCallback((cardIndex: number, commanderId: string) => {
    const card = state.playerHand[cardIndex];
    const commander = state.playerCommanders.find(c => c.instance_id === commanderId);
    
    if (!card || !commander) {
      toast.error('Carta ou comandante inválido');
      return;
    }
    
    const { canPlay, reason } = canCommanderPlayCard(commander, card, commander.is_general);
    if (!canPlay) {
      toast.error(reason || 'Não pode jogar esta carta');
      return;
    }
    
    const newHand = state.playerHand.filter((_, i) => i !== cardIndex);
    const updatedCommanders = state.playerCommanders.map(c =>
      c.instance_id === commanderId
        ? { ...c, cmd_free: c.cmd_free - (card.command_required || 0) }
        : c
    );
    
    const maneuver: SPManeuver = {
      card,
      commander_id: commanderId,
      confirmed: false,
    };
    
    addLog(`Ataque: ${card.name} (+${card.attack_bonus} ATQ)`, 'effect');
    
    setState(prev => ({
      ...prev,
      playerHand: newHand,
      playerCommanders: updatedCommanders,
      board: {
        ...prev.board,
        player: {
          ...prev.board.player,
          attack_maneuvers: [...prev.board.player.attack_maneuvers, maneuver],
        },
      },
    }));
  }, [state.playerHand, state.playerCommanders, addLog]);
  
  const confirmAttackManeuvers = useCallback(() => {
    addLog('Você confirmou seus ataques', 'info');
    
    setState(prev => ({
      ...prev,
      board: {
        ...prev.board,
        player: {
          ...prev.board.player,
          confirmed_attack: true,
        },
      },
      combatPhase: 'attack_reaction',
      awaitingPlayer: prev.board.current_defender === 'player',
    }));
    
    // Se bot defende, ele reage
    if (state.board.current_defender === 'bot') {
      triggerBotReaction('attack');
    }
  }, [state.board.current_defender, addLog]);
  
  // ========================
  // COMBATE: DEFESA
  // ========================
  
  const playDefenseManeuver = useCallback((cardIndex: number, commanderId: string) => {
    const card = state.playerHand[cardIndex];
    const commander = state.playerCommanders.find(c => c.instance_id === commanderId);
    
    if (!card || !commander) {
      toast.error('Carta ou comandante inválido');
      return;
    }
    
    const { canPlay, reason } = canCommanderPlayCard(commander, card, commander.is_general);
    if (!canPlay) {
      toast.error(reason || 'Não pode jogar esta carta');
      return;
    }
    
    const newHand = state.playerHand.filter((_, i) => i !== cardIndex);
    const updatedCommanders = state.playerCommanders.map(c =>
      c.instance_id === commanderId
        ? { ...c, cmd_free: c.cmd_free - (card.command_required || 0) }
        : c
    );
    
    const maneuver: SPManeuver = {
      card,
      commander_id: commanderId,
      confirmed: false,
    };
    
    addLog(`Defesa: ${card.name} (+${card.defense_bonus} DEF)`, 'effect');
    
    setState(prev => ({
      ...prev,
      playerHand: newHand,
      playerCommanders: updatedCommanders,
      board: {
        ...prev.board,
        player: {
          ...prev.board.player,
          defense_maneuvers: [...prev.board.player.defense_maneuvers, maneuver],
        },
      },
    }));
  }, [state.playerHand, state.playerCommanders, addLog]);
  
  const confirmDefenseManeuvers = useCallback(() => {
    addLog('Você confirmou sua defesa', 'info');
    
    setState(prev => ({
      ...prev,
      board: {
        ...prev.board,
        player: {
          ...prev.board.player,
          confirmed_defense: true,
        },
      },
      combatPhase: 'defense_reaction',
      awaitingPlayer: prev.board.current_attacker === 'player',
    }));
    
    // Se bot ataca, ele reage
    if (state.board.current_attacker === 'bot') {
      triggerBotReaction('defense');
    }
  }, [state.board.current_attacker, addLog]);
  
  // ========================
  // COMBATE: RESOLUÇÃO
  // ========================
  
  const resolveCombat = useCallback(() => {
    const attacker = state.board.current_attacker;
    const defender = state.board.current_defender;
    
    if (!attacker || !defender) return;
    
    const attackerAttrs = attacker === 'player' ? state.playerAttributes : state.botAttributes;
    const attackerManeuvers = attacker === 'player' 
      ? state.board.player.attack_maneuvers 
      : state.board.bot.attack_maneuvers;
    
    const defenderAttrs = defender === 'player' ? state.playerAttributes : state.botAttributes;
    const defenderManeuvers = defender === 'player' 
      ? state.board.player.defense_maneuvers 
      : state.board.bot.defense_maneuvers;
    
    const result = resolveCombatRoll(attackerAttrs, attackerManeuvers, defenderAttrs, defenderManeuvers, attacker);
    
    const attackerName = attacker === 'player' ? (state.playerCultureName || 'Você') : state.botName;
    const defenderName = defender === 'player' ? (state.playerCultureName || 'Você') : state.botName;
    
    addLog(`🎲 Rolagem de Combate`, 'phase');
    addLog(`${attackerName} ataca: d20(${result.attackerRoll}) + ${attackerAttrs.attack} ATQ = ${result.attackTotal}`, 'info');
    addLog(`${defenderName} defende: d20(${result.defenderRoll}) + ${defenderAttrs.defense} DEF = ${result.defenseTotal}`, 'info');
    
    if (result.damage > 0) {
      addLog(`💥 ${result.critical ? 'CRÍTICO! ' : ''}${attackerName} causa ${result.damage} de dano em ${defenderName}!`, 'damage');
    } else {
      addLog(`${defenderName} bloqueou o ataque de ${attackerName}!`, 'info');
    }
    
    // Aplicar dano
    const newPlayerHp = defender === 'player' 
      ? Math.max(0, state.playerHp - result.damage)
      : state.playerHp;
    const newBotHp = defender === 'bot' 
      ? Math.max(0, state.botHp - result.damage)
      : state.botHp;
    
    // Verificar vitória
    let winner: 'player' | 'bot' | null = null;
    if (newBotHp <= 0) {
      winner = 'player';
      addLog('🏆 VITÓRIA! Você derrotou o inimigo!', 'phase');
    } else if (newPlayerHp <= 0) {
      winner = 'bot';
      addLog(`💀 DERROTA! ${state.botName} venceu.`, 'phase');
    }
    
    setState(prev => ({
      ...prev,
      playerHp: newPlayerHp,
      botHp: newBotHp,
      board: {
        ...prev.board,
        combat_result: result,
      },
      combatPhase: winner ? 'round_end' : 'combat_resolution',
      phase: winner ? 'finished' : prev.phase,
      winner,
      awaitingPlayer: true,
    }));
  }, [state.board, state.playerAttributes, state.botAttributes, state.playerHp, state.botHp, state.botName, addLog]);
  
  const advanceToNextRound = useCallback(() => {
    addLog(`--- Rodada ${state.round + 1} ---`, 'phase');
    
    // Restaurar CMD parcial
    const restoreCmd = (commanders: SPCommander[]) => 
      commanders.map(c => ({
        ...c,
        cmd_free: Math.min(c.comando_base, c.cmd_free + 1),
      }));
    
    // Comprar carta
    const drawCard = (deck: SPCard[], hand: SPCard[]) => {
      if (deck.length > 0) {
        return { newDeck: deck.slice(1), newHand: [...hand, deck[0]] };
      }
      return { newDeck: deck, newHand: hand };
    };
    
    const playerDraw = drawCard(state.playerDeck, state.playerHand);
    const botDraw = drawCard(state.botDeck, state.botHand);
    
    setState(prev => ({
      ...prev,
      round: prev.round + 1,
      combatPhase: 'initiative_maneuver',
      playerCommanders: restoreCmd(prev.playerCommanders),
      botCommanders: restoreCmd(prev.botCommanders),
      playerHand: playerDraw.newHand,
      playerDeck: playerDraw.newDeck,
      botHand: botDraw.newHand,
      botDeck: botDraw.newDeck,
      board: resetBoardForNewRound(prev.board),
      awaitingPlayer: true,
    }));
  }, [state.round, state.playerDeck, state.playerHand, state.botDeck, state.botHand, addLog]);
  
  // ========================
  // BOT ACTIONS
  // ========================
  
  const triggerBotAttackPhase = useCallback(() => {
    const delay = getBotDelayMs(state.botDifficulty);
    
    botTimerRef.current = setTimeout(() => {
      const decisions = botDecideAttackManeuvers(state.botHand, state.botCommanders, state.botDifficulty);
      
      let newBotHand = [...state.botHand];
      let newBotCommanders = [...state.botCommanders];
      const maneuvers: SPManeuver[] = [];
      
      decisions.forEach(d => {
        const card = newBotHand[d.cardIndex];
        if (card) {
          maneuvers.push({
            card,
            commander_id: d.commanderId,
            confirmed: true,
          });
          addLog(`${state.botName} ataca: ${card.name}`, 'effect');
          newBotHand = newBotHand.filter((_, i) => i !== d.cardIndex);
          newBotCommanders = newBotCommanders.map(c =>
            c.instance_id === d.commanderId
              ? { ...c, cmd_free: c.cmd_free - (card.command_required || 0) }
              : c
          );
        }
      });
      
      if (maneuvers.length === 0) {
        addLog(`${state.botName} não atacou`, 'info');
      }
      
      setState(prev => ({
        ...prev,
        botHand: newBotHand,
        botCommanders: newBotCommanders,
        board: {
          ...prev.board,
          bot: {
            ...prev.board.bot,
            attack_maneuvers: maneuvers,
            confirmed_attack: true,
          },
        },
        combatPhase: 'attack_reaction',
        awaitingPlayer: true, // Jogador reage
      }));
    }, delay);
  }, [state.botDifficulty, state.botHand, state.botCommanders, state.botName, addLog]);
  
  const triggerBotDefensePhase = useCallback(() => {
    const delay = getBotDelayMs(state.botDifficulty);
    
    botTimerRef.current = setTimeout(() => {
      const decisions = botDecideDefenseManeuvers(state.botHand, state.botCommanders, state.botDifficulty);
      
      let newBotHand = [...state.botHand];
      let newBotCommanders = [...state.botCommanders];
      const maneuvers: SPManeuver[] = [];
      
      decisions.forEach(d => {
        const card = newBotHand[d.cardIndex];
        if (card) {
          maneuvers.push({
            card,
            commander_id: d.commanderId,
            confirmed: true,
          });
          addLog(`${state.botName} defende: ${card.name}`, 'effect');
          newBotHand = newBotHand.filter((_, i) => i !== d.cardIndex);
          newBotCommanders = newBotCommanders.map(c =>
            c.instance_id === d.commanderId
              ? { ...c, cmd_free: c.cmd_free - (card.command_required || 0) }
              : c
          );
        }
      });
      
      if (maneuvers.length === 0) {
        addLog(`${state.botName} não defendeu`, 'info');
      }
      
      setState(prev => ({
        ...prev,
        botHand: newBotHand,
        botCommanders: newBotCommanders,
        board: {
          ...prev.board,
          bot: {
            ...prev.board.bot,
            defense_maneuvers: maneuvers,
            confirmed_defense: true,
          },
        },
        combatPhase: 'defense_reaction',
        awaitingPlayer: true, // Jogador reage
      }));
    }, delay);
  }, [state.botDifficulty, state.botHand, state.botCommanders, state.botName, addLog]);
  
  const triggerBotReaction = useCallback((phase: 'attack' | 'defense') => {
    const delay = getBotDelayMs(state.botDifficulty);
    
    botTimerRef.current = setTimeout(() => {
      const botGeneral = state.botCommanders.find(c => c.is_general);
      const decision = botDecideReaction(state.botHand, botGeneral, state.botDifficulty);
      
      if (decision !== null) {
        const card = state.botHand[decision];
        if (card) {
          const newBotHand = state.botHand.filter((_, i) => i !== decision);
          addLog(`${state.botName} reagiu: ${card.name}`, 'effect');
          
          setState(prev => ({
            ...prev,
            botHand: newBotHand,
            combatPhase: phase === 'attack' ? 'defense_maneuver' : 'combat_roll',
            awaitingPlayer: phase === 'attack' ? prev.board.current_defender === 'player' : true,
          }));
          
          if (phase === 'attack' && state.board.current_defender === 'bot') {
            triggerBotDefensePhase();
          }
          return;
        }
      }
      
      addLog(`${state.botName} não reagiu`, 'info');
      
      setState(prev => ({
        ...prev,
        combatPhase: phase === 'attack' ? 'defense_maneuver' : 'combat_roll',
        awaitingPlayer: phase === 'attack' ? prev.board.current_defender === 'player' : true,
      }));
      
      if (phase === 'attack' && state.board.current_defender === 'bot') {
        triggerBotDefensePhase();
      }
    }, delay);
  }, [state.botDifficulty, state.botHand, state.botCommanders, state.botName, state.board.current_defender, addLog, triggerBotDefensePhase]);
  
  // ========================
  // PASSAR TURNO
  // ========================
  
  const passTurn = useCallback(() => {
    const { combatPhase } = state;
    
    switch (combatPhase) {
      case 'initiative_maneuver':
        confirmInitiativeManeuver();
        break;
      case 'initiative_reaction':
        playReaction(null);
        break;
      case 'attack_maneuver':
        confirmAttackManeuvers();
        break;
      case 'attack_reaction':
        setState(prev => ({
          ...prev,
          combatPhase: 'defense_maneuver',
          awaitingPlayer: prev.board.current_defender === 'player',
        }));
        if (state.board.current_defender === 'bot') {
          triggerBotDefensePhase();
        }
        break;
      case 'defense_maneuver':
        confirmDefenseManeuvers();
        break;
      case 'defense_reaction':
        setState(prev => ({
          ...prev,
          combatPhase: 'combat_roll',
          awaitingPlayer: true,
        }));
        break;
      case 'combat_resolution':
        advanceToNextRound();
        break;
    }
  }, [state.combatPhase, state.board.current_defender, confirmInitiativeManeuver, playReaction, confirmAttackManeuvers, confirmDefenseManeuvers, advanceToNextRound, triggerBotDefensePhase]);
  
  // ========================
  // CARTAS BÁSICAS
  // ========================
  
  const useBasicCard = useCallback((cardType: keyof SPBasicCardsUsed) => {
    if (state.playerBasicCardsUsed[cardType]) {
      toast.error('Esta carta básica já foi usada nesta partida');
      return;
    }
    
    // Verificar se a carta pode ser usada na fase atual
    const allowedPhases: Record<keyof SPBasicCardsUsed, SPCombatPhase[]> = {
      heal: ['combat_resolution'],
      attack: ['attack_maneuver', 'attack_reaction'],
      defense: ['defense_maneuver', 'defense_reaction'],
      initiative: ['initiative_maneuver', 'initiative_reaction'],
      countermaneuver: ['initiative_reaction', 'attack_reaction', 'defense_reaction'],
    };
    
    if (!allowedPhases[cardType].includes(state.combatPhase)) {
      toast.error('Esta carta não pode ser usada nesta fase');
      return;
    }
    
    const cardNames: Record<keyof SPBasicCardsUsed, string> = {
      heal: 'Cura',
      attack: 'Ataque',
      defense: 'Defesa',
      initiative: 'Iniciativa',
      countermaneuver: 'Contra-Manobra',
    };
    
    addLog(`🃏 Carta básica ativada: ${cardNames[cardType]}`, 'effect');
    
    setState(prev => ({
      ...prev,
      playerBasicCardsUsed: {
        ...prev.playerBasicCardsUsed,
        [cardType]: true,
      },
      playerBasicCardsBonuses: {
        ...prev.playerBasicCardsBonuses,
        [cardType]: true,
      },
    }));
  }, [state.playerBasicCardsUsed, state.combatPhase, addLog]);
  
  // ========================
  // RESET
  // ========================
  
  const resetGame = useCallback(() => {
    clearBotTimer();
    setState(createInitialState());
  }, [clearBotTimer]);
  
  // Cleanup
  useEffect(() => {
    return () => clearBotTimer();
  }, [clearBotTimer]);
  
  return {
    state,
    startGameWithArmy,
    submitLogisticsBid,
    selectScenario,
    playInitiativeManeuver,
    confirmInitiativeManeuver,
    playReaction,
    resolveInitiative,
    chooseFirstAttacker,
    playAttackManeuver,
    confirmAttackManeuvers,
    playDefenseManeuver,
    confirmDefenseManeuvers,
    resolveCombat,
    advanceToNextRound,
    passTurn,
    resetGame,
    useBasicCard,
  };
}
