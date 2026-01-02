import React from 'react';
import { BattleCommander, PlayerId } from '@/types/tactical-game';
import { axialToPixel, HEX_SIZE } from '@/lib/hexUtils';
import { Crown } from 'lucide-react';

interface CommanderTokenProps {
  commander: BattleCommander;
  isSelected: boolean;
  onClick: () => void;
}

const PLAYER_COLORS: Record<PlayerId, { bg: string; border: string }> = {
  player1: { bg: '#dc2626', border: '#fca5a5' },
  player2: { bg: '#2563eb', border: '#93c5fd' },
};

export function CommanderToken({ commander, isSelected, onClick }: CommanderTokenProps) {
  // Não renderizar se está embarcado
  if (commander.isEmbedded) return null;
  
  const { x, y } = axialToPixel(commander.position.q, commander.position.r);
  const colors = PLAYER_COLORS[commander.owner];
  const tokenSize = HEX_SIZE * 0.5;
  
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Seleção */}
      {isSelected && (
        <circle
          cx={0}
          cy={0}
          r={tokenSize + 4}
          fill="none"
          stroke="#ffd700"
          strokeWidth={3}
        >
          <animate
            attributeName="stroke-opacity"
            values="1;0.5;1"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      
      {/* Token */}
      <circle
        cx={0}
        cy={0}
        r={tokenSize}
        fill={colors.bg}
        stroke="#ffd700"
        strokeWidth={2}
      />
      
      {/* Ícone */}
      <foreignObject
        x={-tokenSize * 0.5}
        y={-tokenSize * 0.5}
        width={tokenSize}
        height={tokenSize}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '100%',
          height: '100%'
        }}>
          <Crown size={tokenSize * 0.7} color="#ffd700" />
        </div>
      </foreignObject>
      
      {/* Badge de estratégia */}
      <g transform={`translate(${tokenSize * 0.6}, ${-tokenSize * 0.6})`}>
        <circle r={8} fill="#7c3aed" stroke="#a78bfa" strokeWidth={1} />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={9}
          fontWeight="bold"
        >
          {commander.strategy}
        </text>
      </g>
    </g>
  );
}
