// Re-exporta para compatibilidade com código existente
// Fonte única de verdade: src/types/entities/

export {
  type FieldCommander,
  type CommanderSpecialization,
  SPECIALIZATIONS,
  EVOLUTION_COSTS,
  CULTURES,
  calculateDerivedFields,
  canEvolve,
  applyEvolution,
  addSpecialization
} from './entities/field-commander';
