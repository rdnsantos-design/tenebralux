// Re-exporta para compatibilidade com código existente
// Fonte única de verdade: src/types/entities/

export {
  type UnitInstance,
  type Posture,
  XP_THRESHOLDS,
  EXPERIENCE_BONUSES,
  createUnitFromTemplate
} from './entities/unit-instance';

// Alias para compatibilidade
export { type UnitInstance as Unit } from './entities/unit-instance';
export { type ExperienceLevel, type SpecialAbilityTemplate } from './entities/unit-template';
