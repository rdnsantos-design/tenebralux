import { ThemeId } from '@/themes/types';

/**
 * Perícias de Domínio - Stats para o Jogo de Domínio
 * 
 * Regência = Intuição + Administração (atributo principal)
 * 
 * Cada perícia de domínio = (Regência + Habilidade específica) / 2
 */

export interface DomainSkillDefinition {
  id: string;
  name: string;
  formula: string;
  requiredSkillId: string; // ID da perícia base necessária
  icon: string; // Nome do ícone lucide
  description: string;
}

export interface DomainSkillsResult {
  regencia: number;       // Intuição + Administração
  seguranca: number;      // (Regência + Militarismo) / 2
  industria: number;      // (Regência + Engenharia) / 2
  comercio: number;       // (Regência + Persuasão) / 2
  politica: number;       // (Regência + Empatia) / 2
  inovacao: number;       // (Regência + Pesquisa) / 2
}

export const DOMAIN_SKILL_DEFINITIONS: DomainSkillDefinition[] = [
  {
    id: 'seguranca',
    name: 'Segurança',
    formula: '(Regência + Militarismo) / 2',
    requiredSkillId: 'militarismo',
    icon: 'Shield',
    description: 'Capacidade de defender o domínio, gerenciar forças militares e manter a ordem.',
  },
  {
    id: 'industria',
    name: 'Indústria',
    formula: '(Regência + Engenharia) / 2',
    requiredSkillId: 'engenharia',
    icon: 'Factory',
    description: 'Capacidade de construir, produzir e desenvolver infraestrutura no domínio.',
  },
  {
    id: 'comercio',
    name: 'Comércio',
    formula: '(Regência + Persuasão) / 2',
    requiredSkillId: 'persuasao',
    icon: 'Coins',
    description: 'Capacidade de negociar, comercializar e gerenciar a economia do domínio.',
  },
  {
    id: 'politica',
    name: 'Política',
    formula: '(Regência + Empatia) / 2',
    requiredSkillId: 'empatia',
    icon: 'Users',
    description: 'Capacidade de negociar, formar alianças e manter relações diplomáticas.',
  },
  {
    id: 'inovacao',
    name: 'Inovação',
    formula: '(Regência + Pesquisa) / 2',
    requiredSkillId: 'pesquisa',
    icon: 'Lightbulb',
    description: 'Capacidade de pesquisar, inovar e desenvolver novas tecnologias ou magias.',
  },
];

/**
 * Calcula a Regência base do personagem
 * Regência = Intuição + Administração
 */
export function calculateRegencia(
  intuicao: number,
  skills: Record<string, number>
): number {
  const administracao = skills['administracao'] || 0;
  return intuicao + administracao;
}

/**
 * Calcula todas as perícias de domínio
 */
export function calculateDomainSkills(
  intuicao: number,
  skills: Record<string, number>
): DomainSkillsResult {
  const regencia = calculateRegencia(intuicao, skills);
  
  const getSkill = (id: string) => skills[id] || 0;
  
  return {
    regencia,
    seguranca: Math.floor((regencia + getSkill('militarismo')) / 2),
    industria: Math.floor((regencia + getSkill('engenharia')) / 2),
    comercio: Math.floor((regencia + getSkill('persuasao')) / 2),
    politica: Math.floor((regencia + getSkill('empatia')) / 2),
    inovacao: Math.floor((regencia + getSkill('pesquisa')) / 2),
  };
}

/**
 * Retorna a definição de uma perícia de domínio pelo ID
 */
export function getDomainSkillById(id: string): DomainSkillDefinition | undefined {
  return DOMAIN_SKILL_DEFINITIONS.find(skill => skill.id === id);
}

/**
 * Retorna todas as definições de perícias de domínio
 */
export function getAllDomainSkills(): DomainSkillDefinition[] {
  return DOMAIN_SKILL_DEFINITIONS;
}
