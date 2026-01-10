/**
 * Tactical Hex Bot Engine
 * IA para jogar o jogo tático hexagonal contra o jogador
 */

import { 
  TacticalGameState, 
  BattleUnit, 
  HexCoord, 
  GamePhase,
  PlayerId,
  HexDirection,
} from '@/types/tactical-game';
import { hexDistance, getNeighbors, hexKey, isValidHex } from '@/lib/hexUtils';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

interface BotAction {
  type: 'move' | 'attack' | 'pass' | 'end_phase';
  unitId?: string;
  targetHex?: HexCoord;
  targetUnitId?: string;
  reason: string;
}

// Configurações por dificuldade
const DIFFICULTY_CONFIG: Record<BotDifficulty, {
  thinkingDelayMs: [number, number]; // min, max
  considerFlanking: boolean;
  preferHighValue: boolean;
  protectWeakUnits: boolean;
  aggressiveness: number; // 0-1, higher = more aggressive
  randomFactor: number; // 0-1, higher = more random decisions
}> = {
  easy: {
    thinkingDelayMs: [500, 1000],
    considerFlanking: false,
    preferHighValue: false,
    protectWeakUnits: false,
    aggressiveness: 0.3,
    randomFactor: 0.4,
  },
  medium: {
    thinkingDelayMs: [800, 1500],
    considerFlanking: true,
    preferHighValue: true,
    protectWeakUnits: false,
    aggressiveness: 0.5,
    randomFactor: 0.2,
  },
  hard: {
    thinkingDelayMs: [1000, 2000],
    considerFlanking: true,
    preferHighValue: true,
    protectWeakUnits: true,
    aggressiveness: 0.7,
    randomFactor: 0.1,
  },
};

/**
 * Retorna delay de "pensamento" do bot
 */
export function getBotThinkingDelay(difficulty: BotDifficulty): number {
  const [min, max] = DIFFICULTY_CONFIG[difficulty].thinkingDelayMs;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Decide a melhor ação para o bot na fase atual
 */
export function decideBotAction(
  state: TacticalGameState,
  botPlayerId: PlayerId,
  difficulty: BotDifficulty
): BotAction {
  const config = DIFFICULTY_CONFIG[difficulty];
  
  // Pegar unidades do bot que podem agir
  const botUnits = Object.values(state.units).filter(
    u => u.owner === botPlayerId && !u.isRouting
  );
  
  const activeUnits = botUnits.filter(u => !u.hasActedThisTurn);
  
  // Se não tem unidades para agir, passar fase
  if (activeUnits.length === 0) {
    return { type: 'end_phase', reason: 'Sem unidades disponíveis' };
  }
  
  // Random factor - às vezes toma decisões subótimas
  if (Math.random() < config.randomFactor) {
    const randomUnit = activeUnits[Math.floor(Math.random() * activeUnits.length)];
    return decideRandomAction(randomUnit, state, botPlayerId);
  }
  
  switch (state.phase) {
    case 'movement':
      return decideMoveAction(activeUnits, state, botPlayerId, config);
    case 'shooting':
      return decideShootAction(activeUnits, state, botPlayerId, config);
    case 'melee':
      return decideMeleeAction(activeUnits, state, botPlayerId, config);
    default:
      return { type: 'end_phase', reason: `Fase ${state.phase} não requer ação` };
  }
}

/**
 * Decide movimento para uma unidade
 */
function decideMoveAction(
  units: BattleUnit[],
  state: TacticalGameState,
  botPlayerId: PlayerId,
  config: typeof DIFFICULTY_CONFIG['medium']
): BotAction {
  const enemyUnits = Object.values(state.units).filter(
    u => u.owner !== botPlayerId && !u.isRouting
  );
  
  if (enemyUnits.length === 0) {
    return { type: 'end_phase', reason: 'Sem inimigos' };
  }
  
  // Avaliar cada unidade e escolher a melhor ação
  let bestAction: BotAction = { type: 'end_phase', reason: 'Nenhuma ação boa' };
  let bestScore = -Infinity;
  
  for (const unit of units) {
    const validMoves = calculateValidMoves(unit, state);
    
    // Encontrar inimigo mais próximo
    const nearestEnemy = findNearestEnemy(unit, enemyUnits);
    if (!nearestEnemy) continue;
    
    for (const move of validMoves) {
      const score = evaluateMovePosition(
        unit, 
        move, 
        nearestEnemy, 
        enemyUnits, 
        state, 
        config
      );
      
      if (score > bestScore) {
        bestScore = score;
        bestAction = {
          type: 'move',
          unitId: unit.id,
          targetHex: move,
          reason: `Mover ${unit.name} para posição tática`,
        };
      }
    }
  }
  
  return bestAction;
}

/**
 * Decide ataque à distância
 */
function decideShootAction(
  units: BattleUnit[],
  state: TacticalGameState,
  botPlayerId: PlayerId,
  config: typeof DIFFICULTY_CONFIG['medium']
): BotAction {
  const shooters = units.filter(u => u.currentRanged > 0);
  
  if (shooters.length === 0) {
    return { type: 'end_phase', reason: 'Sem unidades de tiro' };
  }
  
  const enemyUnits = Object.values(state.units).filter(
    u => u.owner !== botPlayerId && !u.isRouting
  );
  
  let bestAction: BotAction = { type: 'end_phase', reason: 'Sem alvos válidos' };
  let bestScore = -Infinity;
  
  for (const shooter of shooters) {
    const targets = getValidShootingTargets(shooter, state, botPlayerId);
    
    for (const targetId of targets) {
      const target = state.units[targetId];
      if (!target) continue;
      
      const score = evaluateShootTarget(shooter, target, config);
      
      if (score > bestScore) {
        bestScore = score;
        bestAction = {
          type: 'attack',
          unitId: shooter.id,
          targetUnitId: targetId,
          reason: `${shooter.name} atira em ${target.name}`,
        };
      }
    }
  }
  
  return bestAction;
}

/**
 * Decide ataque corpo a corpo
 */
function decideMeleeAction(
  units: BattleUnit[],
  state: TacticalGameState,
  botPlayerId: PlayerId,
  config: typeof DIFFICULTY_CONFIG['medium']
): BotAction {
  let bestAction: BotAction = { type: 'end_phase', reason: 'Sem alvos de melee' };
  let bestScore = -Infinity;
  
  for (const unit of units) {
    const targets = getValidMeleeTargets(unit, state, botPlayerId);
    
    for (const targetId of targets) {
      const target = state.units[targetId];
      if (!target) continue;
      
      const score = evaluateMeleeTarget(unit, target, state, config);
      
      if (score > bestScore) {
        bestScore = score;
        bestAction = {
          type: 'attack',
          unitId: unit.id,
          targetUnitId: targetId,
          reason: `${unit.name} ataca ${target.name}`,
        };
      }
    }
  }
  
  return bestAction;
}

/**
 * Ação aleatória (para dificuldade fácil)
 */
function decideRandomAction(
  unit: BattleUnit,
  state: TacticalGameState,
  botPlayerId: PlayerId
): BotAction {
  const validMoves = calculateValidMoves(unit, state);
  
  if (validMoves.length > 0 && state.phase === 'movement') {
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    return {
      type: 'move',
      unitId: unit.id,
      targetHex: randomMove,
      reason: 'Movimento aleatório',
    };
  }
  
  return { type: 'pass', reason: 'Passar' };
}

// ========== FUNÇÕES AUXILIARES ==========

function calculateValidMoves(unit: BattleUnit, state: TacticalGameState): HexCoord[] {
  const validMoves: HexCoord[] = [];
  const movement = unit.currentMovement;
  
  // BFS para encontrar hexes alcançáveis
  const visited = new Set<string>();
  const queue: { coord: HexCoord; steps: number }[] = [{ coord: unit.position, steps: 0 }];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = hexKey(current.coord);
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (current.steps > 0 && current.steps <= movement) {
      // Verificar se hex está vazio
      const hex = state.hexes[key];
      if (!hex?.unitId) {
        validMoves.push(current.coord);
      }
    }
    
    if (current.steps < movement) {
      const neighbors = getNeighbors(current.coord);
      for (const neighbor of neighbors) {
        if (isValidHex(neighbor.q, neighbor.r) && !visited.has(hexKey(neighbor))) {
          queue.push({ coord: neighbor, steps: current.steps + 1 });
        }
      }
    }
  }
  
  return validMoves;
}

function findNearestEnemy(unit: BattleUnit, enemies: BattleUnit[]): BattleUnit | null {
  let nearest: BattleUnit | null = null;
  let minDist = Infinity;
  
  for (const enemy of enemies) {
    const dist = hexDistance(unit.position, enemy.position);
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }
  
  return nearest;
}

function evaluateMovePosition(
  unit: BattleUnit,
  move: HexCoord,
  nearestEnemy: BattleUnit,
  allEnemies: BattleUnit[],
  state: TacticalGameState,
  config: typeof DIFFICULTY_CONFIG['medium']
): number {
  let score = 0;
  
  const distToEnemy = hexDistance(move, nearestEnemy.position);
  
  // Unidades de melee querem ficar perto
  if (unit.unitType === 'Infantaria' || unit.unitType === 'Cavalaria') {
    score -= distToEnemy * 10; // Quanto mais perto, melhor
    
    // Bônus por ficar adjacente (pode atacar)
    if (distToEnemy === 1) {
      score += 50 * config.aggressiveness;
    }
  }
  
  // Unidades de ranged querem distância ideal (3-6 hexes)
  if (unit.unitType === 'Arqueiros') {
    if (distToEnemy >= 3 && distToEnemy <= 6) {
      score += 30;
    } else if (distToEnemy < 3) {
      score -= 20; // Muito perto, perigoso
    }
  }
  
  // Considerar flanqueamento
  if (config.considerFlanking) {
    const flankBonus = evaluateFlankingPosition(move, nearestEnemy, allEnemies);
    score += flankBonus * 20;
  }
  
  // Terreno defensivo
  const hex = state.hexes[hexKey(move)];
  if (hex?.terrain === 'forest' || hex?.terrain === 'hill') {
    score += 10;
  }
  
  return score;
}

function evaluateFlankingPosition(
  position: HexCoord,
  target: BattleUnit,
  allEnemies: BattleUnit[]
): number {
  // Simplificado: verifica se há aliados do outro lado do alvo
  const neighbors = getNeighbors(target.position);
  const myNeighborIndex = neighbors.findIndex(
    n => n.q === position.q && n.r === position.r
  );
  
  if (myNeighborIndex === -1) return 0;
  
  // Verificar hex oposto
  const oppositeIndex = (myNeighborIndex + 3) % 6;
  // Se tiver aliado no lado oposto, é flanco
  return 0.5; // Bônus parcial
}

function getValidShootingTargets(
  shooter: BattleUnit,
  state: TacticalGameState,
  botPlayerId: PlayerId
): string[] {
  const targets: string[] = [];
  const range = 6; // Range padrão
  
  for (const [unitId, unit] of Object.entries(state.units)) {
    if (unit.owner === botPlayerId) continue;
    if (unit.isRouting) continue;
    
    const dist = hexDistance(shooter.position, unit.position);
    if (dist <= range && dist > 1) {
      targets.push(unitId);
    }
  }
  
  return targets;
}

function getValidMeleeTargets(
  unit: BattleUnit,
  state: TacticalGameState,
  botPlayerId: PlayerId
): string[] {
  const targets: string[] = [];
  const neighbors = getNeighbors(unit.position);
  
  for (const neighbor of neighbors) {
    const key = hexKey(neighbor);
    const hex = state.hexes[key];
    
    if (hex?.unitId) {
      const target = state.units[hex.unitId];
      if (target && target.owner !== botPlayerId && !target.isRouting) {
        targets.push(hex.unitId);
      }
    }
  }
  
  return targets;
}

function evaluateShootTarget(
  shooter: BattleUnit,
  target: BattleUnit,
  config: typeof DIFFICULTY_CONFIG['medium']
): number {
  let score = 0;
  
  // Preferir alvos com pouca vida
  const healthRatio = target.currentHealth / target.maxHealth;
  score += (1 - healthRatio) * 30;
  
  // Preferir alvos com muita pressão (perto de routing)
  const pressureRatio = target.currentPressure / target.maxPressure;
  score += pressureRatio * 40;
  
  // Preferir unidades de alto valor
  if (config.preferHighValue) {
    if (target.unitType === 'Cavalaria') score += 20;
    if (target.unitType === 'Arqueiros') score += 15;
  }
  
  return score;
}

function evaluateMeleeTarget(
  attacker: BattleUnit,
  target: BattleUnit,
  state: TacticalGameState,
  config: typeof DIFFICULTY_CONFIG['medium']
): number {
  let score = 0;
  
  // Preferir alvos fracos
  const healthRatio = target.currentHealth / target.maxHealth;
  score += (1 - healthRatio) * 40;
  
  // Preferir alvos com pressão alta
  const pressureRatio = target.currentPressure / target.maxPressure;
  score += pressureRatio * 50;
  
  // Considerar vantagem de tipo
  if (attacker.unitType === 'Cavalaria' && target.unitType === 'Arqueiros') {
    score += 30; // Cavalaria é boa contra arqueiros
  }
  if (attacker.unitType === 'Infantaria' && target.unitType === 'Cavalaria') {
    score += 15; // Infantaria pode enfrentar cavalaria
  }
  
  // Penalizar atacar unidades muito fortes se estamos fracos
  if (config.protectWeakUnits) {
    const myHealthRatio = attacker.currentHealth / attacker.maxHealth;
    if (myHealthRatio < 0.3 && healthRatio > 0.7) {
      score -= 30;
    }
  }
  
  return score;
}

/**
 * Escolhe um nome para o bot baseado na dificuldade
 */
export function getBotName(difficulty: BotDifficulty): string {
  const names: Record<BotDifficulty, string[]> = {
    easy: ['Recruta Silva', 'Novato João', 'Aprendiz Pedro'],
    medium: ['Capitão Marcos', 'Comandante Ana', 'Estrategista Lucas'],
    hard: ['General Victus', 'Marechal Nero', 'Lorde Tiberius'],
  };
  
  const list = names[difficulty];
  return list[Math.floor(Math.random() * list.length)];
}
