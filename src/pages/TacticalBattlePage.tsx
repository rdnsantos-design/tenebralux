import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TacticalGameProvider, useTacticalGame } from '@/contexts/TacticalGameContext';
import { HexGrid } from '@/components/tactical/HexGrid';
import { UnitDetailPanel } from '@/components/tactical/UnitDetailPanel';
import { RoutingPanel } from '@/components/tactical/RoutingPanel';
import { TurnTracker } from '@/components/tactical/TurnTracker';
import { PhaseModal } from '@/components/tactical/PhaseModal';
import { CombatPreview } from '@/components/tactical/CombatPreview';
import { BattleHeader } from '@/components/tactical/BattleHeader';
import { VictoryModal } from '@/components/tactical/VictoryModal';
import { MiniMap } from '@/components/tactical/MiniMap';
import { QuickActions } from '@/components/tactical/QuickActions';
import { BattleTacticalCards } from '@/components/tactical/BattleTacticalCards';
import { useTacticalMatch, TacticalMatch } from '@/hooks/useTacticalMatch';
import { usePlayerId } from '@/hooks/usePlayerId';
import { hexKey } from '@/lib/hexUtils';
import { GamePhase, HexCoord, BattleUnit } from '@/types/tactical-game';
import { ArrowLeft, Loader2, Users, Clock, Target } from 'lucide-react';

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
    attackUnit,
    endPhase,
    rollInitiative,
    getUnit,
    setPosture,
    canUsePosture,
  } = useTacticalGame();
  
  const [hoveredTarget, setHoveredTarget] = useState<BattleUnit | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showFacing, setShowFacing] = useState(true);
  
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
        await attackUnit(selectedUnitId, hex.unitId);
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
  
  const handlePostureChange = async (posture: 'Ofensiva' | 'Defensiva' | 'Carga' | 'Reorganização') => {
    if (selectedUnitId && canUsePosture(selectedUnitId, posture)) {
      await setPosture(selectedUnitId, posture);
    }
  };
  
  const handleHexHover = (coord: HexCoord | null) => {
    if (!coord || !gameState) {
      setHoveredTarget(null);
      return;
    }
    
    const key = hexKey(coord);
    const hex = gameState.hexes[key];
    
    if (hex?.unitId && selectedUnitId) {
      const targetUnit = gameState.units[hex.unitId];
      if (targetUnit && targetUnit.owner !== myPlayerId) {
        setHoveredTarget(targetUnit);
        return;
      }
    }
    
    setHoveredTarget(null);
  };
  
  // Count units per player
  const player1Units = Object.values(gameState.units).filter(u => u.owner === 'player1' && !u.isRouting).length;
  const player2Units = Object.values(gameState.units).filter(u => u.owner === 'player2' && !u.isRouting).length;
  
  // Convert selectedUnitId to selectedHexKey for HexGrid
  const selectedHexKey = selectedUnit ? hexKey(selectedUnit.position) : undefined;
  
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Phase Modal */}
      <PhaseModal />
      
      {/* Victory Modal */}
      <VictoryModal />
      
      {/* Header melhorado */}
      <BattleHeader />
      
      {/* Turn Tracker */}
      <div className="border-b bg-card/50 backdrop-blur-sm px-4 py-2">
        <TurnTracker />
        
        {/* Turn indicator when waiting */}
        {!isMyTurn && gameState.phase !== 'initiative' && (
          <div className="flex items-center justify-center gap-2 py-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-pulse" />
            Aguardando {gameState.activePlayer === 'player1' ? gameState.player1Name : gameState.player2Name}...
          </div>
        )}
      </div>
      
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
            selectedAttacker={selectedUnit || undefined}
            hoveredTarget={hoveredTarget || undefined}
            showFacingArcs={showFacing}
            onHexClick={handleHexClick}
            onHexHover={handleHexHover}
          />
        </div>
        
        {/* Right sidebar */}
        <div className="w-80 flex-shrink-0 border-l bg-card/50 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {/* Quick Actions e MiniMap */}
              <div className="grid grid-cols-2 gap-2">
                <QuickActions 
                  showGrid={showGrid}
                  onToggleGrid={() => setShowGrid(!showGrid)}
                  showFacing={showFacing}
                  onToggleFacing={() => setShowFacing(!showFacing)}
                />
                <MiniMap />
              </div>
              
              {/* Combat Preview quando mirando em alvo */}
              {selectedUnit && hoveredTarget && validTargets.includes(hoveredTarget.id) && (
                <CombatPreview attacker={selectedUnit} defender={hoveredTarget} />
              )}
              
              {/* Unidade selecionada */}
              {selectedUnit ? (
                <>
                  <UnitDetailPanel
                    unit={selectedUnit}
                    commander={embeddedCommander}
                    isMyUnit={selectedUnit.owner === myPlayerId}
                    canChangePosture={isMyTurn && gameState.phase === 'movement' && !selectedUnit.hasActedThisTurn}
                    onPostureChange={handlePostureChange}
                    onClose={() => selectUnit(null)}
                  />
                  {selectedUnit.owner === myPlayerId && embeddedCommander && (
                    <BattleTacticalCards
                      unit={selectedUnit}
                      commander={embeddedCommander}
                    />
                  )}
                </>
              ) : (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4 text-center text-slate-500">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Selecione uma unidade</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Routing Panel */}
              <RoutingPanel />
              
              {/* Battle Log */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Log de Batalha</CardTitle>
                </CardHeader>
                <CardContent className="p-2 max-h-48 overflow-auto">
                  <div className="space-y-1">
                    {[...gameState.battleLog].reverse().slice(0, 15).map((entry) => (
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
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
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
