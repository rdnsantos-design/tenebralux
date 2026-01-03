import React from 'react';
import { BattleUnit, HexDirection } from '@/types/tactical-game';
import { axialToPixel, HEX_SIZE } from '@/lib/hexUtils';

interface FacingArcProps {
  unit: BattleUnit;
  showArc?: boolean;
}

export function FacingArc({ unit, showArc = true }: FacingArcProps) {
  if (!showArc) return null;
  
  const { x, y } = axialToPixel(unit.position.q, unit.position.r);
  
  // Ângulos por direção de facing (flat-top hexagons)
  const facingAngles: Record<HexDirection, number> = {
    'SE': 0,
    'S': 60,
    'SW': 120,
    'NW': 180,
    'N': 240,
    'NE': 300,
  };
  
  const centerAngle = facingAngles[unit.facing] || 0;
  const arcRadius = HEX_SIZE * 1.3;
  
  // Arco frontal: ±60° do facing (120° total)
  const frontStart = centerAngle - 60;
  const frontEnd = centerAngle + 60;
  
  // Arco de flanco esquerdo: 60-120° 
  const flankLeft = { start: centerAngle + 60, end: centerAngle + 120 };
  // Arco de flanco direito: -60 a -120°
  const flankRight = { start: centerAngle - 120, end: centerAngle - 60 };
  
  // Arco de retaguarda: 120-180° de cada lado (60° total de cada lado = 120° no total)
  const rearStart = centerAngle + 120;
  const rearEnd = centerAngle + 240; // equivale a -120°
  
  return (
    <g className="facing-arc" opacity={0.4}>
      {/* Arco frontal - verde */}
      <path
        d={describeArc(x, y, arcRadius, frontStart, frontEnd)}
        fill="none"
        stroke="#22c55e"
        strokeWidth={5}
        strokeLinecap="round"
      />
      
      {/* Arco flanco esquerdo - amarelo */}
      <path
        d={describeArc(x, y, arcRadius, flankLeft.start, flankLeft.end)}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={5}
        strokeLinecap="round"
      />
      
      {/* Arco flanco direito - amarelo */}
      <path
        d={describeArc(x, y, arcRadius, flankRight.start, flankRight.end)}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={5}
        strokeLinecap="round"
      />
      
      {/* Arco retaguarda - vermelho */}
      <path
        d={describeArc(x, y, arcRadius, rearStart, rearEnd)}
        fill="none"
        stroke="#ef4444"
        strokeWidth={5}
        strokeLinecap="round"
      />
      
      {/* Indicador de direção frontal */}
      <g>
        {(() => {
          const frontAngleRad = (centerAngle - 90) * Math.PI / 180;
          const indicatorRadius = arcRadius + 10;
          const indicatorX = x + indicatorRadius * Math.cos(frontAngleRad);
          const indicatorY = y + indicatorRadius * Math.sin(frontAngleRad);
          
          return (
            <>
              <circle
                cx={indicatorX}
                cy={indicatorY}
                r={6}
                fill="#22c55e"
                stroke="white"
                strokeWidth={1}
              />
              <text
                x={indicatorX}
                y={indicatorY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="7"
                fontWeight="bold"
              >
                F
              </text>
            </>
          );
        })()}
      </g>
    </g>
  );
}

function describeArc(
  x: number, 
  y: number, 
  radius: number, 
  startAngle: number, 
  endAngle: number
): string {
  // Normalizar ângulos
  let start = startAngle;
  let end = endAngle;
  
  // Calcular pontos
  const startPoint = polarToCartesian(x, y, radius, end);
  const endPoint = polarToCartesian(x, y, radius, start);
  
  // Determinar se é arco grande (> 180°)
  let diff = end - start;
  if (diff < 0) diff += 360;
  const largeArcFlag = diff > 180 ? "1" : "0";
  
  return [
    "M", startPoint.x, startPoint.y,
    "A", radius, radius, 0, largeArcFlag, 0, endPoint.x, endPoint.y
  ].join(" ");
}

function polarToCartesian(
  cx: number, 
  cy: number, 
  radius: number, 
  angleInDegrees: number
) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}
