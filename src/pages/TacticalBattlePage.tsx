import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TacticalGameProvider, useTacticalGame } from '@/contexts/TacticalGameContext';
import { HexGrid } from '@/components/tactical/HexGrid';
import { UnitDetailPanel } from '@/components/tactical/UnitDetailPanel';
import { useTacticalMatch, TacticalMatch } from '@/hooks/useTacticalMatch';
import { usePlayerId } from '@/hooks/usePlayerId';
import { hexKey } from '@/lib/hexUtils';
import { GamePhase } from '@/types/tactical-game';
import { ArrowLeft, Loader2, SkipForward, Dices, Users, Clock } from 'lucide-react';

function BattleContent() {
  const navigate = useNavigate();
  const {
    gameState,
    isLoading,
    myPlayerId,
    isMyTurn,
    selectedUnitId,
    validMoves,
    validTargets,
    selectUnit,
    moveUnit,
    endPhase,
    rollInitiative,
    getUnit,
    setPosture,
    canUsePosture,
  } = useTacticalGame();
  
  if (isLoading || !gameState) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const selectedUnit = selectedUnitId ? getUnit(selectedUnitId) : null;
  const embeddedCommander = selectedUnit 
    ? Object.values(gameState.commanders).find(c => c.embeddedUnitId === selectedUnit.id)
    : null;
  
  const handleHexClick = async (coord: { q: number; r: number }) => {
    const key = hexKey(coord);
    const hex = gameState.hexes[key];
    
    // Se clicou em hex com unidade
    if (hex?.unitId) {
      // Se já tenho unidade selecionada e o clique é em inimigo (alvo válido)
      if (selectedUnitId && validTargets.includes(hex.unitId)) {
        console.log('Atacar:', selectedUnitId, '->', hex.unitId);
        return;
      }
      
      // Selecionar a unidade
      selectUnit(selectedUnitId === hex.unitId ? null : hex.unitId);
      return;
    }
    
    // Se clicou em hex vazio e tenho unidade selecionada
    if (selectedUnitId && validMoves.some(m => m.q === coord.q && m.r === coord.r)) {
      await moveUnit(selectedUnitId, coord);
    } else {
      selectUnit(null);
    }
  };
  
  const handleRollInitiative = async () => {
    if (gameState.phase === 'initiative') {
      await rollInitiative();
    }
  };
  
  const handleEndPhase = async () => {
    await endPhase();
  };
  
  const handlePostureChange = async (posture: 'Ofensiva' | 'Defensiva' | 'Carga' | 'Reorganização') => {
    if (selectedUnitId && canUsePosture(selectedUnitId, posture)) {
      await setPosture(selectedUnitId, posture);
    }
  };
  
  const phaseNames: Record<GamePhase, string> = {
    setup: '⚙️ Preparação',
    initiative: '🎲 Iniciativa',
    movement: '🚶 Movimento',
    shooting: '🏹 Tiro',
    charge: '🐴 Carga',
    melee: '⚔️ Combate',
    rout: '💨 Debandada',
    reorganization: '🔄 Reorganização',
    end_turn: '⏭️ Fim do Turno',
  };
  
  // Count units per player
  const player1Units = Object.values(gameState.units).filter(u => u.owner === 'player1' && !u.isRouting).length;
  const player2Units = Object.values(gameState.units).filter(u => u.owner === 'player2' && !u.isRouting).length;
  
  // Convert selectedUnitId to selectedHexKey for HexGrid
  const selectedHexKey = selectedUnit ? hexKey(selectedUnit.position) : undefined;
  
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-card/50 backdrop-blur-sm px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/tactical')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Sair
            </Button>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Turno {gameState.turn}
              </Badge>
              <Badge 
                variant={isMyTurn ? 'default' : 'secondary'}
                className="text-sm"
              >
                {phaseNames[gameState.phase]}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Player info */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className={myPlayerId === 'player1' ? 'font-bold' : ''}>
                  {gameState.player1Name}
                </span>
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {player1Units}
                </Badge>
              </div>
              
              <span className="text-muted-foreground">vs</span>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className={myPlayerId === 'player2' ? 'font-bold' : ''}>
                  {gameState.player2Name}
                </span>
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {player2Units}
                </Badge>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {gameState.phase === 'initiative' && (
                <Button size="sm" onClick={handleRollInitiative}>
                  <Dices className="h-4 w-4 mr-2" />
                  Rolar Iniciativa
                </Button>
              )}
              
              {isMyTurn && gameState.phase !== 'initiative' && (
                <Button size="sm" variant="outline" onClick={handleEndPhase}>
                  <SkipForward className="h-4 w-4 mr-2" />
                  Próxima Fase
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Turn indicator */}
        {!isMyTurn && gameState.phase !== 'initiative' && (
          <div className="flex items-center justify-center gap-2 py-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-pulse" />
            Aguardando {gameState.activePlayer === 'player1' ? gameState.player1Name : gameState.player2Name}...
          </div>
        )}
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map area */}
        <div className="flex-1 relative overflow-auto bg-gradient-to-br from-background to-muted/30">
          <HexGrid
            hexes={gameState.hexes}
            units={gameState.units}
            commanders={gameState.commanders}
            selectedHexKey={selectedHexKey}
            validMoves={validMoves}
            validTargets={validTargets}
            onHexClick={handleHexClick}
          />
        </div>
        
        {/* Right sidebar */}
        <div className="w-80 flex-shrink-0 border-l bg-card/50 flex flex-col">
          {/* Unit detail panel */}
          {selectedUnit && (
            <div className="p-2 border-b">
              <UnitDetailPanel
                unit={selectedUnit}
                commander={embeddedCommander}
                isMyUnit={selectedUnit.owner === myPlayerId}
                canChangePosture={isMyTurn && gameState.phase === 'movement' && !selectedUnit.hasActedThisTurn}
                onPostureChange={handlePostureChange}
                onClose={() => selectUnit(null)}
              />
            </div>
          )}
          
          {/* Battle log */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b">
              <h3 className="text-sm font-medium">Registro de Batalha</h3>
            </div>
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-1">
                {[...gameState.battleLog].reverse().slice(0, 50).map((entry) => (
                  <div 
                    key={entry.id} 
                    className={`text-xs p-1 rounded ${
                      entry.type === 'system' 
                        ? 'bg-muted text-muted-foreground' 
                        : entry.type === 'combat'
                        ? 'bg-red-500/10 text-red-500'
                        : entry.type === 'movement'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-muted/50'
                    }`}
                  >
                    <span className="opacity-50">[T{entry.turn}]</span> {entry.message}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TacticalBattlePage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { playerId } = usePlayerId();
  const { getMatch, loading: matchLoading } = useTacticalMatch();
  const [match, setMatch] = useState<TacticalMatch | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  
  const fetchMatch = useCallback(async () => {
    if (matchId) {
      const m = await getMatch(matchId);
      if (m) {
        setMatch(m);
      } else {
        setMatchError('Partida não encontrada');
      }
    }
  }, [matchId, getMatch]);
  
  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);
  
  if (!matchId) {
    navigate('/tactical');
    return null;
  }
  
  if (matchLoading || (!match && !matchError)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (matchError || !match) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <p className="text-destructive">{matchError || 'Erro ao carregar partida'}</p>
        <Button onClick={() => navigate('/tactical')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }
  
  return (
    <TacticalGameProvider matchId={matchId} playerId={playerId}>
      <BattleContent />
    </TacticalGameProvider>
  );
}
