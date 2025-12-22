// Unidade instanciada - criada a partir de um template, vinculada a um regente
// Pode evoluir, ser alocada em exércitos e receber comandantes

import { ExperienceLevel, SpecialAbilityTemplate } from './UnitTemplate';

export interface Unit {
  id: string;
  templateId: string; // Referência ao UnitTemplate base
  regentId: string; // Regente dono da unidade
  
  // Nome personalizado da unidade (ex: "1ª Guarda Real de Avanil")
  name: string;
  
  // Atributos atuais (podem evoluir)
  attack: number;
  defense: number;
  ranged: number;
  movement: number;
  morale: number;
  
  // Outros atributos
  experience: ExperienceLevel;
  totalForce: number;
  maintenanceCost: number;
  
  // Habilidades especiais da unidade
  specialAbilities: SpecialAbilityTemplate[];
  
  // Sistema de evolução
  experiencePoints: number; // XP acumulado
  battlesWon: number;
  battlesSurvived: number;
  
  // Localização atual
  countryId?: string;
  provinceId?: string;
  
  // Alocação em exército
  armyId?: string; // Se estiver em um exército
  commanderId?: string; // Comandante de campo alocado a esta unidade
  
  // Visual para impressão
  backgroundImageId?: string; // ID da imagem de fundo para o card
  
  // Estado de jogo
  currentPosture?: 'Ofensiva' | 'Defensiva' | 'Carga' | 'Reorganização';
  normalPressure?: number;
  permanentPressure?: number;
  hits?: number;
  disbanded?: boolean;
  
  // Metadados
  createdAt: string;
  updatedAt: string;
}

// Pontos de XP necessários para subir de nível (para implementar depois)
export const XP_THRESHOLDS: Record<ExperienceLevel, number> = {
  'Amador': 0,
  'Recruta': 100,
  'Profissional': 300,
  'Veterano': 600,
  'Elite': 1000,
  'Lendário': 1500
};

// Bônus por nível de experiência
export const EXPERIENCE_BONUSES: Record<ExperienceLevel, { attack: number; defense: number; morale: number }> = {
  'Amador': { attack: 0, defense: 0, morale: 0 },
  'Recruta': { attack: 0, defense: 0, morale: 0 },
  'Profissional': { attack: 0, defense: 0, morale: 1 },
  'Veterano': { attack: 1, defense: 0, morale: 1 },
  'Elite': { attack: 1, defense: 1, morale: 1 },
  'Lendário': { attack: 1, defense: 1, morale: 2 }
};

// Cria uma nova unidade a partir de um template
export function createUnitFromTemplate(
  templateId: string,
  regentId: string,
  name: string,
  templateData: {
    attack: number;
    defense: number;
    ranged: number;
    movement: number;
    morale: number;
    experience: ExperienceLevel;
    totalForce: number;
    maintenanceCost: number;
    specialAbilities: SpecialAbilityTemplate[];
  }
): Omit<Unit, 'id'> {
  const now = new Date().toISOString();
  return {
    templateId,
    regentId,
    name,
    attack: templateData.attack,
    defense: templateData.defense,
    ranged: templateData.ranged,
    movement: templateData.movement,
    morale: templateData.morale,
    experience: templateData.experience,
    totalForce: templateData.totalForce,
    maintenanceCost: templateData.maintenanceCost,
    specialAbilities: templateData.specialAbilities,
    experiencePoints: 0,
    battlesWon: 0,
    battlesSurvived: 0,
    createdAt: now,
    updatedAt: now
  };
}
