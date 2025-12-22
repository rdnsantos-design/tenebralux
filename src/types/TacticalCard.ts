export type TacticalCardType = 'Ataque' | 'Defesa' | 'Movimento' | 'Moral';

export type TacticalCardSubtype = 'Buff' | 'Debuff' | 'Neutra' | 'Instantânea';

export type TacticalCulture = 'Anuire' | 'Khinasi' | 'Vos' | 'Rjurik' | 'Brecht';

export type UnitType = 'Infantaria' | 'Cavalaria' | 'Arqueiros' | 'Todas';

export interface TacticalCard {
  id: string;
  name: string;
  description?: string;
  card_type: TacticalCardType;
  subtype: TacticalCardSubtype;
  affected_unit_types: UnitType[];
  attack_bonus: number;
  defense_bonus: number;
  ranged_bonus: number;
  morale_bonus: number;
  extra_pressure_damage: number;
  extra_lethal_damage: number;
  ignores_pressure: boolean;
  targets_outside_commander_unit: boolean;
  affects_enemy_unit: boolean;
  requires_specialization: boolean;
  required_command: number;
  bonus_cultures: TacticalCulture[];
  penalty_cultures: TacticalCulture[];
  created_at?: string;
  updated_at?: string;
}

export const CARD_TYPES: TacticalCardType[] = ['Ataque', 'Defesa', 'Movimento', 'Moral'];
export const CARD_SUBTYPES: TacticalCardSubtype[] = ['Buff', 'Debuff', 'Neutra', 'Instantânea'];
export const CULTURES: TacticalCulture[] = ['Anuire', 'Khinasi', 'Vos', 'Rjurik', 'Brecht'];
export const UNIT_TYPES: UnitType[] = ['Infantaria', 'Cavalaria', 'Arqueiros', 'Todas'];

// Função para calcular o custo base da carta
export function calculateCardCost(card: Partial<TacticalCard>): number {
  let cost = 0;

  // +1 por cada bônus em atributo
  cost += card.attack_bonus || 0;
  cost += card.defense_bonus || 0;
  cost += card.ranged_bonus || 0;
  cost += card.morale_bonus || 0;

  // +1 se causa dano extra de pressão
  cost += card.extra_pressure_damage || 0;

  // +2 se causa dano letal extra
  cost += (card.extra_lethal_damage || 0) * 2;

  // +2 se ignora pressão
  if (card.ignores_pressure) cost += 2;

  // +1 se afeta unidade fora da unidade do comandante
  if (card.targets_outside_commander_unit) cost += 1;

  // +1 se afeta unidade inimiga
  if (card.affects_enemy_unit) cost += 1;

  // -1 se exigir especialização
  if (card.requires_specialization) cost -= 1;

  // -0.5 por cada ponto de comando exigido (arredonda para baixo)
  cost -= Math.floor((card.required_command || 0) * 0.5);

  // -1 por cada cultura com bônus
  cost -= (card.bonus_cultures?.length || 0);

  // +1 por cada cultura com penalidade
  cost += (card.penalty_cultures?.length || 0);

  // Custo mínimo é 0
  return Math.max(0, cost);
}
