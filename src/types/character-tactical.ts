import { CharacterDraft } from '@/types/character-builder';

/**
 * Tipos de unidade tática
 */
export type TacticalUnitType = 'infantry' | 'ranged' | 'cavalry' | 'support' | 'commander';

/**
 * Tipos de Combat Card
 */
export type TacticalCardType = 'attack' | 'defense' | 'movement' | 'support' | 'special' | 'command';

/**
 * Raridade do card
 */
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic';

/**
 * Mapeamento de stats do personagem para unidade tática
 */
export interface CharacterToUnitMapping {
  // Stats de combate físico
  hp: number;           // Vitalidade
  maxHp: number;        // Vitalidade
  defense: number;      // Guarda
  evasion: number;      // Evasão
  speed: number;        // Movimento
  initiative: number;   // Reação

  // Stats de combate social/stress
  morale: number;       // Vontade
  maxMorale: number;    // Vontade
  stress: number;       // Tensão (inicial)
  influence: number;    // Influência

  // Regência (comandante)
  command: number;      // Comando
  strategy: number;     // Estratégia
  isCommander: boolean; // Se pode ser comandante
}

/**
 * Opções de conversão
 */
export interface ConversionOptions {
  asCommander?: boolean;      // Converter como comandante
  generateCards?: boolean;    // Gerar Combat Cards automaticamente
  includeEquipment?: boolean; // Incluir bônus de equipamento
  teamId?: 'player' | 'enemy' | 'neutral';
}

/**
 * Efeito de Combat Card
 */
export interface CardEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'status' | 'movement' | 'special' | 'cleanse';
  value?: number;
  stat?: string;
  status?: string;
  duration?: number;
  target: 'self' | 'ally' | 'allies' | 'enemy' | 'enemies' | 'varies';
  specialEffect?: string;
}

/**
 * Combat Card para sistema tático
 */
export interface CombatCard {
  id: string;
  name: string;
  type: TacticalCardType;
  rarity: CardRarity;
  unitId: string;
  cost: number;
  cooldown: number;
  currentCooldown: number;
  description: string;
  effects: CardEffect[];
}

/**
 * Unidade tática convertida de personagem
 */
export interface TacticalUnit {
  id: string;
  name: string;
  type: TacticalUnitType;
  teamId: 'player' | 'enemy' | 'neutral';
  
  // Stats de combate
  hp: number;
  maxHp: number;
  defense: number;
  evasion: number;
  speed: number;
  initiative: number;
  
  // Stats sociais
  morale: number;
  maxMorale: number;
  stress: number;
  
  // Posição
  position: { x: number; y: number };
  
  // Flags
  isCommander: boolean;
  isActive: boolean;
  hasActed: boolean;
  
  // Referência ao personagem original
  characterId?: string;
  
  // Stats de comando (se comandante)
  command?: number;
  strategy?: number;
  influence?: number;
  
  // Metadados
  faction?: string;
  theme?: string;
}

/**
 * Resultado da conversão
 */
export interface ConversionResult {
  unit: TacticalUnit;
  cards: CombatCard[];
  warnings: string[];
}
