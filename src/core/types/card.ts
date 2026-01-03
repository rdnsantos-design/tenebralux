import { BaseEntity } from './base';

// === MODO DE JOGO ===
export type GameMode = 'aventura' | 'batalha' | 'campanha' | 'dominio';

// === TIPOS DE CARTA POR MODO ===
export type AventuraCardType = 'combate' | 'debate';
export type BatalhaCardType = 'movimento' | 'tiro' | 'contato' | 'moral' | 'reacao';
export type CampanhaCardType = 'ofensiva' | 'defensiva' | 'mobilidade' | 'reacao';
export type DominioCardType = 'politica' | 'militar' | 'economica';

export type CardType = AventuraCardType | BatalhaCardType | CampanhaCardType | DominioCardType;

// === REQUISITOS ===
export interface CardRequirements {
  // Aventura
  attribute?: string;
  skill?: string;
  minLevel?: number;
  
  // Batalha & Campanha
  command?: number;
  strategy?: number;
  specialization?: string;
  culture?: string;
  phase?: string;
  unitType?: string;
  
  // Domínio
  domainType?: string;
  regencyCost?: number;
}

// === MODIFICADORES ===
export interface CardModifiers {
  // Aventura - Combate
  attack?: number;
  damage?: number;
  movement?: number;
  guard?: number;
  evasion?: number;
  vitality?: number;
  speed?: string;
  
  // Aventura - Debate
  persuasion?: number;
  conviction?: number;
  influence?: number;
  willpower?: number;
  
  // Batalha
  ranged?: number;
  morale?: number;
  pressure?: number;
  health?: number;
  
  // Campanha
  defense?: number;
  initiative?: number;
  
  // Domínio
  administration?: number;
  war?: number;
  arcanism?: number;
  science?: number;
  negotiation?: number;
  intrigue?: number;
}

// === EFEITOS ===
export interface CardEffects {
  minorEffect?: string;
  majorEffect?: string;
  minorCondition?: string;
  majorCondition?: string;
  special?: string;
}

// === CARTA UNIFICADA ===
export interface GameCard extends BaseEntity {
  // Classificação
  gameMode: GameMode;
  cardType: CardType;
  subtype?: string;
  
  // Visual
  imageUrl?: string;
  flavorText?: string;
  
  // Requisitos
  requirements: CardRequirements;
  
  // Modificadores (bônus positivos)
  bonuses: CardModifiers;
  
  // Modificadores (penalidades)
  penalties: CardModifiers;
  
  // Efeitos especiais
  effects: CardEffects;
  
  // Raridade
  rarity?: 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario';
}
