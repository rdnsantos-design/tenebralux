// Re-exporta para compatibilidade com código existente
// Fonte única de verdade: src/types/entities/

export { 
  type Regent,
} from './entities/regent';

export {
  type Realm,
  type Province,
  type ProvinceWithRealm,
  type RealmRegion,
  type RealmCulture,
  type TerrainTypeName,
  REALM_REGIONS,
  REALM_CULTURES,
  TERRAIN_TYPES
} from './entities/domain';

export {
  type Holding,
  type HoldingWithRegent,
  type HoldingType,
  HOLDING_TYPES
} from './entities/holding';
