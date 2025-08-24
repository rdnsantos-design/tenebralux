export type ExperienceLevel = 'Green' | 'Profissional' | 'Veterano' | 'Elite';

export type Posture = 'Ofensiva' | 'Defensiva' | 'Carga' | 'Reorganização';

export interface SpecialAbility {
  id: string;
  name: string;
  level: 1 | 2;
  cost: number;
  description: string;
}

export interface UnitCard {
  id: string;
  name: string;
  
  // Atributos principais (1-6)
  attack: number;
  defense: number;
  ranged: number;
  movement: number;
  morale: number;
  
  // Outros atributos
  experience: ExperienceLevel;
  totalForce: number;
  maintenanceCost: number;
  
  // Habilidades especiais
  specialAbilities: SpecialAbility[];
  
  // Visual
  backgroundImage?: string;
  templateId?: string; // ID do template usado para criar este card
  
  // Estado atual (para uso em jogo)
  currentPosture?: Posture;
  normalPressure?: number;
  permanentPressure?: number;
  hits?: number;
  disbanded?: boolean;
}