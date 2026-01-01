// ========================
// CARTAS TÁTICAS DE COMBATE EM MASSA
// ========================

export type MassCombatUnitType = 'Infantaria' | 'Cavalaria' | 'Arqueiros' | 'Cerco' | 'Geral';

export type MassCombatCulture = 'Anuire' | 'Khinasi' | 'Vos' | 'Rjurik' | 'Brecht';

export interface MassCombatTacticalCard {
  id: string;
  name: string;
  unit_type: MassCombatUnitType;
  attack_bonus: number;
  defense_bonus: number;
  mobility_bonus: number;
  attack_penalty: number;
  defense_penalty: number;
  mobility_penalty: number;
  command_required: number;
  strategy_required: number;
  culture?: string;
  description?: string;
  minor_effect?: string;
  major_effect?: string;
  minor_condition?: string;
  major_condition?: string;
  effect_type?: string | null;
  effect_tag?: string | null;
  vet_cost: number;
  vet_cost_override?: number | null;
  created_at?: string;
  updated_at?: string;
}

export const MASS_COMBAT_UNIT_TYPES: MassCombatUnitType[] = [
  'Infantaria',
  'Cavalaria',
  'Arqueiros',
  'Cerco',
  'Geral'
];

export const MASS_COMBAT_CULTURES: MassCombatCulture[] = [
  'Anuire',
  'Khinasi',
  'Vos',
  'Rjurik',
  'Brecht'
];

// Calculate VET cost with new rules:
// +1 bonus = +2 VET
// -1 penalty = -1 VET
// Minor effect = +2 VET
// Major effect = +4 VET
// Minor condition = -1 VET
// Major condition = -2 VET
export function calculateMassCombatVetCost(card: Partial<MassCombatTacticalCard>): number {
  // Bonus costs (each +1 = +2 VET)
  const bonusCost = ((card.attack_bonus || 0) + (card.defense_bonus || 0) + (card.mobility_bonus || 0)) * 2;
  
  // Penalty reductions (each -1 = -1 VET)
  const penaltyReduction = (card.attack_penalty || 0) + (card.defense_penalty || 0) + (card.mobility_penalty || 0);
  
  // Effect costs
  const minorEffectCost = card.minor_effect?.trim() ? 2 : 0;
  const majorEffectCost = card.major_effect?.trim() ? 4 : 0;
  
  // Condition reductions
  const minorConditionReduction = card.minor_condition?.trim() ? 1 : 0;
  const majorConditionReduction = card.major_condition?.trim() ? 2 : 0;
  
  const calculatedCost = bonusCost - penaltyReduction + minorEffectCost + majorEffectCost - minorConditionReduction - majorConditionReduction;
  
  // Minimum cost is 0
  return Math.max(0, calculatedCost);
}

// Get final VET cost (considering override)
export function getFinalVetCost(card: Partial<MassCombatTacticalCard>): number {
  if (card.vet_cost_override !== undefined && card.vet_cost_override !== null) {
    return card.vet_cost_override;
  }
  return calculateMassCombatVetCost(card);
}

// Calculate minimum required command (highest bonus)
export function calculateMinCommand(card: Partial<MassCombatTacticalCard>): number {
  return Math.max(
    card.attack_bonus || 0,
    card.defense_bonus || 0,
    card.mobility_bonus || 0,
    1
  );
}

// Calculate minimum required strategy (highest bonus)
export function calculateMinStrategy(card: Partial<MassCombatTacticalCard>): number {
  return Math.max(
    card.attack_bonus || 0,
    card.defense_bonus || 0,
    card.mobility_bonus || 0,
    1
  );
}

// Validate card requirements
export function validateMassCombatCard(card: Partial<MassCombatTacticalCard>): string[] {
  const errors: string[] = [];
  
  if (!card.name?.trim()) {
    errors.push('Nome é obrigatório');
  }
  
  if (!card.unit_type) {
    errors.push('Tipo de unidade é obrigatório');
  }
  
  const totalBonus = (card.attack_bonus || 0) + (card.defense_bonus || 0) + (card.mobility_bonus || 0);
  const totalPenalty = (card.attack_penalty || 0) + (card.defense_penalty || 0) + (card.mobility_penalty || 0);
  const hasEffect = card.minor_effect?.trim() || card.major_effect?.trim();
  
  if (totalBonus === 0 && totalPenalty === 0 && !hasEffect) {
    errors.push('A carta deve ter pelo menos um bônus, penalidade ou efeito');
  }
  
  const minCommand = calculateMinCommand(card);
  if ((card.command_required || 0) < minCommand) {
    errors.push(`Comando necessário deve ser pelo menos ${minCommand}`);
  }
  
  return errors;
}
