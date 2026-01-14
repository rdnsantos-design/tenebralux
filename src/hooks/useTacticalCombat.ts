/**
 * Hook para gerenciar combate tático individual
 * 
 * Sistema de Ticks com Escolha Simultânea:
 * 1. Fase 'choosing': Todos escolhem cards simultaneamente
 * 2. O tick de ação = velocidade do card + velocidade da arma
 * 3. Fase 'combat': Ações são resolvidas na ordem dos ticks
 * 4. Após agir, combatente volta para escolher novo card
 * 
 * Sistema de Movimento:
 * - Cada combatente tem pontos de movimento por rodada
 * - Movimento pode ser feito antes de escolher carta
 * - Custo de movimento baseado no terreno
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { CharacterDraft } from '@/types/character-builder';
import { BattleState, Combatant, CombatCard, HexCoord } from '@/types/tactical-combat';
import { 
  initializeBattle, 
  chooseCard,
  aiChooseCard,
  resolveNextAction,
  getNextCombatant,
  checkVictoryCondition,
  moveCombatant
} from '@/lib/tacticalCombatEngine';
import { 
  convertCharacterToCombatant, 
  createGenericEnemy 
} from '@/services/tactical/personalCombatConverter';
import { getCardById } from '@/data/combat/cards';
import { getValidMoveHexes, hexKey } from '@/lib/hexCombatUtils';
import { ThemeId } from '@/themes/types';

export type CombatPhase = 'setup' | 'battle' | 'victory' | 'defeat';
export type ActionMode = 'move' | 'attack';

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
  const [actionMode, setActionMode] = useState<ActionMode>('attack');
  const [selectedHex, setSelectedHex] = useState<HexCoord | null>(null);
  const [playerActionConfirmed, setPlayerActionConfirmed] = useState(false); // Jogador precisa confirmar ataque manualmente
  
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
  
  // Hexes válidos para movimento do jogador atual
  const validMoveHexes = useMemo(() => {
    if (!battleState?.map) return [];
    const combatant = playerCombatantToChoose || currentCombatant;
    if (!combatant || combatant.team !== 'player') return [];
    if (!combatant.stats.position) return [];
    if (combatant.stats.currentMovement <= 0) return [];
    
    // Calcular hexes ocupados
    const occupiedHexes = new Set<string>();
    for (const c of battleState.combatants) {
      if (c.stats.position && c.id !== combatant.id) {
        occupiedHexes.add(hexKey(c.stats.position));
      }
    }
    
    return getValidMoveHexes(
      combatant.stats.position,
      combatant.stats.currentMovement,
      battleState.map,
      occupiedHexes
    );
  }, [battleState, playerCombatantToChoose, currentCombatant]);
  
  // Hexes válidos para ataque (inimigos)
  const validTargetHexes = useMemo(() => {
    if (!battleState?.map || !selectedCard) return [];
    
    return battleState.combatants
      .filter(c => c.team === 'enemy' && !c.stats.isDown && c.stats.position)
      .map(c => c.stats.position!)
      .filter(Boolean);
  }, [battleState, selectedCard]);
  
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
    
    // Se é jogador, esperar confirmação manual (para permitir movimento antes)
    if (next.team === 'player') {
      // Só resolver se o jogador já confirmou
      if (playerActionConfirmed) {
        console.log('[combat] resolving player action (confirmed)', {
          name: next.name,
          tick: next.stats.currentTick,
          card: next.stats.chosenCardId,
          target: next.stats.chosenTargetId,
        });
        const newState = resolveNextAction(battleState);
        if (newState !== battleState) {
          setBattleState(newState);
          setPlayerActionConfirmed(false); // Reset para próxima ação
        }
      }
      // Se não confirmou, aguardar (jogador pode mover antes de atacar)
    }
  }, [battleState, playerActionConfirmed]);

  // ... keep existing code
  
  // Reiniciar combate
  const resetBattle = useCallback(() => {
    setBattleState(null);
    setPhase('setup');
    setPlayerCharacter(null);
    setSelectedCard(null);
    setSelectedTarget(null);
    setActionMode('attack');
    setSelectedHex(null);
    setPlayerActionConfirmed(false);
  }, []);
  
  // Selecionar carta
  const selectCard = useCallback((card: CombatCard | null) => {
    setSelectedCard(card);
    setActionMode('attack');
  }, []);
  
  // Selecionar alvo
  const selectTarget = useCallback((targetId: string | null) => {
    setSelectedTarget(targetId);
  }, []);
  
  // Alternar modo de ação
  const toggleActionMode = useCallback(() => {
    setActionMode(prev => prev === 'move' ? 'attack' : 'move');
    setSelectedCard(null);
    setSelectedTarget(null);
    setSelectedHex(null);
  }, []);
  
  // Mover combatente
  const movePlayer = useCallback((targetHex: HexCoord) => {
    if (!battleState) return;
    const combatant = playerCombatantToChoose || currentCombatant;
    if (!combatant || combatant.team !== 'player') return;
    
    const newState = moveCombatant(battleState, combatant.id, targetHex);
    setBattleState(newState);
    setSelectedHex(null);
  }, [battleState, playerCombatantToChoose, currentCombatant]);
  
  // Handler de clique no hex
  const handleHexClick = useCallback((coord: HexCoord) => {
    if (!battleState) return;
    
    if (actionMode === 'move') {
      // Verificar se é hex válido para movimento
      const isValidMove = validMoveHexes.some(h => h.q === coord.q && h.r === coord.r);
      if (isValidMove) {
        movePlayer(coord);
      }
    } else {
      // No modo ataque, verificar se clicou em um inimigo
      const enemy = battleState.combatants.find(
        c => c.team === 'enemy' && !c.stats.isDown && 
        c.stats.position?.q === coord.q && c.stats.position?.r === coord.r
      );
      if (enemy && selectedCard) {
        selectTarget(enemy.id);
      }
    }
    
    setSelectedHex(coord);
  }, [battleState, actionMode, validMoveHexes, movePlayer, selectedCard, selectTarget]);
  
  // Confirmar ação (escolher card na fase choosing, ou executar ação na fase combat)
  const confirmAction = useCallback(() => {
    if (!battleState) return;
    
    if (battleState.phase === 'choosing' && selectedCard && selectedTarget) {
      // Fase de escolha: registrar card escolhido
      choosePlayerCard(selectedCard.id, selectedTarget);
    } else if (battleState.phase === 'combat') {
      // Fase de combate: confirmar execução da ação (após mover, se quiser)
      setPlayerActionConfirmed(true);
    }
  }, [battleState, selectedCard, selectedTarget, choosePlayerCard]);
  
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
    actionMode,
    selectedHex,
    
    // Movimento
    validMoveHexes,
    validTargetHexes,
    
    // Ações
    startBattle,
    choosePlayerCard,
    executePlayerAction,
    executeAIAction,
    resetBattle,
    selectCard,
    selectTarget,
    confirmAction,
    toggleActionMode,
    movePlayer,
    handleHexClick
  };
}
