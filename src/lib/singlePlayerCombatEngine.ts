// ========================
// SINGLE PLAYER COMBAT ENGINE
// Motor de combate completo com todas as regras do multiplayer
// ========================

import { BotDifficulty, BotCard, BotCommander, makeBotDecision, getBotDelayMs } from './botEngine';

// ========================
// TIPOS
// ========================

export type SPGamePhase = 
  | 'army_selection'
  | 'difficulty_select'
  | 'scenario_selection'
  | 'deckbuilding'
  | 'deployment'
  | 'combat'
  | 'finished';

export type SPCombatPhase = 
  | 'initiative_maneuver'
  | 'initiative_reaction'
  | 'initiative_roll'
  | 'initiative_post'
  | 'attack_maneuver'
  | 'attack_reaction'
  | 'defense_maneuver'
  | 'defense_reaction'
  | 'combat_roll'
  | 'combat_resolution'
  | 'round_end';

export interface SPCommander {
  instance_id: string;
  template_id: string;
  numero: number;
  especializacao: string;
  comando_base: number;
  cmd_free: number;
  estrategia: number;
  guarda_base: number;
  guarda_current: number;
  is_general: boolean;
  vet_cost: number;
}

export interface SPCard {
  id: string;
  name: string;
  card_type: 'ofensiva' | 'defensiva' | 'movimentacao' | 'reacao';
  unit_type: string;
  attack_bonus: number;
  defense_bonus: number;
  mobility_bonus: number;
  command_required: number;
  strategy_required: number;
  vet_cost: number;
  minor_effect?: string;
  major_effect?: string;
  culture?: string;
}

export interface SPArmyAttributes {
  attack: number;
  defense: number;
  mobility: number;
}

export interface SPManeuver {
  card: SPCard;
  commander_id: string;
  confirmed: boolean;
}

export interface SPBoardSide {
  deployed_commanders: SPCommander[];
  maneuver?: SPManeuver;
  confirmed_maneuver: boolean;
  reaction?: { card: SPCard };
  confirmed_reaction: boolean;
  attack_maneuvers: SPManeuver[];
  confirmed_attack: boolean;
  defense_maneuvers: SPManeuver[];
  confirmed_defense: boolean;
}

export interface SPInitiativeResult {
  player: { d20: number; strategy: number; mobility: number; total: number };
  bot: { d20: number; strategy: number; mobility: number; total: number };
  winner: 'player' | 'bot';
}

export interface SPCombatResult {
  attacker: 'player' | 'bot';
  attackerRoll: number;
  defenderRoll: number;
  attackTotal: number;
  defenseTotal: number;
  damage: number;
  critical: boolean;
}

export interface SPCombatBoard {
  player: SPBoardSide;
  bot: SPBoardSide;
  initiative_result?: SPInitiativeResult;
  current_attacker?: 'player' | 'bot';
  current_defender?: 'player' | 'bot';
  chosen_secondary_terrain_id?: string;
  combat_result?: SPCombatResult;
  reaction_turn?: 'player' | 'bot';
}

export interface SPScenarioOption {
  terrain_id: string;
  terrain_name: string;
  season_id: string;
  season_name: string;
  draw_order: number;
}

export interface SPBasicCardsUsed {
  heal: boolean;
  attack: boolean;
  defense: boolean;
  initiative: boolean;
  countermaneuver: boolean;
}

export interface SPBasicCardsBonuses {
  heal?: boolean;
  attack?: boolean;
  defense?: boolean;
  initiative?: boolean;
  countermaneuver?: boolean;
}

export interface SPGameState {
  phase: SPGamePhase;
  combatPhase: SPCombatPhase;
  round: number;
  
  // Jogador
  playerCulture: string | null;
  playerCultureName: string | null;
  playerHand: SPCard[];
  playerDeck: SPCard[];
  playerDiscard: SPCard[];
  playerCommanders: SPCommander[];
  playerGeneralId: string | null;
  playerHp: number;
  playerMaxHp: number;
  playerAttributes: SPArmyAttributes;
  playerVetBudget: number;
  playerVetSpent: number;
  playerBasicCardsUsed: SPBasicCardsUsed;
  playerBasicCardsBonuses: SPBasicCardsBonuses;
  
  // Bot
  botDifficulty: BotDifficulty;
  botName: string;
  botCulture: string | null;
  botCultureName: string | null;
  botHand: SPCard[];
  botDeck: SPCard[];
  botDiscard: SPCard[];
  botCommanders: SPCommander[];
  botGeneralId: string | null;
  botHp: number;
  botMaxHp: number;
  botAttributes: SPArmyAttributes;
  botBasicCardsUsed: SPBasicCardsUsed;
  botBasicCardsBonuses: SPBasicCardsBonuses;
  
  // Cenário
  scenarioOptions: SPScenarioOption[];
  playerLogisticsBid: number | null;
  botLogisticsBid: number | null;
  scenarioWinner: 'player' | 'bot' | null;
  selectedTerrainId: string | null;
  selectedTerrainName: string | null;
  selectedSeasonId: string | null;
  selectedSeasonName: string | null;
  secondaryTerrainId: string | null;
  secondaryTerrainName: string | null;
  
  // Tabuleiro de combate
  board: SPCombatBoard;
  
  // Meta
  battleLog: Array<{ message: string; timestamp: number; type?: 'info' | 'damage' | 'effect' | 'phase' }>;
  isLoading: boolean;
  winner: 'player' | 'bot' | null;
  awaitingPlayer: boolean;
}

export function createInitialBasicCards(): SPBasicCardsUsed {
  return {
    heal: false,
    attack: false,
    defense: false,
    initiative: false,
    countermaneuver: false,
  };
}

// ========================
// FUNÇÕES DE COMBATE
// ========================

/**
 * Rolar d20
 */
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Calcular modificador de mobilidade total
 */
export function calculateMobilityModifier(
  attributes: SPArmyAttributes,
  commanders: SPCommander[],
  maneuver?: SPManeuver,
  terrain?: { mobility_mod: number }
): number {
  let mod = attributes.mobility;
  
  // Bônus da carta de manobra
  if (maneuver?.card) {
    mod += maneuver.card.mobility_bonus || 0;
  }
  
  // Modificador do terreno
  if (terrain) {
    mod += terrain.mobility_mod;
  }
  
  return mod;
}

/**
 * Calcular estratégia do general
 */
export function calculateStrategyModifier(commanders: SPCommander[]): number {
  const general = commanders.find(c => c.is_general);
  return general?.estrategia || 0;
}

/**
 * Resolver rolagem de iniciativa
 */
export function resolveInitiativeRoll(
  playerAttrs: SPArmyAttributes,
  playerCommanders: SPCommander[],
  playerManeuver: SPManeuver | undefined,
  botAttrs: SPArmyAttributes,
  botCommanders: SPCommander[],
  botManeuver: SPManeuver | undefined
): SPInitiativeResult {
  const playerD20 = rollD20();
  const botD20 = rollD20();
  
  const playerStrategy = calculateStrategyModifier(playerCommanders);
  const botStrategy = calculateStrategyModifier(botCommanders);
  
  const playerMobility = calculateMobilityModifier(playerAttrs, playerCommanders, playerManeuver);
  const botMobility = calculateMobilityModifier(botAttrs, botCommanders, botManeuver);
  
  const playerTotal = playerD20 + playerStrategy + playerMobility;
  const botTotal = botD20 + botStrategy + botMobility;
  
  return {
    player: { d20: playerD20, strategy: playerStrategy, mobility: playerMobility, total: playerTotal },
    bot: { d20: botD20, strategy: botStrategy, mobility: botMobility, total: botTotal },
    winner: playerTotal >= botTotal ? 'player' : 'bot', // Empate favorece player
  };
}

/**
 * Calcular ataque total
 */
export function calculateAttackTotal(
  attributes: SPArmyAttributes,
  maneuvers: SPManeuver[],
  terrain?: { attack_mod: number },
  season?: { modifier: number; modifier_type: string }
): { base: number; bonus: number; total: number } {
  const base = attributes.attack;
  let bonus = 0;
  
  // Bônus das cartas ofensivas
  maneuvers.forEach(m => {
    bonus += m.card.attack_bonus || 0;
  });
  
  // Modificador de terreno
  if (terrain) {
    bonus += terrain.attack_mod;
  }
  
  // Modificador de estação (se aplicável ao ataque)
  if (season && season.modifier_type === 'attack') {
    bonus += season.modifier;
  }
  
  return { base, bonus, total: base + bonus };
}

/**
 * Calcular defesa total
 */
export function calculateDefenseTotal(
  attributes: SPArmyAttributes,
  maneuvers: SPManeuver[],
  terrain?: { defense_mod: number },
  season?: { modifier: number; modifier_type: string }
): { base: number; bonus: number; total: number } {
  const base = attributes.defense;
  let bonus = 0;
  
  // Bônus das cartas defensivas
  maneuvers.forEach(m => {
    bonus += m.card.defense_bonus || 0;
  });
  
  // Modificador de terreno
  if (terrain) {
    bonus += terrain.defense_mod;
  }
  
  // Modificador de estação (se aplicável à defesa)
  if (season && season.modifier_type === 'defense') {
    bonus += season.modifier;
  }
  
  return { base, bonus, total: base + bonus };
}

/**
 * Resolver rolagem de combate
 * Atacante: d20 + ATQ vs Defensor: d20 + DEF
 * Dano = diferença (mínimo 1 se atacante vence)
 */
export function resolveCombatRoll(
  attackerAttrs: SPArmyAttributes,
  attackerManeuvers: SPManeuver[],
  defenderAttrs: SPArmyAttributes,
  defenderManeuvers: SPManeuver[],
  attacker: 'player' | 'bot'
): SPCombatResult {
  const attackerD20 = rollD20();
  const defenderD20 = rollD20();
  
  const attackTotal = calculateAttackTotal(attackerAttrs, attackerManeuvers);
  const defenseTotal = calculateDefenseTotal(defenderAttrs, defenderManeuvers);
  
  const attackRoll = attackerD20 + attackTotal.total;
  const defenseRoll = defenderD20 + defenseTotal.total;
  
  const critical = attackerD20 === 20;
  let damage = 0;
  
  if (attackRoll > defenseRoll) {
    damage = attackRoll - defenseRoll;
    if (critical) {
      damage = Math.floor(damage * 1.5); // Crítico = 50% mais dano
    }
  }
  
  return {
    attacker,
    attackerRoll: attackerD20,
    defenderRoll: defenderD20,
    attackTotal: attackRoll,
    defenseTotal: defenseRoll,
    damage: Math.max(0, damage),
    critical,
  };
}

/**
 * Verificar se um comandante pode jogar uma carta
 */
export function canCommanderPlayCard(
  commander: SPCommander,
  card: SPCard,
  isGeneral: boolean
): { canPlay: boolean; reason?: string } {
  // General só joga reações
  if (isGeneral && card.card_type !== 'reacao') {
    return { canPlay: false, reason: 'General só pode jogar cartas de reação' };
  }
  
  // Verificar CMD disponível
  if (commander.cmd_free < (card.command_required || 0)) {
    return { canPlay: false, reason: 'CMD insuficiente' };
  }
  
  return { canPlay: true };
}

/**
 * Filtrar cartas jogáveis na fase atual
 */
export function getPlayableCards(hand: SPCard[], phase: SPCombatPhase): SPCard[] {
  const allowedTypes: Record<SPCombatPhase, string[]> = {
    'initiative_maneuver': ['movimentacao'],
    'initiative_reaction': ['reacao'],
    'initiative_roll': [],
    'initiative_post': [],
    'attack_maneuver': ['ofensiva'],
    'attack_reaction': ['reacao'],
    'defense_maneuver': ['defensiva'],
    'defense_reaction': ['reacao'],
    'combat_roll': [],
    'combat_resolution': [],
    'round_end': [],
  };
  
  const allowed = allowedTypes[phase] || [];
  return hand.filter(c => allowed.includes(c.card_type));
}

/**
 * Criar estado inicial do tabuleiro
 */
export function createInitialBoard(): SPCombatBoard {
  return {
    player: {
      deployed_commanders: [],
      confirmed_maneuver: false,
      confirmed_reaction: false,
      attack_maneuvers: [],
      confirmed_attack: false,
      defense_maneuvers: [],
      confirmed_defense: false,
    },
    bot: {
      deployed_commanders: [],
      confirmed_maneuver: false,
      confirmed_reaction: false,
      attack_maneuvers: [],
      confirmed_attack: false,
      defense_maneuvers: [],
      confirmed_defense: false,
    },
  };
}

/**
 * Resetar tabuleiro para novo round
 */
export function resetBoardForNewRound(board: SPCombatBoard): SPCombatBoard {
  return {
    ...board,
    player: {
      ...board.player,
      maneuver: undefined,
      confirmed_maneuver: false,
      reaction: undefined,
      confirmed_reaction: false,
      attack_maneuvers: [],
      confirmed_attack: false,
      defense_maneuvers: [],
      confirmed_defense: false,
    },
    bot: {
      ...board.bot,
      maneuver: undefined,
      confirmed_maneuver: false,
      reaction: undefined,
      confirmed_reaction: false,
      attack_maneuvers: [],
      confirmed_attack: false,
      defense_maneuvers: [],
      confirmed_defense: false,
    },
    initiative_result: undefined,
    current_attacker: undefined,
    current_defender: undefined,
    combat_result: undefined,
    reaction_turn: undefined,
  };
}

/**
 * Calcular HP base por VET
 * Regra: VET / 10 (mínimo 1)
 */
export function calculateBaseHp(vetBudget: number): number {
  return Math.max(1, Math.floor(vetBudget / 10));
}

/**
 * Calcular HP do bot baseado na dificuldade
 */
export function calculateBotHp(difficulty: BotDifficulty, playerVet: number): number {
  const baseHp = calculateBaseHp(playerVet);
  const multipliers: Record<BotDifficulty, number> = {
    easy: 0.8,
    medium: 1.0,
    hard: 1.2,
  };
  return Math.max(1, Math.floor(baseHp * multipliers[difficulty]));
}

/**
 * Obter próxima fase de combate
 */
export function getNextCombatPhase(current: SPCombatPhase, board: SPCombatBoard): SPCombatPhase {
  const sequence: SPCombatPhase[] = [
    'initiative_maneuver',
    'initiative_reaction',
    'initiative_roll',
    'initiative_post',
    'attack_maneuver',
    'attack_reaction',
    'defense_maneuver',
    'defense_reaction',
    'combat_roll',
    'combat_resolution',
    'round_end',
  ];
  
  const currentIndex = sequence.indexOf(current);
  if (currentIndex === -1 || currentIndex >= sequence.length - 1) {
    return 'initiative_maneuver'; // Volta ao início do round
  }
  
  return sequence[currentIndex + 1];
}

// ========================
// BOT DECISIONS
// ========================

/**
 * Bot decide manobra de iniciativa
 */
export function botDecideInitiativeManeuver(
  hand: SPCard[],
  commanders: SPCommander[],
  difficulty: BotDifficulty
): { cardIndex: number; commanderId: string } | null {
  const playable = getPlayableCards(hand, 'initiative_maneuver');
  if (playable.length === 0) return null;
  
  const nonGeneralCommanders = commanders.filter(c => !c.is_general && c.cmd_free > 0);
  if (nonGeneralCommanders.length === 0) return null;
  
  // Dificuldade influencia escolha
  if (difficulty === 'easy' && Math.random() < 0.4) {
    return null; // Bot fácil passa 40% das vezes
  }
  
  // Escolher melhor carta
  const sorted = [...playable].sort((a, b) => (b.mobility_bonus || 0) - (a.mobility_bonus || 0));
  const card = difficulty === 'hard' ? sorted[0] : sorted[Math.floor(Math.random() * sorted.length)];
  
  const cardIndex = hand.findIndex(c => c.id === card.id);
  const commander = nonGeneralCommanders[Math.floor(Math.random() * nonGeneralCommanders.length)];
  
  return { cardIndex, commanderId: commander.instance_id };
}

/**
 * Bot decide reação
 */
export function botDecideReaction(
  hand: SPCard[],
  general: SPCommander | undefined,
  difficulty: BotDifficulty
): number | null {
  const playable = getPlayableCards(hand, 'initiative_reaction');
  if (playable.length === 0 || !general) return null;
  
  // Dificuldade influencia
  if (difficulty === 'easy' && Math.random() < 0.6) return null;
  if (difficulty === 'medium' && Math.random() < 0.3) return null;
  
  const card = playable[Math.floor(Math.random() * playable.length)];
  return hand.findIndex(c => c.id === card.id);
}

/**
 * Bot decide manobras de ataque
 */
export function botDecideAttackManeuvers(
  hand: SPCard[],
  commanders: SPCommander[],
  difficulty: BotDifficulty
): Array<{ cardIndex: number; commanderId: string }> {
  const playable = getPlayableCards(hand, 'attack_maneuver');
  const nonGeneralCommanders = commanders.filter(c => !c.is_general && c.cmd_free > 0);
  
  // Se não tem cartas ofensivas ou comandantes disponíveis, retorna vazio
  // mas o combate ainda acontece com atributos base
  if (playable.length === 0 || nonGeneralCommanders.length === 0) return [];
  
  const decisions: Array<{ cardIndex: number; commanderId: string }> = [];
  
  // Bot SEMPRE tenta jogar pelo menos 1 carta ofensiva se tiver
  const minCards = 1;
  const maxCards = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
  const targetCards = Math.max(minCards, maxCards);
  
  const sorted = [...playable].sort((a, b) => (b.attack_bonus || 0) - (a.attack_bonus || 0));
  const usedCommanders = new Set<string>();
  
  for (let i = 0; i < Math.min(targetCards, sorted.length); i++) {
    const card = sorted[i];
    const availableCmd = nonGeneralCommanders.find(c => 
      !usedCommanders.has(c.instance_id) && c.cmd_free >= (card.command_required || 0)
    );
    
    if (availableCmd) {
      decisions.push({
        cardIndex: hand.findIndex(c => c.id === card.id),
        commanderId: availableCmd.instance_id,
      });
      usedCommanders.add(availableCmd.instance_id);
    }
  }
  
  return decisions;
}

/**
 * Bot decide manobras de defesa
 */
export function botDecideDefenseManeuvers(
  hand: SPCard[],
  commanders: SPCommander[],
  difficulty: BotDifficulty
): Array<{ cardIndex: number; commanderId: string }> {
  const playable = getPlayableCards(hand, 'defense_maneuver');
  const nonGeneralCommanders = commanders.filter(c => !c.is_general && c.cmd_free > 0);
  
  // Se não tem cartas defensivas ou comandantes disponíveis, retorna vazio
  // mas o combate ainda acontece com atributos base
  if (playable.length === 0 || nonGeneralCommanders.length === 0) return [];
  
  const decisions: Array<{ cardIndex: number; commanderId: string }> = [];
  
  // Bot SEMPRE tenta jogar pelo menos 1 carta defensiva se tiver
  const minCards = 1;
  const maxCards = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
  const targetCards = Math.max(minCards, maxCards);
  
  const sorted = [...playable].sort((a, b) => (b.defense_bonus || 0) - (a.defense_bonus || 0));
  const usedCommanders = new Set<string>();
  
  for (let i = 0; i < Math.min(targetCards, sorted.length); i++) {
    const card = sorted[i];
    const availableCmd = nonGeneralCommanders.find(c => 
      !usedCommanders.has(c.instance_id) && c.cmd_free >= (card.command_required || 0)
    );
    
    if (availableCmd) {
      decisions.push({
        cardIndex: hand.findIndex(c => c.id === card.id),
        commanderId: availableCmd.instance_id,
      });
      usedCommanders.add(availableCmd.instance_id);
    }
  }
  
  return decisions;
}

/**
 * Bot escolhe terreno secundário
 */
export function botChooseSecondaryTerrain(
  compatibleTerrains: Array<{ id: string; name: string; attack_mod: number; defense_mod: number }>,
  difficulty: BotDifficulty,
  isAttacker: boolean
): string | null {
  if (compatibleTerrains.length === 0) return null;
  
  // Bot difícil escolhe estrategicamente
  if (difficulty === 'hard') {
    const sorted = [...compatibleTerrains].sort((a, b) => {
      const aScore = isAttacker ? a.attack_mod : a.defense_mod;
      const bScore = isAttacker ? b.attack_mod : b.defense_mod;
      return bScore - aScore;
    });
    return sorted[0].id;
  }
  
  // Outros escolhem aleatoriamente
  return compatibleTerrains[Math.floor(Math.random() * compatibleTerrains.length)].id;
}

/**
 * Bot escolhe se ataca ou defende primeiro
 */
export function botChooseFirstAttacker(
  difficulty: BotDifficulty,
  botAttack: number,
  botDefense: number
): boolean {
  // Bot difícil analisa atributos
  if (difficulty === 'hard') {
    return botAttack >= botDefense; // Ataca se ATQ >= DEF
  }
  
  // Médio tem 60% de atacar
  if (difficulty === 'medium') {
    return Math.random() < 0.6;
  }
  
  // Fácil é aleatório
  return Math.random() < 0.5;
}
