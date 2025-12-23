export interface Regent {
  id: string;
  name: string;
  character: string; // jogador
  domain: string; // domínio
  goldBars: number; // GB - Gold Bars
  regencyPoints: number; // RP - Regency Points
  comando: number; // perícia de comando (1-5)
  estrategia: number; // perícia de estratégia (1-5)  
  createdAt: string;
}

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