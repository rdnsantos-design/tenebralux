// ========================
// BOT ENGINE - Single Player AI
// Níveis: Fácil, Médio, Difícil
// ========================

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface BotCard {
  id: string;
  name: string;
  card_type: 'ofensiva' | 'defensiva' | 'movimentacao' | 'reacao';
  attack_bonus?: number;
  defense_bonus?: number;
  mobility_bonus?: number;
  command_required?: number;
  vet_cost?: number;
}

export interface BotCommander {
  instance_id: string;
  numero: number;
  especializacao: string;
  comando_base: number;
  cmd_free: number;
  estrategia: number;
  guarda_current: number;
  is_general: boolean;
}

export interface BotGameState {
  phase: string;
  myHp: number;
  opponentHp: number;
  myHand: BotCard[];
  myCommanders: BotCommander[];
  cmdFree: number;
  round: number;
}

export interface BotDecision {
  action: 'play_card' | 'pass' | 'confirm';
  cardIndex?: number;
  commanderId?: string;
  reasoning?: string;
}

// Pesos para avaliação de cartas por dificuldade
const DIFFICULTY_WEIGHTS = {
  easy: {
    randomFactor: 0.7,      // 70% chance de decisão aleatória
    valueThreshold: 0.3,    // Aceita cartas de baixo valor
    passChance: 0.3,        // 30% chance de passar mesmo tendo cartas
  },
  medium: {
    randomFactor: 0.3,      // 30% chance de decisão aleatória
    valueThreshold: 0.5,    // Mais seletivo
    passChance: 0.15,       // 15% chance de passar
  },
  hard: {
    randomFactor: 0.05,     // 5% chance de decisão aleatória (para parecer humano)
    valueThreshold: 0.7,    // Muito seletivo
    passChance: 0.05,       // Raramente passa
  },
};

// === FUNÇÕES DE AVALIAÇÃO ===

/**
 * Calcula o valor de uma carta baseado no contexto do jogo
 */
function evaluateCard(card: BotCard, state: BotGameState, phase: string): number {
  let value = 0;
  
  // Bônus base pelos modificadores
  value += (card.attack_bonus || 0) * 1.5;
  value += (card.defense_bonus || 0) * 1.2;
  value += (card.mobility_bonus || 0) * 1.0;
  
  // Penalidade pelo custo de comando
  value -= (card.command_required || 0) * 0.5;
  
  // Ajustes contextuais
  if (state.myHp < 30) {
    // Baixa vida: priorizar defesa
    if (card.card_type === 'defensiva') value *= 1.8;
    if (card.card_type === 'ofensiva') value *= 0.7;
  } else if (state.opponentHp < 30) {
    // Oponente com baixa vida: priorizar ataque
    if (card.card_type === 'ofensiva') value *= 1.8;
  }
  
  // Verificar se é a fase certa para o tipo de carta
  const phaseCardType: Record<string, string> = {
    'initiative_maneuver': 'movimentacao',
    'attack_maneuver': 'ofensiva',
    'defense_maneuver': 'defensiva',
    'initiative_reaction': 'reacao',
    'attack_reaction': 'reacao',
    'defense_reaction': 'reacao',
  };
  
  if (phaseCardType[phase] === card.card_type) {
    value *= 2; // Dobra o valor se for a fase correta
  } else {
    value = 0; // Carta não jogável nesta fase
  }
  
  return value;
}

/**
 * Encontra o melhor comandante para jogar uma carta
 */
function findBestCommander(
  card: BotCard,
  commanders: BotCommander[]
): BotCommander | null {
  const cmdRequired = card.command_required || 0;
  
  // Filtrar comandantes com CMD suficiente (excluindo general)
  const available = commanders.filter(
    cmd => !cmd.is_general && cmd.cmd_free >= cmdRequired
  );
  
  if (available.length === 0) return null;
  
  // Ordenar por CMD disponível (usar o que tem menos para preservar recursos)
  available.sort((a, b) => a.cmd_free - b.cmd_free);
  
  return available[0];
}

/**
 * Filtra cartas jogáveis na fase atual
 */
function getPlayableCards(cards: BotCard[], phase: string): BotCard[] {
  const phaseCardType: Record<string, string> = {
    'initiative_maneuver': 'movimentacao',
    'attack_maneuver': 'ofensiva',
    'defense_maneuver': 'defensiva',
    'initiative_reaction': 'reacao',
    'attack_reaction': 'reacao',
    'defense_reaction': 'reacao',
  };
  
  const allowedType = phaseCardType[phase];
  if (!allowedType) return [];
  
  return cards.filter(card => card.card_type === allowedType);
}

// === MOTOR DE DECISÃO PRINCIPAL ===

export function makeBotDecision(
  state: BotGameState,
  difficulty: BotDifficulty
): BotDecision {
  const weights = DIFFICULTY_WEIGHTS[difficulty];
  
  // Chance de decisão aleatória (para variar comportamento)
  if (Math.random() < weights.randomFactor) {
    return makeRandomDecision(state);
  }
  
  // Decisão baseada em heurísticas
  return makeStrategicDecision(state, weights);
}

function makeRandomDecision(state: BotGameState): BotDecision {
  const playableCards = getPlayableCards(state.myHand, state.phase);
  
  if (playableCards.length === 0 || Math.random() < 0.4) {
    return { action: 'pass', reasoning: 'Decisão aleatória: passar' };
  }
  
  // Escolher carta aleatória
  const randomIndex = Math.floor(Math.random() * playableCards.length);
  const card = playableCards[randomIndex];
  const cardIndex = state.myHand.findIndex(c => c.id === card.id);
  
  // Encontrar comandante válido
  const commander = findBestCommander(card, state.myCommanders);
  if (!commander) {
    return { action: 'pass', reasoning: 'Sem comandante disponível' };
  }
  
  return {
    action: 'play_card',
    cardIndex,
    commanderId: commander.instance_id,
    reasoning: `Decisão aleatória: jogar ${card.name}`,
  };
}

function makeStrategicDecision(
  state: BotGameState,
  weights: typeof DIFFICULTY_WEIGHTS['medium']
): BotDecision {
  const playableCards = getPlayableCards(state.myHand, state.phase);
  
  if (playableCards.length === 0) {
    return { action: 'pass', reasoning: 'Sem cartas jogáveis' };
  }
  
  // Avaliar todas as cartas
  const evaluatedCards = playableCards.map(card => ({
    card,
    value: evaluateCard(card, state, state.phase),
    commander: findBestCommander(card, state.myCommanders),
  }));
  
  // Filtrar cartas com comandante disponível
  const validCards = evaluatedCards.filter(ec => ec.commander !== null);
  
  if (validCards.length === 0) {
    return { action: 'pass', reasoning: 'Nenhum comandante com CMD suficiente' };
  }
  
  // Ordenar por valor
  validCards.sort((a, b) => b.value - a.value);
  
  const bestCard = validCards[0];
  
  // Verificar se vale a pena jogar (threshold de valor)
  const normalizedValue = bestCard.value / 10; // Normalizar para 0-1
  if (normalizedValue < weights.valueThreshold) {
    // Chance de passar mesmo com carta disponível
    if (Math.random() < weights.passChance) {
      return { action: 'pass', reasoning: 'Guardando recursos' };
    }
  }
  
  const cardIndex = state.myHand.findIndex(c => c.id === bestCard.card.id);
  
  return {
    action: 'play_card',
    cardIndex,
    commanderId: bestCard.commander!.instance_id,
    reasoning: `Estratégia: jogar ${bestCard.card.name} (valor: ${bestCard.value.toFixed(1)})`,
  };
}

// === DECISÕES ESPECÍFICAS POR FASE ===

export function makeBotInitiativeDecision(
  state: BotGameState,
  difficulty: BotDifficulty
): BotDecision {
  return makeBotDecision({ ...state, phase: 'initiative_maneuver' }, difficulty);
}

export function makeBotAttackDecision(
  state: BotGameState,
  difficulty: BotDifficulty
): BotDecision {
  return makeBotDecision({ ...state, phase: 'attack_maneuver' }, difficulty);
}

export function makeBotDefenseDecision(
  state: BotGameState,
  difficulty: BotDifficulty
): BotDecision {
  return makeBotDecision({ ...state, phase: 'defense_maneuver' }, difficulty);
}

export function makeBotReactionDecision(
  state: BotGameState,
  difficulty: BotDifficulty,
  reactionPhase: 'initiative_reaction' | 'attack_reaction' | 'defense_reaction'
): BotDecision {
  const weights = DIFFICULTY_WEIGHTS[difficulty];
  
  // Fácil: frequentemente passa reações
  if (difficulty === 'easy' && Math.random() < 0.6) {
    return { action: 'pass', reasoning: 'Bot fácil: ignorando reação' };
  }
  
  // Médio: 40% chance de ignorar
  if (difficulty === 'medium' && Math.random() < 0.4) {
    return { action: 'pass', reasoning: 'Bot médio: poupando reações' };
  }
  
  return makeBotDecision({ ...state, phase: reactionPhase }, difficulty);
}

// === ESCOLHAS DE CENÁRIO ===

export function makeBotScenarioChoice(
  options: Array<{ terrain_id: string; season_id: string; draw_order: number }>,
  difficulty: BotDifficulty,
  botCulture?: string
): { terrainId: string; seasonId: string } {
  // Por enquanto, escolha simples baseada em ordem
  // Futuro: considerar afinidades culturais
  
  if (difficulty === 'easy') {
    // Escolhe aleatório
    const random = options[Math.floor(Math.random() * options.length)];
    return { terrainId: random.terrain_id, seasonId: random.season_id };
  }
  
  if (difficulty === 'medium') {
    // Escolhe o primeiro ou segundo aleatoriamente
    const index = Math.random() < 0.5 ? 0 : Math.min(1, options.length - 1);
    return { terrainId: options[index].terrain_id, seasonId: options[index].season_id };
  }
  
  // Hard: escolhe o "melhor" (primeira opção, assumindo que é a mais favorável)
  return { terrainId: options[0].terrain_id, seasonId: options[0].season_id };
}

// === ESCOLHA DE CULTURA ===

const BOT_CULTURES = ['Anuire', 'Khinasi', 'Vos', 'Rjurik', 'Brecht'];

export function makeBotCultureChoice(difficulty: BotDifficulty): string {
  // Fácil: cultura aleatória
  // Médio/Difícil: preferência por culturas "fortes" (pode ser customizado)
  
  if (difficulty === 'easy') {
    return BOT_CULTURES[Math.floor(Math.random() * BOT_CULTURES.length)];
  }
  
  // Médio e Difícil: preferir Anuire ou Khinasi (consideradas balanceadas)
  const preferred = ['Anuire', 'Khinasi', 'Vos'];
  return preferred[Math.floor(Math.random() * preferred.length)];
}

// === BID DE LOGÍSTICA ===

export function makeBotLogisticsBid(
  difficulty: BotDifficulty,
  maxBid: number = 10
): number {
  if (difficulty === 'easy') {
    // Bid baixo
    return Math.floor(Math.random() * 3) + 1;
  }
  
  if (difficulty === 'medium') {
    // Bid médio
    return Math.floor(Math.random() * 5) + 3;
  }
  
  // Hard: bid alto para ganhar cenário
  return Math.floor(Math.random() * 3) + (maxBid - 2);
}

// === UTILS ===

export function getBotName(difficulty: BotDifficulty): string {
  const names: Record<BotDifficulty, string[]> = {
    easy: ['Recruta', 'Aprendiz', 'Novato'],
    medium: ['Capitão', 'Veterano', 'Tático'],
    hard: ['General', 'Estrategista', 'Mestre de Guerra'],
  };
  
  const list = names[difficulty];
  return list[Math.floor(Math.random() * list.length)];
}

export function getBotDelayMs(difficulty: BotDifficulty): number {
  // Delay para simular "pensamento" do bot
  return {
    easy: 200 + Math.random() * 200,      // 0.2-0.4s
    medium: 300 + Math.random() * 300,    // 0.3-0.6s
    hard: 400 + Math.random() * 400,      // 0.4-0.8s
  }[difficulty];
}
