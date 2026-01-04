/**
 * Índice de hooks - Exportações centralizadas
 */

// Hooks de UI
export * from './use-mobile';
export * from './use-toast';

// Hooks de entidades base
export * from './useRegents';
export * from './useFieldCommanders';
export * from './useUnitTemplates';
export * from './useUnitInstances';
export * from './useHoldings';
export * from './useDomains';
export * from './useCharacterCards';

// Hooks de combate
export * from './useTacticalCards';
export * from './useTerrains';
export * from './useMassCombatTerrains';
export * from './useMassCombatTacticalCards';
export * from './useMassCombatClimates';

// Hooks de viagem
export * from './useTravel';

// Hooks unificados (dados combinados)
export * from './useArmyData';
export * from './useDomainData';
export * from './useMassCombatData';

// Hooks de batalha tática
export * from './useTacticalBattleInit';

// Hooks de personagens
export * from './useCharacterStorage';
export * from './useCharacterStorageHybrid';
export * from './useTacticalIntegration';
