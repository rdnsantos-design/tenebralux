import React, { useState, useRef, useCallback, useMemo } from 'react';
import { HexCoord, HexData, BattleUnit, BattleCommander } from '@/types/tactical-game';
import { 
  axialToPixel, 
  hexCorners, 
  hexKey, 
  generateMapHexes, 
  calculateViewBox,
  HEX_SIZE 
} from '@/lib/hexUtils';

interface HexGridProps {
  hexes: Record<string, HexData>;
  units?: Record<string, BattleUnit>;
  commanders?: Record<string, BattleCommander>;
  selectedHexKey?: string;
  validMoves?: HexCoord[];
  validTargets?: string[];
  onHexClick?: (coord: HexCoord) => void;
  onHexHover?: (coord: HexCoord | null) => void;
}

const TERRAIN_COLORS: Record<string, string> = {
  plains: '#4a7c4e',
  forest: '#2d5a2e',
  hill: '#8b7355',
  river: '#4a90d9',
  fortification: '#6b6b6b',
};

export function HexGrid({
  hexes,
  units = {},
  commanders = {},
  selectedHexKey,
  validMoves = [],
  validTargets = [],
  onHexClick,
  onHexHover,
}: HexGridProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredHex, setHoveredHex] = useState<string | null>(null);

  const { width, height, viewBox } = useMemo(() => calculateViewBox(), []);
  
  const validMoveKeys = useMemo(
    () => new Set(validMoves.map(c => hexKey(c))),
    [validMoves]
  );

  const allHexCoords = useMemo(() => generateMapHexes(), []);

  // Zoom com scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.min(Math.max(s * delta, 0.5), 2.5));
  }, []);

  // Pan com drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Renderizar hexágono individual
  const renderHex = (coord: HexCoord) => {
    const key = hexKey(coord);
    const hexData = hexes[key] || { coord, terrain: 'plains' };
    const { x, y } = axialToPixel(coord.q, coord.r);
    const points = hexCorners(x, y, HEX_SIZE - 1);
    
    const isSelected = selectedHexKey === key;
    const isValidMove = validMoveKeys.has(key);
    const isHovered = hoveredHex === key;
    const isValidTarget = hexData.unitId && validTargets.includes(hexData.unitId);

    let fill = TERRAIN_COLORS[hexData.terrain] || TERRAIN_COLORS.plains;
    let strokeColor = '#1a1a2e';
    let strokeWidth = 1;
    let opacity = 1;

    if (isValidMove) {
      fill = '#4a90d9';
      opacity = 0.6;
    }
    if (isValidTarget) {
      fill = '#e94560';
      opacity = 0.7;
    }
    if (isSelected) {
      strokeColor = '#ffd700';
      strokeWidth = 3;
    }
    if (isHovered && !isSelected) {
      opacity = 0.85;
      strokeWidth = 2;
    }

    return (
      <g key={key}>
        <polygon
          points={points}
          fill={fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          className="cursor-pointer transition-opacity duration-150"
          onClick={() => onHexClick?.(coord)}
          onMouseEnter={() => {
            setHoveredHex(key);
            onHexHover?.(coord);
          }}
          onMouseLeave={() => {
            setHoveredHex(null);
            onHexHover?.(null);
          }}
        />
        {/* Coordenadas para debug */}
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fill="rgba(255,255,255,0.5)"
          pointerEvents="none"
        >
          {coord.q},{coord.r}
        </text>
      </g>
    );
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-slate-900 rounded-lg"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setScale(s => Math.min(s * 1.2, 2.5))}
          className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center justify-center"
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(s * 0.8, 0.5))}
          className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center justify-center"
        >
          -
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center justify-center text-xs"
        >
          ⟲
        </button>
      </div>

      {/* Info de zoom */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-800/80 px-3 py-1 rounded text-xs text-slate-300">
        Zoom: {Math.round(scale * 100)}% | Shift+Drag para mover
      </div>

      {/* SVG do mapa */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={viewBox}
        className="select-none"
        onContextMenu={(e) => e.preventDefault()}
        style={{
          transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
          transformOrigin: 'center center',
        }}
      >
        {/* Renderizar todos os hexágonos */}
        {allHexCoords.map(coord => renderHex(coord))}
      </svg>
    </div>
  );
}
