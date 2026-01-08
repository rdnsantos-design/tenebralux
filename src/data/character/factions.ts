import { ThemeId } from '@/themes/types';

export interface FactionSkillBonus {
  points: number;      // Quantidade de níveis de perícia
  skillCount: number;  // Quantas perícias podem receber esses pontos
}

export interface FactionDefinition {
  id: string;
  name: string;
  theme: ThemeId;
  description: string;
  color: string;
  icon: string;
  virtue?: string | 'choice';  // Virtude inicial ou 'choice' para livre escolha
  attributeBonuses?: string[]; // Atributos que recebem bônus
  freeSkills?: FactionSkillBonus;
}

// Facções do tema Akashic (Sci-Fi) - Baseado na planilha oficial
export const AKASHIC_FACTIONS: FactionDefinition[] = [
  {
    id: 'hegemonia',
    name: 'Hegemonia',
    theme: 'akashic',
    description: 'O poder militar dominante do cosmos, onde a força e a disciplina são a lei.',
    color: '#dc2626',
    icon: 'Shield',
    virtue: 'coragem',
    freeSkills: { points: 5, skillCount: 1 },
  },
  {
    id: 'alianca',
    name: 'Aliança',
    theme: 'akashic',
    description: 'Coalizão diversificada de mundos que valoriza a liberdade e a cooperação.',
    color: '#3b82f6',
    icon: 'Users',
    virtue: 'choice',
    freeSkills: { points: 4, skillCount: 2 },
  },
  {
    id: 'pacto',
    name: 'Pacto',
    theme: 'akashic',
    description: 'Federação de sobreviventes unidos pela determinação e resiliência.',
    color: '#84cc16',
    icon: 'Handshake',
    virtue: 'perseveranca',
    freeSkills: { points: 5, skillCount: 3 },
  },
  {
    id: 'concordia',
    name: 'Concórdia',
    theme: 'akashic',
    description: 'Civilização avançada que equilibra intelecto e força física em harmonia.',
    color: '#8b5cf6',
    icon: 'Scale',
    attributeBonuses: ['raciocinio', 'corpo'],
    freeSkills: { points: 6, skillCount: 4 },
  },
  {
    id: 'brunianos',
    name: 'Brunianos',
    theme: 'akashic',
    description: 'Anciãos sábios guardiões do conhecimento ancestral e da tradição.',
    color: '#f59e0b',
    icon: 'BookOpen',
    virtue: 'sabedoria',
    attributeBonuses: ['corpo'],
    freeSkills: { points: 3, skillCount: 5 },
  },
  {
    id: 'federacao',
    name: 'Federação',
    theme: 'akashic',
    description: 'União diplomática que busca equilíbrio e entendimento entre todos os povos.',
    color: '#06b6d4',
    icon: 'Globe',
    virtue: 'harmonia',
    freeSkills: { points: 5, skillCount: 6 },
  },
  {
    id: 'corporacoes',
    name: 'Corporações',
    theme: 'akashic',
    description: 'Mega-corporações que controlam o comércio e a tecnologia interestelar.',
    color: '#f97316',
    icon: 'Building2',
  },
  {
    id: 'astra',
    name: 'Astra',
    theme: 'akashic',
    description: 'Exploradores dos confins do espaço, pioneiros do desconhecido.',
    color: '#a855f7',
    icon: 'Rocket',
  },
  {
    id: 'piratas',
    name: 'Piratas',
    theme: 'akashic',
    description: 'Fora-da-lei espaciais que vivem à margem da sociedade galáctica.',
    color: '#64748b',
    icon: 'Skull',
  },
  {
    id: 'star-knights',
    name: 'Star Knights',
    theme: 'akashic',
    description: 'Ordem de guerreiros cósmicos guardiões da justiça interestelar.',
    color: '#eab308',
    icon: 'Sword',
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

export function getFactionFreeSkills(factionId: string): FactionSkillBonus | undefined {
  const faction = getFactionById(factionId);
  return faction?.freeSkills;
}
