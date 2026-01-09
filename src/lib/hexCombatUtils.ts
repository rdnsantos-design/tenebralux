/**
 * Utilitários para Combate em Mapa Hexagonal
 * 
 * Funções para:
 * - Linha de Visão (LoS)
 * - Cobertura
 * - Distância e Pathfinding
 * - Adjacência
 */

import { HexCoord, HexTile, HexMap, CoverType, COVER_MODIFIERS } from '@/types/tactical-combat';

// ============= CONSTANTES =============

const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },   // Leste
  { q: 1, r: -1 },  // Nordeste
  { q: 0, r: -1 },  // Noroeste
  { q: -1, r: 0 },  // Oeste
  { q: -1, r: 1 },  // Sudoeste
  { q: 0, r: 1 }    // Sudeste
];

// ============= FUNÇÕES BÁSICAS =============

/**
 * Distância entre dois hexes (coordenadas axiais)
 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  return Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.r - b.r),
    Math.abs((-a.q - a.r) - (-b.q - b.r))
  );
}

/**
 * Chave única para um hex
 */
export function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

/**
 * Parse chave para coordenada
 */
export function parseHexKey(key: string): HexCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

/**
 * Retorna hexes adjacentes
 */
export function getAdjacentHexes(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map(dir => ({
    q: coord.q + dir.q,
    r: coord.r + dir.r
  }));
}

/**
 * Verifica se dois hexes são adjacentes
 */
export function areAdjacent(a: HexCoord, b: HexCoord): boolean {
  return hexDistance(a, b) === 1;
}

// ============= LINHA DE VISÃO =============

/**
 * Interpolação linear entre dois hexes
 */
function hexLerp(a: HexCoord, b: HexCoord, t: number): { q: number; r: number } {
  return {
    q: a.q + (b.q - a.q) * t,
    r: a.r + (b.r - a.r) * t
  };
}

/**
 * Arredonda coordenadas fracionárias para hex
 */
function hexRound(frac: { q: number; r: number }): HexCoord {
  let q = Math.round(frac.q);
  let r = Math.round(frac.r);
  const s = Math.round(-frac.q - frac.r);
  
  const qDiff = Math.abs(q - frac.q);
  const rDiff = Math.abs(r - frac.r);
  const sDiff = Math.abs(s - (-frac.q - frac.r));
  
  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }
  
  return { q, r };
}

/**
 * Retorna linha de hexes entre dois pontos
 */
export function getHexLine(a: HexCoord, b: HexCoord): HexCoord[] {
  const n = hexDistance(a, b);
  if (n === 0) return [a];
  
  const results: HexCoord[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    results.push(hexRound(hexLerp(a, b, t)));
  }
  return results;
}

/**
 * Verifica linha de visão entre dois hexes
 */
export function checkLineOfSight(
  from: HexCoord,
  to: HexCoord,
  map: HexMap
): {
  hasLoS: boolean;
  blockedBy: HexCoord | null;
  coverType: CoverType;
} {
  const line = getHexLine(from, to);
  let maxCover: CoverType = 'none';
  const coverOrder: Record<CoverType, number> = {
    'none': 0,
    'light': 1,
    'partial': 2,
    'heavy': 3,
    'total': 4
  };
  
  // Ignora origem e destino
  for (const hex of line.slice(1, -1)) {
    const tile = map.hexes.get(hexKey(hex));
    
    if (!tile) continue;
    
    // Hex bloqueado = LoS bloqueada
    if (tile.blocked) {
      return { hasLoS: false, blockedBy: hex, coverType: 'none' };
    }
    
    // Cobertura total = LoS bloqueada
    if (tile.cover === 'total') {
      return { hasLoS: false, blockedBy: hex, coverType: 'none' };
    }
    
    // Acumular maior cobertura encontrada
    if (coverOrder[tile.cover] > coverOrder[maxCover]) {
      maxCover = tile.cover;
    }
  }
  
  // Verificar cobertura do destino
  const destTile = map.hexes.get(hexKey(to));
  if (destTile && coverOrder[destTile.cover] > coverOrder[maxCover]) {
    maxCover = destTile.cover;
  }
  
  return { hasLoS: true, blockedBy: null, coverType: maxCover };
}

/**
 * Retorna bônus de defesa da cobertura
 */
export function getCoverDefenseBonus(cover: CoverType): number {
  return COVER_MODIFIERS[cover];
}

// ============= PATHFINDING =============

interface PathNode {
  coord: HexCoord;
  cost: number;
  parent: PathNode | null;
}

/**
 * Encontra hexes válidos para movimento
 */
export function getValidMoveHexes(
  start: HexCoord,
  maxMove: number,
  map: HexMap,
  occupiedHexes: Set<string>
): HexCoord[] {
  const valid: HexCoord[] = [];
  const visited = new Set<string>();
  const queue: PathNode[] = [{ coord: start, cost: 0, parent: null }];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = hexKey(current.coord);
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    // Não inclui posição inicial, mas verifica adjacentes
    if (current.cost > 0) {
      valid.push(current.coord);
    }
    
    if (current.cost >= maxMove) continue;
    
    // Explorar adjacentes
    for (const adj of getAdjacentHexes(current.coord)) {
      const adjKey = hexKey(adj);
      if (visited.has(adjKey)) continue;
      
      const tile = map.hexes.get(adjKey);
      
      // Verificar se é passável
      if (!tile || tile.blocked || tile.terrain === 'impassable') continue;
      if (occupiedHexes.has(adjKey)) continue;
      
      // Calcular custo de movimento
      const moveCost = tile.terrain === 'difficult' ? 2 : 1;
      const newCost = current.cost + moveCost;
      
      if (newCost <= maxMove) {
        queue.push({ coord: adj, cost: newCost, parent: current });
      }
    }
    
    // Ordenar por custo para priorizar menores distâncias
    queue.sort((a, b) => a.cost - b.cost);
  }
  
  return valid;
}

/**
 * Encontra caminho mais curto entre dois hexes
 */
export function findPath(
  start: HexCoord,
  end: HexCoord,
  map: HexMap,
  occupiedHexes: Set<string>
): HexCoord[] | null {
  const startKey = hexKey(start);
  const endKey = hexKey(end);
  
  if (startKey === endKey) return [start];
  
  const visited = new Set<string>();
  const queue: PathNode[] = [{ coord: start, cost: 0, parent: null }];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = hexKey(current.coord);
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    // Chegou ao destino
    if (key === endKey) {
      const path: HexCoord[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift(node.coord);
        node = node.parent;
      }
      return path;
    }
    
    // Explorar adjacentes
    for (const adj of getAdjacentHexes(current.coord)) {
      const adjKey = hexKey(adj);
      if (visited.has(adjKey)) continue;
      
      const tile = map.hexes.get(adjKey);
      
      if (!tile || tile.blocked || tile.terrain === 'impassable') continue;
      // Permitir destino mesmo se ocupado (pode ser alvo de ataque)
      if (adjKey !== endKey && occupiedHexes.has(adjKey)) continue;
      
      const moveCost = tile.terrain === 'difficult' ? 2 : 1;
      queue.push({ 
        coord: adj, 
        cost: current.cost + moveCost, 
        parent: current 
      });
    }
    
    queue.sort((a, b) => a.cost - b.cost);
  }
  
  return null; // Caminho não encontrado
}

// ============= ATAQUES =============

/**
 * Retorna hexes válidos para ataque
 */
export function getValidAttackHexes(
  attacker: HexCoord,
  range: number,
  map: HexMap,
  requireLoS: boolean = true
): HexCoord[] {
  const valid: HexCoord[] = [];
  
  // Gerar todos os hexes dentro do alcance
  for (const [key, tile] of map.hexes) {
    const coord = parseHexKey(key);
    const dist = hexDistance(attacker, coord);
    
    if (dist > 0 && dist <= range) {
      if (!requireLoS) {
        valid.push(coord);
        continue;
      }
      
      // Verificar LoS
      const los = checkLineOfSight(attacker, coord, map);
      if (los.hasLoS) {
        valid.push(coord);
      }
    }
  }
  
  return valid;
}

/**
 * Verifica se posição permite ataque de oportunidade
 * (quando inimigo sai de adjacência)
 */
export function canMakeOpportunityAttack(
  attacker: HexCoord,
  targetPrevious: HexCoord,
  targetCurrent: HexCoord
): boolean {
  // Estava adjacente e agora não está mais
  const wasAdjacent = areAdjacent(attacker, targetPrevious);
  const isAdjacent = areAdjacent(attacker, targetCurrent);
  
  return wasAdjacent && !isAdjacent;
}

// ============= CRIAÇÃO DE MAPA =============

/**
 * Cria um mapa hexagonal básico
 */
export function createBasicHexMap(width: number, height: number): HexMap {
  const hexes = new Map<string, HexTile>();
  
  for (let q = 0; q < width; q++) {
    for (let r = 0; r < height; r++) {
      const coord: HexCoord = { q, r };
      hexes.set(hexKey(coord), {
        coord,
        terrain: 'normal',
        elevation: 0,
        cover: 'none',
        blocked: false,
        occupantId: null
      });
    }
  }
  
  return { width, height, hexes };
}

/**
 * Adiciona cobertura aleatória ao mapa
 */
export function addRandomCover(map: HexMap, coverChance: number = 0.15): HexMap {
  const coverTypes: CoverType[] = ['light', 'partial', 'heavy'];
  
  for (const [key, tile] of map.hexes) {
    if (Math.random() < coverChance && !tile.blocked) {
      tile.cover = coverTypes[Math.floor(Math.random() * coverTypes.length)];
    }
  }
  
  return map;
}

/**
 * Adiciona obstáculos ao mapa
 */
export function addRandomObstacles(map: HexMap, obstacleChance: number = 0.1): HexMap {
  for (const [key, tile] of map.hexes) {
    if (Math.random() < obstacleChance) {
      tile.blocked = true;
      tile.cover = 'total';
    }
  }
  
  return map;
}
