/**
 * Sistema de Combate Tático Individual
 * Baseado em Timeline de Ticks, ações por velocidade
 * 
 * Fórmulas de Stats Derivados:
 * - Reação = Intuição + Reflexos + Prontidão
 * - Guarda = Reflexos × 2 + Esquiva + Armadura
 * - Evasão = Reflexos × 2 + Instinto
 * - Vitalidade = Corpo × 2 + Resistência
 * - Movimento = Corpo × 2 + Atletismo
 * - Preparo = Determinação × 2 + Atletismo
 */

import { ThemeId } from '@/themes/types';

// ============= TIPOS DE CARTA =============

export type CombatCardType = 'basic' | 'tactical' | 'special';

/**
 * Carta de Combate
 * Contém modificadores de Velocidade, Ataque, Movimento e Efeito
 */
export interface CombatCard {
  id: string;
  name: {
    akashic: string;
    tenebralux: string;
  };
  type: CombatCardType;
  speedModifier: number;      // Modificador de velocidade (ticks)
  attackModifier: number;     // Modificador de ataque
  movementModifier: number;   // Metros de movimento (geralmente negativo = custo)
  effect?: string;            // Efeito especial
  defenseBonus?: number;      // Bônus de defesa (para cartas de defesa)
  requirements?: {
    skillId?: string;
    skillMin?: number;
    xpCost?: number;
  };
  description: {
    akashic: string;
    tenebralux: string;
  };
}

// ============= ARMAS =============

export type WeaponTier = 1 | 2 | 3;
export type WeaponType = 'ballistic' | 'energy' | 'melee' | 'explosive';

/**
 * Arma Tática
 * Formato: Dano, Mod Ataque, Velocidade, Efeito, Slots
 */
export interface TacticalWeapon {
  id: string;
  name: {
    akashic: string;
    tenebralux: string;
  };
  type: WeaponType;
  tier: WeaponTier;
  damage: number;
  attackModifier: number;
  speedModifier: number;      // Velocidade da arma (somado ao tempo)
  effect?: string;
  slots: number;              // Slots ocupados
  range: number;              // Alcance em metros (0 = melee)
  description: {
    akashic: string;
    tenebralux: string;
  };
}

// ============= ARMADURAS =============

/**
 * Armadura Tática
 * Formato: Guarda, Redução Dano, Penalidade Vel, Penalidade Mov
 */
export interface TacticalArmor {
  id: string;
  name: {
    akashic: string;
    tenebralux: string;
  };
  tier: WeaponTier;
  guardBonus: number;         // Bônus de Guarda
  damageReduction: number;    // Redução de dano
  speedPenalty: number;       // Penalidade de velocidade
  movementPenalty: number;    // Penalidade de movimento
  description: {
    akashic: string;
    tenebralux: string;
  };
}

// ============= COMBATENTE =============

export interface CombatantStats {
  // Stats base (do personagem)
  attributes: {
    corpo: number;
    reflexos: number;
    coordenacao: number;
    determinacao: number;
    intuicao: number;
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
    instinto: number;
  };
  
  // Stats derivados (calculados)
  vitality: number;           // Corpo × 2 + Resistência
  maxVitality: number;
  guard: number;              // Reflexos × 2 + Esquiva + Armadura
  evasion: number;            // Reflexos × 2 + Instinto
  reaction: number;           // Intuição + Reflexos + Prontidão
  movement: number;           // Corpo × 2 + Atletismo
  prep: number;               // Determinação × 2 + Atletismo
  
  // Equipamento
  weapon?: TacticalWeapon;
  armor?: TacticalArmor;
  
  // Estado em combate
  currentTick: number;
  fatigue: number;
  slowness: number;
  wounds: number;
  isDown: boolean;
  currentMovement: number;    // Movimento restante no turno
  
  // Cartas disponíveis
  availableCards: string[];
  purchasedCards: string[];   // Cartas compradas com XP
}

export interface Combatant {
  id: string;
  name: string;
  theme: ThemeId;
  characterId?: string;       // Referência ao personagem original
  stats: CombatantStats;
  team: 'player' | 'enemy';
  portraitUrl?: string;
}

// ============= AÇÕES DE COMBATE =============

export type ActionType = 'attack' | 'move' | 'defend' | 'use_item' | 'wait';

export interface CombatAction {
  id: string;
  type: ActionType;
  combatantId: string;
  card?: CombatCard;
  targetId?: string;
  tick: number;
  resolved: boolean;
  result?: ActionResult;
}

export interface ActionResult {
  success: boolean;
  attackRoll?: number;        // Resultado da rolagem
  targetDefense?: number;     // Guarda ou Evasão do alvo
  margin?: number;            // Margem de sucesso/falha
  baseDamage?: number;
  bonusDamage?: number;
  totalDamage?: number;
  reducedDamage?: number;     // Dano após redução de armadura
  finalDamage?: number;
  isCritical?: boolean;
  isFumble?: boolean;
  effectTriggered?: string;   // Efeito especial ativado
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

// ============= FUNÇÕES DE CÁLCULO DE STATS =============

/**
 * Calcula a Reação do combatente
 * Fórmula: Intuição + Reflexos + Prontidão
 */
export function calculateReaction(intuicao: number, reflexos: number, prontidao: number): number {
  return intuicao + reflexos + prontidao;
}

/**
 * Calcula a Guarda do combatente
 * Fórmula: Reflexos × 2 + Esquiva + Bônus de Armadura
 */
export function calculateGuard(reflexos: number, esquiva: number, armorBonus: number = 0): number {
  return (reflexos * 2) + esquiva + armorBonus;
}

/**
 * Calcula a Evasão do combatente
 * Fórmula: Reflexos × 2 + Instinto
 */
export function calculateEvasion(reflexos: number, instinto: number): number {
  return (reflexos * 2) + instinto;
}

/**
 * Calcula a Vitalidade do combatente
 * Fórmula: Corpo × 2 + Resistência
 */
export function calculateVitality(corpo: number, resistencia: number): number {
  return (corpo * 2) + resistencia;
}

/**
 * Calcula o Movimento do combatente
 * Fórmula: Corpo × 2 + Atletismo
 */
export function calculateMovement(corpo: number, atletismo: number): number {
  return (corpo * 2) + atletismo;
}

/**
 * Calcula o Preparo do combatente (tick inicial)
 * Fórmula: Determinação × 2 + Atletismo
 */
export function calculatePrep(determinacao: number, atletismo: number): number {
  return (determinacao * 2) + atletismo;
}
