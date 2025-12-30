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
  command_required: number;
  strategy_required: number;
  culture?: string;
  description?: string;
  vet_cost: number;
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

// Calculate VET cost: 1 point per bonus
export function calculateMassCombatVetCost(card: Partial<MassCombatTacticalCard>): number {
  return (card.attack_bonus || 0) + (card.defense_bonus || 0) + (card.mobility_bonus || 0);
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
  if (totalBonus === 0) {
    errors.push('A carta deve ter pelo menos um bônus');
  }
  
  const minCommand = calculateMinCommand(card);
  if ((card.command_required || 0) < minCommand) {
    errors.push(`Comando necessário deve ser pelo menos ${minCommand}`);
  }
  
  const minStrategy = calculateMinStrategy(card);
  if ((card.strategy_required || 0) < minStrategy) {
    errors.push(`Estratégia requerida deve ser pelo menos ${minStrategy}`);
  }
  
  return errors;
}
