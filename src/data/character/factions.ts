import { ThemeId } from '@/themes/types';

export interface FactionDefinition {
  id: string;
  name: string;
  theme: ThemeId;
  description: string;
  color: string;
  icon: string;
  virtue?: string | 'choice';  // Virtude inicial ou 'choice' para livre escolha
  attributeBonuses?: string[]; // Atributos que recebem bônus
  freeSkillPoints?: number;    // Pontos livres de perícia na criação
}

// Facções do tema Akashic (Sci-Fi) - Baseado na planilha oficial
export const AKASHIC_FACTIONS: FactionDefinition[] = [
  {
    id: 'hegemonia',
    name: 'Hegemonia Humanista',
    theme: 'akashic',
    description: 'O poder militar dominante do cosmos, onde a força e a disciplina são a lei.',
    color: '#dc2626',
    icon: 'Shield',
    virtue: 'coragem',
    freeSkillPoints: 5,
  },
  {
    id: 'alianca',
    name: 'Aliança Estelar',
    theme: 'akashic',
    description: 'Coalizão diversificada de mundos que valoriza a liberdade e a cooperação.',
    color: '#3b82f6',
    icon: 'Users',
    virtue: 'choice',
    freeSkillPoints: 4,
  },
  {
    id: 'pacto',
    name: 'Pacto de Liberstadt',
    theme: 'akashic',
    description: 'Federação de sobreviventes unidos pela determinação e resiliência.',
    color: '#84cc16',
    icon: 'Handshake',
    virtue: 'perseveranca',
    freeSkillPoints: 5,
  },
  {
    id: 'concordia',
    name: 'Nova Concórdia',
    theme: 'akashic',
    description: 'Civilização avançada que equilibra intelecto e força física em harmonia.',
    color: '#8b5cf6',
    icon: 'Scale',
    attributeBonuses: ['raciocinio', 'corpo'],
    freeSkillPoints: 6,
  },
  {
    id: 'brunianos',
    name: 'República Bruniana',
    theme: 'akashic',
    description: 'Anciãos sábios guardiões do conhecimento ancestral e da tradição.',
    color: '#f59e0b',
    icon: 'BookOpen',
    virtue: 'sabedoria',
    attributeBonuses: ['corpo'],
    freeSkillPoints: 3,
  },
  {
    id: 'federacao',
    name: 'Federação Solônica',
    theme: 'akashic',
    description: 'União diplomática que busca equilíbrio e entendimento entre todos os povos.',
    color: '#06b6d4',
    icon: 'Globe',
    virtue: 'harmonia',
    freeSkillPoints: 5,
  },
  {
    id: 'independentes',
    name: 'Mundos Independentes',
    theme: 'akashic',
    description: 'Nascido nas periferias da galáxia, longe do alcance das grandes potências.',
    color: '#64748b',
    icon: 'Compass',
    virtue: 'choice',
    attributeBonuses: ['choice'],
    freeSkillPoints: 2,
  },
];

// Facções do tema Tenebra (Medieval Fantasy)
export const TENEBRA_FACTIONS: FactionDefinition[] = [
  {
    id: 'anuire',
    name: 'Império de Anuire',
    theme: 'tenebralux',
    description: 'O antigo império dos humanos, agora fragmentado em reinos rivais.',
    color: '#c0392b',
    icon: 'Crown',
    virtue: 'coragem',
  },
  {
    id: 'khinasi',
    name: 'Cidades-Estado Khinasi',
    theme: 'tenebralux',
    description: 'Mercadores e sábios das terras do sul, mestres do comércio e da magia.',
    color: '#f39c12',
    icon: 'Landmark',
    virtue: 'sabedoria',
  },
  {
    id: 'rjurik',
    name: 'Clãs Rjurik',
    theme: 'tenebralux',
    description: 'Guerreiros do norte que seguem os espíritos da natureza.',
    color: '#27ae60',
    icon: 'TreePine',
    virtue: 'harmonia',
  },
  {
    id: 'brecht',
    name: 'Liga Brecht',
    theme: 'tenebralux',
    description: 'Guildas mercantis das terras costeiras, mestres do mar e do comércio.',
    color: '#3498db',
    icon: 'Ship',
    virtue: 'choice',
  },
  {
    id: 'vos',
    name: 'Senhores Vos',
    theme: 'tenebralux',
    description: 'Guerreiros brutais das terras geladas do leste.',
    color: '#8e44ad',
    icon: 'Axe',
    virtue: 'perseveranca',
  },
];

export function getFactionsByTheme(theme: ThemeId): FactionDefinition[] {
  return theme === 'akashic' ? AKASHIC_FACTIONS : TENEBRA_FACTIONS;
}

export function getFactionById(id: string): FactionDefinition | undefined {
  return [...AKASHIC_FACTIONS, ...TENEBRA_FACTIONS].find(f => f.id === id);
}

export function getFactionVirtue(factionId: string): string | 'choice' | undefined {
  const faction = getFactionById(factionId);
  return faction?.virtue;
}

export function getFactionAttributeBonuses(factionId: string): string[] {
  const faction = getFactionById(factionId);
  return faction?.attributeBonuses ?? [];
}

export function getFactionFreeSkillPoints(factionId: string): number {
  const faction = getFactionById(factionId);
  return faction?.freeSkillPoints ?? 4; // Default to 4 if not specified
}
