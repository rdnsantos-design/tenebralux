// Re-exporta para compatibilidade com código existente
// Fonte única de verdade: src/types/combat/

export {
  type MassCombatTacticalCard,
  type MassCombatUnitType,
  type MassCombatCulture,
  MASS_COMBAT_UNIT_TYPES,
  MASS_COMBAT_CULTURES,
  calculateMassCombatVetCost,
  calculateMinCommand,
  calculateMinStrategy,
  validateMassCombatCard
} from './combat/mass-combat-tactical-card';
