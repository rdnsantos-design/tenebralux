import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  BotDifficulty,
  BotGameState,
  BotCard,
  BotCommander,
  makeBotDecision,
  makeBotCultureChoice,
  makeBotLogisticsBid,
  makeBotScenarioChoice,
  getBotName,
  getBotDelayMs,
} from '@/lib/botEngine';

export type SinglePlayerPhase =
  | 'setup'
  | 'culture_selection'
  | 'scenario_selection'
  | 'deckbuilding'
  | 'combat'
  | 'finished';

export interface SinglePlayerState {
  phase: SinglePlayerPhase;
  round: number;
  combatPhase: string;
  
  // Jogador
  playerCulture: string | null;
  playerHand: BotCard[];
  playerCommanders: BotCommander[];
  playerHp: number;
  playerCmdState: {
    general: { cmd_total: number; cmd_free: number; strategy_total: number };
    commanders: Record<string, { cmd_free: number }>;
  };
  
  // Bot
  botDifficulty: BotDifficulty;
  botName: string;
  botCulture: string | null;
  botHand: BotCard[];
  botCommanders: BotCommander[];
  botHp: number;
  botCmdState: {
    general: { cmd_total: number; cmd_free: number; strategy_total: number };
    commanders: Record<string, { cmd_free: number }>;
  };
  
  // Cenário
  selectedTerrainId: string | null;
  selectedSeasonId: string | null;
  
  // Combate
  currentAttacker: 'player' | 'bot' | null;
  currentDefender: 'player' | 'bot' | null;
  initiativeWinner: 'player' | 'bot' | null;
  
  // Log
  battleLog: Array<{ message: string; timestamp: number }>;
  
  // Carregamento
  isLoading: boolean;
  winner: 'player' | 'bot' | null;
}

const initialState: SinglePlayerState = {
  phase: 'setup',
  round: 1,
  combatPhase: 'initiative_maneuver',
  
  playerCulture: null,
  playerHand: [],
  playerCommanders: [],
  playerHp: 100,
  playerCmdState: {
    general: { cmd_total: 1, cmd_free: 1, strategy_total: 1 },
    commanders: {},
  },
  
  botDifficulty: 'medium',
  botName: 'Bot',
  botCulture: null,
  botHand: [],
  botCommanders: [],
  botHp: 100,
  botCmdState: {
    general: { cmd_total: 1, cmd_free: 1, strategy_total: 1 },
    commanders: {},
  },
  
  selectedTerrainId: null,
  selectedSeasonId: null,
  
  currentAttacker: null,
  currentDefender: null,
  initiativeWinner: null,
  
  battleLog: [],
  
  isLoading: false,
  winner: null,
};

export function useSinglePlayerGame() {
  const [state, setState] = useState<SinglePlayerState>(initialState);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Adicionar log
  const addLog = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      battleLog: [
        ...prev.battleLog,
        { message, timestamp: Date.now() }
      ].slice(-50), // Manter últimos 50
    }));
  }, []);
  
  // Iniciar jogo
  const startGame = useCallback(async (difficulty: BotDifficulty) => {
    setState(prev => ({
      ...initialState,
      botDifficulty: difficulty,
      botName: getBotName(difficulty),
      phase: 'culture_selection',
      isLoading: true,
    }));
    
    // Bot escolhe cultura
    const botCulture = makeBotCultureChoice(difficulty);
    
    setState(prev => ({
      ...prev,
      botCulture,
      isLoading: false,
    }));
    
    addLog(`${getBotName(difficulty)} entra na arena com a cultura ${botCulture}`);
  }, [addLog]);
  
  // Jogador seleciona cultura
  const selectCulture = useCallback(async (culture: string) => {
    setState(prev => ({
      ...prev,
      playerCulture: culture,
      phase: 'deckbuilding',
    }));
    
    addLog(`Você escolheu a cultura ${culture}`);
    
    // Carregar cartas do banco para ambos
    await loadDecks(culture, state.botCulture || 'Anuire');
  }, [state.botCulture, addLog]);
  
  // Carregar decks do banco
  const loadDecks = async (playerCulture: string, botCulture: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Buscar cartas táticas
      const { data: cards, error } = await supabase
        .from('mass_combat_tactical_cards')
        .select('*')
        .or(`culture.eq.${playerCulture},culture.is.null`)
        .limit(30);
      
      if (error) throw error;
      
      // Distribuir cartas para jogador e bot
      const playerCards: BotCard[] = (cards || []).slice(0, 7).map(c => ({
        id: c.id,
        name: c.name,
        card_type: c.card_type as BotCard['card_type'],
        attack_bonus: c.attack_bonus,
        defense_bonus: c.defense_bonus,
        mobility_bonus: c.mobility_bonus,
        command_required: c.command_required,
        vet_cost: c.vet_cost,
      }));
      
      const botCards: BotCard[] = (cards || []).slice(7, 14).map(c => ({
        id: c.id,
        name: c.name,
        card_type: c.card_type as BotCard['card_type'],
        attack_bonus: c.attack_bonus,
        defense_bonus: c.defense_bonus,
        mobility_bonus: c.mobility_bonus,
        command_required: c.command_required,
        vet_cost: c.vet_cost,
      }));
      
      // Criar comandantes básicos
      const playerCommanders: BotCommander[] = [
        {
          instance_id: 'player-cmd-1',
          numero: 1,
          especializacao: 'Infantaria',
          comando_base: 3,
          cmd_free: 3,
          estrategia: 2,
          guarda_current: 2,
          is_general: false,
        },
        {
          instance_id: 'player-cmd-2',
          numero: 2,
          especializacao: 'Cavalaria',
          comando_base: 2,
          cmd_free: 2,
          estrategia: 3,
          guarda_current: 1,
          is_general: false,
        },
        {
          instance_id: 'player-general',
          numero: 0,
          especializacao: 'General',
          comando_base: 1,
          cmd_free: 1,
          estrategia: 4,
          guarda_current: 3,
          is_general: true,
        },
      ];
      
      const botCommanders: BotCommander[] = [
        {
          instance_id: 'bot-cmd-1',
          numero: 1,
          especializacao: 'Infantaria',
          comando_base: 3,
          cmd_free: 3,
          estrategia: 2,
          guarda_current: 2,
          is_general: false,
        },
        {
          instance_id: 'bot-cmd-2',
          numero: 2,
          especializacao: 'Arqueria',
          comando_base: 2,
          cmd_free: 2,
          estrategia: 3,
          guarda_current: 1,
          is_general: false,
        },
        {
          instance_id: 'bot-general',
          numero: 0,
          especializacao: 'General',
          comando_base: 1,
          cmd_free: 1,
          estrategia: 4,
          guarda_current: 3,
          is_general: true,
        },
      ];
      
      setState(prev => ({
        ...prev,
        playerHand: playerCards,
        playerCommanders,
        playerCmdState: {
          general: { cmd_total: 1, cmd_free: 1, strategy_total: 4 },
          commanders: {
            'player-cmd-1': { cmd_free: 3 },
            'player-cmd-2': { cmd_free: 2 },
          },
        },
        botHand: botCards,
        botCommanders,
        botCmdState: {
          general: { cmd_total: 1, cmd_free: 1, strategy_total: 4 },
          commanders: {
            'bot-cmd-1': { cmd_free: 3 },
            'bot-cmd-2': { cmd_free: 2 },
          },
        },
        isLoading: false,
      }));
      
    } catch (err) {
      console.error('Erro ao carregar decks:', err);
      toast.error('Erro ao carregar cartas');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  // Confirmar deck e iniciar combate
  const confirmDeck = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'combat',
      combatPhase: 'initiative_maneuver',
    }));
    
    addLog('Combate iniciado! Fase de Iniciativa');
  }, [addLog]);
  
  // Jogar carta
  const playCard = useCallback(async (cardIndex: number, commanderId: string) => {
    const card = state.playerHand[cardIndex];
    if (!card) return;
    
    const commander = state.playerCommanders.find(c => c.instance_id === commanderId);
    if (!commander) return;
    
    // Verificar CMD
    const cmdRequired = card.command_required || 0;
    const cmdAvailable = state.playerCmdState.commanders[commanderId]?.cmd_free || 0;
    
    if (cmdAvailable < cmdRequired) {
      toast.error('CMD insuficiente');
      return;
    }
    
    // Atualizar estado
    setState(prev => ({
      ...prev,
      playerHand: prev.playerHand.filter((_, i) => i !== cardIndex),
      playerCmdState: {
        ...prev.playerCmdState,
        commanders: {
          ...prev.playerCmdState.commanders,
          [commanderId]: { cmd_free: cmdAvailable - cmdRequired },
        },
      },
    }));
    
    addLog(`Você jogou ${card.name} com ${commander.especializacao}`);
    
    // Processar efeitos da carta (simplificado)
    processCombatRound('player', card);
  }, [state, addLog]);
  
  // Passar turno
  const passTurn = useCallback(() => {
    addLog('Você passou o turno');
    processCombatRound('player', null);
  }, [addLog]);
  
  // Processar rodada de combate
  const processCombatRound = useCallback((actor: 'player' | 'bot', card: BotCard | null) => {
    // Simular dano (simplificado)
    if (card) {
      const damage = (card.attack_bonus || 0) + Math.floor(Math.random() * 5) + 1;
      
      if (actor === 'player') {
        setState(prev => ({
          ...prev,
          botHp: Math.max(0, prev.botHp - damage),
        }));
        addLog(`Você causou ${damage} de dano!`);
      } else {
        setState(prev => ({
          ...prev,
          playerHp: Math.max(0, prev.playerHp - damage),
        }));
        addLog(`${state.botName} causou ${damage} de dano!`);
      }
    }
    
    // Verificar vitória
    setTimeout(() => {
      setState(prev => {
        if (prev.botHp <= 0) {
          return { ...prev, phase: 'finished', winner: 'player' };
        }
        if (prev.playerHp <= 0) {
          return { ...prev, phase: 'finished', winner: 'bot' };
        }
        
        // Se foi o jogador, agora é a vez do bot
        if (actor === 'player') {
          triggerBotTurn();
        }
        
        return prev;
      });
    }, 500);
  }, [state.botName, addLog]);
  
  // Turno do bot
  const triggerBotTurn = useCallback(() => {
    const delay = getBotDelayMs(state.botDifficulty);
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    botTimerRef.current = setTimeout(() => {
      const botState: BotGameState = {
        phase: state.combatPhase,
        myHp: state.botHp,
        opponentHp: state.playerHp,
        myHand: state.botHand,
        myCommanders: state.botCommanders,
        cmdFree: state.botCmdState.general.cmd_free,
        round: state.round,
      };
      
      const decision = makeBotDecision(botState, state.botDifficulty);
      
      if (decision.action === 'play_card' && decision.cardIndex !== undefined) {
        const card = state.botHand[decision.cardIndex];
        
        setState(prev => ({
          ...prev,
          botHand: prev.botHand.filter((_, i) => i !== decision.cardIndex),
          isLoading: false,
        }));
        
        addLog(`${state.botName} jogou ${card?.name || 'uma carta'}`);
        processCombatRound('bot', card);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        addLog(`${state.botName} passou`);
        
        // Avançar rodada
        advanceRound();
      }
    }, delay);
  }, [state, addLog]);
  
  // Avançar rodada
  const advanceRound = useCallback(() => {
    setState(prev => ({
      ...prev,
      round: prev.round + 1,
      combatPhase: 'initiative_maneuver',
      // Restaurar CMD parcial
      playerCmdState: {
        ...prev.playerCmdState,
        commanders: {
          'player-cmd-1': { cmd_free: Math.min(3, (prev.playerCmdState.commanders['player-cmd-1']?.cmd_free || 0) + 1) },
          'player-cmd-2': { cmd_free: Math.min(2, (prev.playerCmdState.commanders['player-cmd-2']?.cmd_free || 0) + 1) },
        },
      },
      botCmdState: {
        ...prev.botCmdState,
        commanders: {
          'bot-cmd-1': { cmd_free: Math.min(3, (prev.botCmdState.commanders['bot-cmd-1']?.cmd_free || 0) + 1) },
          'bot-cmd-2': { cmd_free: Math.min(2, (prev.botCmdState.commanders['bot-cmd-2']?.cmd_free || 0) + 1) },
        },
      },
    }));
    
    addLog(`--- Rodada ${state.round + 1} ---`);
  }, [state.round, addLog]);
  
  // Reset
  const resetGame = useCallback(() => {
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
    }
    setState(initialState);
  }, []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
      }
    };
  }, []);
  
  return {
    state,
    startGame,
    selectCulture,
    confirmDeck,
    playCard,
    passTurn,
    resetGame,
  };
}
