// ========================
// MULTIPLAYER GAME TYPES
// Fase 0 - Fundação
// ========================

// Enums que espelham o banco
export type RoomStatus = 'waiting' | 'ready' | 'in_progress' | 'finished' | 'cancelled';
export type PlayerStatus = 'joined' | 'ready' | 'disconnected';
export type GamePhase = 
  | 'lobby'
  | 'culture_selection'
  | 'scenario_selection'
  | 'scenario_tiebreak'
  | 'deckbuilding'
  | 'deployment'
  | 'combat_setup'
  | 'combat'
  | 'resolution';

// Sala de jogo
export interface Room {
  id: string;
  code: string;
  host_nickname: string;
  status: RoomStatus;
  current_phase: GamePhase;
  created_at: string;
  updated_at: string;
}

// Jogador na sala
export interface RoomPlayer {
  id: string;
  room_id: string;
  player_number: 1 | 2;
  nickname: string;
  session_id: string;
  status: PlayerStatus;
  is_host: boolean;
  created_at: string;
  updated_at: string;
}

// Opção de cenário gerada pelo servidor
export interface ScenarioOption {
  terrain_id: string;
  terrain_name: string;
  season_id: string;
  season_name: string;
  draw_order: number;
}

// Deck do jogador
export interface PlayerDeck {
  attributes: {
    attack: number;
    defense: number;
    mobility: number;
  };
  commanders: string[]; // IDs dos templates de comandante
  general_id: string | null;
  cards: string[]; // IDs das cartas táticas
}

// Estado da partida
export interface MatchState {
  id: string;
  room_id: string;
  version: number;
  game_seed: string | null;
  
  // Cultura
  player1_culture: string | null;
  player1_culture_confirmed: boolean;
  player2_culture: string | null;
  player2_culture_confirmed: boolean;
  
  // Cenário
  scenario_options: ScenarioOption[] | null;
  player1_logistics_bid: number | null;
  player1_logistics_confirmed: boolean;
  player2_logistics_bid: number | null;
  player2_logistics_confirmed: boolean;
  
  // Resultado cenário
  scenario_winner: 1 | 2 | null;
  selected_terrain_id: string | null;
  selected_season_id: string | null;
  
  // Tiebreak
  tiebreak_required: boolean;
  tiebreak_players: number[] | null;
  player1_tiebreak_bid: number | null;
  player1_tiebreak_confirmed: boolean;
  player2_tiebreak_bid: number | null;
  player2_tiebreak_confirmed: boolean;
  
  // VET
  player1_vet_remaining: number | null;
  player2_vet_remaining: number | null;
  
  // Deck
  player1_deck: PlayerDeck | null;
  player1_deck_confirmed: boolean;
  player2_deck: PlayerDeck | null;
  player2_deck_confirmed: boolean;
  
  created_at: string;
  updated_at: string;
}

// Ação de log
export interface MatchAction {
  id: string;
  room_id: string;
  player_number: 1 | 2;
  action_type: string;
  action_data: Record<string, unknown> | null;
  phase: GamePhase;
  state_version: number;
  created_at: string;
}

// Resultado de criar sala
export interface CreateRoomResult {
  room_id: string;
  room_code: string;
  player_id: string;
}

// Resultado de entrar na sala
export interface JoinRoomResult {
  room_id: string;
  player_id: string;
  player_number: number;
}

// Contexto do jogador na sessão atual
export interface PlayerContext {
  playerId: string;
  playerNumber: 1 | 2;
  nickname: string;
  isHost: boolean;
  sessionId: string;
}
