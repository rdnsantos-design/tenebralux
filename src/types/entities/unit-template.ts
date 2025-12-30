// ========================
// TEMPLATE DE UNIDADE
// Modelo base importado do Excel, usado para criar instâncias
// ========================

export type ExperienceLevel = 'Amador' | 'Recruta' | 'Profissional' | 'Veterano' | 'Elite' | 'Lendário';

export interface SpecialAbilityTemplate {
  id: string;
  name: string;
  level: 1 | 2;
  cost: number;
  description: string;
}

export interface UnitTemplate {
  id: string;
  name: string; // Nome genérico do tipo de unidade (ex: "Infantaria Pesada Anuireana")
  
  // Atributos base (1-6)
  attack: number;
  defense: number;
  ranged: number;
  movement: number;
  morale: number;
  
  // Outros atributos base
  experience: ExperienceLevel;
  totalForce: number;
  maintenanceCost: number;
  
  // Habilidades especiais disponíveis
  specialAbilities: SpecialAbilityTemplate[];
  
  // Metadados
  sourceFile?: string; // arquivo Excel de origem
  createdAt: string;
}

// Níveis de experiência em ordem
export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'Amador',
  'Recruta', 
  'Profissional',
  'Veterano',
  'Elite',
  'Lendário'
];

// Calcula o próximo nível de experiência
export function getNextExperienceLevel(current: ExperienceLevel): ExperienceLevel | null {
  const currentIndex = EXPERIENCE_LEVELS.indexOf(current);
  if (currentIndex === -1 || currentIndex >= EXPERIENCE_LEVELS.length - 1) {
    return null;
  }
  return EXPERIENCE_LEVELS[currentIndex + 1];
}
