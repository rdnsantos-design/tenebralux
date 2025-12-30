// ========================
// EXÉRCITO
// ========================

export interface Army {
  id: string;
  regentId: string;
  name: string;
  generalId?: string; // ID do comandante promovido a general deste exército
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
  countryId?: string;
  provinceId?: string;
  isGarrisoned: boolean;
  commanderId?: string; // ID do comandante de campo associado
}
