/**
 * Mass Combat Rules Engine
 * Implementa as regras do Manual de Combate em Massa
 */

import { BattleUnit, BattleCommander, HexData, HexCoord, PlayerId } from '@/types/tactical-game';
import { hexDistance, getNeighbors, hexKey } from '@/lib/hexUtils';

// ========================
// 1. TERRAIN EFFECTS
// ========================

export interface TerrainEffect {
  movementCost: number;      // Custo extra de movimento
  attackMod: number;         // Modificador de ataque
  defenseMod: number;        // Modificador de defesa
  rangedMod: number;         // Modificador de tiro
  rangeBonus: number;        // Bônus de alcance (colinas)
  blocksCharge: boolean;     // Impede carga
  blocksLoS: boolean;        // Bloqueia linha de visão
}

export const TERRAIN_EFFECTS: Record<HexData['terrain'], TerrainEffect> = {
  plains: {
    movementCost: 0,
    attackMod: 0,
    defenseMod: 0,
    rangedMod: 0,
    rangeBonus: 0,
    blocksCharge: false,
    blocksLoS: false,
  },
  forest: {
    movementCost: 1,          // +1 hex para atravessar
    attackMod: 0,
    defenseMod: 1,            // +1 DEF contra tiro
    rangedMod: -1,            // -1 Tiro dentro do bosque
    rangeBonus: -3,           // Reduz alcance pela metade (~3 hexes)
    blocksCharge: true,       // Impede cargas
    blocksLoS: true,          // Bloqueia linha de visão
  },
  hill: {
    movementCost: 1,          // +1 hex para subir
    attackMod: 0,
    defenseMod: 1,            // +1 DEF no topo
    rangedMod: 0,
    rangeBonus: 2,            // +2 alcance para arqueiros
    blocksCharge: false,
    blocksLoS: false,
  },
  river: {
    movementCost: 2,          // MOV = 1 efetivo
    attackMod: 0,
    defenseMod: -1,           // -1 DEF enquanto atravessa
    rangedMod: 0,
    rangeBonus: 0,
    blocksCharge: true,
    blocksLoS: false,
  },
  fortification: {
    movementCost: 1,
    attackMod: 0,
    defenseMod: 2,            // +2 DEF dentro
    rangedMod: 2,             // +2 Tiro (muralhas)
    rangeBonus: 1,            // +1 alcance
    blocksCharge: true,
    blocksLoS: false,
  },
};

export function getTerrainEffect(terrain: HexData['terrain']): TerrainEffect {
  return TERRAIN_EFFECTS[terrain] || TERRAIN_EFFECTS.plains;
}

// ========================
// 2. POSTURE EFFECTS
// ========================

export interface PostureEffect {
  attackMod: number;
  defenseMod: number;
  movementMod: number;
  moraleMod: number;
  canAttack: boolean;
  canMove: boolean;
  pressureRecovery: number;  // Quanto de pressão remove por turno
}

export const POSTURE_EFFECTS: Record<string, PostureEffect> = {
  Ofensiva: {
    attackMod: 1,
    defenseMod: -1,
    movementMod: 0,
    moraleMod: 0,
    canAttack: true,
    canMove: true,
    pressureRecovery: 0,
  },
  Defensiva: {
    attackMod: -1,
    defenseMod: 2,
    movementMod: -1,
    moraleMod: 1,
    canAttack: true,
    canMove: true,
    pressureRecovery: 0,
  },
  Neutra: {
    attackMod: 0,
    defenseMod: 0,
    movementMod: 0,
    moraleMod: 0,
    canAttack: true,
    canMove: true,
    pressureRecovery: 0,
  },
  Reorganização: {
    attackMod: 0,
    defenseMod: -1,          // Vulnerável durante reorganização
    movementMod: 0,
    moraleMod: 2,
    canAttack: false,
    canMove: true,
    pressureRecovery: 2,     // Remove 2 pressão por turno (ajustado por experiência)
  },
};

// Pressão removida por experiência na postura Reorganização
export const REORGANIZATION_BY_EXPERIENCE: Record<string, number> = {
  'Recruta': 1,
  'Regular': 2,
  'Profissional': 2,
  'Veterano': 3,
  'Elite': 4,
  'Lendário': 5,
};

export function getPostureEffect(posture: string): PostureEffect {
  return POSTURE_EFFECTS[posture] || POSTURE_EFFECTS.Neutra;
}

export function getPressureRecovery(unit: BattleUnit): number {
  if (unit.posture !== 'Reorganização') return 0;
  return REORGANIZATION_BY_EXPERIENCE[unit.experience] || 2;
}

// ========================
// 3. DAMAGE REDUCES ATTRIBUTES
// ========================

/**
 * Calcula os atributos efetivos considerando dano (hits)
 * Cada Hit reduz TODOS os atributos em 1
 */
export function getEffectiveStats(unit: BattleUnit, hexData?: HexData): {
  attack: number;
  defense: number;
  ranged: number;
  movement: number;
  morale: number;
} {
  const hits = unit.hitsReceived;
  const posture = getPostureEffect(unit.posture);
  const terrain = hexData ? getTerrainEffect(hexData.terrain) : getTerrainEffect('plains');
  
  return {
    attack: Math.max(0, unit.baseAttack - hits + posture.attackMod + terrain.attackMod),
    defense: Math.max(0, unit.baseDefense - hits + posture.defenseMod + terrain.defenseMod),
    ranged: Math.max(0, unit.baseRanged - hits + terrain.rangedMod),
    movement: Math.max(1, unit.baseMovement - hits + posture.movementMod),
    morale: Math.max(0, unit.baseMorale - hits + posture.moraleMod),
  };
}

/**
 * Atualiza os atributos current baseado em hits e postura
 */
export function updateCurrentStats(unit: BattleUnit, hexData?: HexData): BattleUnit {
  const stats = getEffectiveStats(unit, hexData);
  return {
    ...unit,
    currentAttack: stats.attack,
    currentDefense: stats.defense,
    currentRanged: stats.ranged,
    currentMovement: stats.movement,
    currentMorale: stats.morale,
  };
}

// ========================
// 4. MORALE TEST (d20 + Moral vs DC 18)
// ========================

export interface MoraleTestResult {
  success: boolean;
  roll: number;
  modifier: number;
  total: number;
  dc: number;
  reason: string;
}

export function calculateMoraleModifier(
  unit: BattleUnit,
  commanders: Record<string, BattleCommander>,
  units: Record<string, BattleUnit>,
  hexes: Record<string, HexData>
): { modifier: number; breakdown: string[] } {
  let modifier = 0;
  const breakdown: string[] = [];
  
  // Base: Moral atual
  const effectiveMorale = Math.max(0, unit.baseMorale - unit.hitsReceived);
  modifier += effectiveMorale;
  breakdown.push(`Moral base: +${effectiveMorale}`);
  
  // Penalidade por Pressão (-1 por ponto)
  if (unit.currentPressure > 0) {
    modifier -= unit.currentPressure;
    breakdown.push(`Pressão: -${unit.currentPressure}`);
  }
  
  // Penalidade por Hits (-1 por hit)
  if (unit.hitsReceived > 0) {
    modifier -= unit.hitsReceived;
    breakdown.push(`Hits: -${unit.hitsReceived}`);
  }
  
  // Bônus de Comandante na área de influência
  const commanderBonus = getCommanderBonus(unit, commanders);
  if (commanderBonus > 0) {
    modifier += commanderBonus;
    breakdown.push(`Comandante: +${commanderBonus}`);
  }
  
  // Bônus de Postura
  const postureEffect = getPostureEffect(unit.posture);
  if (postureEffect.moraleMod !== 0) {
    modifier += postureEffect.moraleMod;
    breakdown.push(`Postura ${unit.posture}: ${postureEffect.moraleMod > 0 ? '+' : ''}${postureEffect.moraleMod}`);
  }
  
  // Penalidade por unidades em rout adjacentes
  const routingNeighbors = countRoutingNeighbors(unit, units, hexes);
  if (routingNeighbors > 0) {
    modifier -= routingNeighbors;
    breakdown.push(`Aliados em rota: -${routingNeighbors}`);
  }
  
  return { modifier, breakdown };
}

/**
 * Realiza teste de moral: d20 + modificadores vs DC 18
 */
export function rollMoraleTest(
  unit: BattleUnit,
  commanders: Record<string, BattleCommander>,
  units: Record<string, BattleUnit>,
  hexes: Record<string, HexData>
): MoraleTestResult {
  const DC = 18;
  const roll = Math.floor(Math.random() * 20) + 1;
  const { modifier, breakdown } = calculateMoraleModifier(unit, commanders, units, hexes);
  const total = roll + modifier;
  
  return {
    success: total >= DC,
    roll,
    modifier,
    total,
    dc: DC,
    reason: breakdown.join(', '),
  };
}

/**
 * Verifica se unidade precisa testar moral
 */
export function shouldTestMorale(unit: BattleUnit): boolean {
  // Pressão + Hits >= Moral
  const totalDamage = unit.currentPressure + unit.hitsReceived;
  const effectiveMorale = Math.max(1, unit.baseMorale - unit.hitsReceived);
  return totalDamage >= effectiveMorale;
}

// ========================
// 5. COMMANDER INFLUENCE
// ========================

const COMMANDER_INFLUENCE_RANGE = 4; // Hexes de alcance

/**
 * Encontra comandante aliado mais próximo e calcula bônus
 */
export function getCommanderBonus(
  unit: BattleUnit,
  commanders: Record<string, BattleCommander>
): number {
  let bestBonus = 0;
  
  for (const commander of Object.values(commanders)) {
    if (commander.owner !== unit.owner) continue;
    
    const distance = hexDistance(unit.position, commander.position);
    
    if (distance <= COMMANDER_INFLUENCE_RANGE) {
      // Bônus = Command do comandante
      let bonus = commander.command;
      
      // Adjacente: +1 adicional
      if (distance <= 1) {
        bonus += 1;
      }
      
      bestBonus = Math.max(bestBonus, bonus);
    }
  }
  
  return bestBonus;
}

/**
 * Verifica se unidade está na área de influência de algum comandante
 */
export function isInCommanderInfluence(
  unit: BattleUnit,
  commanders: Record<string, BattleCommander>
): boolean {
  for (const commander of Object.values(commanders)) {
    if (commander.owner !== unit.owner) continue;
    
    const distance = hexDistance(unit.position, commander.position);
    if (distance <= COMMANDER_INFLUENCE_RANGE) {
      return true;
    }
  }
  return false;
}

/**
 * Conta unidades aliadas em rout adjacentes
 */
function countRoutingNeighbors(
  unit: BattleUnit,
  units: Record<string, BattleUnit>,
  hexes: Record<string, HexData>
): number {
  let count = 0;
  const neighbors = getNeighbors(unit.position);
  
  for (const neighbor of neighbors) {
    const hex = hexes[hexKey(neighbor)];
    if (hex?.unitId) {
      const neighborUnit = units[hex.unitId];
      if (neighborUnit && 
          neighborUnit.owner === unit.owner && 
          neighborUnit.isRouting) {
        count++;
      }
    }
  }
  
  return count;
}

// ========================
// 6. COMBAT RESOLUTION
// ========================

export interface CombatResult {
  attackRoll: number;
  defenseRoll: number;
  attackTotal: number;
  defenseTotal: number;
  margin: number;
  damage: number;
  pressure: number;
  isCritical: boolean;
  logs: string[];
}

/**
 * Resolve combate conforme regras do manual
 * Ataque vs Defesa com tabela de resultados
 */
export function resolveCombat(
  attacker: BattleUnit,
  target: BattleUnit,
  attackerHex: HexData | undefined,
  targetHex: HexData | undefined,
  isRanged: boolean = false
): CombatResult {
  const logs: string[] = [];
  
  // Calcular stats efetivos
  const attackerStats = getEffectiveStats(attacker, attackerHex);
  const targetStats = getEffectiveStats(target, targetHex);
  
  // Valor de ataque (ranged ou melee)
  const attackValue = isRanged ? attackerStats.ranged : attackerStats.attack;
  const defenseValue = targetStats.defense;
  
  // Rolagens 1d6
  const attackRoll = Math.floor(Math.random() * 6) + 1;
  const defenseRoll = Math.floor(Math.random() * 6) + 1;
  
  const attackTotal = attackRoll + attackValue;
  const defenseTotal = defenseRoll + defenseValue;
  const margin = attackTotal - defenseTotal;
  
  logs.push(`⚔️ ${attacker.name} ataca ${target.name}`);
  logs.push(`🎲 ATQ: [${attackRoll}] + ${attackValue} = ${attackTotal} | DEF: [${defenseRoll}] + ${defenseValue} = ${defenseTotal}`);
  
  let damage = 0;
  let pressure = 0;
  const isCritical = attackRoll === 6;
  
  if (margin > 0) {
    // Aplicar tabela de dano do manual
    // Margem 1-2: 1 Pressão
    // Margem 3-4: 1 Pressão + 1 Hit
    // Margem 5+: 1 Hit direto + 1 Pressão
    
    if (margin <= 2) {
      pressure = 1;
      logs.push(`✅ ACERTO! Margem +${margin} → Pressão: +1`);
    } else if (margin <= 4) {
      pressure = 1;
      damage = 1;
      logs.push(`✅ ACERTO FORTE! Margem +${margin} → Dano: 1 Hit, Pressão: +1`);
    } else {
      damage = Math.ceil(margin / 3);
      pressure = 1;
      logs.push(`💥 ACERTO DEVASTADOR! Margem +${margin} → Dano: ${damage} Hit(s), Pressão: +1`);
    }
    
    if (isCritical) {
      damage += 1;
      logs.push(`⭐ CRÍTICO (6)! +1 Hit adicional`);
    }
  } else {
    logs.push(`❌ BLOQUEADO! Margem: ${margin}`);
  }
  
  return {
    attackRoll,
    defenseRoll,
    attackTotal,
    defenseTotal,
    margin,
    damage,
    pressure,
    isCritical,
    logs,
  };
}

// ========================
// 7. MOVEMENT WITH TERRAIN
// ========================

/**
 * Calcula custo de movimento para entrar em um hex
 */
export function getMovementCost(targetHex: HexData): number {
  const terrain = getTerrainEffect(targetHex.terrain);
  return 1 + terrain.movementCost;
}

/**
 * Calcula alcance de tiro efetivo considerando terreno
 */
export function getEffectiveRange(unit: BattleUnit, unitHex: HexData): number {
  const baseRange = 6;
  const terrain = getTerrainEffect(unitHex.terrain);
  return Math.max(2, baseRange + terrain.rangeBonus);
}
