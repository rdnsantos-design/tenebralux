// ========================
// TYPES - ÍNDICE PRINCIPAL
// ========================

// Entidades (fonte principal)
export * from './entities';

// Combate
export * from './combat';

// Cards (re-exporta apenas o que não conflita)
export { 
  type TextFieldMapping,
  type ImageFieldMapping,
  type CardTemplate,
  type CardData,
  type CardBackgroundImage,
  REQUIRED_WIDTH,
  REQUIRED_HEIGHT,
  type UnitCard,
  type SpecialAbility
} from './cards';

// Viagem (re-exporta apenas location legacy para não conflitar com domain.Province)
export { 
  type Country,
  type LocationImport,
  type ProvinceDistance,
  type TravelSpeed,
  type TravelCalculation
} from './travel';
export { type Province as LocationProvince } from './travel/location';

// Importação
export * from './import';
