/**
 * Hook para gerenciar combate tático individual
 */

import { useState, useCallback, useMemo } from 'react';
import { CharacterDraft } from '@/types/character-builder';
import { BattleState, Combatant, CombatManeuver } from '@/types/tactical-combat';
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
import { getManeuverById, getBasicManeuversBySkill } from '@/data/combat/maneuvers';
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
  const [selectedManeuver, setSelectedManeuver] = useState<CombatManeuver | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  
  // Combatente atual (próximo a agir)
  const currentCombatant = useMemo(() => {
    if (!battleState) return null;
    return getNextCombatant(battleState);
  }, [battleState]);
  
  // Verificar se é turno do jogador
  const isPlayerTurn = useMemo(() => {
    return currentCombatant?.team === 'player';
  }, [currentCombatant]);
  
  // Combatentes do jogador e inimigos
  const playerCombatants = useMemo(() => {
    return battleState?.combatants.filter(c => c.team === 'player') || [];
  }, [battleState]);
  
  const enemyCombatants = useMemo(() => {
    return battleState?.combatants.filter(c => c.team === 'enemy') || [];
  }, [battleState]);
  
  // Manobras disponíveis para o combatente atual
  const availableManeuvers = useMemo(() => {
    if (!currentCombatant) return [];
    return currentCombatant.stats.availableManeuvers
      .map(id => getManeuverById(id))
      .filter((m): m is CombatManeuver => m !== undefined);
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
  const executePlayerAction = useCallback((maneuverId: string, targetId: string) => {
    if (!battleState || !currentCombatant || currentCombatant.team !== 'player') {
      return;
    }
    
    let newState = executeAction(battleState, currentCombatant.id, maneuverId, targetId);
    
    // Verificar vitória/derrota
    const result = checkVictoryCondition(newState);
    if (result) {
      setPhase(result === 'player' ? 'victory' : 'defeat');
    } else {
      // Avançar para o próximo tick
      newState = advanceToNextTick(newState);
    }
    
    setBattleState(newState);
    setSelectedManeuver(null);
    setSelectedTarget(null);
  }, [battleState, currentCombatant]);
  
  // Executar ação da IA
  const executeAIAction = useCallback(() => {
    if (!battleState || !currentCombatant || currentCombatant.team !== 'enemy') {
      return;
    }
    
    // IA simples: escolhe manobra e alvo aleatoriamente
    const maneuvers = currentCombatant.stats.availableManeuvers;
    if (maneuvers.length === 0) return;
    
    const randomManeuver = maneuvers[Math.floor(Math.random() * maneuvers.length)];
    
    // Selecionar alvo (jogador vivo)
    const targets = battleState.combatants.filter(c => c.team === 'player' && !c.stats.isDown);
    if (targets.length === 0) return;
    
    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    
    let newState = executeAction(battleState, currentCombatant.id, randomManeuver, randomTarget.id);
    
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
    setSelectedManeuver(null);
    setSelectedTarget(null);
  }, []);
  
  // Selecionar manobra
  const selectManeuver = useCallback((maneuver: CombatManeuver | null) => {
    setSelectedManeuver(maneuver);
  }, []);
  
  // Selecionar alvo
  const selectTarget = useCallback((targetId: string | null) => {
    setSelectedTarget(targetId);
  }, []);
  
  // Confirmar ação
  const confirmAction = useCallback(() => {
    if (selectedManeuver && selectedTarget) {
      executePlayerAction(selectedManeuver.id, selectedTarget);
    }
  }, [selectedManeuver, selectedTarget, executePlayerAction]);
  
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
    selectedManeuver,
    selectedTarget,
    availableManeuvers,
    
    // Ações
    startBattle,
    executePlayerAction,
    executeAIAction,
    resetBattle,
    selectManeuver,
    selectTarget,
    confirmAction
  };
}
