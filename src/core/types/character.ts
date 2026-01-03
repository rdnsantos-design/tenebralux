import { 
  BaseEntity, 
  CharacterAttributes, 
  CharacterVirtues,
  DerivedStats,
  CommandStats,
  DomainStats,
  ExperienceLevel 
} from './base';

// === PERÍCIA ===
export interface Skill {
  id: string;
  name: string;
  attribute: keyof CharacterAttributes;
  level: number; // 0-6
}

// === BÊNÇÃO E DESAFIO ===
export interface Blessing {
  id: string;
  name: string;
  description: string;
  category: string;
  selectedChallenge?: Challenge;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  blessingId: string;
}

// === EQUIPAMENTO ===
export interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'item';
  stats: Record<string, number>;
  traits?: string[];
}

// === PERSONAGEM COMPLETO ===
export interface Character extends BaseEntity {
  // Facção/Origem
  faction?: string;
  culture?: string;
  
  // Atributos base
  attributes: CharacterAttributes;
  
  // Perícias (mapa de skill_id -> level)
  skills: Record<string, number>;
  
  // Virtudes
  virtues: CharacterVirtues;
  
  // Bênçãos e Desafios
  blessings: Blessing[];
  
  // Stats derivados (calculados)
  derivedStats?: DerivedStats;
  
  // Equipamento
  equipment: Equipment[];
  
  // Experiência geral
  experiencePoints?: number;
  
  // === PAPÉIS EM OUTROS MÓDULOS ===
  
  // Como Comandante (Batalha/Campanha)
  commandStats?: CommandStats;
  
  // Como Regente (Domínio)
  domainStats?: DomainStats;
  
  // IDs de onde está sendo usado
  linkedArmyIds?: string[];
  linkedDomainIds?: string[];
}

// === FUNÇÕES DE CÁLCULO ===
export function calculateDerivedStats(
  attributes: CharacterAttributes,
  skills: Record<string, number>
): DerivedStats {
  const getSkill = (id: string) => skills[id] || 0;
  
  return {
    // Combate Físico
    vitalidade: attributes.corpo * 2 + getSkill('resistencia'),
    evasao: attributes.reflexos * 2 + getSkill('instinto'),
    guarda: attributes.reflexos * 2 + getSkill('esquiva'), // + armadura depois
    reacao: attributes.intuicao + attributes.reflexos + getSkill('prontidao'),
    movimento: attributes.corpo * 2 + getSkill('atletismo'),
    
    // Combate Social
    vontade: attributes.raciocinio * 2 + getSkill('resiliencia'),
    conviccao: attributes.determinacao * 2 + getSkill('logica'),
    influencia: attributes.carisma,
    
    // Recursos
    tensaoMaxima: attributes.determinacao * 2 + getSkill('autocontrole'),
    fortitude: attributes.corpo + attributes.determinacao,
  };
}

export function calculateCommandStats(
  attributes: CharacterAttributes,
  skills: Record<string, number>
): CommandStats {
  const getSkill = (id: string) => skills[id] || 0;
  
  return {
    strategy: Math.min(6, Math.floor((attributes.raciocinio + getSkill('estrategia')) / 2)),
    command: Math.min(6, Math.floor((attributes.carisma + getSkill('lideranca')) / 2)),
    guard: Math.min(6, Math.floor((attributes.corpo + getSkill('resistencia')) / 2)),
  };
}
