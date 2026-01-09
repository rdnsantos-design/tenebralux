// Tipos para o sistema de mapa galáctico

export interface Planet {
  id: number;
  nome: string;
  x: number;
  y: number;
  z: number;
  distancia: number;
  regiao: string;
  faccao: string;
  zona: 'Core' | 'Periferia';
  tier: 1 | 2 | 3 | 4 | 5;
  D: number; // Desenvolvimento (1-10)
  R: number; // Recursos (1-10)
  Def: number; // Defesa (0-6)
  slotsProd: number;
  slotsCom: number;
  slotsSoc: number;
  pcpTotal: number;
  pcpGasto: number;
  tagsPositivas: string;
  tagsNegativas: string;
  tipo: PlanetType;
  funcao: PlanetFunction;
  populacao: number;
  descricao: string;
}

export type PlanetType = 
  | 'Terrestre'
  | 'Artificial'
  | 'Oceânico'
  | 'Desértico'
  | 'Glacial'
  | 'Vulcânico'
  | 'Asteroide'
  | 'Estação'
  | 'Ruínas';

export type PlanetFunction =
  | 'Capital'
  | 'Militar'
  | 'Acadêmico'
  | 'Hub Comercial'
  | 'Minerador'
  | 'Agrícola'
  | 'Industrial'
  | 'Religioso'
  | 'Fronteira'
  | 'Refúgio'
  | 'Colonial';

export interface Faction {
  id: string;
  name: string;
  color: string;
  planets_count: number;
  percent: number;
  description?: string;
}

export interface GalaxyFilters {
  factions: string[];
  tiers: number[];
  types: string[];
  functions: string[];
  regions: string[];
  searchQuery: string;
  showLabels: boolean;
  showConnections: boolean;
}

export interface TierLimits {
  maxD: number;
  maxR: number;
  maxDef: number;
  maxSlots: number;
  pcpBase: number;
}

export const TIER_LIMITS: Record<1 | 2 | 3 | 4 | 5, TierLimits> = {
  1: { maxD: 3, maxR: 3, maxDef: 1, maxSlots: 3, pcpBase: 6 },
  2: { maxD: 5, maxR: 5, maxDef: 2, maxSlots: 5, pcpBase: 12 },
  3: { maxD: 7, maxR: 7, maxDef: 3, maxSlots: 7, pcpBase: 16 },
  4: { maxD: 9, maxR: 8, maxDef: 4, maxSlots: 9, pcpBase: 20 },
  5: { maxD: 10, maxR: 10, maxDef: 6, maxSlots: 10, pcpBase: 24 }
};

export const PLANET_TYPES: PlanetType[] = [
  'Terrestre', 'Artificial', 'Oceânico', 'Desértico', 
  'Glacial', 'Vulcânico', 'Asteroide', 'Estação', 'Ruínas'
];

export const PLANET_FUNCTIONS: PlanetFunction[] = [
  'Capital', 'Militar', 'Acadêmico', 'Hub Comercial', 
  'Minerador', 'Agrícola', 'Industrial', 'Religioso', 
  'Fronteira', 'Refúgio', 'Colonial'
];

export const REGIONS = [
  'Cubo Principal',
  'Via Victoria - Drachenfels',
  'Via Victoria - Nueva Iberia',
  'Via Victoria - New Anglia',
  'Via Victoria - Raj Novgorod',
  'Via Victoria - Élysée',
  'Via Victoria - Bell Burnell',
  'Território Bruniano',
  'Território Synaxis'
];

// Tags do sistema
export const POSITIVE_TAGS = [
  { name: 'Hub Histórico', effect: '+2 Influência diplomática' },
  { name: 'Centro Acadêmico', effect: '+2 Pesquisa' },
  { name: 'Base Militar', effect: '+2 Defesa' },
  { name: 'Porto Natural', effect: '+2 Comércio' },
  { name: 'Fortaleza Natural', effect: '+3 Defesa' },
  { name: 'Centro Religioso', effect: '+2 Sociedade' },
  { name: 'Paradisíaco', effect: '+2 Turismo/Moral' },
  { name: 'Cultura Coesa', effect: '+1 Estabilidade' },
  { name: 'Rico em Minérios', effect: '+2 Recursos' },
  { name: 'Raro/Estratégico', effect: 'Recurso único' }
];

export const NEGATIVE_TAGS = [
  { name: 'Facções Internas', effect: '-1 Estabilidade' },
  { name: 'Fronteira Pirata', effect: '-2 Segurança comercial' },
  { name: 'Hostil', effect: '-1 em todas operações' },
  { name: 'Zona de Guerra', effect: '-3 Desenvolvimento' },
  { name: 'Instável', effect: '-1 Estabilidade' }
];

// Mapeamento de nome de facção para ID
export const FACTION_NAME_TO_ID: Record<string, string> = {
  'Aliança Estelar': 'alianca',
  'Hegemonia Humanista': 'hegemonia',
  'Pacto de Liberstadt': 'pacto',
  'Federação Solônica': 'federacao',
  'Nova Concórdia': 'concordia',
  'Independente': 'independente',
  'Synaxis': 'synaxis',
  'República Bruniana': 'brunianos',
  'Zona Fantasma': 'fantasma',
  'Zona Disputada': 'disputada'
};
