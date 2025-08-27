export interface Regent {
  id: string;
  name: string;
  character: string; // personagem
  domain: string; // domínio
  goldBars: number; // GB - Gold Bars
  regencyPoints: number; // RP - Regency Points
  createdAt: string;
}

export interface Army {
  id: string;
  regentId: string;
  name: string;
  units: ArmyUnit[];
  createdAt: string;
}

export interface ArmyUnit {
  id: string;
  cardId: string; // referência ao UnitCard
  name: string;
  unitNumber?: string; // número da unidade para distinguir
  power: number;
  creationCost: number;
  maintenanceCost: number;
  location?: string;
  isGarrisoned: boolean;
}