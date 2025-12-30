// ========================
// TIPOS - EXÉRCITO ESTRATÉGICO
// ========================

import { MassCombatTacticalCard } from './mass-combat-tactical-card';

export interface StrategicArmyCommander {
  templateId: string;
  templateNumber: number;
  especializacao: string;
  comando: number;
  estrategia: number;
  guarda: number;
  custoVet: number;
  isGeneral?: boolean; // Indica se é o general do exército
}

export interface StrategicArmyCard {
  cardId: string;
  cardName: string;
  vetCost: number;
  quantity: number;
}

export interface StrategicArmy {
  id: string;
  name: string;
  culture: string; // Cultura obrigatória
  cultureName?: string;
  regentId?: string;
  regentName?: string;
  realmId?: string;
  realmName?: string;
  provinceId?: string;
  provinceName?: string;
  
  // VET total e distribuição
  totalVet: number;
  
  // Atributos comprados (5 VET = 1 ponto)
  attackPurchased: number;
  defensePurchased: number;
  mobilityPurchased: number;
  
  // Valores calculados
  attack: number;       // = attackPurchased
  defense: number;      // = 5 + defensePurchased
  mobility: number;     // = mobilityPurchased
  hitPoints: number;    // = totalVet / 10
  
  // Cartas e comandantes
  commanders: StrategicArmyCommander[];
  tacticalCards: StrategicArmyCard[];
  
  // VET gasto e restante
  vetSpentOnAttributes: number;
  vetSpentOnCommanders: number;
  vetSpentOnCards: number;
  vetRemaining: number;
  
  createdAt?: string;
  updatedAt?: string;
}

// Funções auxiliares
export const VET_PER_ATTRIBUTE_POINT = 5; // Alterado de 10 para 5

export function calculateAttributeVetCost(points: number): number {
  return points * VET_PER_ATTRIBUTE_POINT;
}

export function calculateHitPoints(totalVet: number): number {
  return Math.floor(totalVet / 10);
}

export function calculateDefense(defensePurchased: number): number {
  return 5 + defensePurchased;
}

export function createEmptyStrategicArmy(): Partial<StrategicArmy> {
  return {
    name: '',
    culture: '',
    totalVet: 100,
    attackPurchased: 0,
    defensePurchased: 0,
    mobilityPurchased: 0,
    commanders: [],
    tacticalCards: [],
  };
}

export function calculateVetSpent(army: Partial<StrategicArmy>): {
  attributes: number;
  commanders: number;
  cards: number;
  total: number;
  remaining: number;
} {
  const attributes = calculateAttributeVetCost(
    (army.attackPurchased || 0) + 
    (army.defensePurchased || 0) + 
    (army.mobilityPurchased || 0)
  );
  
  const commanders = (army.commanders || []).reduce((sum, c) => sum + c.custoVet, 0);
  const cards = (army.tacticalCards || []).reduce((sum, c) => sum + (c.vetCost * c.quantity), 0);
  
  const total = attributes + commanders + cards;
  const remaining = (army.totalVet || 0) - total;
  
  return { attributes, commanders, cards, total, remaining };
}

export function hasGeneral(army: Partial<StrategicArmy>): boolean {
  return (army.commanders || []).some(c => c.isGeneral);
}

export function getGeneral(army: Partial<StrategicArmy>): StrategicArmyCommander | undefined {
  return (army.commanders || []).find(c => c.isGeneral);
}
