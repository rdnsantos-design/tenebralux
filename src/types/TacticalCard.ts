// Re-exporta para compatibilidade com código existente
// Fonte única de verdade: src/types/combat/

export {
  type TacticalCard,
  type TacticalCardType,
  type TacticalCardSubtype,
  type TacticalCulture,
  type UnitType,
  CARD_TYPES,
  CARD_SUBTYPES,
  CULTURES,
  UNIT_TYPES,
  calculateCardCost
} from './combat/tactical-card';
