import React from 'react';
import { BattleUnit, PlayerId } from '@/types/tactical-game';
import { axialToPixel, HEX_SIZE } from '@/lib/hexUtils';
import { Shield, Sword, Crosshair, Castle } from 'lucide-react';

interface UnitTokenProps {
  unit: BattleUnit;
  isSelected: boolean;
  isValidTarget: boolean;
  onClick: () => void;
}

const PLAYER_COLORS: Record<PlayerId, { bg: string; border: string }> = {
  player1: { bg: '#dc2626', border: '#fca5a5' },
  player2: { bg: '#2563eb', border: '#93c5fd' },
};

const UNIT_ICONS = {
  Infantaria: Shield,
  Cavalaria: Sword,
  Arqueiros: Crosshair,
  Cerco: Castle,
} as const;

export function UnitToken({ unit, isSelected, isValidTarget, onClick }: UnitTokenProps) {
  const { x, y } = axialToPixel(unit.position.q, unit.position.r);
  const colors = PLAYER_COLORS[unit.owner];
  const Icon = UNIT_ICONS[unit.unitType] || Shield;
  
  const tokenSize = HEX_SIZE * 0.7;
  
  // Calcular porcentagem de vida e pressão
  const healthPercent = (unit.currentHealth / unit.maxHealth) * 100;
  const pressurePercent = (unit.currentPressure / unit.maxPressure) * 100;
  
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Sombra */}
      <ellipse
        cx={2}
        cy={tokenSize * 0.4}
        rx={tokenSize * 0.8}
        ry={tokenSize * 0.3}
        fill="rgba(0,0,0,0.3)"
      />
      
      {/* Círculo de seleção/target */}
      {(isSelected || isValidTarget) && (
        <circle
          cx={0}
          cy={0}
          r={tokenSize + 4}
          fill="none"
          stroke={isValidTarget ? '#ef4444' : '#ffd700'}
          strokeWidth={3}
          strokeDasharray={isValidTarget ? '4,4' : undefined}
        >
          {isSelected && (
            <animate
              attributeName="stroke-opacity"
              values="1;0.5;1"
              dur="1s"
              repeatCount="indefinite"
            />
          )}
        </circle>
      )}
      
      {/* Token principal */}
      <circle
        cx={0}
        cy={0}
        r={tokenSize}
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth={2}
        opacity={unit.hasActedThisTurn ? 0.6 : 1}
      />
      
      {/* Ícone da unidade */}
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
          <Icon size={tokenSize * 0.6} color="white" />
        </div>
      </foreignObject>
      
      {/* Indicador de facing (triângulo) */}
      <polygon
        points={getFacingTriangle(unit.facing, tokenSize + 8)}
        fill={colors.border}
        stroke={colors.bg}
        strokeWidth={1}
      />
      
      {/* Barra de vida (embaixo) */}
      <g transform={`translate(${-tokenSize}, ${tokenSize + 4})`}>
        <rect width={tokenSize * 2} height={4} fill="#1a1a2e" rx={2} />
        <rect
          width={tokenSize * 2 * (healthPercent / 100)}
          height={4}
          fill={healthPercent > 50 ? '#22c55e' : healthPercent > 25 ? '#eab308' : '#ef4444'}
          rx={2}
        />
      </g>
      
      {/* Barra de pressão (embaixo da vida) */}
      {unit.currentPressure > 0 && (
        <g transform={`translate(${-tokenSize}, ${tokenSize + 10})`}>
          <rect width={tokenSize * 2} height={3} fill="#1a1a2e" rx={1} />
          <rect
            width={tokenSize * 2 * (pressurePercent / 100)}
            height={3}
            fill="#a855f7"
            rx={1}
          />
        </g>
      )}
      
      {/* Badge de hits (se > 0) */}
      {unit.hitsReceived > 0 && (
        <g transform={`translate(${tokenSize * 0.6}, ${-tokenSize * 0.6})`}>
          <circle r={10} fill="#ef4444" stroke="#fca5a5" strokeWidth={1} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={10}
            fontWeight="bold"
          >
            {unit.hitsReceived}
          </text>
        </g>
      )}
      
      {/* Indicador de debandada com animação */}
      {unit.isRouting && (
        <>
          {/* Overlay tremendo */}
          <circle
            cx={0}
            cy={0}
            r={tokenSize}
            fill="rgba(255, 100, 0, 0.3)"
            pointerEvents="none"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              dur="0.3s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Ícone de fuga */}
          <g transform={`translate(0, ${-tokenSize - 16})`}>
            <rect
              x={-24}
              y={-8}
              width={48}
              height={16}
              rx={3}
              fill="#dc2626"
              stroke="#fca5a5"
              strokeWidth={1}
            >
              <animate
                attributeName="y"
                values="-8;-10;-8"
                dur="0.5s"
                repeatCount="indefinite"
              />
            </rect>
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={9}
              fontWeight="bold"
              fill="white"
            >
              EM FUGA
            </text>
          </g>
        </>
      )}
      
      {/* Indicador de já agiu */}
      {unit.hasActedThisTurn && (
        <circle
          cx={0}
          cy={0}
          r={tokenSize}
          fill="rgba(0,0,0,0.3)"
          pointerEvents="none"
        />
      )}
    </g>
  );
}

// Função para calcular pontos do triângulo de facing
function getFacingTriangle(facing: string, distance: number): string {
  const angles: Record<string, number> = {
    'N': -90,
    'NE': -30,
    'SE': 30,
    'S': 90,
    'SW': 150,
    'NW': -150,
  };
  
  const angle = (angles[facing] || 0) * Math.PI / 180;
  const size = 6;
  
  const tipX = Math.cos(angle) * distance;
  const tipY = Math.sin(angle) * distance;
  
  const baseAngle1 = angle + Math.PI * 0.8;
  const baseAngle2 = angle - Math.PI * 0.8;
  
  const base1X = tipX + Math.cos(baseAngle1) * size;
  const base1Y = tipY + Math.sin(baseAngle1) * size;
  const base2X = tipX + Math.cos(baseAngle2) * size;
  const base2Y = tipY + Math.sin(baseAngle2) * size;
  
  return `${tipX},${tipY} ${base1X},${base1Y} ${base2X},${base2Y}`;
}
