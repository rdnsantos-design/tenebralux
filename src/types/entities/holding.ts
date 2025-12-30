// ========================
// HOLDINGS (Ordens, Guildas, Templos, Fontes Mágicas)
// ========================

import { Regent } from './regent';

export type HoldingType = 'ordem' | 'guilda' | 'templo' | 'fonte_magica';

export interface Holding {
  id: string;
  province_id: string;
  holding_type: HoldingType;
  regent_id?: string;
  level: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HoldingWithRegent extends Holding {
  regent?: Regent;
}

export const HOLDING_TYPES: { value: HoldingType; label: string }[] = [
  { value: 'ordem', label: 'Ordem' },
  { value: 'guilda', label: 'Guilda' },
  { value: 'templo', label: 'Templo' },
  { value: 'fonte_magica', label: 'Fonte Mágica' },
];
