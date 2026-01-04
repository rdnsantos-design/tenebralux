import { Character, CharacterAttributes, CharacterVirtues } from '@/core/types';
import { ThemeId } from '@/themes/types';

// Estado do draft durante a criação
export interface CharacterDraft {
  // Step 1: Conceito
  name?: string;
  theme?: ThemeId;
  factionId?: string;
  culture?: string;
  
  // Step 2: Atributos
  attributes?: Partial<CharacterAttributes>;
  
  // Step 3: Perícias
  skills?: Record<string, number>;
  
  // Step 4: Derivados (calculados)
  // Não armazena - calcula em tempo real
  
  // Step 5: Bênçãos e Desafios
  blessingIds?: string[];
  challengeIds?: Record<string, string>; // blessingId -> challengeId
  
  // Step 6: Virtudes
  virtues?: Partial<CharacterVirtues>;
  
  // Step 7: Equipamento
  weaponId?: string;
  armorId?: string;
  itemIds?: string[];
  
  // Step 8: Resumo
  // Não armazena - mostra tudo
}

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface WizardStepDefinition {
  step: WizardStep;
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const WIZARD_STEPS: WizardStepDefinition[] = [
  { step: 1, id: 'concept', name: 'Conceito', description: 'Nome e origem', icon: 'User' },
  { step: 2, id: 'attributes', name: 'Atributos', description: '8 atributos base', icon: 'BarChart3' },
  { step: 3, id: 'skills', name: 'Perícias', description: '40 perícias', icon: 'ListChecks' },
  { step: 4, id: 'derived', name: 'Características', description: 'Valores calculados', icon: 'Calculator' },
  { step: 5, id: 'blessings', name: 'Legados', description: 'Bênçãos e desafios', icon: 'Gift' },
  { step: 6, id: 'virtues', name: 'Virtudes', description: '4 virtudes', icon: 'Sparkles' },
  { step: 7, id: 'equipment', name: 'Equipamento', description: 'Armas e armaduras', icon: 'Swords' },
  { step: 8, id: 'summary', name: 'Resumo', description: 'Ficha completa', icon: 'FileText' },
];

export interface ValidationError {
  field: string;
  message: string;
}

export interface StepValidation {
  isValid: boolean;
  errors: ValidationError[];
}
