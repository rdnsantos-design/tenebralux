import { 
  BaseEntity, 
  CharacterAttributes, 
  CharacterVirtues,
  DerivedStats,
  RegencyStats,
  CommandStats,
  DomainStats,
  DomainSkillStats,
  ExperienceLevel 
} from './base';
import { ThemeId } from '@/themes/types';
import { calculateDomainSkills, DomainSkillsResult } from '@/data/character/domainSkills';

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
  benefit: string;
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
  
  // Atributos base (8)
  attributes: CharacterAttributes;
  
  // Perícias (mapa de skill_id -> level)
  skills: Record<string, number>;
  
  // Virtudes (4)
  virtues: CharacterVirtues;
  
  // Bênçãos e Desafios
  blessings: Blessing[];
  
  // Stats derivados (calculados)
  derivedStats?: DerivedStats;
  
  // Stats de regência (calculados)
  regencyStats?: RegencyStats;
  
  // Perícias de Domínio (calculados)
  domainSkillStats?: DomainSkillStats;
  
  // Equipamento
  equipment: Equipment[];
  
  // Experiência geral
  experiencePoints?: number;
  
  // === COMPATIBILIDADE COM MÓDULOS EXISTENTES ===
  
  // Para Batalha/Campanha (derivado de regencyStats)
  commandStats?: CommandStats;
  
  // Para Domínio
  domainStats?: DomainStats;
  
  // IDs de onde está sendo usado
  linkedArmyIds?: string[];
  linkedDomainIds?: string[];
}

// === FUNÇÕES DE CÁLCULO ===

/**
 * Calcula os stats derivados do personagem
 * Fórmulas atualizadas conforme planilha do RPG
 */
export function calculateDerivedStats(
  attributes: CharacterAttributes,
  skills: Record<string, number>,
  armorBonus: number = 0
): DerivedStats {
  const getSkill = (id: string) => skills[id] || 0;
  
  // Reação = 12 - (Reflexos × 2 + Instinto)
  // Menor valor = age mais rápido
  const reacaoBase = (attributes.reflexos * 2) + getSkill('instinto');
  
  return {
    // Combate Físico
    vitalidade: attributes.corpo * 2 + getSkill('resistencia'),
    evasao: attributes.reflexos * 2 + getSkill('instinto'),
    guarda: attributes.reflexos * 2 + getSkill('esquiva') + armorBonus, // Armadura somada na finalização
    reacao: 12 - reacaoBase, // Tick inicial na timeline
    movimento: attributes.corpo * 2 + getSkill('atletismo'),
    
    // Combate Social
    vontade: attributes.raciocinio * 2 + getSkill('resiliencia'),
    conviccao: attributes.determinacao * 2 + getSkill('logica'), // Determinação × 2 + Lógica
    influencia: attributes.carisma,
    
    // Recursos
    tensao: attributes.raciocinio + attributes.determinacao,
    fortitude: getSkill('autocontrole'),
  };
}

/**
 * Calcula os stats de regência do personagem
 * Usado para Batalha, Campanha e Domínio
 */
export function calculateRegencyStats(
  attributes: CharacterAttributes,
  skills: Record<string, number>,
  theme: ThemeId
): RegencyStats {
  const getSkill = (id: string) => skills[id] || 0;
  
  return {
    comando: attributes.carisma + getSkill('pesquisa'),
    estrategia: attributes.raciocinio + getSkill('militarismo'),
    administracao: attributes.raciocinio + getSkill('economia'),
    politica: attributes.raciocinio + getSkill('diplomacia'),
    tecnologia: theme === 'akashic' 
      ? attributes.conhecimento + getSkill('engenharia') 
      : 0,
    geomancia: theme === 'tenebralux' 
      ? attributes.conhecimento + getSkill('computacao')
      : 0,
  };
}

/**
 * Calcula as Perícias de Domínio
 * Re-export da função do módulo domainSkills
 */
export { calculateDomainSkills, type DomainSkillsResult } from '@/data/character/domainSkills';

/**
 * Converte RegencyStats para CommandStats (compatibilidade)
 * Usado pelo sistema tático existente
 */
export function regencyToCommandStats(
  regency: RegencyStats,
  derived: DerivedStats
): CommandStats {
  return {
    strategy: Math.min(6, regency.estrategia),
    command: Math.min(6, regency.comando),
    guard: Math.min(6, Math.floor(derived.guarda / 3)),
  };
}

/**
 * Calcula o custo em pontos de poder do personagem
 * Para uso em modos táticos com limite de pontos
 */
export function calculateCharacterPowerCost(
  regency: RegencyStats,
  escolta: number = 0
): number {
  const regencyTotal = 
    regency.comando +
    regency.estrategia +
    regency.administracao +
    regency.politica +
    Math.max(regency.tecnologia, regency.geomancia);
  
  // Regência custa 2 pontos por nível, Escolta custa 1 ponto por nível
  return (regencyTotal * 2) + escolta;
}

/**
 * Cria um personagem com valores iniciais padrão
 */
export function createDefaultCharacter(theme: ThemeId): Partial<Character> {
  return {
    id: crypto.randomUUID(),
    name: '',
    theme,
    attributes: {
      conhecimento: 1,
      raciocinio: 1,
      corpo: 1,
      reflexos: 1,
      determinacao: 1,
      coordenacao: 1,
      carisma: 1,
      intuicao: 1,
    },
    skills: {},
    virtues: {
      sabedoria: 0,
      coragem: 0,
      perseveranca: 0,
      harmonia: 0,
    },
    blessings: [],
    equipment: [],
  };
}
