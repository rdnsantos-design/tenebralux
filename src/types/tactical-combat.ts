/**
 * Sistema de Combate Tático Individual
 * Baseado em Timeline de Ticks, ações por velocidade
 * 
 * Fórmulas de Stats Derivados:
 * - Reação = Reflexos × 2 + Prontidão
 * - Guarda = Reflexos + Esquiva + Instinto
 * - Evasão = Intuição × 2 + Percepção
 * - Vitalidade = Corpo × 2 + Resistência
 * - Movimento = Corpo × 2 + Atletismo
 * - Preparo = Determinação + Corpo + Vigor
 */

import { ThemeId } from '@/themes/types';

// ============= TIPOS DE CARTA =============

export type CombatCardType = 'basic' | 'tactical' | 'special' | 'posture' | 'reaction';

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
  guardMultiplier?: number;   // Multiplicador de guarda (para posturas)
  allowMultipleTargets?: boolean;
  maxTargets?: number;
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
  range: number;              // Alcance em hexes (0 = melee adjacente, 2 = lança)
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

// ============= COBERTURA =============

export type CoverType = 'none' | 'light' | 'partial' | 'heavy' | 'total';

export const COVER_MODIFIERS: Record<CoverType, number> = {
  none: 0,
  light: 1,      // Vegetação, fumaça
  partial: 2,    // Meia parede, veículo
  heavy: 3,      // Trincheira, janela
  total: 999     // Parede completa - LoS bloqueada
};

// ============= HEX E POSIÇÃO =============

export interface HexCoord {
  q: number;
  r: number;
}

export interface HexTile {
  coord: HexCoord;
  terrain: 'normal' | 'difficult' | 'water' | 'impassable';
  elevation: number;
  cover: CoverType;
  blocked: boolean;
  occupantId: string | null;
}

export interface HexMap {
  width: number;
  height: number;
  hexes: Map<string, HexTile>;
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
    percepcao: number;
    vigor: number;
    resiliencia: number;
    instinto: number;
  };
  
  // Stats derivados (calculados)
  vitality: number;           // Corpo × 2 + Resistência
  maxVitality: number;
  evasion: number;            // Intuição × 2 + Percepção (absorve dano)
  maxEvasion: number;
  guard: number;              // Reflexos + Esquiva + Instinto
  reaction: number;           // Reflexos × 2 + Prontidão
  movement: number;           // Corpo × 2 + Atletismo
  prep: number;               // Determinação + Corpo + Vigor (intervalo fadiga)
  
  // Equipamento
  weapon?: TacticalWeapon;
  armor?: TacticalArmor;
  
  // Estado em combate
  currentTick: number;
  fatigue: number;
  slowness: number;           // Lentidão (+tick por ação quando evasão < 0)
  wounds: number;             // Ferimentos (-1 em todos atributos por ponto)
  isDown: boolean;
  currentMovement: number;    // Movimento restante no turno
  lastFatigueTick: number;    // Último tick que sofreu fadiga
  
  // Cartas e posturas
  availableCards: string[];
  purchasedCards: string[];   // Cartas compradas com XP
  activePosture: string | null; // ID da postura ativa
  
  // Posição no mapa
  position?: HexCoord;
  facing?: number;            // Direção (0-5 para hexágono)
}

export interface Combatant {
  id: string;
  name: string;
  theme: ThemeId;
  characterId?: string;       // Referência ao personagem original
  stats: CombatantStats;
  team: 'player' | 'enemy';
  portraitUrl?: string;
  
  // IA comportamento (para inimigos)
  behavior?: EnemyBehavior;
}

// ============= COMPORTAMENTO DE IA =============

export type AggressionLevel = 'passive' | 'balanced' | 'aggressive';
export type TargetPriority = 'nearest' | 'weakest' | 'strongest' | 'random';
export type EnemyTier = 'minion' | 'standard' | 'elite' | 'boss';

export interface EnemyBehavior {
  aggression: AggressionLevel;
  targetPriority: TargetPriority;
  fleeThreshold: number;      // % HP para fugir (0 = nunca)
  preferredRange: 'melee' | 'ranged' | 'any';
  usesPostures: boolean;
  usesCover: boolean;
}

export interface EnemyTemplate {
  id: string;
  name: {
    akashic: string;
    tenebralux: string;
  };
  tier: EnemyTier;
  stats: {
    reaction: number;
    guard: number;
    evasion: number;
    vitality: number;
    movement: number;
    prep: number;
  };
  weapon: {
    name: string;
    damage: number;
    speed: number;
    range: number;
  };
  behavior: EnemyBehavior;
}

// ============= AÇÕES DE COMBATE =============

export type ActionType = 'attack' | 'move' | 'defend' | 'rest' | 'posture' | 'reload' | 'swap_weapon' | 'opportunity';

export interface CombatAction {
  id: string;
  type: ActionType;
  combatantId: string;
  card?: CombatCard;
  targetIds?: string[];       // Suporte a múltiplos alvos
  targetId?: string;          // Mantido para compatibilidade
  tick: number;
  executesAtTick: number;
  plannedMovement?: HexCoord[];
  state: 'preparing' | 'executing' | 'resolved' | 'cancelled';
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
  evasionAbsorbed?: number;   // Dano absorvido pela evasão
  vitalityDamage?: number;    // Dano que foi para vitalidade
  isCritical?: boolean;
  isFumble?: boolean;
  effectTriggered?: string;   // Efeito especial ativado
  coverBonus?: number;        // Bônus de cobertura aplicado
  distanceModifier?: number;  // Modificador de distância
  message: string;
}

// ============= ESTADO DA BATALHA =============

export type BattlePhase = 'setup' | 'initiative' | 'combat' | 'victory' | 'defeat';

export interface BattleState {
  id: string;
  currentTick: number;
  maxTick: number;            // 20 - loop
  phase: BattlePhase;
  combatants: Combatant[];
  actionQueue: CombatAction[];
  pendingActions: CombatAction[];  // Ações em preparação
  log: BattleLogEntry[];
  round: number;
  winner?: 'player' | 'enemy' | 'draw';
  map?: HexMap;
}

export interface BattleLogEntry {
  tick: number;
  round: number;
  message: string;
  type: 'action' | 'damage' | 'effect' | 'system' | 'fatigue' | 'opportunity';
  combatantId?: string;
  details?: Record<string, unknown>;
}

// ============= FUNÇÕES DE CÁLCULO DE STATS =============

/**
 * Calcula a Reação do combatente
 * Fórmula: Reflexos × 2 + Prontidão
 */
export function calculateReaction(reflexos: number, prontidao: number): number {
  return (reflexos * 2) + prontidao;
}

/**
 * Calcula a Guarda do combatente
 * Fórmula: Reflexos + Esquiva + Instinto
 */
export function calculateGuard(reflexos: number, esquiva: number, instinto: number): number {
  return reflexos + esquiva + instinto;
}

/**
 * Calcula a Evasão do combatente
 * Fórmula: Intuição × 2 + Percepção
 */
export function calculateEvasion(intuicao: number, percepcao: number): number {
  return (intuicao * 2) + percepcao;
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
 * Calcula o Preparo do combatente (intervalo de fadiga)
 * Fórmula: Determinação + Corpo + Vigor
 */
export function calculatePrep(determinacao: number, corpo: number, vigor: number): number {
  return determinacao + corpo + vigor;
}

/**
 * Calcula modificador de distância para armas de fogo
 */
export function getDistanceModifier(distance: number): number {
  if (distance <= 2) return 1;    // Queima-roupa
  if (distance <= 5) return 0;    // Curta
  if (distance <= 10) return -2;  // Média
  if (distance <= 20) return -4;  // Longa
  return -6;                       // Extrema
}

/**
 * Calcula penalidade por múltiplos alvos
 */
export function getMultiTargetPenalty(targetCount: number): number {
  return (targetCount - 1) * -2;
}

/**
 * Calcula guarda efetiva considerando postura e ferimentos
 */
export function getEffectiveGuard(
  baseGuard: number,
  armorBonus: number,
  wounds: number,
  postureMultiplier: number = 1,
  coverBonus: number = 0
): number {
  const woundPenalty = wounds; // -1 por ferimento
  return Math.max(0, Math.floor((baseGuard - woundPenalty) * postureMultiplier) + armorBonus + coverBonus);
}

/**
 * Calcula atributo efetivo considerando ferimentos
 */
export function getEffectiveAttribute(baseValue: number, wounds: number): number {
  return Math.max(1, baseValue - wounds);
}
