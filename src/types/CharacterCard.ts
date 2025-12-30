// Re-exporta para compatibilidade com código existente
// Fonte única de verdade: src/types/entities/

export {
  type CharacterCard,
  type CharacterAbility,
  type CharacterType,
  type AbilityType,
  type EffectType,
  type ConditionalType,
  type RangeType,
  type PassiveBonusType,
  type Specialty,
  type SystemConfig,
  type AbilityCostRules,
  CHARACTER_TYPES,
  ABILITY_TYPES,
  EFFECT_TYPES,
  CONDITIONAL_TYPES,
  RANGE_TYPES,
  PASSIVE_BONUS_TYPES,
  DEFAULT_SPECIALTIES,
  DEFAULT_CULTURES,
  DEFAULT_CONFIG,
  DEFAULT_ABILITY_COST_RULES,
  SPECIALTY_COST_MULTIPLIER,
  calculateSpecialtyCost,
  calculatePowerCost,
  calculateAbilityCost,
  calculateAbilityCostBreakdown,
  EFFECT_TYPE_LABELS,
  CONDITIONAL_TYPE_LABELS,
  RANGE_TYPE_LABELS
} from './entities/character-card';
