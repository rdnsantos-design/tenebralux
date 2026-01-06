// ========================
// COMBATE E TERRENO
// ========================

// Tipos legados (mantidos para compatibilidade)
export * from './tactical-card';
export * from './terrain';
export * from './mass-combat-terrain';
export * from './mass-combat-tactical-card';
export * from './mass-combat-climate';
export * from './strategic-army';

// Re-exporta tipos unificados do core/terrain
export type {
  PrimaryTerrain,
  SecondaryTerrain,
  TerrainCompatibility,
  HexTerrain,
  TerrainGameMode,
} from '@/core/terrain';

// Re-exporta tipos unificados do core/cards  
export type {
  UnifiedCardGameMode,
  UnifiedSkirmishCardType,
  SkirmishModifiers,
  WarfareModifiers,
  RpgModifiers,
  DominionModifiers,
} from '@/core/cards';
