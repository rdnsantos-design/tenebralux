export interface Realm {
  id: string;
  name: string;
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
