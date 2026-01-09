/**
 * Sistema de Combate Tático Individual
 * Baseado em Timeline de Ticks, ações por velocidade
 */

import { ThemeId } from '@/themes/types';

// ============= ESCALAS DE DANO =============

export type DamageScale = {
  divider: number; // Cada X de margem = +1 dano
  label: string;
};

export const DAMAGE_SCALES: Record<string, DamageScale> = {
  unarmed: { divider: 4, label: 'Desarmado' },
  blade: { divider: 2, label: 'Lâminas' },
  ballistic: { divider: 1, label: 'Balístico' },
  laser: { divider: 2, label: 'Laser' },
  explosion: { divider: 1, label: 'Explosão' }, // + área de efeito
};

// ============= TIPOS DE ARMA =============

export type WeaponCategory = 'unarmed' | 'blade' | 'ballistic' | 'laser' | 'explosion';
export type WeaponWeight = 'light' | 'medium' | 'heavy' | 'very_heavy';

export interface TacticalWeapon {
  id: string;
  name: {
    akashic: string;
    tenebralux: string;
  };
  category: WeaponCategory;
  weight: WeaponWeight;
  baseDamage: number;
  timeModifier: number; // +0 leve, +1 média, +2 pesada, +3 muito pesada
  range: number; // em metros (0 = corpo a corpo)
  damageScale: number; // divisor de escala (1:X)
  special?: string[];
  description: {
    akashic: string;
    tenebralux: string;
  };
}

// ============= ARMADURAS =============

export interface TacticalArmor {
  id: string;
  name: {
    akashic: string;
    tenebralux: string;
  };
  absorption: number;
  evasionPenalty: number;
  weight: WeaponWeight;
  description: {
    akashic: string;
    tenebralux: string;
  };
}

// ============= MANOBRAS DE COMBATE =============

export type ManeuverType = 'quick' | 'strong' | 'aimed' | 'special';
export type CombatSkill = 'luta' | 'laminas' | 'tiro';

export interface CombatManeuver {
  id: string;
  name: {
    akashic: string;
    tenebralux: string;
  };
  skill: CombatSkill;
  type: ManeuverType;
  timeModifier: number; // Somado ao tempo base
  attackModifier: number; // Bônus/penalidade no ataque
  damageMultiplier: number; // Multiplicador de dano (1 = normal, 2 = dobrado)
  description: {
    akashic: string;
    tenebralux: string;
  };
  requirements?: {
    skillMin?: number;
    xpCost?: number; // Custo para desbloquear
  };
  isBasic: boolean; // Manobras básicas são automáticas
}

// ============= COMBATENTE =============

export interface CombatantStats {
  // Stats base (do personagem)
  attributes: {
    corpo: number;
    reflexos: number;
    coordenacao: number;
    determinacao: number;
  };
  skills: {
    luta: number;
    laminas: number;
    tiro: number;
    esquiva: number;
    prontidao: number;
    atletismo: number;
    resistencia: number;
    resiliencia: number;
  };
  
  // Stats derivados
  vitality: number;
  maxVitality: number;
  guard: number;
  evasion: number;
  reactionBase: number;
  movement: number;
  prep: number;
  
  // Equipamento
  weapon?: TacticalWeapon;
  armor?: TacticalArmor;
  
  // Estado em combate
  currentTick: number;
  fatigue: number;
  slowness: number;
  wounds: number;
  isDown: boolean;
  posture: CombatPosture;
  
  // Manobras disponíveis
  availableManeuvers: string[];
}

export type CombatPosture = 'aggressive' | 'defensive' | 'balanced' | 'evasive';

export interface Combatant {
  id: string;
  name: string;
  theme: ThemeId;
  characterId?: string; // Referência ao personagem original
  stats: CombatantStats;
  team: 'player' | 'enemy';
  portraitUrl?: string;
}

// ============= AÇÕES DE COMBATE =============

export type ActionType = 'attack' | 'move' | 'defend' | 'use_item' | 'change_posture' | 'wait';

export interface CombatAction {
  id: string;
  type: ActionType;
  combatantId: string;
  maneuver?: CombatManeuver;
  targetId?: string;
  tick: number;
  resolved: boolean;
  result?: ActionResult;
}

export interface ActionResult {
  success: boolean;
  attackRoll?: number;
  targetGuard?: number;
  margin?: number;
  baseDamage?: number;
  bonusDamage?: number;
  totalDamage?: number;
  absorbed?: number;
  finalDamage?: number;
  isCritical?: boolean;
  isFumble?: boolean;
  message: string;
}

// ============= ESTADO DA BATALHA =============

export type BattlePhase = 'setup' | 'initiative' | 'combat' | 'victory' | 'defeat';

export interface BattleState {
  id: string;
  currentTick: number;
  phase: BattlePhase;
  combatants: Combatant[];
  actionQueue: CombatAction[];
  log: BattleLogEntry[];
  round: number;
  winner?: 'player' | 'enemy' | 'draw';
}

export interface BattleLogEntry {
  tick: number;
  round: number;
  message: string;
  type: 'action' | 'damage' | 'effect' | 'system';
  combatantId?: string;
}

// ============= FUNÇÕES AUXILIARES =============

export function getWeaponTimeModifier(weight: WeaponWeight): number {
  switch (weight) {
    case 'light': return 0;
    case 'medium': return 1;
    case 'heavy': return 2;
    case 'very_heavy': return 3;
    default: return 0;
  }
}

export function getPostureModifiers(posture: CombatPosture): { attack: number; defense: number; evasion: number } {
  switch (posture) {
    case 'aggressive':
      return { attack: 2, defense: -2, evasion: -1 };
    case 'defensive':
      return { attack: -2, defense: 2, evasion: 1 };
    case 'evasive':
      return { attack: -1, defense: -1, evasion: 3 };
    case 'balanced':
    default:
      return { attack: 0, defense: 0, evasion: 0 };
  }
}
