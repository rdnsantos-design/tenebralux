import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HexGrid } from '@/components/tactical/HexGrid';
import { HexCoord, HexData } from '@/types/tactical-game';
import { generateMapHexes, hexKey } from '@/lib/hexUtils';
import { ArrowLeft, Map } from 'lucide-react';

export default function TacticalBattleTestPage() {
  const navigate = useNavigate();
  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const [lastClicked, setLastClicked] = useState<HexCoord | null>(null);
  const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);

  // Gerar hexes do mapa com terreno variado
  const hexes = useMemo(() => {
    const result: Record<string, HexData> = {};
    const allCoords = generateMapHexes();
    
    for (const coord of allCoords) {
      const key = hexKey(coord);
      // Adicionar alguma variação de terreno para visualização
      let terrain: HexData['terrain'] = 'plains';
      const rand = Math.random();
      if (rand < 0.15) terrain = 'forest';
      else if (rand < 0.2) terrain = 'hill';
      else if (rand < 0.22) terrain = 'river';
      
      result[key] = { coord, terrain };
    }
    return result;
  }, []);

  const handleHexClick = (coord: HexCoord) => {
    const key = hexKey(coord);
    setSelectedHex(key);
    setLastClicked(coord);
    console.log('Hex clicked:', coord, 'Terrain:', hexes[key]?.terrain);
  };

  const handleHexHover = (coord: HexCoord | null) => {
    setHoveredHex(coord);
  };

  const hexCount = Object.keys(hexes).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/tactical')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Teste do Grid Hexagonal</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Total: {hexCount} hexágonos</span>
          {hoveredHex && (
            <span className="text-foreground">
              Hover: ({hoveredHex.q}, {hoveredHex.r})
            </span>
          )}
          {lastClicked && (
            <span className="text-primary font-medium">
              Selecionado: ({lastClicked.q}, {lastClicked.r}) - {hexes[hexKey(lastClicked)]?.terrain}
            </span>
          )}
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 p-4">
        <div className="w-full h-[calc(100vh-120px)] border rounded-lg overflow-hidden">
          <HexGrid
            hexes={hexes}
            selectedHexKey={selectedHex || undefined}
            onHexClick={handleHexClick}
            onHexHover={handleHexHover}
          />
        </div>
      </div>
    </div>
  );
}
