// ========================
// MASS COMBAT BOT ENGINE
// IA para modo Single Player
// Fase 1: MVP com decisões simples
// ========================

import type { BotDifficulty } from './botEngine';
import type {
  SPPlayerState,
  SPTacticalCard,
  SPCommander,
  SPScenarioOption,
  ArmyAttributes,
  SPPlayerDeck,
  CombatSubPhase,
} from '@/types/singleplayer-mass-combat';

// ========================
// CONSTANTES
// ========================

const CULTURES = ['anuire', 'khinasi', 'vos', 'brecht', 'rjurik'];

const BOT_NAMES: Record<BotDifficulty, string[]> = {
  easy: ['Recruta Amaldiçoado', 'Aprendiz de Bruxo', 'Soldado Noviço'],
  medium: ['Capitão da Sombra', 'Cavaleiro das Brumas', 'Tático Sombrio'],
  hard: ['General das Trevas', 'Lorde da Guerra', 'Mestre Estrategista'],
};

const DIFFICULTY_CONFIG = {
  easy: {
    randomFactor: 0.7,
    passChance: 0.4,
    bidMultiplier: 0.3,
    attributeSpread: 'random',
    reactionChance: 0.3,
    thinkingDelayMs: { min: 500, max: 1000 },
  },
  medium: {
    randomFactor: 0.4,
    passChance: 0.2,
    bidMultiplier: 0.5,
    attributeSpread: 'balanced',
    reactionChance: 0.5,
    thinkingDelayMs: { min: 800, max: 1500 },
  },
  hard: {
    randomFactor: 0.1,
    passChance: 0.05,
    bidMultiplier: 0.8,
    attributeSpread: 'optimized',
    reactionChance: 0.8,
    thinkingDelayMs: { min: 1000, max: 2000 },
  },
};

// ========================
// UTILIDADES
// ========================

export function getBotName(difficulty: BotDifficulty): string {
  const names = BOT_NAMES[difficulty];
  return names[Math.floor(Math.random() * names.length)];
}

export function getBotThinkingDelay(difficulty: BotDifficulty): number {
  const config = DIFFICULTY_CONFIG[difficulty];
  return config.thinkingDelayMs.min + 
    Math.random() * (config.thinkingDelayMs.max - config.thinkingDelayMs.min);
}

// ========================
// ESCOLHA DE CULTURA
// ========================

export function chooseBotCulture(difficulty: BotDifficulty): string {
  const config = DIFFICULTY_CONFIG[difficulty];
  
  // Fácil: totalmente aleatório
  if (Math.random() < config.randomFactor) {
    return CULTURES[Math.floor(Math.random() * CULTURES.length)];
  }
  
  // Médio/Difícil: preferir culturas mais "fortes"
  const preferred = ['anuire', 'khinasi', 'vos'];
  return preferred[Math.floor(Math.random() * preferred.length)];
}

// ========================
// SELEÇÃO DE CENÁRIO
// ========================

export interface BotScenarioChoice {
  terrainId: string;
  seasonId: string;
  logisticsBid: number;
}

export function chooseBotScenario(
  terrains: SPScenarioOption[],
  seasons: SPScenarioOption[],
  difficulty: BotDifficulty,
  maxBid: number = 10
): BotScenarioChoice {
  const config = DIFFICULTY_CONFIG[difficulty];
  
  // Escolher terreno
  let terrainId: string;
  if (Math.random() < config.randomFactor) {
    // Aleatório
    terrainId = terrains[Math.floor(Math.random() * terrains.length)].id;
  } else {
    // Preferir primeira opção (assumindo melhor posição)
    terrainId = terrains[0].id;
  }
  
  // Escolher estação
  let seasonId: string;
  if (Math.random() < config.randomFactor) {
    seasonId = seasons[Math.floor(Math.random() * seasons.length)].id;
  } else {
    seasonId = seasons[0].id;
  }
  
  // Calcular bid
  const baseBid = Math.floor(maxBid * config.bidMultiplier);
  const variance = Math.floor(Math.random() * 3) - 1; // -1, 0, ou +1
  const logisticsBid = Math.max(1, Math.min(maxBid, baseBid + variance));
  
  return { terrainId, seasonId, logisticsBid };
}

// ========================
// CONSTRUÇÃO DE DECK
// ========================

export interface BotDeckBuild {
  attributes: ArmyAttributes;
  commanders: SPCommander[];
  generalId: string;
  deck: SPPlayerDeck;
  vetSpent: number;
}

export function buildBotDeck(
  difficulty: BotDifficulty,
  vetBudget: number,
  availableCards: SPTacticalCard[],
  commanderTemplates: Array<{
    id: string;
    numero: number;
    especializacao: string;
    comando: number;
    estrategia: number;
    guarda: number;
    custo_vet: number;
  }>
): BotDeckBuild {
  const config = DIFFICULTY_CONFIG[difficulty];
  let vetRemaining = vetBudget;
  
  // 1. ATRIBUTOS
  let attributes: ArmyAttributes;
  
  if (config.attributeSpread === 'random') {
    // Distribuição aleatória
    const totalPoints = Math.floor(Math.random() * 8) + 3; // 3-10 pontos
    attributes = {
      attack: Math.floor(Math.random() * Math.min(totalPoints, 5)) + 1,
      defense: Math.floor(Math.random() * Math.min(totalPoints, 5)) + 1,
      mobility: Math.floor(Math.random() * Math.min(totalPoints, 5)) + 1,
    };
  } else if (config.attributeSpread === 'balanced') {
    // Distribuição balanceada
    attributes = { attack: 3, defense: 3, mobility: 2 };
  } else {
    // Otimizado (mais ataque)
    attributes = { attack: 4, defense: 3, mobility: 3 };
  }
  
  const attributesCost = (attributes.attack + attributes.defense + attributes.mobility) * 5;
  vetRemaining -= attributesCost;
  
  // 2. COMANDANTES
  const commanders: SPCommander[] = [];
  const sortedTemplates = [...commanderTemplates].sort((a, b) => a.custo_vet - b.custo_vet);
  
  // Adicionar 2-4 comandantes baseado na dificuldade
  const targetCommanderCount = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
  
  for (let i = 0; i < targetCommanderCount && sortedTemplates.length > 0; i++) {
    // Escolher um template aleatório dos mais baratos
    const candidates = sortedTemplates.slice(0, Math.min(5, sortedTemplates.length));
    const template = candidates[Math.floor(Math.random() * candidates.length)];
    
    if (template.custo_vet <= vetRemaining) {
      commanders.push({
        instance_id: `bot_cmd_${i}_${Date.now()}`,
        template_id: template.id,
        numero: template.numero,
        especializacao: template.especializacao,
        comando_base: template.comando,
        cmd_free: template.comando,
        estrategia: template.estrategia,
        guarda_max: template.guarda,
        guarda_current: template.guarda,
        is_general: i === 0, // Primeiro é o general
        custo_vet: template.custo_vet,
      });
      vetRemaining -= template.custo_vet;
      
      // Remover template usado
      const idx = sortedTemplates.findIndex(t => t.id === template.id);
      if (idx > -1) sortedTemplates.splice(idx, 1);
    }
  }
  
  const generalId = commanders[0]?.instance_id || '';
  
  // 3. DECK DE CARTAS
  const deck: SPPlayerDeck = {
    offensive: [],
    defensive: [],
    initiative: [],
    reactions: [],
  };
  
  // Filtrar cartas por tipo
  const offensiveCards = availableCards.filter(c => 
    c.card_type === 'ofensiva' && (c.vet_cost || 0) <= vetRemaining
  );
  const defensiveCards = availableCards.filter(c => 
    c.card_type === 'defensiva' && (c.vet_cost || 0) <= vetRemaining
  );
  const initiativeCards = availableCards.filter(c => 
    c.card_type === 'movimentacao' && (c.vet_cost || 0) <= vetRemaining
  );
  const reactionCards = availableCards.filter(c => 
    c.card_type === 'reacao' && (c.vet_cost || 0) <= vetRemaining
  );
  
  // Adicionar cartas respeitando limites de atributos
  const addCards = (
    source: SPTacticalCard[], 
    target: SPTacticalCard[], 
    limit: number
  ) => {
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    for (const card of shuffled) {
      if (target.length >= limit) break;
      if ((card.vet_cost || 0) <= vetRemaining) {
        target.push(card);
        vetRemaining -= card.vet_cost || 0;
      }
    }
  };
  
  addCards(offensiveCards, deck.offensive, attributes.attack);
  addCards(defensiveCards, deck.defensive, attributes.defense);
  addCards(initiativeCards, deck.initiative, attributes.mobility);
  addCards(reactionCards, deck.reactions, attributes.mobility * 2);
  
  return {
    attributes,
    commanders,
    generalId,
    deck,
    vetSpent: vetBudget - vetRemaining,
  };
}

// ========================
// DECISÕES DE COMBATE
// ========================

export interface BotCombatDecision {
  action: 'play_card' | 'pass';
  card?: SPTacticalCard;
  commanderId?: string;
  reasoning?: string;
}

export function makeBotCombatDecision(
  botState: SPPlayerState,
  phase: CombatSubPhase,
  difficulty: BotDifficulty,
  opponentHp: number
): BotCombatDecision {
  const config = DIFFICULTY_CONFIG[difficulty];
  
  // Verificar se deve passar
  if (Math.random() < config.passChance) {
    return { action: 'pass', reasoning: 'Bot decidiu passar' };
  }
  
  // Obter cartas jogáveis para esta fase
  const playableCards = getPlayableCardsForPhase(botState.hand, phase);
  
  if (playableCards.length === 0) {
    return { action: 'pass', reasoning: 'Sem cartas jogáveis' };
  }
  
  // Encontrar comandante com CMD disponível
  const availableCommander = findAvailableCommander(botState.commanders, playableCards[0]);
  
  if (!availableCommander) {
    return { action: 'pass', reasoning: 'Sem comandante com CMD disponível' };
  }
  
  // Escolher carta
  let selectedCard: SPTacticalCard;
  
  if (Math.random() < config.randomFactor) {
    // Escolha aleatória
    selectedCard = playableCards[Math.floor(Math.random() * playableCards.length)];
  } else {
    // Escolha estratégica simples (maior bônus total)
    selectedCard = playableCards.reduce((best, card) => {
      const cardValue = evaluateCard(card, phase, opponentHp, botState.hp);
      const bestValue = evaluateCard(best, phase, opponentHp, botState.hp);
      return cardValue > bestValue ? card : best;
    }, playableCards[0]);
  }
  
  return {
    action: 'play_card',
    card: selectedCard,
    commanderId: availableCommander.instance_id,
    reasoning: `Jogando ${selectedCard.name}`,
  };
}

function getPlayableCardsForPhase(hand: SPTacticalCard[], phase: CombatSubPhase): SPTacticalCard[] {
  const phaseToCardType: Record<CombatSubPhase, string> = {
    'initiative_maneuver': 'movimentacao',
    'initiative_reaction': 'reacao',
    'attack_maneuver': 'ofensiva',
    'attack_reaction': 'reacao',
    'defense_maneuver': 'defensiva',
    'defense_reaction': 'reacao',
    'resolution': '',
  };
  
  const requiredType = phaseToCardType[phase];
  if (!requiredType) return [];
  
  return hand.filter(card => card.card_type === requiredType);
}

function findAvailableCommander(
  commanders: SPCommander[],
  card: SPTacticalCard
): SPCommander | null {
  const cmdRequired = card.command_required || 0;
  
  // Encontrar comandante com CMD suficiente (excluindo general para cartas normais)
  const available = commanders.filter(
    cmd => !cmd.is_general && cmd.cmd_free >= cmdRequired
  );
  
  if (available.length === 0) {
    // Tentar usar o general como último recurso
    const general = commanders.find(cmd => cmd.is_general && cmd.cmd_free >= cmdRequired);
    return general || null;
  }
  
  // Usar o que tem menos CMD para preservar recursos
  return available.reduce((min, cmd) => 
    cmd.cmd_free < min.cmd_free ? cmd : min
  , available[0]);
}

function evaluateCard(
  card: SPTacticalCard,
  phase: CombatSubPhase,
  opponentHp: number,
  myHp: number
): number {
  let value = 0;
  
  // Valor base dos bônus
  value += (card.attack_bonus || 0) * 1.5;
  value += (card.defense_bonus || 0) * 1.2;
  value += (card.mobility_bonus || 0) * 1.0;
  
  // Penalidade por custo de comando
  value -= (card.command_required || 0) * 0.5;
  
  // Ajustes contextuais
  if (myHp < 30) {
    // Baixa vida: priorizar defesa
    if (card.card_type === 'defensiva') value *= 1.5;
  }
  
  if (opponentHp < 30) {
    // Oponente com baixa vida: priorizar ataque
    if (card.card_type === 'ofensiva') value *= 1.5;
  }
  
  return value;
}

// ========================
// REAÇÕES
// ========================

export function shouldBotReact(
  botState: SPPlayerState,
  phase: CombatSubPhase,
  difficulty: BotDifficulty
): BotCombatDecision {
  const config = DIFFICULTY_CONFIG[difficulty];
  
  // Verificar chance de reagir baseado na dificuldade
  if (Math.random() > config.reactionChance) {
    return { action: 'pass', reasoning: 'Bot decidiu não reagir' };
  }
  
  // Verificar se tem cartas de reação
  const reactionCards = botState.hand.filter(c => c.card_type === 'reacao');
  
  if (reactionCards.length === 0) {
    return { action: 'pass', reasoning: 'Sem cartas de reação' };
  }
  
  // Encontrar comandante
  const card = reactionCards[Math.floor(Math.random() * reactionCards.length)];
  const commander = findAvailableCommander(botState.commanders, card);
  
  if (!commander) {
    return { action: 'pass', reasoning: 'Sem CMD para reação' };
  }
  
  return {
    action: 'play_card',
    card,
    commanderId: commander.instance_id,
    reasoning: `Reagindo com ${card.name}`,
  };
}

// ========================
// FORMAÇÃO DE DEPLOYMENT
// ========================

export type DeploymentFormation = 'aggressive' | 'balanced' | 'defensive';

export function chooseBotFormation(difficulty: BotDifficulty): DeploymentFormation {
  const config = DIFFICULTY_CONFIG[difficulty];
  
  if (Math.random() < config.randomFactor) {
    const formations: DeploymentFormation[] = ['aggressive', 'balanced', 'defensive'];
    return formations[Math.floor(Math.random() * formations.length)];
  }
  
  // Estratégia básica por dificuldade
  if (difficulty === 'easy') return 'balanced';
  if (difficulty === 'medium') return Math.random() < 0.5 ? 'balanced' : 'aggressive';
  return 'aggressive'; // Hard: mais agressivo
}

// ========================
// INICIALIZAÇÃO DO BOT
// ========================

export function createInitialBotState(
  difficulty: BotDifficulty,
  vetBudget: number
): SPPlayerState {
  return {
    isBot: true,
    nickname: getBotName(difficulty),
    difficulty,
    
    culture: null,
    cultureConfirmed: false,
    
    logisticsBid: 0,
    logisticsConfirmed: false,
    
    attributes: { attack: 0, defense: 0, mobility: 0 },
    commanders: [],
    generalId: null,
    deck: { offensive: [], defensive: [], initiative: [], reactions: [] },
    deckConfirmed: false,
    
    hp: 0,
    hand: [],
    discardPile: [],
    drawPile: [],
    
    roundCardsPlayed: [],
    cmdSpentThisRound: 0,
  };
}
