import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HexGrid } from '@/components/tactical/HexGrid';
import { HexCoord, HexData, BattleUnit } from '@/types/tactical-game';
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

  // Unidades de teste
  const testUnits = useMemo(() => {
    const units: Record<string, BattleUnit> = {};
    
    // Unidades Player 1 (esquerda)
    units['unit1'] = {
      id: 'unit1',
      cardId: 'card1',
      name: 'Infantaria Pesada',
      unitType: 'Infantaria',
      experience: 'Veterano',
      owner: 'player1',
      position: { q: 2, r: 3 },
      facing: 'SE',
      posture: 'Ofensiva',
      baseAttack: 4, currentAttack: 4,
      baseDefense: 4, currentDefense: 3,
      baseRanged: 0, currentRanged: 0,
      baseMovement: 4, currentMovement: 4,
      baseMorale: 4, currentMorale: 4,
      maxHealth: 4, currentHealth: 3,
      maxPressure: 4, currentPressure: 1,
      permanentPressure: 0,
      isRouting: false,
      hasActedThisTurn: false,
      hitsReceived: 1,
      availableTacticalCards: [],
      specialAbilities: [],
    };
    
    units['unit2'] = {
      id: 'unit2',
      cardId: 'card2',
      name: 'Arqueiros',
      unitType: 'Arqueiros',
      experience: 'Profissional',
      owner: 'player1',
      position: { q: 1, r: 4 },
      facing: 'SE',
      posture: 'Ofensiva',
      baseAttack: 2, currentAttack: 2,
      baseDefense: 2, currentDefense: 2,
      baseRanged: 3, currentRanged: 3,
      baseMovement: 4, currentMovement: 4,
      baseMorale: 3, currentMorale: 3,
      maxHealth: 2, currentHealth: 2,
      maxPressure: 3, currentPressure: 0,
      permanentPressure: 0,
      isRouting: false,
      hasActedThisTurn: true,
      hitsReceived: 0,
      availableTacticalCards: [],
      specialAbilities: [],
    };
    
    // Unidades Player 2 (direita)
    units['unit3'] = {
      id: 'unit3',
      cardId: 'card3',
      name: 'Cavalaria Leve',
      unitType: 'Cavalaria',
      experience: 'Elite',
      owner: 'player2',
      position: { q: 17, r: 3 },
      facing: 'NW',
      posture: 'Carga',
      baseAttack: 3, currentAttack: 3,
      baseDefense: 2, currentDefense: 2,
      baseRanged: 0, currentRanged: 0,
      baseMovement: 8, currentMovement: 8,
      baseMorale: 4, currentMorale: 4,
      maxHealth: 2, currentHealth: 2,
      maxPressure: 4, currentPressure: 2,
      permanentPressure: 0,
      isRouting: false,
      hasActedThisTurn: false,
      hitsReceived: 0,
      availableTacticalCards: [],
      specialAbilities: [],
    };
    
    units['unit4'] = {
      id: 'unit4',
      cardId: 'card4',
      name: 'Milícia',
      unitType: 'Infantaria',
      experience: 'Amador',
      owner: 'player2',
      position: { q: 18, r: 4 },
      facing: 'NW',
      posture: 'Defensiva',
      baseAttack: 2, currentAttack: 1,
      baseDefense: 2, currentDefense: 1,
      baseRanged: 0, currentRanged: 0,
      baseMovement: 4, currentMovement: 4,
      baseMorale: 2, currentMorale: 1,
      maxHealth: 2, currentHealth: 1,
      maxPressure: 2, currentPressure: 2,
      permanentPressure: 0,
      isRouting: true,
      hasActedThisTurn: false,
      hitsReceived: 2,
      availableTacticalCards: [],
      specialAbilities: [],
    };
    
    return units;
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
            units={testUnits}
            selectedHexKey={selectedHex || undefined}
            onHexClick={handleHexClick}
            onHexHover={handleHexHover}
          />
        </div>
      </div>
    </div>
  );
}
