// ========================
// ESTAÇÕES DE COMBATE EM MASSA (Sistema Simplificado)
// ========================

export interface MassCombatSeason {
  id: string;
  name: string;
  modifier_type: 'ataque' | 'defesa' | 'mobilidade' | 'pv';
  condition1_name: string;
  condition1_modifier: number;
  condition2_name: string;
  condition2_modifier: number;
  condition3_name: string;
  condition3_modifier: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Mantendo export para compatibilidade (não usado mais)
export interface MassCombatClimate {
  id: string;
  name: string;
}
