import { BattleUnit, HexCoord, TacticalGameState, HexDirection } from '@/types/tactical-game';
import { getNeighbors, hexKey, hexDistance } from '@/lib/hexUtils';

// ============================================
// TIPOS DE RESULTADO
// ============================================

export interface CombatResult {
  attackerDamage: { pressure: number; hits: number };
  defenderDamage: { pressure: number; hits: number };
  attackerRouted: boolean;
  defenderRouted: boolean;
  attackerRoutReason?: string;
  defenderRoutReason?: string;
  log: string[];
}

export interface RangedResult {
  targetPressure: number;
  friendlyFirePressure: number;
  friendlyFireUnitId: string | null;
  log: string[];
}

// ============================================
// TABELA DE PENALIDADES POR HIT
// ============================================

const HIT_PENALTIES = [
  { attack: -1, ranged: -1, defense: 0, morale: 0 },   // Hit 1
  { attack: -1, ranged: -1, defense: 0, morale: 0 },   // Hit 2
  { attack: -1, ranged: -1, defense: 0, morale: -1 },  // Hit 3
  { attack: 0, ranged: 0, defense: -1, morale: -1 },   // Hit 4
  { attack: 0, ranged: 0, defense: -1, morale: -1 },   // Hit 5
  { attack: -1, ranged: -1, defense: -1, morale: -1 }, // Hit 6
];

// ============================================
// DETERMINAR DIREÇÃO DO ATAQUE
// ============================================

export type AttackAngle = 'front' | 'flank' | 'rear';

const DIRECTION_ANGLES: Record<HexDirection, number> = {
  'N': 0,
  'NE': 60,
  'SE': 120,
  'S': 180,
  'SW': 240,
  'NW': 300,
};

export function getAttackAngle(
  attacker: BattleUnit,
  defender: BattleUnit
): AttackAngle {
  // Calcular direção do atacante para o defensor
  const dq = attacker.position.q - defender.position.q;
  const dr = attacker.position.r - defender.position.r;
  
  // Ângulo do ataque (de onde o atacante vem)
  let attackAngle = Math.atan2(dr, dq) * (180 / Math.PI);
  if (attackAngle < 0) attackAngle += 360;
  
  // Ângulo que o defensor está encarando
  const facingAngle = DIRECTION_ANGLES[defender.facing];
  
  // Diferença de ângulos
  let diff = Math.abs(attackAngle - facingAngle);
  if (diff > 180) diff = 360 - diff;
  
  // Frente: 0-60°, Flanco: 60-120°, Retaguarda: 120-180°
  if (diff <= 60) return 'front';
  if (diff <= 120) return 'flank';
  return 'rear';
}

// ============================================
// MODIFICADORES DE COMBATE
// ============================================

export function getPostureModifiers(unit: BattleUnit): { attack: number; defense: number } {
  switch (unit.posture) {
    case 'Ofensiva':
      return { attack: 2, defense: -1 };
    case 'Defensiva':
      return { attack: -1, defense: 2 };
    case 'Carga':
      return { attack: 4, defense: -2 };
    case 'Reorganização':
      return { attack: -2, defense: 0 };
    default:
      return { attack: 0, defense: 0 };
  }
}

export function getAngleModifiers(angle: AttackAngle): { attack: number; defense: number } {
  switch (angle) {
    case 'front':
      return { attack: 0, defense: 0 };
    case 'flank':
      return { attack: 2, defense: -2 };
    case 'rear':
      return { attack: 4, defense: -4 };
    default:
      return { attack: 0, defense: 0 };
  }
}

export function getExperienceModifier(experience: BattleUnit['experience']): number {
  switch (experience) {
    case 'Lendário': return 3;
    case 'Elite': return 2;
    case 'Veterano': return 1;
    case 'Profissional': return 0;
    case 'Recruta': return -1;
    case 'Amador': return -2;
    default: return 0;
  }
}

// ============================================
// CALCULAR SUPORTE (unidades adjacentes aliadas)
// ============================================

export function calculateSupport(
  unit: BattleUnit,
  gameState: TacticalGameState
): number {
  const neighbors = getNeighbors(unit.position);
  let support = 0;
  
  for (const neighbor of neighbors) {
    const key = hexKey(neighbor);
    const hex = gameState.hexes[key];
    if (hex?.unitId) {
      const adjacentUnit = gameState.units[hex.unitId];
      if (adjacentUnit && adjacentUnit.owner === unit.owner && !adjacentUnit.isRouting) {
        support++;
      }
    }
  }
  
  // Máximo de +2 de suporte
  return Math.min(support, 2);
}

// ============================================
// RESOLVER COMBATE CORPO A CORPO
// ============================================

export function resolveMeleeCombat(
  attacker: BattleUnit,
  defender: BattleUnit,
  gameState: TacticalGameState
): CombatResult {
  const log: string[] = [];
  
  // Ângulo de ataque
  const angle = getAttackAngle(attacker, defender);
  log.push(`Ângulo de ataque: ${angle}`);
  
  // Modificadores do atacante
  const attackerPosture = getPostureModifiers(attacker);
  const attackerExp = getExperienceModifier(attacker.experience);
  const attackerSupport = calculateSupport(attacker, gameState);
  const angleAttackMod = getAngleModifiers(angle).attack;
  
  const attackValue = 
    attacker.currentAttack + 
    attackerPosture.attack + 
    attackerExp + 
    attackerSupport +
    angleAttackMod;
  
  log.push(`Ataque de ${attacker.name}: ${attacker.currentAttack} base + ${attackerPosture.attack} postura + ${attackerExp} exp + ${attackerSupport} suporte + ${angleAttackMod} ângulo = ${attackValue}`);
  
  // Modificadores do defensor
  const defenderPosture = getPostureModifiers(defender);
  const defenderExp = getExperienceModifier(defender.experience);
  const defenderSupport = calculateSupport(defender, gameState);
  const angleDefenseMod = getAngleModifiers(angle).defense;
  
  const defenseValue = 
    defender.currentDefense + 
    defenderPosture.defense + 
    defenderExp + 
    defenderSupport +
    angleDefenseMod;
  
  log.push(`Defesa de ${defender.name}: ${defender.currentDefense} base + ${defenderPosture.defense} postura + ${defenderExp} exp + ${defenderSupport} suporte + ${angleDefenseMod} ângulo = ${defenseValue}`);
  
  // Rolar d20 para cada lado
  const attackRoll = Math.floor(Math.random() * 20) + 1;
  const defenseRoll = Math.floor(Math.random() * 20) + 1;
  
  const attackTotal = attackRoll + attackValue;
  const defenseTotal = defenseRoll + defenseValue;
  
  log.push(`Rolagens: Ataque ${attackRoll}+${attackValue}=${attackTotal} vs Defesa ${defenseRoll}+${defenseValue}=${defenseTotal}`);
  
  // Calcular diferença
  const difference = attackTotal - defenseTotal;
  
  const result: CombatResult = {
    attackerDamage: { pressure: 0, hits: 0 },
    defenderDamage: { pressure: 0, hits: 0 },
    attackerRouted: false,
    defenderRouted: false,
    log,
  };
  
  if (difference > 0) {
    // Atacante vence
    if (difference >= 10) {
      result.defenderDamage.hits = 1;
      result.defenderDamage.pressure = 2;
      log.push(`${attacker.name} DERROTA ESMAGADORA! ${defender.name} sofre 1 hit + 2 pressão`);
    } else if (difference >= 5) {
      result.defenderDamage.hits = 1;
      log.push(`${attacker.name} vitória! ${defender.name} sofre 1 hit`);
    } else {
      result.defenderDamage.pressure = 1;
      log.push(`${attacker.name} vitória marginal. ${defender.name} sofre 1 pressão`);
    }
  } else if (difference < 0) {
    // Defensor vence (contra-ataque)
    const absDiff = Math.abs(difference);
    if (absDiff >= 10) {
      result.attackerDamage.hits = 1;
      result.attackerDamage.pressure = 1;
      log.push(`${defender.name} CONTRA-ATAQUE DEVASTADOR! ${attacker.name} sofre 1 hit + 1 pressão`);
    } else if (absDiff >= 5) {
      result.attackerDamage.pressure = 2;
      log.push(`${defender.name} defesa forte! ${attacker.name} sofre 2 pressão`);
    } else {
      result.attackerDamage.pressure = 1;
      log.push(`${defender.name} defesa. ${attacker.name} sofre 1 pressão`);
    }
  } else {
    // Empate
    result.attackerDamage.pressure = 1;
    result.defenderDamage.pressure = 1;
    log.push('Empate! Ambos sofrem 1 pressão.');
  }
  
  // Verificar rout do defensor
  const defenderNewPressure = defender.currentPressure + result.defenderDamage.pressure;
  const defenderNewHits = defender.hitsReceived + result.defenderDamage.hits;
  
  if (defenderNewPressure >= defender.maxPressure) {
    result.defenderRouted = true;
    result.defenderRoutReason = 'Pressão máxima atingida';
    log.push(`${defender.name} ENTRA EM ROTA! (Pressão excedeu moral)`);
  } else if (defenderNewHits >= 6) {
    result.defenderRouted = true;
    result.defenderRoutReason = 'Muitos hits recebidos';
    log.push(`${defender.name} DESTRUÍDO! (6 hits)`);
  }
  
  // Verificar rout do atacante
  const attackerNewPressure = attacker.currentPressure + result.attackerDamage.pressure;
  const attackerNewHits = attacker.hitsReceived + result.attackerDamage.hits;
  
  if (attackerNewPressure >= attacker.maxPressure) {
    result.attackerRouted = true;
    result.attackerRoutReason = 'Pressão máxima atingida';
    log.push(`${attacker.name} ENTRA EM ROTA! (Pressão excedeu moral)`);
  } else if (attackerNewHits >= 6) {
    result.attackerRouted = true;
    result.attackerRoutReason = 'Muitos hits recebidos';
    log.push(`${attacker.name} DESTRUÍDO! (6 hits)`);
  }
  
  return result;
}

// ============================================
// APLICAR RESULTADO DE COMBATE
// ============================================

export function applyCombatResult(
  attacker: BattleUnit,
  defender: BattleUnit,
  result: CombatResult
): { updatedAttacker: BattleUnit; updatedDefender: BattleUnit } {
  // Aplicar dano ao atacante
  let updatedAttacker = { ...attacker };
  updatedAttacker.currentPressure += result.attackerDamage.pressure;
  updatedAttacker.hitsReceived += result.attackerDamage.hits;
  
  // Aplicar penalidades por hits
  if (result.attackerDamage.hits > 0) {
    const totalHits = updatedAttacker.hitsReceived;
    for (let i = attacker.hitsReceived; i < totalHits && i < 6; i++) {
      const penalty = HIT_PENALTIES[i];
      updatedAttacker.currentAttack = Math.max(0, updatedAttacker.currentAttack + penalty.attack);
      updatedAttacker.currentRanged = Math.max(0, updatedAttacker.currentRanged + penalty.ranged);
      updatedAttacker.currentDefense = Math.max(0, updatedAttacker.currentDefense + penalty.defense);
      updatedAttacker.currentMorale = Math.max(0, updatedAttacker.currentMorale + penalty.morale);
    }
  }
  
  if (result.attackerRouted) {
    updatedAttacker.isRouting = true;
  }
  
  // Aplicar dano ao defensor
  let updatedDefender = { ...defender };
  updatedDefender.currentPressure += result.defenderDamage.pressure;
  updatedDefender.hitsReceived += result.defenderDamage.hits;
  
  // Aplicar penalidades por hits
  if (result.defenderDamage.hits > 0) {
    const totalHits = updatedDefender.hitsReceived;
    for (let i = defender.hitsReceived; i < totalHits && i < 6; i++) {
      const penalty = HIT_PENALTIES[i];
      updatedDefender.currentAttack = Math.max(0, updatedDefender.currentAttack + penalty.attack);
      updatedDefender.currentRanged = Math.max(0, updatedDefender.currentRanged + penalty.ranged);
      updatedDefender.currentDefense = Math.max(0, updatedDefender.currentDefense + penalty.defense);
      updatedDefender.currentMorale = Math.max(0, updatedDefender.currentMorale + penalty.morale);
    }
  }
  
  if (result.defenderRouted) {
    updatedDefender.isRouting = true;
  }
  
  return { updatedAttacker, updatedDefender };
}

// ============================================
// RESOLVER COMBATE À DISTÂNCIA
// ============================================

export function resolveRangedCombat(
  shooter: BattleUnit,
  target: BattleUnit,
  gameState: TacticalGameState
): RangedResult {
  const log: string[] = [];
  const result: RangedResult = {
    targetPressure: 0,
    friendlyFirePressure: 0,
    friendlyFireUnitId: null,
    log,
  };
  
  if (shooter.currentRanged <= 0) {
    log.push(`${shooter.name} não tem capacidade de tiro`);
    return result;
  }
  
  const distance = hexDistance(shooter.position, target.position);
  log.push(`Distância: ${distance} hexes`);
  
  // Penalidade por distância
  let distancePenalty = 0;
  if (distance > 12) distancePenalty = -4;
  else if (distance > 8) distancePenalty = -2;
  else if (distance > 4) distancePenalty = -1;
  
  const shooterExp = getExperienceModifier(shooter.experience);
  
  const attackValue = shooter.currentRanged + shooterExp + distancePenalty;
  log.push(`Tiro de ${shooter.name}: ${shooter.currentRanged} base + ${shooterExp} exp + ${distancePenalty} distância = ${attackValue}`);
  
  // Rolar d20
  const attackRoll = Math.floor(Math.random() * 20) + 1;
  const targetDefense = target.currentDefense + getExperienceModifier(target.experience);
  const defenseRoll = Math.floor(Math.random() * 20) + 1;
  
  const attackTotal = attackRoll + attackValue;
  const defenseTotal = defenseRoll + targetDefense;
  
  log.push(`Rolagens: Ataque ${attackRoll}+${attackValue}=${attackTotal} vs Defesa ${defenseRoll}+${targetDefense}=${defenseTotal}`);
  
  const difference = attackTotal - defenseTotal;
  
  if (difference >= 5) {
    result.targetPressure = 2;
    log.push(`${shooter.name} ACERTO CRÍTICO! ${target.name} sofre 2 pressão`);
  } else if (difference > 0) {
    result.targetPressure = 1;
    log.push(`${shooter.name} acerto! ${target.name} sofre 1 pressão`);
  } else {
    log.push(`${shooter.name} erro!`);
    
    // Verificar fogo amigo (rol natural 1 ou 2)
    if (attackRoll <= 2) {
      // Encontrar unidade aliada adjacente ao alvo
      const neighbors = getNeighbors(target.position);
      for (const neighbor of neighbors) {
        const key = hexKey(neighbor);
        const hex = gameState.hexes[key];
        if (hex?.unitId) {
          const adjacentUnit = gameState.units[hex.unitId];
          if (adjacentUnit && adjacentUnit.owner === shooter.owner) {
            result.friendlyFirePressure = 1;
            result.friendlyFireUnitId = hex.unitId;
            log.push(`FOGO AMIGO! ${adjacentUnit.name} sofre 1 pressão!`);
            break;
          }
        }
      }
    }
  }
  
  return result;
}

// ============================================
// TESTE DE MORAL (para não entrar em rota)
// ============================================

export function rollMoraleCheck(
  unit: BattleUnit,
  modifier: number = 0
): { success: boolean; roll: number; target: number } {
  const roll = Math.floor(Math.random() * 20) + 1;
  const target = 10 + unit.currentMorale + modifier;
  
  return {
    success: roll + unit.currentMorale + modifier >= 10,
    roll,
    target,
  };
}

// ============================================
// RALLY (tentativa de reorganizar unidade em rota)
// ============================================

export interface RallyResult {
  success: boolean;
  pressureRemoved: number;
  log: string[];
}

export function attemptRally(
  unit: BattleUnit,
  commanderCommand: number
): RallyResult {
  const log: string[] = [];
  
  // Rolar d20 + comando do comandante + moral da unidade
  const roll = Math.floor(Math.random() * 20) + 1;
  const target = 15;
  const total = roll + commanderCommand + unit.currentMorale;
  
  log.push(`Rally de ${unit.name}: ${roll} + ${commanderCommand} (CMD) + ${unit.currentMorale} (MRL) = ${total} vs CD ${target}`);
  
  if (total >= target) {
    const pressureRemoved = Math.min(2, unit.currentPressure);
    log.push(`SUCESSO! ${unit.name} remove ${pressureRemoved} pressão e para de fugir.`);
    
    return {
      success: true,
      pressureRemoved,
      log,
    };
  } else {
    log.push(`Falha. ${unit.name} continua em rota.`);
    
    return {
      success: false,
      pressureRemoved: 0,
      log,
    };
  }
}
