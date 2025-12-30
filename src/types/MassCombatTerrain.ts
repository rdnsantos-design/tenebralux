// Re-exporta para compatibilidade com código existente
// Fonte única de verdade: src/types/combat/

export {
  type MassCombatPrimaryTerrain,
  type MassCombatSecondaryTerrain,
  type MassCombatTerrainCompatibility,
  type VisibilityLevel,
  type ClimateType,
  VISIBILITY_OPTIONS,
  CLIMATE_OPTIONS,
  INITIAL_PRIMARY_TERRAINS,
  INITIAL_SECONDARY_TERRAINS,
  TERRAIN_COMPATIBILITY_MAP
} from './combat/mass-combat-terrain';
