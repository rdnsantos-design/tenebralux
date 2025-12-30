// ========================
// DOMÍNIOS E PROVÍNCIAS
// ========================

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
