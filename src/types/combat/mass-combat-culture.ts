// ========================
// CULTURAS DE COMBATE EM MASSA
// ========================

export interface MassCombatCulture {
  id: string;
  name: string;
  terrain_affinity: string;
  season_affinity: string;
  specialization: string;
  special_ability: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const CULTURE_COLORS: Record<string, { primary: string; secondary: string; bg: string }> = {
  Anuire: { primary: 'text-amber-600', secondary: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
  Khinasi: { primary: 'text-orange-600', secondary: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
  Vos: { primary: 'text-red-600', secondary: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
  Brecht: { primary: 'text-blue-600', secondary: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
  Rjurik: { primary: 'text-green-600', secondary: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' },
};
