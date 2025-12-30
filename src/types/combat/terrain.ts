// ========================
// TIPOS DE TERRENO (SISTEMA ANTIGO)
// ========================

export interface TerrainType {
  id: string;
  name: string;
  tag: string | null;
  level: number;
  movement_mod: string;
  defense_mod: number;
  morale_mod: number;
  ranged_mod: number;
  special: string | null;
  mod_rjurik: string | null;
  mod_vos: string | null;
  mod_khinasi: string | null;
  mod_brecht: string | null;
  mod_anuire: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}
