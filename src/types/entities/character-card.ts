// ========================
// PERSONAGEM (Tenebra Lux System)
// ========================

export type CharacterType = 'Herói' | 'Comandante' | 'Regente';
export type AbilityType = 'Passiva' | 'Ativável' | 'Uma vez por batalha';
export type EffectType = 'buff_self' | 'debuff_enemy';
export type ConditionalType = 'none' | 'light' | 'heavy';
export type RangeType = 'self' | 'unit' | 'area' | 'enemy';
export type PassiveBonusType = 'Ataque' | 'Defesa' | 'Mobilidade';
export type Specialty = 'Infantaria' | 'Cavalaria' | 'Arqueria' | 'Sitio';

export const CHARACTER_TYPES: CharacterType[] = ['Herói', 'Comandante', 'Regente'];
export const ABILITY_TYPES: AbilityType[] = ['Passiva', 'Ativável', 'Uma vez por batalha'];
export const EFFECT_TYPES: EffectType[] = ['buff_self', 'debuff_enemy'];
export const CONDITIONAL_TYPES: ConditionalType[] = ['none', 'light', 'heavy'];
export const RANGE_TYPES: RangeType[] = ['self', 'unit', 'area', 'enemy'];
export const PASSIVE_BONUS_TYPES: PassiveBonusType[] = ['Ataque', 'Defesa', 'Mobilidade'];
export const DEFAULT_SPECIALTIES: Specialty[] = ['Infantaria', 'Cavalaria', 'Arqueria', 'Sitio'];
export const DEFAULT_CULTURES = ['Anuire', 'Khinasi', 'Vos', 'Rjurik', 'Brecht'];

export interface CharacterAbility {
  id: string;
  name: string;
  description?: string;
  ability_type: AbilityType;
  effect_type: EffectType;
  affected_attribute?: string;
  attribute_modifier: number;
  conditional_type: ConditionalType;
  conditional_description?: string;
  range_type: RangeType;
  base_power_cost: number;
  created_at?: string;
  updated_at?: string;
}

export interface CharacterCard {
  id: string;
  name: string;
  character_type: CharacterType[];
  culture: string;
  // PC/NPC distinction
  is_pc: boolean;
  player_name?: string;
  // Regent linking
  regent_id?: string;
  // Core attributes
  comando: number;
  estrategia: number;
  guarda: number;
  // Passive bonus
  passive_bonus_type?: PassiveBonusType;
  passive_bonus_value: number;
  passive_affects_area: boolean;
  // Specialties
  specialties: Specialty[];
  // Special ability
  ability_id?: string;
  custom_ability_name?: string;
  custom_ability_description?: string;
  custom_ability_power_cost: number;
  // Calculated
  total_power_cost: number;
  power_cost_override?: number;
  // Images
  portrait_url?: string;
  coat_of_arms_url?: string;
  // Bio
  domain?: string;
  notes?: string;
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface AbilityCostRules {
  per_modifier_point: number;
  range_costs: {
    self: number;
    unit: number;
    area: number;
    enemy: number;
  };
  type_costs: {
    'Passiva': number;
    'Ativável': number;
    'Uma vez por batalha': number;
  };
  effect_costs: {
    buff_self: number;
    debuff_enemy: number;
  };
}

export interface SystemConfig {
  attribute_costs: {
    comando: number;
    estrategia: number;
    guarda: number;
  };
  passive_bonus_costs: {
    [key: string]: number;
  };
  passive_area_cost: number;
  conditional_discounts: {
    none: number;
    light: number;
    heavy: number;
  };
  ability_cost_rules: AbilityCostRules;
  cultures: string[];
  specialties: string[];
}

export const DEFAULT_ABILITY_COST_RULES: AbilityCostRules = {
  per_modifier_point: 1,
  range_costs: {
    self: 0,
    unit: 0,
    area: 1,
    enemy: 0.5
  },
  type_costs: {
    'Passiva': 2,
    'Ativável': 1,
    'Uma vez por batalha': 0
  },
  effect_costs: {
    buff_self: 0,
    debuff_enemy: 0.5
  }
};

// Default configuration values
export const DEFAULT_CONFIG: SystemConfig = {
  attribute_costs: {
    comando: 1,
    estrategia: 2,
    guarda: 0.5
  },
  passive_bonus_costs: {
    '1': 1,
    '2': 3,
    '3': 5
  },
  passive_area_cost: 1,
  conditional_discounts: {
    none: 0,
    light: 1,
    heavy: 2
  },
  ability_cost_rules: DEFAULT_ABILITY_COST_RULES,
  cultures: DEFAULT_CULTURES,
  specialties: DEFAULT_SPECIALTIES
};

// Cost per additional specialty multiplier (2nd costs 1×3, 3rd costs 2×3, etc.)
export const SPECIALTY_COST_MULTIPLIER = 3;

// Calculate specialty cost: first is free, each next costs (current count × 3)
export function calculateSpecialtyCost(specialtyCount: number): number {
  if (specialtyCount <= 1) return 0;
  return SPECIALTY_COST_MULTIPLIER * ((specialtyCount - 1) * specialtyCount) / 2;
}

// Calculate power cost for a character card
export function calculatePowerCost(
  card: Partial<CharacterCard>,
  config: SystemConfig = DEFAULT_CONFIG
): number {
  let cost = 0;

  cost += (card.comando || 0) * config.attribute_costs.comando;
  cost += (card.estrategia || 0) * config.attribute_costs.estrategia;
  cost += (card.guarda || 0) * config.attribute_costs.guarda;

  const specialtyCount = card.specialties?.length || 0;
  cost += calculateSpecialtyCost(specialtyCount);

  if (card.passive_bonus_value && card.passive_bonus_value > 0) {
    const bonusCost = config.passive_bonus_costs[card.passive_bonus_value.toString()] || 0;
    cost += bonusCost;
    
    if (card.passive_affects_area) {
      cost += config.passive_area_cost;
    }
  }

  if (card.custom_ability_power_cost) {
    cost += card.custom_ability_power_cost;
  }

  return Math.max(0, cost);
}

// Calculate ability power cost automatically based on components
export function calculateAbilityCost(
  ability: Partial<CharacterAbility>,
  config: SystemConfig = DEFAULT_CONFIG
): number {
  const rules = config.ability_cost_rules || DEFAULT_ABILITY_COST_RULES;
  
  const modifierCost = Math.abs(ability.attribute_modifier || 0) * rules.per_modifier_point;
  const rangeCost = rules.range_costs[ability.range_type || 'self'] || 0;
  const typeCost = rules.type_costs[ability.ability_type || 'Ativável'] || 0;
  const effectCost = rules.effect_costs[ability.effect_type || 'buff_self'] || 0;
  const discount = config.conditional_discounts[ability.conditional_type || 'none'] || 0;
  
  if (ability.base_power_cost !== undefined && ability.base_power_cost > 0) {
    return Math.max(0, ability.base_power_cost - discount);
  }
  
  const calculatedCost = modifierCost + rangeCost + typeCost + effectCost - discount;
  return Math.max(0, calculatedCost);
}

// Label helpers
export const EFFECT_TYPE_LABELS: Record<EffectType, string> = {
  buff_self: 'Buff para si/aliados',
  debuff_enemy: 'Debuff para inimigo'
};

export const CONDITIONAL_TYPE_LABELS: Record<ConditionalType, string> = {
  none: 'Sem condicional',
  light: 'Condicional leve (-1 custo)',
  heavy: 'Condicional pesada (-2 custo)'
};

export const RANGE_TYPE_LABELS: Record<RangeType, string> = {
  self: 'Próprio',
  unit: 'Unidade',
  area: 'Área de influência',
  enemy: 'Inimigo'
};
