import { ThemeId } from '@/themes/types';

export interface CultureDefinition {
  id: string;
  name: string;
  theme: ThemeId;
  description: string;
  factionIds: string[]; // Facções onde esta cultura é comum
}

// Culturas do tema Akashic
export const AKASHIC_CULTURES: CultureDefinition[] = [
  {
    id: 'nucleo',
    name: 'Mundos do Núcleo',
    theme: 'akashic',
    description: 'Habitantes dos sistemas centrais, urbanos e cosmopolitas.',
    factionIds: ['confederacao', 'corporacoes', 'tecnocracia'],
  },
  {
    id: 'colonial',
    name: 'Colonial',
    theme: 'akashic',
    description: 'Colonos de primeira ou segunda geração em novos mundos.',
    factionIds: ['confederacao', 'fronteira'],
  },
  {
    id: 'espacial',
    name: 'Nascido no Espaço',
    theme: 'akashic',
    description: 'Cresceu em estações espaciais ou naves de longo curso.',
    factionIds: ['corporacoes', 'sindicato', 'fronteira'],
  },
  {
    id: 'nativo',
    name: 'Nativo Planetário',
    theme: 'akashic',
    description: 'De um mundo com cultura própria pré-contato.',
    factionIds: ['fronteira', 'tecnocracia'],
  },
  {
    id: 'sintetico',
    name: 'Sintético',
    theme: 'akashic',
    description: 'IA ou ser artificial com consciência reconhecida.',
    factionIds: ['tecnocracia', 'corporacoes'],
  },
];

// Culturas do tema Tenebra
export const TENEBRA_CULTURES: CultureDefinition[] = [
  {
    id: 'anuireano',
    name: 'Anuireano',
    theme: 'tenebralux',
    description: 'Herdeiros do antigo império, valorizam honra e linhagem.',
    factionIds: ['anuire'],
  },
  {
    id: 'khinasi_culture',
    name: 'Khinasi',
    theme: 'tenebralux',
    description: 'Povo comerciante e erudito das terras quentes do sul.',
    factionIds: ['khinasi'],
  },
  {
    id: 'rjurik_culture',
    name: 'Rjurik',
    theme: 'tenebralux',
    description: 'Guerreiros tribais que reverenciam a natureza.',
    factionIds: ['rjurik'],
  },
  {
    id: 'brecht_culture',
    name: 'Brecht',
    theme: 'tenebralux',
    description: 'Marinheiros e mercadores pragmáticos.',
    factionIds: ['brecht'],
  },
  {
    id: 'vos_culture',
    name: 'Vos',
    theme: 'tenebralux',
    description: 'Povo duro das terras frias, honram a força.',
    factionIds: ['vos'],
  },
];

export function getCulturesByTheme(theme: ThemeId): CultureDefinition[] {
  return theme === 'akashic' ? AKASHIC_CULTURES : TENEBRA_CULTURES;
}

export function getCultureById(id: string): CultureDefinition | undefined {
  return [...AKASHIC_CULTURES, ...TENEBRA_CULTURES].find(c => c.id === id);
}

export function getCulturesByFaction(factionId: string): CultureDefinition[] {
  return [...AKASHIC_CULTURES, ...TENEBRA_CULTURES].filter(c => 
    c.factionIds.includes(factionId)
  );
}
