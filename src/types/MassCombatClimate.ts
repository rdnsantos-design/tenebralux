export interface MassCombatSeason {
  id: string;
  name: string;
  description: string | null;
  common_climates: string[];
  rare_climates: string[];
  blocked_climates: string[];
  created_at: string;
  updated_at: string;
}

export interface MassCombatClimate {
  id: string;
  name: string;
  description: string | null;
  // Nível 1 (Leve)
  level1_attack_mod: number;
  level1_defense_mod: number;
  level1_mobility_mod: number;
  level1_strategy_mod: number;
  level1_description: string | null;
  // Nível 2 (Moderado)
  level2_attack_mod: number;
  level2_defense_mod: number;
  level2_mobility_mod: number;
  level2_strategy_mod: number;
  level2_description: string | null;
  // Nível 3 (Severo)
  level3_attack_mod: number;
  level3_defense_mod: number;
  level3_mobility_mod: number;
  level3_strategy_mod: number;
  level3_description: string | null;
  special_effects: string | null;
  has_all_levels: boolean;
  created_at: string;
  updated_at: string;
}
