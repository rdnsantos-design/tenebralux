import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { 
  TacticalGameState, 
  BattleUnit, 
  BattleCommander,
  HexCoord, 
  GamePhase,
  PlayerId,
  GameAction,
  hexToKey,
} from '@/types/tactical-game';
import { Posture } from '@/types/cards/unit-card';
import { useTacticalGameState } from '@/hooks/useTacticalGameState';
import { getNeighbors, hexDistance, isValidHex, hexKey } from '@/lib/hexUtils';

interface TacticalGameContextType {
  // Estado
  gameState: TacticalGameState | null;
  isLoading: boolean;
  error: string | null;
  
  // Identificação do jogador
  myPlayerId: PlayerId | null;
  isMyTurn: boolean;
  
  // Seleção (estado local)
  selectedUnitId: string | null;
  selectedCommanderId: string | null;
  validMoves: HexCoord[];
  validTargets: string[];
  hoveredUnit: BattleUnit | null;
  
  // Ações de UI (local)
  selectUnit: (unitId: string | null) => void;
  selectCommander: (commanderId: string | null) => void;
  setHoveredUnit: (unit: BattleUnit | null) => void;
  
  // Ações de jogo (sincronizadas)
  moveUnit: (unitId: string, to: HexCoord) => Promise<boolean>;
  attackUnit: (attackerId: string, targetId: string) => Promise<boolean>;
  setPosture: (unitId: string, posture: Posture) => Promise<boolean>;
  endPhase: () => Promise<boolean>;
  rollInitiative: () => Promise<boolean>;
  
  // Utilitários
  getUnit: (unitId: string) => BattleUnit | undefined;
  getCommander: (commanderId: string) => BattleCommander | undefined;
  getUnitAtHex: (coord: HexCoord) => BattleUnit | undefined;
  canUsePosture: (unitId: string, posture: Posture) => boolean;
  isUnitEngaged: (unitId: string) => boolean;
}

const TacticalGameContext = createContext<TacticalGameContextType | null>(null);

interface TacticalGameProviderProps {
  children: React.ReactNode;
  matchId: string;
  playerId: string;
}

export function TacticalGameProvider({ children, matchId, playerId }: TacticalGameProviderProps) {
  const { 
    gameState: loadedState, 
    loading, 
    loadGameState, 
    saveGameState, 
    subscribeToGameState,
    logAction,
  } = useTacticalGameState();
  
  const [gameState, setGameState] = useState<TacticalGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estado local de seleção
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedCommanderId, setSelectedCommanderId] = useState<string | null>(null);
  const [hoveredUnit, setHoveredUnit] = useState<BattleUnit | null>(null);
  
  // Determinar qual jogador eu sou
  const myPlayerId = useMemo((): PlayerId | null => {
    if (!gameState) return null;
    if (gameState.player1Id === playerId) return 'player1';
    if (gameState.player2Id === playerId) return 'player2';
    return null;
  }, [gameState, playerId]);
  
  // Verificar se é meu turno
  const isMyTurn = useMemo(() => {
    if (!gameState || !myPlayerId) return false;
    if (gameState.phase === 'initiative') return true; // Ambos participam
    return gameState.activePlayer === myPlayerId;
  }, [gameState, myPlayerId]);
  
  // Calcular movimentos válidos para unidade selecionada
  const validMoves = useMemo((): HexCoord[] => {
    if (!gameState || !selectedUnitId) return [];
    
    const unit = gameState.units[selectedUnitId];
    if (!unit || unit.owner !== myPlayerId) return [];
    if (unit.hasActedThisTurn) return [];
    if (gameState.phase !== 'movement') return [];
    
    return calculateValidMoves(unit, gameState);
  }, [gameState, selectedUnitId, myPlayerId]);
  
  // Calcular alvos válidos para unidade selecionada
  const validTargets = useMemo((): string[] => {
    if (!gameState || !selectedUnitId) return [];
    
    const unit = gameState.units[selectedUnitId];
    if (!unit || unit.owner !== myPlayerId) return [];
    
    if (gameState.phase === 'melee') {
      return calculateMeleeTargets(unit, gameState);
    }
    if (gameState.phase === 'shooting' && unit.currentRanged > 0) {
      return calculateShootingTargets(unit, gameState);
    }
    
    return [];
  }, [gameState, selectedUnitId, myPlayerId]);
  
  // Carregar estado inicial
  useEffect(() => {
    loadGameState(matchId).then(state => {
      if (state) setGameState(state);
    });
  }, [matchId, loadGameState]);
  
  // Subscribe para mudanças Realtime
  useEffect(() => {
    const unsubscribe = subscribeToGameState(matchId, (newState) => {
      setGameState(newState);
    });
    return unsubscribe;
  }, [matchId, subscribeToGameState]);
  
  // Atualizar quando loadedState mudar
  useEffect(() => {
    if (loadedState) setGameState(loadedState);
  }, [loadedState]);
  
  // Utilitários
  const getUnit = useCallback((unitId: string) => {
    return gameState?.units[unitId];
  }, [gameState]);
  
  const getCommander = useCallback((commanderId: string) => {
    return gameState?.commanders[commanderId];
  }, [gameState]);
  
  const getUnitAtHex = useCallback((coord: HexCoord) => {
    if (!gameState) return undefined;
    const key = hexKey(coord);
    const hex = gameState.hexes[key];
    if (hex?.unitId) {
      return gameState.units[hex.unitId];
    }
    return undefined;
  }, [gameState]);
  
  const isUnitEngaged = useCallback((unitId: string): boolean => {
    if (!gameState) return false;
    const unit = gameState.units[unitId];
    if (!unit) return false;
    
    const neighbors = getNeighbors(unit.position);
    for (const neighbor of neighbors) {
      const neighborKey = hexKey(neighbor);
      const neighborHex = gameState.hexes[neighborKey];
      if (neighborHex?.unitId) {
        const neighborUnit = gameState.units[neighborHex.unitId];
        if (neighborUnit && neighborUnit.owner !== unit.owner) {
          return true;
        }
      }
    }
    return false;
  }, [gameState]);
  
  const canUsePosture = useCallback((unitId: string, posture: Posture): boolean => {
    if (!gameState) return false;
    const unit = gameState.units[unitId];
    if (!unit) return false;
    
    switch (posture) {
      case 'Ofensiva':
        return true;
      case 'Defensiva':
        // Precisa habilidade "Escudo"
        return unit.specialAbilities.some(a => 
          a.name.toLowerCase().includes('escudo') || a.name.toLowerCase().includes('shield')
        );
      case 'Carga':
        return unit.unitType === 'Cavalaria';
      case 'Reorganização':
        return !isUnitEngaged(unitId);
      default:
        return false;
    }
  }, [gameState, isUnitEngaged]);
  
  // Ações de UI
  const selectUnit = useCallback((unitId: string | null) => {
    setSelectedUnitId(unitId);
    setSelectedCommanderId(null);
  }, []);
  
  const selectCommander = useCallback((commanderId: string | null) => {
    setSelectedCommanderId(commanderId);
    setSelectedUnitId(null);
  }, []);
  
  // Ações de jogo
  const moveUnit = useCallback(async (unitId: string, to: HexCoord): Promise<boolean> => {
    if (!gameState || !myPlayerId || !isMyTurn) return false;
    
    const unit = gameState.units[unitId];
    if (!unit || unit.owner !== myPlayerId) return false;
    if (unit.hasActedThisTurn) return false;
    
    // Validar movimento
    const validMoveKeys = new Set(calculateValidMoves(unit, gameState).map(c => hexKey(c)));
    if (!validMoveKeys.has(hexKey(to))) return false;
    
    // Criar novo estado
    const fromKey = hexKey(unit.position);
    const toKey = hexKey(to);
    
    const newUnits = { ...gameState.units };
    const newHexes = { ...gameState.hexes };
    
    // Atualizar unidade
    newUnits[unitId] = {
      ...unit,
      position: to,
      hasActedThisTurn: true,
      // Atualizar facing baseado na direção do movimento
      facing: (getDirectionFromMove(unit.position, to) as BattleUnit['facing']) || unit.facing,
    };
    
    // Atualizar hexes
    if (newHexes[fromKey]) {
      newHexes[fromKey] = { ...newHexes[fromKey], unitId: undefined };
    }
    if (newHexes[toKey]) {
      newHexes[toKey] = { ...newHexes[toKey], unitId };
    }
    
    // Lógica de alternância de turno
    let newActivePlayer = gameState.activePlayer;
    const newUnitsMovedThisPhase = gameState.unitsMovedThisPhase + 1;
    
    // Se passou da vantagem de iniciativa, alternar
    if (newUnitsMovedThisPhase > gameState.initiativeAdvantage) {
      newActivePlayer = gameState.activePlayer === 'player1' ? 'player2' : 'player1';
    }
    
    const newState: TacticalGameState = {
      ...gameState,
      units: newUnits,
      hexes: newHexes,
      activePlayer: newActivePlayer,
      unitsMovedThisPhase: newUnitsMovedThisPhase,
      battleLog: [
        ...gameState.battleLog,
        {
          id: crypto.randomUUID(),
          turn: gameState.turn,
          phase: gameState.phase,
          timestamp: Date.now(),
          type: 'movement',
          message: `${unit.name} moveu para (${to.q}, ${to.r})`,
        }
      ],
    };
    
    // Salvar e logar
    const action: GameAction = { type: 'MOVE_UNIT', unitId, to };
    await logAction(matchId, playerId, action);
    const success = await saveGameState(matchId, newState);
    
    if (success) {
      setGameState(newState);
      setSelectedUnitId(null);
    }
    
    return success;
  }, [gameState, myPlayerId, isMyTurn, matchId, playerId, saveGameState, logAction]);
  
  const attackUnit = useCallback(async (attackerId: string, targetId: string): Promise<boolean> => {
    // Implementar no próximo prompt (combate)
    console.log('Attack:', attackerId, '->', targetId);
    return false;
  }, []);
  
  const setPosture = useCallback(async (unitId: string, posture: Posture): Promise<boolean> => {
    if (!gameState || !myPlayerId || !isMyTurn) return false;
    
    const unit = gameState.units[unitId];
    if (!unit || unit.owner !== myPlayerId) return false;
    if (!canUsePosture(unitId, posture)) return false;
    
    const newUnits = { ...gameState.units };
    newUnits[unitId] = { ...unit, posture };
    
    const newState: TacticalGameState = {
      ...gameState,
      units: newUnits,
      battleLog: [
        ...gameState.battleLog,
        {
          id: crypto.randomUUID(),
          turn: gameState.turn,
          phase: gameState.phase,
          timestamp: Date.now(),
          type: 'ability',
          message: `${unit.name} mudou para postura ${posture}`,
        }
      ],
    };
    
    const action: GameAction = { type: 'SET_POSTURE', unitId, posture };
    await logAction(matchId, playerId, action);
    const success = await saveGameState(matchId, newState);
    
    if (success) setGameState(newState);
    return success;
  }, [gameState, myPlayerId, isMyTurn, canUsePosture, matchId, playerId, saveGameState, logAction]);
  
  const endPhase = useCallback(async (): Promise<boolean> => {
    if (!gameState || !isMyTurn) return false;
    
    const phases: GamePhase[] = [
      'initiative', 'movement', 'shooting', 'charge', 'melee', 'rout', 'reorganization', 'end_turn'
    ];
    
    const currentIndex = phases.indexOf(gameState.phase);
    let nextPhase = phases[(currentIndex + 1) % phases.length];
    
    let newTurn = gameState.turn;
    const newUnits = { ...gameState.units };
    
    // Se chegou em end_turn, avança turno
    if (nextPhase === 'end_turn') {
      nextPhase = 'initiative';
      newTurn++;
      
      // Reset hasActedThisTurn em todas as unidades
      for (const id of Object.keys(newUnits)) {
        newUnits[id] = { ...newUnits[id], hasActedThisTurn: false };
      }
    }
    
    const newState: TacticalGameState = {
      ...gameState,
      phase: nextPhase,
      turn: newTurn,
      units: newUnits,
      unitsMovedThisPhase: 0,
      activePlayer: gameState.initiativeWinner || 'player1',
      battleLog: [
        ...gameState.battleLog,
        {
          id: crypto.randomUUID(),
          turn: newTurn,
          phase: nextPhase,
          timestamp: Date.now(),
          type: 'system',
          message: `Fase: ${nextPhase}${newTurn > gameState.turn ? ` (Turno ${newTurn})` : ''}`,
        }
      ],
    };
    
    const action: GameAction = { type: 'END_PHASE' };
    await logAction(matchId, playerId, action);
    const success = await saveGameState(matchId, newState);
    
    if (success) {
      setGameState(newState);
      setSelectedUnitId(null);
    }
    return success;
  }, [gameState, isMyTurn, matchId, playerId, saveGameState, logAction]);
  
  const rollInitiative = useCallback(async (): Promise<boolean> => {
    if (!gameState || gameState.phase !== 'initiative') return false;
    
    // Buscar comandantes para bônus de estratégia
    const p1Commander = Object.values(gameState.commanders).find(c => c.owner === 'player1');
    const p2Commander = Object.values(gameState.commanders).find(c => c.owner === 'player2');
    
    const p1Strategy = p1Commander?.strategy || 0;
    const p2Strategy = p2Commander?.strategy || 0;
    
    // Rolar 1d20 + estratégia
    const p1Roll = Math.floor(Math.random() * 20) + 1 + p1Strategy;
    const p2Roll = Math.floor(Math.random() * 20) + 1 + p2Strategy;
    
    const difference = Math.abs(p1Roll - p2Roll);
    const winner: PlayerId = p1Roll >= p2Roll ? 'player1' : 'player2';
    
    // Calcular vantagem
    let advantage = 0;
    if (difference >= 1 && difference <= 3) advantage = 1;
    else if (difference >= 4 && difference <= 6) advantage = 2;
    else if (difference >= 7 && difference <= 9) advantage = 3;
    else if (difference >= 10) advantage = 4;
    
    const newState: TacticalGameState = {
      ...gameState,
      phase: 'movement',
      initiativeWinner: winner,
      initiativeAdvantage: advantage,
      activePlayer: winner,
      unitsMovedThisPhase: 0,
      battleLog: [
        ...gameState.battleLog,
        {
          id: crypto.randomUUID(),
          turn: gameState.turn,
          phase: 'initiative',
          timestamp: Date.now(),
          type: 'system',
          message: `Iniciativa: P1 ${p1Roll} vs P2 ${p2Roll} → ${winner === 'player1' ? 'Player 1' : 'Player 2'} vence (vantagem: ${advantage})`,
        }
      ],
    };
    
    const action: GameAction = { type: 'ROLL_INITIATIVE', player1Roll: p1Roll, player2Roll: p2Roll };
    await logAction(matchId, playerId, action);
    const success = await saveGameState(matchId, newState);
    
    if (success) setGameState(newState);
    return success;
  }, [gameState, matchId, playerId, saveGameState, logAction]);
  
  const value: TacticalGameContextType = {
    gameState,
    isLoading: loading,
    error,
    myPlayerId,
    isMyTurn,
    selectedUnitId,
    selectedCommanderId,
    validMoves,
    validTargets,
    hoveredUnit,
    selectUnit,
    selectCommander,
    setHoveredUnit,
    moveUnit,
    attackUnit,
    setPosture,
    endPhase,
    rollInitiative,
    getUnit,
    getCommander,
    getUnitAtHex,
    canUsePosture,
    isUnitEngaged,
  };
  
  return (
    <TacticalGameContext.Provider value={value}>
      {children}
    </TacticalGameContext.Provider>
  );
}

export function useTacticalGame() {
  const context = useContext(TacticalGameContext);
  if (!context) {
    throw new Error('useTacticalGame must be used within TacticalGameProvider');
  }
  return context;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function calculateValidMoves(unit: BattleUnit, gameState: TacticalGameState): HexCoord[] {
  const moves: HexCoord[] = [];
  let maxDistance = unit.currentMovement;
  
  // Modificadores de postura
  if (unit.posture === 'Carga') maxDistance *= 2;
  if (unit.posture === 'Defensiva') maxDistance = 1;
  if (unit.posture === 'Reorganização') return []; // Não pode mover
  
  // BFS para encontrar hexes alcançáveis
  const visited = new Set<string>();
  const queue: { coord: HexCoord; distance: number }[] = [
    { coord: unit.position, distance: 0 }
  ];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const { coord, distance } = current;
    const key = hexKey(coord);
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (distance > 0) {
      const hex = gameState.hexes[key];
      // Não pode entrar em hex com unidade
      if (!hex?.unitId) {
        moves.push(coord);
      }
    }
    
    if (distance < maxDistance) {
      for (const neighbor of getNeighbors(coord)) {
        if (!isValidHex(neighbor.q, neighbor.r)) continue;
        
        const neighborKey = hexKey(neighbor);
        const neighborHex = gameState.hexes[neighborKey];
        
        // Não pode atravessar unidades (exceto as próprias em algumas situações)
        if (!neighborHex?.unitId) {
          queue.push({ coord: neighbor, distance: distance + 1 });
        }
      }
    }
  }
  
  return moves;
}

function calculateMeleeTargets(unit: BattleUnit, gameState: TacticalGameState): string[] {
  const targets: string[] = [];
  const neighbors = getNeighbors(unit.position);
  
  for (const neighbor of neighbors) {
    const key = hexKey(neighbor);
    const hex = gameState.hexes[key];
    if (hex?.unitId) {
      const targetUnit = gameState.units[hex.unitId];
      if (targetUnit && targetUnit.owner !== unit.owner) {
        targets.push(hex.unitId);
      }
    }
  }
  
  return targets;
}

function calculateShootingTargets(unit: BattleUnit, gameState: TacticalGameState): string[] {
  const targets: string[] = [];
  const maxRange = 24;
  
  for (const [id, targetUnit] of Object.entries(gameState.units)) {
    if (targetUnit.owner === unit.owner) continue;
    
    const distance = hexDistance(unit.position, targetUnit.position);
    if (distance <= maxRange && distance > 0) {
      targets.push(id);
    }
  }
  
  return targets;
}

function getDirectionFromMove(from: HexCoord, to: HexCoord): string | null {
  const dq = to.q - from.q;
  const dr = to.r - from.r;
  
  // Normalizar
  const len = Math.sqrt(dq * dq + dr * dr);
  if (len === 0) return null;
  
  const angle = Math.atan2(dr, dq) * 180 / Math.PI;
  
  if (angle >= -30 && angle < 30) return 'SE';
  if (angle >= 30 && angle < 90) return 'S';
  if (angle >= 90 && angle < 150) return 'SW';
  if (angle >= 150 || angle < -150) return 'NW';
  if (angle >= -150 && angle < -90) return 'N';
  if (angle >= -90 && angle < -30) return 'NE';
  
  return 'SE';
}
