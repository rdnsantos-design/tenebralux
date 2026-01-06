/**
 * CARTAS UNIFICADAS
 * 
 * Sistema de cards dinâmico baseado no modo de jogo:
 * - Skirmish: Afeta unidades individuais no tabuleiro hexagonal
 * - Warfare: Afeta atributos de exército no card game estratégico
 * - RPG: Afeta personagens em combate ou debate
 * - Dominion: Afeta ações de domínio e regência
 */

// === MODOS DE JOGO ===
export type UnifiedCardGameMode = 'skirmish' | 'warfare' | 'rpg' | 'dominion';

// === TIPOS DE CARTA POR MODO ===
export type UnifiedSkirmishCardType = 'movimento' | 'ataque' | 'defesa' | 'moral' | 'reacao';
export type UnifiedWarfareCardType = 'ofensiva' | 'defensiva' | 'mobilidade' | 'reacao';
export type UnifiedRpgCardType = 'combate' | 'debate' | 'exploracao';
export type UnifiedDominionCardType = 'politica' | 'militar' | 'economica' | 'arcana';

export type UnifiedCardType = UnifiedSkirmishCardType | UnifiedWarfareCardType | UnifiedRpgCardType | UnifiedDominionCardType;
export type UnifiedCardSubtype = 'buff' | 'debuff' | 'neutra' | 'instantanea';
export type UnifiedSkirmishUnitType = 'Infantaria' | 'Cavalaria' | 'Arqueiros' | 'Cerco' | 'Geral';
export type UnifiedCulture = 'Anuire' | 'Khinasi' | 'Vos' | 'Rjurik' | 'Brecht';

// === MODIFICADORES ===
export interface SkirmishModifiers {
  attack?: number;
  defense?: number;
  mobility?: number;
  morale?: number;
  ranged?: number;
  pressure?: number;
  lethal?: number;
  ignoresPressure?: boolean;
  targetsOutsideCommander?: boolean;
  affectsEnemy?: boolean;
  requiresSpecialization?: boolean;
}

export interface WarfareModifiers {
  attack?: number;
  defense?: number;
  mobility?: number;
  hp?: number;
  initiative?: number;
}

export interface RpgModifiers {
  attack?: number;
  damage?: number;
  guard?: number;
  evasion?: number;
  vitality?: number;
  speed?: string;
  persuasion?: number;
  conviction?: number;
  influence?: number;
  willpower?: number;
}

export interface DominionModifiers {
  administration?: number;
  war?: number;
  arcanism?: number;
  science?: number;
  negotiation?: number;
  intrigue?: number;
}

// === EFEITOS ===
export interface UnifiedCardEffects {
  minorEffect?: string;
  majorEffect?: string;
  minorCondition?: string;
  majorCondition?: string;
  special?: string;
  effectType?: string;
  effectTag?: string;
}

// === REQUISITOS ===
export interface UnifiedCardRequirements {
  command?: number;
  strategy?: number;
  culture?: UnifiedCulture;
  unitType?: UnifiedSkirmishUnitType;
  specialization?: string;
  phase?: string;
  attribute?: string;
  skill?: string;
  minLevel?: number;
  domainType?: string;
  regencyCost?: number;
}

// === CARTA UNIFICADA ===
export interface UnifiedGameCard {
  id: string;
  name: string;
  description?: string;
  gameModes: UnifiedCardGameMode[];
  cardType: UnifiedCardType;
  subtype?: UnifiedCardSubtype;
  imageUrl?: string;
  flavorText?: string;
  requirements: UnifiedCardRequirements;
  skirmishBonuses?: SkirmishModifiers;
  skirmishPenalties?: SkirmishModifiers;
  warfareBonuses?: WarfareModifiers;
  warfarePenalties?: WarfareModifiers;
  rpgBonuses?: RpgModifiers;
  rpgPenalties?: RpgModifiers;
  dominionBonuses?: DominionModifiers;
  dominionPenalties?: DominionModifiers;
  effects: UnifiedCardEffects;
  vetCost?: number;
  vetCostOverride?: number;
  bonusCultures?: UnifiedCulture[];
  penaltyCultures?: UnifiedCulture[];
  affectedUnitTypes?: UnifiedSkirmishUnitType[];
  rarity?: 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario';
  created_at?: string;
  updated_at?: string;
}

// === CONSTANTES ===
export const UNIFIED_CARD_GAME_MODES: { value: UnifiedCardGameMode; label: string }[] = [
  { value: 'skirmish', label: 'Tabuleiro Tático' },
  { value: 'warfare', label: 'Card Game Estratégico' },
  { value: 'rpg', label: 'RPG' },
  { value: 'dominion', label: 'Domínio' },
];

export const UNIFIED_SKIRMISH_CARD_TYPES: UnifiedSkirmishCardType[] = ['movimento', 'ataque', 'defesa', 'moral', 'reacao'];
export const UNIFIED_WARFARE_CARD_TYPES: UnifiedWarfareCardType[] = ['ofensiva', 'defensiva', 'mobilidade', 'reacao'];
export const UNIFIED_RPG_CARD_TYPES: UnifiedRpgCardType[] = ['combate', 'debate', 'exploracao'];
export const UNIFIED_DOMINION_CARD_TYPES: UnifiedDominionCardType[] = ['politica', 'militar', 'economica', 'arcana'];
export const UNIFIED_CARD_SUBTYPES: UnifiedCardSubtype[] = ['buff', 'debuff', 'neutra', 'instantanea'];
export const UNIFIED_CULTURES: UnifiedCulture[] = ['Anuire', 'Khinasi', 'Vos', 'Rjurik', 'Brecht'];
export const UNIFIED_SKIRMISH_UNIT_TYPES: UnifiedSkirmishUnitType[] = ['Infantaria', 'Cavalaria', 'Arqueiros', 'Cerco', 'Geral'];

// === FUNÇÕES ===
export function calculateUnifiedSkirmishVetCost(card: Partial<UnifiedGameCard>): number {
  const bonuses = card.skirmishBonuses || {};
  const bonusCost = (bonuses.attack || 0) + (bonuses.defense || 0) + (bonuses.mobility || 0);
  const minorEffectCost = card.effects?.minorEffect?.trim() ? 2 : 0;
  const majorEffectCost = card.effects?.majorEffect?.trim() ? 4 : 0;
  const minorConditionReduction = card.effects?.minorCondition?.trim() ? 1 : 0;
  const majorConditionReduction = card.effects?.majorCondition?.trim() ? 2 : 0;
  return Math.max(0, bonusCost + minorEffectCost + majorEffectCost - minorConditionReduction - majorConditionReduction);
}

export function calculateUnifiedWarfareVetCost(card: Partial<UnifiedGameCard>): number {
  const bonuses = card.warfareBonuses || {};
  const bonusCost = (bonuses.attack || 0) + (bonuses.defense || 0) + (bonuses.mobility || 0);
  const minorEffectCost = card.effects?.minorEffect?.trim() ? 2 : 0;
  const majorEffectCost = card.effects?.majorEffect?.trim() ? 4 : 0;
  const minorConditionReduction = card.effects?.minorCondition?.trim() ? 1 : 0;
  const majorConditionReduction = card.effects?.majorCondition?.trim() ? 2 : 0;
  return Math.max(0, bonusCost + minorEffectCost + majorEffectCost - minorConditionReduction - majorConditionReduction);
}

export function getUnifiedFinalVetCost(card: Partial<UnifiedGameCard>, mode: UnifiedCardGameMode): number {
  if (card.vetCostOverride != null) return card.vetCostOverride;
  if (mode === 'skirmish') return calculateUnifiedSkirmishVetCost(card);
  if (mode === 'warfare') return calculateUnifiedWarfareVetCost(card);
  return card.vetCost || 0;
}

export function validateUnifiedGameCard(card: Partial<UnifiedGameCard>): string[] {
  const errors: string[] = [];
  if (!card.name?.trim()) errors.push('Nome é obrigatório');
  if (!card.gameModes?.length) errors.push('Selecione pelo menos um modo de jogo');
  if (!card.cardType) errors.push('Tipo de carta é obrigatório');
  return errors;
}
