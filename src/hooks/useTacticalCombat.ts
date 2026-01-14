/**
 * Hook para gerenciar combate tático individual
 * 
 * Sistema de Ticks com Escolha Simultânea:
 * 1. Fase 'choosing': Todos escolhem cards simultaneamente
 * 2. O tick de ação = velocidade do card + velocidade da arma
 * 3. Fase 'combat': Ações são resolvidas na ordem dos ticks
 * 4. Após agir, combatente volta para escolher novo card
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { CharacterDraft } from '@/types/character-builder';
import { BattleState, Combatant, CombatCard } from '@/types/tactical-combat';
import { 
  initializeBattle, 
  chooseCard,
  aiChooseCard,
  resolveNextAction,
  getNextCombatant,
  checkVictoryCondition
} from '@/lib/tacticalCombatEngine';
import { 
  convertCharacterToCombatant, 
  createGenericEnemy 
} from '@/services/tactical/personalCombatConverter';
import { getCardById } from '@/data/combat/cards';
import { ThemeId } from '@/themes/types';

export type CombatPhase = 'setup' | 'battle' | 'victory' | 'defeat';

export interface UseTacticalCombatOptions {
  theme?: ThemeId;
}

export function useTacticalCombat(options: UseTacticalCombatOptions = {}) {
  const { theme = 'akashic' } = options;
  
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [phase, setPhase] = useState<CombatPhase>('setup');
  const [playerCharacter, setPlayerCharacter] = useState<CharacterDraft | null>(null);
  const [selectedCard, setSelectedCard] = useState<CombatCard | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  
  // Verificar se jogador precisa escolher card
  const playerNeedsToChoose = useMemo(() => {
    if (!battleState || battleState.phase !== 'choosing') return false;
    return battleState.combatants.some(
      c => c.team === 'player' && c.stats.pendingCardChoice && !c.stats.isDown
    );
  }, [battleState]);
  
  // Combatente do jogador que precisa escolher
  const playerCombatantToChoose = useMemo(() => {
    if (!battleState || battleState.phase !== 'choosing') return null;
    return battleState.combatants.find(
      c => c.team === 'player' && c.stats.pendingCardChoice && !c.stats.isDown
    ) || null;
  }, [battleState]);
  
  // Próximo combatente a agir (na fase de combate)
  const currentCombatant = useMemo(() => {
    if (!battleState) return null;
    return getNextCombatant(battleState);
  }, [battleState]);
  
  // É turno do jogador escolher ou agir
  const isPlayerTurn = useMemo(() => {
    if (!battleState) return false;
    
    // Na fase de escolha, verifica se jogador precisa escolher
    if (battleState.phase === 'choosing') {
      return playerNeedsToChoose;
    }
    
    // Na fase de combate, verifica se próximo a agir é jogador
    if (battleState.phase === 'combat' && currentCombatant) {
      return currentCombatant.team === 'player';
    }
    
    return false;
  }, [battleState, playerNeedsToChoose, currentCombatant]);
  
  // Combatentes do jogador e inimigos
  const playerCombatants = useMemo(() => {
    return battleState?.combatants.filter(c => c.team === 'player') || [];
  }, [battleState]);
  
  const enemyCombatants = useMemo(() => {
    return battleState?.combatants.filter(c => c.team === 'enemy') || [];
  }, [battleState]);
  
  // Cartas disponíveis para o combatente que precisa escolher
  const availableCards = useMemo(() => {
    const combatant = playerCombatantToChoose || currentCombatant;
    if (!combatant) return [];
    return combatant.stats.availableCards
      .map(id => getCardById(id))
      .filter((c): c is CombatCard => c !== undefined);
  }, [playerCombatantToChoose, currentCombatant]);
  
  // Iniciar combate
  const startBattle = useCallback((
    character: CharacterDraft,
    enemyLevel: 'weak' | 'normal' | 'strong' | 'elite' = 'normal',
    enemyCount: number = 1
  ) => {
    setPlayerCharacter(character);
    
    // Converter personagem para combatente
    const playerCombatant = convertCharacterToCombatant(character, { team: 'player' });
    
    // Criar inimigos
    const enemies: Combatant[] = [];
    for (let i = 0; i < enemyCount; i++) {
      const enemy = createGenericEnemy(
        `Inimigo ${i + 1}`,
        enemyLevel,
        theme
      );
      enemies.push(enemy);
    }
    
    // Inicializar batalha (começa na fase 'choosing')
    const battle = initializeBattle([playerCombatant, ...enemies]);
    setBattleState(battle);
    setPhase('battle');
  }, [theme]);
  
  // Escolher card (fase de escolha)
  const choosePlayerCard = useCallback((cardId: string, targetId: string) => {
    if (!battleState || !playerCombatantToChoose) {
      console.warn('Sem estado ou combatente para escolher');
      return;
    }
    
    const newState = chooseCard(battleState, playerCombatantToChoose.id, cardId, targetId);
    setBattleState(newState);
    setSelectedCard(null);
    setSelectedTarget(null);
  }, [battleState, playerCombatantToChoose]);
  
  // IA escolhe cards automaticamente
  useEffect(() => {
    if (!battleState || battleState.phase !== 'choosing') return;
    
    // Verificar se há inimigos que precisam escolher
    const enemiesNeedChoice = battleState.combatants.filter(
      c => c.team === 'enemy' && c.stats.pendingCardChoice && !c.stats.isDown
    );
    
    if (enemiesNeedChoice.length === 0) return;
    
    // Delay pequeno para parecer que IA está "pensando"
    const timer = setTimeout(() => {
      let newState = battleState;
      for (const enemy of enemiesNeedChoice) {
        newState = aiChooseCard(newState, enemy.id);
      }
      setBattleState(newState);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [battleState]);
  
  // Resolver ações na fase de combate
  useEffect(() => {
    if (!battleState || battleState.phase !== 'combat') return;

    // Debug (temporário)
    console.log('[combat] phase=combat', {
      currentTick: battleState.currentTick,
      round: battleState.round,
      next: getNextCombatant(battleState)?.name,
    });
    
    // Verificar vitória/derrota
    const result = checkVictoryCondition(battleState);
    if (result) {
      setPhase(result === 'player' ? 'victory' : 'defeat');
      return;
    }
    
    const next = getNextCombatant(battleState);
    if (!next) return;
    
    // Verificar se o próximo combatente tem card e alvo escolhidos
    if (!next.stats.chosenCardId || !next.stats.chosenTargetId) {
      // Combatente precisa escolher mas estamos na fase de combate - voltar para choosing
      console.warn('Combatente sem escolha na fase de combate, voltando para choosing:', {
        name: next.name,
        team: next.team,
        tick: next.stats.currentTick,
        chosenCardId: next.stats.chosenCardId,
        chosenTargetId: next.stats.chosenTargetId,
        pendingCardChoice: next.stats.pendingCardChoice,
      });
      setBattleState(prev => prev ? { ...prev, phase: 'choosing' } : null);
      return;
    }
    
    // Se próximo é inimigo, resolver automaticamente
    if (next.team === 'enemy') {
      const timer = setTimeout(() => {
        console.log('[combat] resolving enemy action', {
          name: next.name,
          tick: next.stats.currentTick,
          card: next.stats.chosenCardId,
          target: next.stats.chosenTargetId,
        });
        const newState = resolveNextAction(battleState);
        // Só atualizar se o estado realmente mudou (evitar loop)
        if (newState !== battleState) {
          setBattleState(newState);
        }
      }, 800);
      
      return () => clearTimeout(timer);
    }
    
    // Se é jogador e tem escolha, resolver imediatamente
    if (next.team === 'player') {
      console.log('[combat] resolving player action', {
        name: next.name,
        tick: next.stats.currentTick,
        card: next.stats.chosenCardId,
        target: next.stats.chosenTargetId,
      });
      const newState = resolveNextAction(battleState);
      if (newState !== battleState) {
        setBattleState(newState);
      }
    }
  }, [battleState]);

  // ... keep existing code
  
  // Reiniciar combate
  const resetBattle = useCallback(() => {
    setBattleState(null);
    setPhase('setup');
    setPlayerCharacter(null);
    setSelectedCard(null);
    setSelectedTarget(null);
  }, []);
  
  // Selecionar carta
  const selectCard = useCallback((card: CombatCard | null) => {
    setSelectedCard(card);
  }, []);
  
  // Selecionar alvo
  const selectTarget = useCallback((targetId: string | null) => {
    setSelectedTarget(targetId);
  }, []);
  
  // Confirmar ação (escolher card)
  const confirmAction = useCallback(() => {
    if (selectedCard && selectedTarget) {
      choosePlayerCard(selectedCard.id, selectedTarget);
    }
  }, [selectedCard, selectedTarget, choosePlayerCard]);
  
  // Executar ação do jogador (legado - mantido para compatibilidade)
  const executePlayerAction = useCallback((cardId: string, targetId: string) => {
    choosePlayerCard(cardId, targetId);
  }, [choosePlayerCard]);
  
  // Executar ação da IA (legado - agora automático)
  const executeAIAction = useCallback(() => {
    // Agora é automático via useEffect
  }, []);
  
  return {
    // Estado
    battleState,
    phase,
    playerCharacter,
    currentCombatant,
    isPlayerTurn,
    playerCombatants,
    enemyCombatants,
    playerNeedsToChoose,
    playerCombatantToChoose,
    
    // Seleção
    selectedCard,
    selectedTarget,
    availableCards,
    
    // Ações
    startBattle,
    choosePlayerCard,
    executePlayerAction,
    executeAIAction,
    resetBattle,
    selectCard,
    selectTarget,
    confirmAction
  };
}
