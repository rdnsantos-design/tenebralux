import React from 'react';
import { BattleUnit } from '@/types/tactical-game';
import { axialToPixel, HEX_SIZE } from '@/lib/hexUtils';
import { getAttackAngle, AttackAngle } from '@/lib/combatEngine';

interface FlankingIndicatorProps {
  attacker: BattleUnit;
  defender: BattleUnit;
}

export function FlankingIndicator({ attacker, defender }: FlankingIndicatorProps) {
  const direction = getAttackAngle(attacker, defender);
  
  const attackerPos = axialToPixel(attacker.position.q, attacker.position.r);
  const defenderPos = axialToPixel(defender.position.q, defender.position.r);
  
  // Calcular ponto médio para o indicador
  const midX = (attackerPos.x + defenderPos.x) / 2;
  const midY = (attackerPos.y + defenderPos.y) / 2;
  
  // Cores e labels por direção
  const directionConfig: Record<AttackAngle, { color: string; label: string; bonus: string }> = {
    front: { color: '#22c55e', label: 'FRONTAL', bonus: '' },
    flank: { color: '#f59e0b', label: 'FLANCO', bonus: '-2 DEF, +2 ATQ' },
    rear: { color: '#ef4444', label: 'RETAGUARDA', bonus: '-4 DEF, +4 ATQ' },
  };
  
  const config = directionConfig[direction];
  const arrowPoints = calculateArrowPoints(attackerPos, defenderPos);
  
  return (
    <g className="flanking-indicator">
      {/* Linha de ataque animada */}
      <line
        x1={attackerPos.x}
        y1={attackerPos.y}
        x2={defenderPos.x}
        y2={defenderPos.y}
        stroke={config.color}
        strokeWidth={3}
        strokeDasharray="8,4"
        opacity={0.8}
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="24"
          dur="1s"
          repeatCount="indefinite"
        />
      </line>
      
      {/* Seta na direção do ataque */}
      <polygon
        points={arrowPoints}
        fill={config.color}
      />
      
      {/* Badge de direção */}
      <g transform={`translate(${midX}, ${midY - 15})`}>
        <rect
          x={-40}
          y={-10}
          width={80}
          height={20}
          rx={4}
          fill={config.color}
          opacity={0.9}
        />
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
        >
          {config.label}
        </text>
      </g>
      
      {/* Bônus/Penalidade */}
      {config.bonus && (
        <g transform={`translate(${midX}, ${midY + 10})`}>
          <rect
            x={-55}
            y={-8}
            width={110}
            height={16}
            rx={3}
            fill="rgba(0,0,0,0.8)"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill={config.color}
            fontSize="9"
            fontWeight="bold"
          >
            {config.bonus}
          </text>
        </g>
      )}
    </g>
  );
}

function calculateArrowPoints(
  from: { x: number; y: number }, 
  to: { x: number; y: number }
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return '';
  
  // Normalizar
  const nx = dx / len;
  const ny = dy / len;
  
  // Ponto da ponta (próximo ao defensor)
  const tipX = to.x - nx * (HEX_SIZE * 0.8);
  const tipY = to.y - ny * (HEX_SIZE * 0.8);
  
  // Pontos da base da seta
  const arrowSize = 12;
  const perpX = -ny * arrowSize;
  const perpY = nx * arrowSize;
  
  const base1X = tipX - nx * arrowSize + perpX;
  const base1Y = tipY - ny * arrowSize + perpY;
  const base2X = tipX - nx * arrowSize - perpX;
  const base2Y = tipY - ny * arrowSize - perpY;
  
  return `${tipX},${tipY} ${base1X},${base1Y} ${base2X},${base2Y}`;
}
