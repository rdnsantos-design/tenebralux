export const REALM_REGIONS = [
  'Anuire',
  'Khinasi',
  'Brechtur',
  'Vosgaard',
  'Rjuven',
  'Aduria',
  'Ultramar',
] as const;

export type RealmRegion = typeof REALM_REGIONS[number];

export const REALM_CULTURES = [
  'Anuire',
  'Khinasi',
  'Rjurik',
  'Brecht',
  'Vos',
  'Elfos',
  'Anões',
  'Goblinóides',
  'Orogs',
  'Gnolls',
  'Desabitado',
  'Selvagem',
  'Awnsheag',
  'Aduriana',
  'Basaia',
  'Ilhas do Dragão',
] as const;

export type RealmCulture = typeof REALM_CULTURES[number];

export interface Realm {
  id: string;
  name: string;
  region?: string;
  culture?: string;
  created_at: string;
  updated_at: string;
}

export interface Province {
  id: string;
  name: string;
  realm_id: string;
  development: number;
  magic: number;
  cultura?: string;
  terrain_type?: string;
  has_port: boolean;
  has_river: boolean;
  has_path: boolean;
  road_level: number;
  arcane_line_level: number;
  fortification_level: number;
  created_at: string;
  updated_at: string;
}

export interface ProvinceWithRealm extends Province {
  realm?: Realm;
}

export interface Regent {
  id: string;
  code?: string;
  name: string;
  full_name?: string;
  notes?: string;
  // Campos para gestão de exércitos (unificados de Army.Regent)
  character?: string; // jogador que controla
  domain?: string; // domínio do regente
  gold_bars: number; // GB - Gold Bars
  regency_points: number; // RP - Regency Points
  comando: number; // perícia de comando (1-5)
  estrategia: number; // perícia de estratégia (1-5)
  created_at: string;
  updated_at: string;
}

export type HoldingType = 'ordem' | 'guilda' | 'templo' | 'fonte_magica';

export interface Holding {
  id: string;
  province_id: string;
  holding_type: HoldingType;
  regent_id?: string;
  level: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HoldingWithRegent extends Holding {
  regent?: Regent;
}

export const HOLDING_TYPES: { value: HoldingType; label: string }[] = [
  { value: 'ordem', label: 'Ordem' },
  { value: 'guilda', label: 'Guilda' },
  { value: 'templo', label: 'Templo' },
  { value: 'fonte_magica', label: 'Fonte Mágica' },
];

export const TERRAIN_TYPES = [
  'Planície',
  'Colina',
  'Morro',
  'Montanha',
  'Deserto',
  'Dunas',
  'Neve',
  'Gelo',
  'Brejo',
  'Pântano',
  'Paliçada',
  'Matagal',
  'Bosque',
  'Floresta',
] as const;

export type TerrainTypeName = typeof TERRAIN_TYPES[number];
