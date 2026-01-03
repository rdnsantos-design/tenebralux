import React, { useMemo } from 'react';
import { useTacticalGame } from '@/contexts/TacticalGameContext';
import { generateMapHexes, hexKey } from '@/lib/hexUtils';

export function MiniMap() {
  const { gameState } = useTacticalGame();
  
  if (!gameState) return null;
  
  const mapHexes = useMemo(() => generateMapHexes(), []);
  
  // Escala do minimapa
  const scale = 3;
  const width = 20 * scale + 10;
  const height = 12 * scale + 10;
  
  return (
    <div className="bg-slate-800 rounded-lg p-2">
      <h4 className="text-xs text-slate-400 mb-1">Mapa</h4>
      <svg width={width} height={height} className="bg-slate-900 rounded">
        {/* Hexágonos simplificados como pontos */}
        {mapHexes.map(coord => {
          const key = hexKey(coord);
          const hex = gameState.hexes[key];
          const x = coord.q * scale + 5;
          const y = (coord.r + coord.q * 0.5) * scale + 5;
          
          let color = '#374151'; // slate-700
          
          if (hex?.unitId) {
            const unit = gameState.units[hex.unitId];
            if (unit) {
              color = unit.owner === 'player1' ? '#dc2626' : '#2563eb';
              if (unit.isRouting) color = '#f97316';
            }
          }
          
          return (
            <circle
              key={key}
              cx={x}
              cy={y}
              r={scale / 2}
              fill={color}
            />
          );
        })}
      </svg>
    </div>
  );
}
