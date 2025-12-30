// ========================
// CARD DE UNIDADE (Legacy - para compatibilidade)
// ========================

export type ExperienceLevel = 'Amador' | 'Recruta' | 'Profissional' | 'Veterano' | 'Elite' | 'Lendário';

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
  
  // Localização
  countryId?: string;
  provinceId?: string;
  
  // Visual
  backgroundImage?: string;
  customBackgroundImage?: string; // skin personalizada para o card
  templateId?: string; // ID do template usado para criar este card
  images?: { [fieldId: string]: string }; // mapeamento de campo de imagem para caminho da imagem
  
  // Estado atual (para uso em jogo)
  currentPosture?: Posture;
  normalPressure?: number;
  permanentPressure?: number;
  hits?: number;
  disbanded?: boolean;
}
