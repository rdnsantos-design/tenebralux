/**
 * Sistema de IA para Combate Tático
 * 
 * Decide ações de inimigos baseado em comportamento e estado da batalha
 */

import { 
  Combatant, 
  CombatCard, 
  BattleState, 
  HexCoord,
  EnemyBehavior,
  CoverType
} from '@/types/tactical-combat';
import { getCardById, getBasicCards } from '@/data/combat/cards';
import { getPostureById } from '@/data/combat/postures';

export interface AIDecision {
  card: CombatCard;
  targetIds: string[];
  movement?: HexCoord[];
  shouldFlee: boolean;
}

/**
 * Decide a próxima ação de um inimigo
 */
export function decideEnemyAction(
  enemy: Combatant,
  state: BattleState
): AIDecision | null {
  const players = state.combatants.filter(c => c.team === 'player' && !c.stats.isDown);
  if (players.length === 0) return null;
  
  const behavior = enemy.behavior || getDefaultBehavior();
  
  // Verificar fuga
  const hpRatio = enemy.stats.vitality / enemy.stats.maxVitality;
  if (behavior.fleeThreshold > 0 && hpRatio <= behavior.fleeThreshold) {
    return {
      card: getFleeCard(),
      targetIds: [],
      shouldFlee: true
    };
  }
  
  // Selecionar alvo baseado em prioridade
  const target = selectTarget(enemy, players, behavior);
  
  // Calcular distância (simplificado sem mapa hex)
  const distance = estimateDistance(enemy, target);
  
  // Decidir carta baseado em situação
  const card = selectCard(enemy, target, distance, behavior);
  
  return {
    card,
    targetIds: [target.id],
    shouldFlee: false
  };
}

/**
 * Seleciona alvo baseado na prioridade do comportamento
 */
function selectTarget(
  enemy: Combatant,
  players: Combatant[],
  behavior: EnemyBehavior
): Combatant {
  switch (behavior.targetPriority) {
    case 'nearest':
      // Simplificado: menor HP pode indicar mais perto na linha de frente
      return players.reduce((a, b) => 
        a.stats.vitality < b.stats.vitality ? a : b
      );
    
    case 'weakest':
      return players.reduce((a, b) => 
        a.stats.vitality < b.stats.vitality ? a : b
      );
    
    case 'strongest':
      return players.reduce((a, b) => 
        calculateThreat(a) > calculateThreat(b) ? a : b
      );
    
    case 'random':
    default:
      return players[Math.floor(Math.random() * players.length)];
  }
}

/**
 * Calcula nível de ameaça de um combatente
 */
function calculateThreat(combatant: Combatant): number {
  const weapon = combatant.stats.weapon;
  const damage = weapon?.damage || 1;
  const health = combatant.stats.vitality + combatant.stats.evasion;
  
  return damage * 2 + health;
}

/**
 * Estima distância entre dois combatentes (simplificado)
 */
function estimateDistance(a: Combatant, b: Combatant): number {
  // Se temos posições hex, calcular distância real
  if (a.stats.position && b.stats.position) {
    return hexDistance(a.stats.position, b.stats.position);
  }
  // Caso contrário, assumir distância média
  return 5;
}

/**
 * Distância entre dois hexes (coordenadas axiais)
 */
function hexDistance(a: HexCoord, b: HexCoord): number {
  return Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.r - b.r),
    Math.abs((-a.q - a.r) - (-b.q - b.r))
  );
}

/**
 * Seleciona carta apropriada para a situação
 */
function selectCard(
  enemy: Combatant,
  target: Combatant,
  distance: number,
  behavior: EnemyBehavior
): CombatCard {
  const cards = enemy.stats.availableCards;
  const basicCards = getBasicCards();
  
  // Se agressivo e perto, usar ataque poderoso
  if (behavior.aggression === 'aggressive' && distance <= 2) {
    const powerCard = cards.find(id => id.includes('powerful') || id.includes('precise'));
    if (powerCard) {
      const card = getCardById(powerCard);
      if (card) return card;
    }
  }
  
  // Se defensivo e HP baixo, usar defesa
  if (behavior.aggression === 'passive' || enemy.stats.vitality < enemy.stats.maxVitality * 0.3) {
    const defenseCard = basicCards.find(c => c.id === 'total_defense');
    if (defenseCard) return defenseCard;
  }
  
  // Se ranged e longe, usar tiro preciso
  if (behavior.preferredRange === 'ranged' && distance > 5) {
    const rangedCard = cards.find(id => id.includes('shot') || id.includes('tiro'));
    if (rangedCard) {
      const card = getCardById(rangedCard);
      if (card) return card;
    }
  }
  
  // Se melee e precisa se aproximar, usar ataque rápido
  if (behavior.preferredRange === 'melee' && distance > 2) {
    const quickCard = basicCards.find(c => c.id === 'quick_attack');
    if (quickCard) return quickCard;
  }
  
  // Default: ataque padrão
  const standardAttack = basicCards.find(c => c.id === 'standard_attack');
  return standardAttack || basicCards[0];
}

/**
 * Comportamento padrão se não definido
 */
function getDefaultBehavior(): EnemyBehavior {
  return {
    aggression: 'balanced',
    targetPriority: 'nearest',
    fleeThreshold: 0.1,
    preferredRange: 'any',
    usesPostures: false,
    usesCover: false
  };
}

/**
 * Carta fictícia para fuga
 */
function getFleeCard(): CombatCard {
  return {
    id: 'action_flee',
    name: { akashic: 'Fugir', tenebralux: 'Fugir' },
    type: 'basic',
    speedModifier: 0,
    attackModifier: 0,
    movementModifier: 10,
    effect: 'Foge do combate',
    description: {
      akashic: 'Foge da batalha.',
      tenebralux: 'Foge da batalha.'
    }
  };
}

/**
 * Decide se deve usar cobertura
 */
export function shouldSeekCover(
  enemy: Combatant,
  state: BattleState
): boolean {
  const behavior = enemy.behavior;
  if (!behavior?.usesCover) return false;
  
  // Buscar cobertura se HP baixo
  const hpRatio = enemy.stats.vitality / enemy.stats.maxVitality;
  if (hpRatio < 0.5) return true;
  
  // Ranged preferem cobertura
  if (behavior.preferredRange === 'ranged') return true;
  
  return false;
}

/**
 * Decide postura apropriada
 */
export function selectPosture(
  enemy: Combatant,
  state: BattleState
): string | null {
  const behavior = enemy.behavior;
  if (!behavior?.usesPostures) return null;
  
  const hpRatio = enemy.stats.vitality / enemy.stats.maxVitality;
  
  // Se HP baixo, usar guarda alta
  if (hpRatio < 0.3) {
    return 'posture_high_guard';
  }
  
  // Se agressivo e HP ok, usar postura agressiva
  if (behavior.aggression === 'aggressive' && hpRatio > 0.5) {
    return 'posture_aggressive';
  }
  
  // Se usa cobertura e está em desvantagem, usar cobertura
  if (behavior.usesCover && hpRatio < 0.6) {
    return 'posture_cover';
  }
  
  return null;
}
