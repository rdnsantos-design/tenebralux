import { BaseEntity } from './base';
import { UnitInstance } from './unit';
import { Commander } from './commander';

// === EXÉRCITO ===
export interface Army extends BaseEntity {
  // Dono
  ownerId?: string;
  culture?: string;
  
  // Composição
  units: UnitInstance[];
  commanders: Commander[];
  
  // Totais calculados
  totalPower?: number;
  totalCost?: number;
  totalUpkeep?: number;
  
  // Cartas táticas disponíveis
  tacticalCardIds?: string[];
}

// === FUNÇÕES AUXILIARES ===
export function calculateArmyPower(army: Army): number {
  return army.units.reduce((sum, unit) => {
    const power = unit.currentAttack + unit.currentDefense + unit.currentMorale;
    return sum + power;
  }, 0);
}
