// ========================
// SINGLE PLAYER MASS COMBAT TYPES
// Modo Single Player contra Bot
// ========================

import type { BotDifficulty } from '@/lib/botEngine';

// Fases do jogo single player
export type SinglePlayerPhase = 
  | 'setup'              // Configuração inicial
  | 'culture_selection'  // Escolha de cultura
  | 'scenario_selection' // Escolha de cenário
  | 'deckbuilding'       // Construção de deck
  | 'deployment'         // Posicionamento
  | 'combat'             // Combate
  | 'resolution'         // Resolução/Fim
  | 'finished';

// Sub-fases do combate
export type CombatSubPhase = 
  | 'initiative_maneuver'
  | 'initiative_reaction'
  | 'attack_maneuver'
  | 'attack_reaction'
  | 'defense_maneuver'
  | 'defense_reaction'
  | 'resolution';

// Atributos do exército
export interface ArmyAttributes {
  attack: number;
  defense: number;
  mobility: number;
}

// Carta tática (simplificada para single player)
export interface SPTacticalCard {
  id: string;
  name: string;
  card_type: 'ofensiva' | 'defensiva' | 'movimentacao' | 'reacao';
  attack_bonus: number;
  defense_bonus: number;
  mobility_bonus: number;
  command_required: number;
  strategy_required: number;
  vet_cost: number;
  description?: string;
  culture?: string;
  effect_tag?: string;
}

// Comandante
export interface SPCommander {
  instance_id: string;
  template_id: string;
  numero: number;
  especializacao: string;
  comando_base: number;
  cmd_free: number;
  estrategia: number;
  guarda_max: number;
  guarda_current: number;
  is_general: boolean;
  custo_vet: number;
}

// Deck do jogador
export interface SPPlayerDeck {
  offensive: SPTacticalCard[];
  defensive: SPTacticalCard[];
  initiative: SPTacticalCard[];
  reactions: SPTacticalCard[];
}

// Estado do jogador (humano ou bot)
export interface SPPlayerState {
  isBot: boolean;
  nickname: string;
  difficulty?: BotDifficulty;
  
  // Cultura
  culture: string | null;
  cultureConfirmed: boolean;
  
  // Cenário (bids simplificados)
  logisticsBid: number;
  logisticsConfirmed: boolean;
  
  // Exército
  attributes: ArmyAttributes;
  commanders: SPCommander[];
  generalId: string | null;
  deck: SPPlayerDeck;
  deckConfirmed: boolean;
  
  // Combate
  hp: number;
  hand: SPTacticalCard[];
  discardPile: SPTacticalCard[];
  drawPile: SPTacticalCard[];
  
  // Estado atual de combate
  roundCardsPlayed: SPTacticalCard[];
  cmdSpentThisRound: number;
}

// Opção de cenário
export interface SPScenarioOption {
  id: string;
  name: string;
  order: number;
}

// Cenário escolhido
export interface SPScenario {
  terrainId: string;
  terrainName: string;
  seasonId: string;
  seasonName: string;
}

// Estado completo do jogo single player
export interface SinglePlayerMassCombatState {
  // Meta
  gameId: string;
  createdAt: string;
  
  // Configuração
  difficulty: BotDifficulty;
  vetBudget: number;
  
  // Fase atual
  phase: SinglePlayerPhase;
  combatSubPhase?: CombatSubPhase;
  combatRound: number;
  
  // Jogadores
  player: SPPlayerState;
  bot: SPPlayerState;
  
  // Cenário
  scenarioOptions: {
    terrains: SPScenarioOption[];
    seasons: SPScenarioOption[];
  } | null;
  chosenScenario: SPScenario | null;
  scenarioWinner: 'player' | 'bot' | null;
  
  // Combate
  currentAttacker: 'player' | 'bot';
  firstAttacker: 'player' | 'bot' | null;
  
  // Resultado
  winner: 'player' | 'bot' | null;
  
  // Log de ações
  actionLog: SPActionLogEntry[];
}

// Entrada no log de ações
export interface SPActionLogEntry {
  id: string;
  timestamp: string;
  actor: 'player' | 'bot' | 'system';
  action: string;
  details?: string;
}

// Configuração inicial do jogo
export interface SinglePlayerSetupConfig {
  difficulty: BotDifficulty;
  vetBudget?: number;
  playerNickname?: string;
}

// Templates de deck pré-construídos para o bot
export interface BotDeckTemplate {
  name: string;
  difficulty: BotDifficulty[];
  attributes: ArmyAttributes;
  commanderCount: number;
  cardCategories: {
    offensive: number;
    defensive: number;
    initiative: number;
    reactions: number;
  };
}
