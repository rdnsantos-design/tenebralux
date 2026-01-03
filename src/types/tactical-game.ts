// ========================
// TACTICAL BATTLE SYSTEM TYPES
// ========================

// Coordenadas axiais para hexágonos
export interface HexCoord {
  q: number;
  r: number;
}

export type HexDirection = 'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW';

export type GamePhase = 
  | 'setup' | 'initiative' | 'movement' | 'shooting' 
  | 'charge' | 'melee' | 'rout' | 'reorganization' | 'end_turn';

export type PlayerId = 'player1' | 'player2';

// Usar o tipo Posture existente do UnitCard
import { Posture, ExperienceLevel, SpecialAbility } from './cards/unit-card';

export interface BattleUnit {
  id: string;
  cardId: string;
  instanceId?: string;
  name: string;
  unitType: 'Infantaria' | 'Cavalaria' | 'Arqueiros' | 'Cerco';
  culture?: string;
  experience: ExperienceLevel;
  
  baseAttack: number;
  baseDefense: number;
  baseRanged: number;
  baseMovement: number;
  baseMorale: number;
  
  currentAttack: number;
  currentDefense: number;
  currentRanged: number;
  currentMovement: number;
  currentMorale: number;
  
  maxHealth: number;
  currentHealth: number;
  maxPressure: number;
  currentPressure: number;
  permanentPressure: number;
  
  owner: PlayerId;
  position: HexCoord;
  facing: HexDirection;
  posture: Posture;
  isRouting: boolean;
  hasActedThisTurn: boolean;
  hitsReceived: number;
  
  availableTacticalCards: string[];
  activeTacticalCard?: string;
  tacticalCardModifiers?: {
    attackBonus: number;
    defenseBonus: number;
    mobilityBonus: number;
    attackPenalty: number;
    defensePenalty: number;
    mobilityPenalty: number;
  };
  specialAbilities: SpecialAbility[];
}

export interface BattleCommander {
  id: string;
  name: string;
  owner: PlayerId;
  strategy: number;
  command: number;
  guard: number;
  position: HexCoord;
  isEmbedded: boolean;
  embeddedUnitId?: string;
  hasActedThisTurn: boolean;
  usedCommandThisTurn: number;
}

export interface HexData {
  coord: HexCoord;
  terrain: 'plains' | 'forest' | 'hill' | 'river' | 'fortification';
  unitId?: string;
  commanderId?: string;
  terrainModifiers?: {
    attack: number;
    defense: number;
    mobility: number;
  };
}

export interface BattleLogEntry {
  id: string;
  turn: number;
  phase: GamePhase;
  timestamp: number;
  type: 'movement' | 'combat' | 'ability' | 'rout' | 'rally' | 'tactical_card' | 'system';
  message: string;
  details?: Record<string, unknown>;
}

export interface TacticalGameState {
  id: string;
  matchId: string;
  turn: number;
  phase: GamePhase;
  
  player1Id: string;
  player1Name: string;
  player1ArmyId: string;
  player1Culture?: string;
  
  player2Id: string;
  player2Name: string;
  player2ArmyId: string;
  player2Culture?: string;
  
  activePlayer: PlayerId;
  initiativeWinner?: PlayerId;
  initiativeAdvantage: number;
  unitsMovedThisPhase: number;
  
  units: Record<string, BattleUnit>;
  commanders: Record<string, BattleCommander>;
  hexes: Record<string, HexData>;
  
  selectedUnitId?: string;
  selectedCommanderId?: string;
  validMoves: HexCoord[];
  validTargets: string[];
  
  primaryTerrainId?: string;
  secondaryTerrainIds: string[];
  seasonId?: string;
  
  battleLog: BattleLogEntry[];
  winner?: PlayerId;
  isFinished: boolean;
}

export type GameAction = 
  | { type: 'MOVE_UNIT'; unitId: string; to: HexCoord }
  | { type: 'ATTACK_UNIT'; attackerId: string; targetId: string }
  | { type: 'SET_POSTURE'; unitId: string; posture: Posture }
  | { type: 'USE_TACTICAL_CARD'; unitId: string; cardId: string }
  | { type: 'RALLY_UNIT'; commanderId: string; unitId: string }
  | { type: 'END_PHASE' }
  | { type: 'ROLL_INITIATIVE'; player1Roll: number; player2Roll: number }
  | { type: 'SURRENDER'; playerId: PlayerId };

export const hexToKey = (coord: HexCoord): string => `${coord.q},${coord.r}`;

export const keyToHex = (key: string): HexCoord => {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
};
