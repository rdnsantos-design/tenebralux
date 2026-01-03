import { BaseEntity, ExperienceLevel } from './base';

// === TIPO DE UNIDADE ===
export type UnitType = 'Infantaria' | 'Cavalaria' | 'Arqueiros' | 'Cerco';

// === POSTURA ===
export type UnitPosture = 'Ofensiva' | 'Defensiva' | 'Carga' | 'Reorganização';

// === HABILIDADE ESPECIAL ===
export interface SpecialAbility {
  id: string;
  name: string;
  description: string;
  level: number;
  effect?: Record<string, any>;
}

// === TEMPLATE DE UNIDADE (definição base) ===
export interface UnitTemplate extends BaseEntity {
  unitType: UnitType;
  culture?: string;
  experience: ExperienceLevel;
  
  // Stats base
  attack: number;
  defense: number;
  ranged: number;
  movement: number;
  morale: number;
  
  // Custo
  cost: number;
  upkeep?: number;
  
  // Habilidades
  specialAbilities: SpecialAbility[];
}

// === INSTÂNCIA DE UNIDADE (em batalha) ===
export interface UnitInstance extends BaseEntity {
  templateId: string;
  armyId?: string;
  
  // Tipo e experiência
  unitType: UnitType;
  experience: ExperienceLevel;
  culture?: string;
  
  // Stats base (do template)
  baseAttack: number;
  baseDefense: number;
  baseRanged: number;
  baseMovement: number;
  baseMorale: number;
  
  // Stats atuais (modificados por dano, cartas, etc)
  currentAttack: number;
  currentDefense: number;
  currentRanged: number;
  currentMovement: number;
  currentMorale: number;
  
  // Recursos
  maxHealth: number;
  currentHealth: number;
  maxPressure: number;
  currentPressure: number;
  permanentPressure: number;
  
  // Estado
  posture: UnitPosture;
  isRouting: boolean;
  hitsReceived: number;
  hasActedThisTurn: boolean;
  
  // Posição (para batalha tática)
  position?: { q: number; r: number };
  facing?: 'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW';
  
  // Carta tática ativa
  activeTacticalCardId?: string;
  
  // Habilidades
  specialAbilities: SpecialAbility[];
}
