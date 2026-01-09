/**
 * Mapa de Combate Hexagonal
 * 
 * Renderiza grid hex com combatentes, cobertura, LoS
 */

import React, { useMemo, useState } from 'react';
import { Combatant, HexMap, HexCoord, CoverType } from '@/types/tactical-combat';
import { hexKey, getHexLine, checkLineOfSight, hexDistance } from '@/lib/hexCombatUtils';
import { cn } from '@/lib/utils';

interface HexCombatMapProps {
  map: HexMap;
  combatants: Combatant[];
  selectedCombatant: Combatant | null;
  validMoveHexes?: HexCoord[];
  validTargetHexes?: HexCoord[];
  onHexClick: (coord: HexCoord) => void;
  onCombatantClick: (combatant: Combatant) => void;
  showLoS?: boolean;
  targetHex?: HexCoord | null;
}

// Constantes para renderização
const HEX_SIZE = 32;
const HEX_WIDTH = HEX_SIZE * 2;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

// Cores
const COLORS = {
  normal: 'rgba(50, 50, 50, 0.3)',
  moveValid: 'rgba(34, 197, 94, 0.4)',
  targetValid: 'rgba(239, 68, 68, 0.4)',
  hover: 'rgba(255, 255, 255, 0.2)',
  blocked: '#333',
  coverLight: '#90EE90',
  coverPartial: '#FFD700',
  coverHeavy: '#FF8C00',
  player: '#3b82f6',
  enemy: '#ef4444',
  selected: '#fbbf24'
};

export function HexCombatMap({
  map,
  combatants,
  selectedCombatant,
  validMoveHexes = [],
  validTargetHexes = [],
  onHexClick,
  onCombatantClick,
  showLoS = false,
  targetHex = null
}: HexCombatMapProps) {
  const [hoveredHex, setHoveredHex] = useState<string | null>(null);
  
  // Converter hex coord para pixel position
  const hexToPixel = (q: number, r: number) => ({
    x: HEX_SIZE * (3/2 * q),
    y: HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r)
  });
  
  // Gerar pontos do hexágono
  const hexPoints = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = HEX_SIZE * Math.cos(angle);
      const y = HEX_SIZE * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }, []);
  
  // Criar lookup de ocupação
  const occupantMap = useMemo(() => {
    const map = new Map<string, Combatant>();
    combatants.forEach(c => {
      if (c.stats.position) {
        map.set(hexKey(c.stats.position), c);
      }
    });
    return map;
  }, [combatants]);
  
  // Sets para lookup rápido
  const validMoveSet = useMemo(() => 
    new Set(validMoveHexes.map(hexKey)), [validMoveHexes]);
  const validTargetSet = useMemo(() => 
    new Set(validTargetHexes.map(hexKey)), [validTargetHexes]);
  
  // Linha de visão se selecionado
  const losLine = useMemo(() => {
    if (!showLoS || !selectedCombatant?.stats.position || !targetHex) return null;
    return getHexLine(selectedCombatant.stats.position, targetHex);
  }, [showLoS, selectedCombatant, targetHex]);
  
  // Calcular bounds do mapa
  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const [key] of map.hexes) {
      const [q, r] = key.split(',').map(Number);
      const { x, y } = hexToPixel(q, r);
      minX = Math.min(minX, x - HEX_SIZE);
      minY = Math.min(minY, y - HEX_SIZE);
      maxX = Math.max(maxX, x + HEX_SIZE);
      maxY = Math.max(maxY, y + HEX_SIZE);
    }
    
    return { 
      minX, minY, 
      width: maxX - minX + HEX_SIZE * 2,
      height: maxY - minY + HEX_SIZE * 2
    };
  }, [map]);
  
  // Renderizar borda de cobertura
  const getCoverBorderColor = (cover: CoverType): string | null => {
    switch (cover) {
      case 'light': return COLORS.coverLight;
      case 'partial': return COLORS.coverPartial;
      case 'heavy': return COLORS.coverHeavy;
      default: return null;
    }
  };
  
  return (
    <div className="relative overflow-auto border rounded-lg bg-slate-900 p-4">
      <svg 
        width={bounds.width}
        height={bounds.height}
        viewBox={`${bounds.minX - HEX_SIZE} ${bounds.minY - HEX_SIZE} ${bounds.width} ${bounds.height}`}
        className="mx-auto"
      >
        {/* Hexes */}
        {Array.from(map.hexes.entries()).map(([key, tile]) => {
          const { x, y } = hexToPixel(tile.coord.q, tile.coord.r);
          const isValidMove = validMoveSet.has(key);
          const isValidTarget = validTargetSet.has(key);
          const isHovered = hoveredHex === key;
          const occupant = occupantMap.get(key);
          const coverBorder = getCoverBorderColor(tile.cover);
          
          let fillColor = COLORS.normal;
          if (tile.blocked) fillColor = COLORS.blocked;
          else if (isValidMove) fillColor = COLORS.moveValid;
          else if (isValidTarget) fillColor = COLORS.targetValid;
          
          if (isHovered) fillColor = COLORS.hover;
          
          return (
            <g 
              key={key} 
              transform={`translate(${x}, ${y})`}
              onClick={() => {
                if (occupant) onCombatantClick(occupant);
                else onHexClick(tile.coord);
              }}
              onMouseEnter={() => setHoveredHex(key)}
              onMouseLeave={() => setHoveredHex(null)}
              className="cursor-pointer"
            >
              {/* Hex base */}
              <polygon
                points={hexPoints}
                fill={fillColor}
                stroke={coverBorder || '#555'}
                strokeWidth={coverBorder ? 3 : 1}
              />
              
              {/* Terreno difícil */}
              {tile.terrain === 'difficult' && (
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fill="#888"
                >
                  ~~~
                </text>
              )}
              
              {/* Combatente */}
              {occupant && (
                <>
                  <circle
                    cx={0}
                    cy={0}
                    r={HEX_SIZE * 0.6}
                    fill={occupant.team === 'player' ? COLORS.player : COLORS.enemy}
                    stroke={selectedCombatant?.id === occupant.id ? COLORS.selected : '#fff'}
                    strokeWidth={selectedCombatant?.id === occupant.id ? 3 : 1}
                  />
                  {/* Inicial */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={14}
                    fontWeight="bold"
                    fill="white"
                  >
                    {occupant.name.charAt(0)}
                  </text>
                  {/* HP bar */}
                  <rect
                    x={-HEX_SIZE * 0.5}
                    y={HEX_SIZE * 0.4}
                    width={HEX_SIZE}
                    height={4}
                    fill="#333"
                    rx={2}
                  />
                  <rect
                    x={-HEX_SIZE * 0.5}
                    y={HEX_SIZE * 0.4}
                    width={HEX_SIZE * (occupant.stats.vitality / occupant.stats.maxVitality)}
                    height={4}
                    fill="#22c55e"
                    rx={2}
                  />
                  {/* Evasion bar */}
                  <rect
                    x={-HEX_SIZE * 0.5}
                    y={HEX_SIZE * 0.5}
                    width={HEX_SIZE}
                    height={3}
                    fill="#333"
                    rx={1}
                  />
                  <rect
                    x={-HEX_SIZE * 0.5}
                    y={HEX_SIZE * 0.5}
                    width={HEX_SIZE * (occupant.stats.evasion / occupant.stats.maxEvasion)}
                    height={3}
                    fill="#a855f7"
                    rx={1}
                  />
                </>
              )}
            </g>
          );
        })}
        
        {/* Linha de visão */}
        {losLine && losLine.length > 1 && (
          <polyline
            points={losLine.map(h => {
              const { x, y } = hexToPixel(h.q, h.r);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={2}
            strokeDasharray="5,5"
            opacity={0.6}
          />
        )}
      </svg>
      
      {/* Legenda */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ background: COLORS.player }} />
          <span>Jogador</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ background: COLORS.enemy }} />
          <span>Inimigo</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3" style={{ background: COLORS.moveValid }} />
          <span>Movimento</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3" style={{ background: COLORS.targetValid }} />
          <span>Alvo</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2" style={{ borderColor: COLORS.coverLight }} />
          <span>Cobertura Leve</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2" style={{ borderColor: COLORS.coverPartial }} />
          <span>Cobertura Parcial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2" style={{ borderColor: COLORS.coverHeavy }} />
          <span>Cobertura Pesada</span>
        </div>
      </div>
    </div>
  );
}
