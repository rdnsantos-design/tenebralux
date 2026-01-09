/**
 * Hook para gerenciar combate tático individual
 */

import { useState, useCallback, useMemo } from 'react';
import { CharacterDraft } from '@/types/character-builder';
import { BattleState, Combatant, CombatCard } from '@/types/tactical-combat';
import { 
  initializeBattle, 
  executeAction, 
  advanceToNextTick, 
  getNextCombatant,
  checkVictoryCondition
} from '@/lib/tacticalCombatEngine';
import { 
  convertCharacterToCombatant, 
  createGenericEnemy 
} from '@/services/tactical/personalCombatConverter';
import { getCardById, getBasicCards } from '@/data/combat/cards';
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
  
  // Combatente atual (próximo a agir) - é quem tem o menor currentTick
  const currentCombatant = useMemo(() => {
    if (!battleState) return null;
    return getNextCombatant(battleState);
  }, [battleState]);
  
  // Verificar se é turno do jogador
  // Só é turno do jogador se o combatente atual for do time 'player'
  // E se o tick do combatente for igual ao tick atual da batalha
  const isPlayerTurn = useMemo(() => {
    if (!currentCombatant || !battleState) return false;
    // O combatente atual é quem tem o menor tick
    // O tick da batalha avança para o tick do combatente atual
    return currentCombatant.team === 'player' && 
           currentCombatant.stats.currentTick <= battleState.currentTick;
  }, [currentCombatant, battleState]);
  
  // Combatentes do jogador e inimigos
  const playerCombatants = useMemo(() => {
    return battleState?.combatants.filter(c => c.team === 'player') || [];
  }, [battleState]);
  
  const enemyCombatants = useMemo(() => {
    return battleState?.combatants.filter(c => c.team === 'enemy') || [];
  }, [battleState]);
  
  // Cartas disponíveis para o combatente atual
  const availableCards = useMemo(() => {
    if (!currentCombatant) return [];
    return currentCombatant.stats.availableCards
      .map(id => getCardById(id))
      .filter((c): c is CombatCard => c !== undefined);
  }, [currentCombatant]);
  
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
    
    // Inicializar batalha
    const battle = initializeBattle([playerCombatant, ...enemies]);
    setBattleState(battle);
    setPhase('battle');
    
    // Avançar para o primeiro tick
    const advanced = advanceToNextTick(battle);
    setBattleState(advanced);
  }, [theme]);
  
  // Executar ação do jogador
  const executePlayerAction = useCallback((cardId: string, targetId: string) => {
    if (!battleState || !currentCombatant) {
      console.warn('Sem estado de batalha ou combatente atual');
      return;
    }
    
    if (currentCombatant.team !== 'player') {
      console.warn('Não é turno do jogador! Combatente atual:', currentCombatant.name);
      return;
    }
    
    // Validar que é realmente o turno deste combatente
    if (currentCombatant.stats.currentTick > battleState.currentTick) {
      console.warn('Ainda não é hora de agir! Tick atual:', battleState.currentTick, 'Tick do combatente:', currentCombatant.stats.currentTick);
      return;
    }
    
    let newState = executeAction(battleState, currentCombatant.id, cardId, targetId);
    
    // Verificar vitória/derrota
    const result = checkVictoryCondition(newState);
    if (result) {
      setPhase(result === 'player' ? 'victory' : 'defeat');
    } else {
      // Avançar para o próximo tick
      newState = advanceToNextTick(newState);
    }
    
    setBattleState(newState);
    setSelectedCard(null);
    setSelectedTarget(null);
  }, [battleState, currentCombatant]);
  
  // Executar ação da IA
  const executeAIAction = useCallback(() => {
    if (!battleState || !currentCombatant || currentCombatant.team !== 'enemy') {
      return;
    }
    
    // IA simples: escolhe carta e alvo aleatoriamente
    const cards = currentCombatant.stats.availableCards;
    if (cards.length === 0) return;
    
    const randomCardId = cards[Math.floor(Math.random() * cards.length)];
    
    // Selecionar alvo (jogador vivo)
    const targets = battleState.combatants.filter(c => c.team === 'player' && !c.stats.isDown);
    if (targets.length === 0) return;
    
    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    
    let newState = executeAction(battleState, currentCombatant.id, randomCardId, randomTarget.id);
    
    // Verificar vitória/derrota
    const result = checkVictoryCondition(newState);
    if (result) {
      setPhase(result === 'player' ? 'victory' : 'defeat');
    } else {
      // Avançar para o próximo tick
      newState = advanceToNextTick(newState);
    }
    
    setBattleState(newState);
  }, [battleState, currentCombatant]);
  
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
  
  // Confirmar ação
  const confirmAction = useCallback(() => {
    if (selectedCard && selectedTarget) {
      executePlayerAction(selectedCard.id, selectedTarget);
    }
  }, [selectedCard, selectedTarget, executePlayerAction]);
  
  return {
    // Estado
    battleState,
    phase,
    playerCharacter,
    currentCombatant,
    isPlayerTurn,
    playerCombatants,
    enemyCombatants,
    
    // Seleção
    selectedCard,
    selectedTarget,
    availableCards,
    
    // Ações
    startBattle,
    executePlayerAction,
    executeAIAction,
    resetBattle,
    selectCard,
    selectTarget,
    confirmAction
  };
}
