// Sistema de coordenadas AXIAIS (q, r) - flat-top hexagons
import { HexCoord, HexDirection } from '@/types/tactical-game';

export const HEX_SIZE = 40; // Raio em pixels
export const MAP_WIDTH = 20; // Hexágonos de largura
export const MAP_HEIGHT = 12; // Hexágonos de altura

// Converter coordenadas axiais para pixels (flat-top)
export function axialToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_SIZE * (3/2 * q);
  const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  return { x: x + 60, y: y + 60 }; // Padding
}

// Converter pixels para coordenadas axiais
export function pixelToAxial(x: number, y: number): HexCoord {
  const adjustedX = x - 60;
  const adjustedY = y - 60;
  const q = (2/3 * adjustedX) / HEX_SIZE;
  const r = (-1/3 * adjustedX + Math.sqrt(3)/3 * adjustedY) / HEX_SIZE;
  return { q: Math.round(q), r: Math.round(r) };
}

// Gerar pontos do hexágono para SVG polygon (flat-top)
export function hexCorners(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const px = cx + size * Math.cos(angle);
    const py = cy + size * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  return points.join(' ');
}

// Obter os 6 vizinhos de um hexágono
export function getNeighbors(coord: HexCoord): HexCoord[] {
  const { q, r } = coord;
  return [
    { q: q + 1, r: r },     // E
    { q: q + 1, r: r - 1 }, // NE
    { q: q, r: r - 1 },     // NW
    { q: q - 1, r: r },     // W
    { q: q - 1, r: r + 1 }, // SW
    { q: q, r: r + 1 },     // SE
  ];
}

// Distância entre dois hexágonos
export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

// Verificar se coordenada está dentro do mapa
export function isValidHex(q: number, r: number): boolean {
  // Calcular offset para mapa retangular
  const col = q;
  const row = r + Math.floor(q / 2);
  return col >= 0 && col < MAP_WIDTH && row >= 0 && row < MAP_HEIGHT;
}

// Converter coordenada para string key
export function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

// Parse string key para coordenada
export function parseHexKey(key: string): HexCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

// Gerar todos os hexágonos do mapa
export function generateMapHexes(): HexCoord[] {
  const hexes: HexCoord[] = [];
  for (let col = 0; col < MAP_WIDTH; col++) {
    for (let row = 0; row < MAP_HEIGHT; row++) {
      // Converter offset para axial
      const q = col;
      const r = row - Math.floor(col / 2);
      hexes.push({ q, r });
    }
  }
  return hexes;
}

// Verificar adjacência pelo lado reto (para engajamento)
export function isAdjacentBySide(a: HexCoord, b: HexCoord): boolean {
  const neighbors = getNeighbors(a);
  return neighbors.some(n => n.q === b.q && n.r === b.r);
}

// Obter direção entre dois hexágonos adjacentes
export function getDirectionTo(from: HexCoord, to: HexCoord): HexDirection | null {
  const dq = to.q - from.q;
  const dr = to.r - from.r;
  
  const directions: Record<string, HexDirection> = {
    '1,0': 'SE',
    '1,-1': 'NE',
    '0,-1': 'N',
    '-1,0': 'NW',
    '-1,1': 'SW',
    '0,1': 'S',
  };
  
  return directions[`${dq},${dr}`] || null;
}

// Calcular viewBox do SVG baseado no mapa
export function calculateViewBox(): { width: number; height: number; viewBox: string } {
  const hexes = generateMapHexes();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (const hex of hexes) {
    const { x, y } = axialToPixel(hex.q, hex.r);
    minX = Math.min(minX, x - HEX_SIZE);
    minY = Math.min(minY, y - HEX_SIZE);
    maxX = Math.max(maxX, x + HEX_SIZE);
    maxY = Math.max(maxY, y + HEX_SIZE);
  }
  
  const padding = 20;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;
  
  return {
    width,
    height,
    viewBox: `${minX - padding} ${minY - padding} ${width} ${height}`
  };
}

// Obter hexágonos em linha reta
export function getHexLine(from: HexCoord, to: HexCoord): HexCoord[] {
  const distance = hexDistance(from, to);
  if (distance === 0) return [from];
  
  const results: HexCoord[] = [];
  for (let i = 0; i <= distance; i++) {
    const t = i / distance;
    const q = Math.round(from.q + (to.q - from.q) * t);
    const r = Math.round(from.r + (to.r - from.r) * t);
    results.push({ q, r });
  }
  return results;
}

// Obter hexágonos dentro de um raio
export function getHexesInRange(center: HexCoord, range: number): HexCoord[] {
  const results: HexCoord[] = [];
  for (let dq = -range; dq <= range; dq++) {
    for (let dr = Math.max(-range, -dq - range); dr <= Math.min(range, -dq + range); dr++) {
      const coord = { q: center.q + dq, r: center.r + dr };
      if (isValidHex(coord.q, coord.r)) {
        results.push(coord);
      }
    }
  }
  return results;
}
