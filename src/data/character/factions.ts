import { ThemeId } from '@/themes/types';

export interface FactionDefinition {
  id: string;
  name: string;
  theme: ThemeId;
  description: string;
  color: string;
  icon: string;
  bonuses?: {
    attribute?: string;
    skill?: string;
    value?: number;
  }[];
}

// Facções do tema Akashic (Sci-Fi)
export const AKASHIC_FACTIONS: FactionDefinition[] = [
  {
    id: 'confederacao',
    name: 'Confederação Estelar',
    theme: 'akashic',
    description: 'Aliança democrática de sistemas estelares focada em exploração e diplomacia.',
    color: '#3498db',
    icon: 'Globe',
  },
  {
    id: 'corporacoes',
    name: 'Consórcio Corporativo',
    theme: 'akashic',
    description: 'Mega-corporações que controlam o comércio e a tecnologia interestelar.',
    color: '#f39c12',
    icon: 'Building2',
  },
  {
    id: 'tecnocracia',
    name: 'Tecnocracia Akashic',
    theme: 'akashic',
    description: 'Guardiões do conhecimento ancestral e da tecnologia avançada.',
    color: '#9b59b6',
    icon: 'Cpu',
  },
  {
    id: 'fronteira',
    name: 'Mundos da Fronteira',
    theme: 'akashic',
    description: 'Colonos independentes nos limites do espaço conhecido.',
    color: '#e74c3c',
    icon: 'Rocket',
  },
  {
    id: 'sindicato',
    name: 'Sindicato das Sombras',
    theme: 'akashic',
    description: 'Rede clandestina de contrabandistas, mercenários e informantes.',
    color: '#2c3e50',
    icon: 'Ghost',
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
  },
  {
    id: 'khinasi',
    name: 'Cidades-Estado Khinasi',
    theme: 'tenebralux',
    description: 'Mercadores e sábios das terras do sul, mestres do comércio e da magia.',
    color: '#f39c12',
    icon: 'Landmark',
  },
  {
    id: 'rjurik',
    name: 'Clãs Rjurik',
    theme: 'tenebralux',
    description: 'Guerreiros do norte que seguem os espíritos da natureza.',
    color: '#27ae60',
    icon: 'TreePine',
  },
  {
    id: 'brecht',
    name: 'Liga Brecht',
    theme: 'tenebralux',
    description: 'Guildas mercantis das terras costeiras, mestres do mar e do comércio.',
    color: '#3498db',
    icon: 'Ship',
  },
  {
    id: 'vos',
    name: 'Senhores Vos',
    theme: 'tenebralux',
    description: 'Guerreiros brutais das terras geladas do leste.',
    color: '#8e44ad',
    icon: 'Axe',
  },
];

export function getFactionsByTheme(theme: ThemeId): FactionDefinition[] {
  return theme === 'akashic' ? AKASHIC_FACTIONS : TENEBRA_FACTIONS;
}

export function getFactionById(id: string): FactionDefinition | undefined {
  return [...AKASHIC_FACTIONS, ...TENEBRA_FACTIONS].find(f => f.id === id);
}
