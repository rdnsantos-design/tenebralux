import React from 'react';
import { useTacticalGame } from '@/contexts/TacticalGameContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Move, 
  Swords, 
  Eye,
  EyeOff,
  Grid3X3,
  SkipForward,
  Crosshair,
  Zap,
  FastForward
} from 'lucide-react';
import { GamePhase } from '@/types/tactical-game';

interface QuickActionsProps {
  showGrid: boolean;
  onToggleGrid: () => void;
  showFacing: boolean;
  onToggleFacing: () => void;
}

const PHASE_INFO: Record<GamePhase, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  setup: { label: 'Preparação', icon: <Grid3X3 className="h-3 w-3" />, color: 'bg-slate-500', description: 'Configurando a batalha...' },
  initiative: { label: 'Iniciativa', icon: <Zap className="h-3 w-3" />, color: 'bg-yellow-500', description: 'Role para determinar quem age primeiro' },
  movement: { label: 'Movimento', icon: <Move className="h-3 w-3" />, color: 'bg-blue-500', description: 'Mova suas unidades pelo campo' },
  shooting: { label: 'Tiro', icon: <Crosshair className="h-3 w-3" />, color: 'bg-orange-500', description: 'Unidades com ataque à distância podem atirar' },
  charge: { label: 'Carga', icon: <FastForward className="h-3 w-3" />, color: 'bg-purple-500', description: 'Cavalaria pode declarar cargas' },
  melee: { label: 'Combate', icon: <Swords className="h-3 w-3" />, color: 'bg-red-500', description: 'Resolva combates corpo-a-corpo' },
  rout: { label: 'Fuga', icon: <Move className="h-3 w-3" />, color: 'bg-gray-500', description: 'Unidades em fuga se movem' },
  reorganization: { label: 'Reorganização', icon: <Grid3X3 className="h-3 w-3" />, color: 'bg-green-500', description: 'Recupere moral e reorganize' },
  end_turn: { label: 'Fim do Turno', icon: <SkipForward className="h-3 w-3" />, color: 'bg-slate-600', description: 'Preparando próximo turno...' },
};

export function QuickActions({ 
  showGrid, 
  onToggleGrid,
  showFacing,
  onToggleFacing
}: QuickActionsProps) {
  const { gameState, myPlayerId, isMyTurn, selectedUnitId, validMoves, validTargets, passTurn, endPhase } = useTacticalGame();
  
  if (!gameState) return null;
  
  const selectedUnit = selectedUnitId ? gameState.units[selectedUnitId] : null;
  const isMyUnit = selectedUnit?.owner === myPlayerId;
  const phaseInfo = PHASE_INFO[gameState.phase];
  
  const handlePassTurn = async () => {
    await passTurn();
  };
  
  const handleEndPhase = async () => {
    await endPhase();
  };
  
  // Verificar se há unidades que podem atirar
  const myShootingUnits = Object.values(gameState.units).filter(
    u => u.owner === myPlayerId && u.currentRanged > 0 && !u.isRouting
  );
  
  // Verificar se há cavalaria para carga
  const myCavalry = Object.values(gameState.units).filter(
    u => u.owner === myPlayerId && u.unitType === 'Cavalaria' && !u.isRouting
  );
  
  return (
    <div className="bg-slate-800 rounded-lg p-2 space-y-2">
      {/* Fase atual */}
      <div className="space-y-1">
        <h4 className="text-xs text-slate-400">Fase Atual</h4>
        <Badge className={`${phaseInfo.color} text-white w-full justify-center`}>
          {phaseInfo.icon}
          <span className="ml-1">{phaseInfo.label}</span>
        </Badge>
        <p className="text-xs text-slate-400 text-center">{phaseInfo.description}</p>
      </div>
      
      {/* Ações de fase */}
      {isMyTurn && (
        <div className="space-y-1">
          <h4 className="text-xs text-slate-400">Ações</h4>
          
          {/* Passar a vez - sempre disponível */}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-8 border-amber-500 text-amber-400 hover:bg-amber-500/20"
            onClick={handlePassTurn}
          >
            <SkipForward className="h-3 w-3 mr-1" />
            Passar a Vez
          </Button>
          
          {/* Avançar fase */}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-8 border-green-500 text-green-400 hover:bg-green-500/20"
            onClick={handleEndPhase}
          >
            <FastForward className="h-3 w-3 mr-1" />
            Avançar Fase
          </Button>
          
          {/* Dicas de fase */}
          {gameState.phase === 'movement' && (
            <div className="text-xs text-blue-400 p-2 bg-blue-500/10 rounded">
              <p>💡 Clique em uma unidade sua para selecioná-la, depois clique em um hex azul para mover.</p>
            </div>
          )}
          
          {gameState.phase === 'shooting' && myShootingUnits.length > 0 && (
            <div className="text-xs text-orange-400 p-2 bg-orange-500/10 rounded">
              <p>🎯 Selecione uma unidade de arqueiros e clique em um inimigo vermelho para atirar.</p>
            </div>
          )}
          
          {gameState.phase === 'charge' && myCavalry.length > 0 && (
            <div className="text-xs text-purple-400 p-2 bg-purple-500/10 rounded">
              <p>🐎 Cavalaria pode declarar cargas contra inimigos próximos.</p>
            </div>
          )}
          
          {gameState.phase === 'melee' && (
            <div className="text-xs text-red-400 p-2 bg-red-500/10 rounded">
              <p>⚔️ Selecione uma unidade em combate e clique no inimigo adjacente para atacar.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Info da seleção */}
      {selectedUnit && (
        <div className="space-y-1">
          <h4 className="text-xs text-slate-400">Unidade Selecionada</h4>
          {isMyUnit && validMoves.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <Move className="h-3 w-3" />
              {validMoves.length} movimentos possíveis
            </div>
          )}
          {isMyUnit && validTargets.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-400">
              <Swords className="h-3 w-3" />
              {validTargets.length} alvos disponíveis - clique para atacar!
            </div>
          )}
          {isMyUnit && selectedUnit.currentRanged > 0 && gameState.phase !== 'shooting' && (
            <div className="flex items-center gap-1 text-xs text-yellow-400">
              <Crosshair className="h-3 w-3" />
              Avance para fase de Tiro para usar arcos
            </div>
          )}
        </div>
      )}
      
      {/* Toggle buttons */}
      <div className="flex gap-1">
        <Button
          variant={showGrid ? "secondary" : "ghost"}
          size="sm"
          className="text-xs h-7 flex-1"
          onClick={onToggleGrid}
        >
          <Grid3X3 className="h-3 w-3 mr-1" />
          Grid
        </Button>
        <Button
          variant={showFacing ? "secondary" : "ghost"}
          size="sm"
          className="text-xs h-7 flex-1"
          onClick={onToggleFacing}
        >
          {showFacing ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
          Facing
        </Button>
      </div>
      
      {/* Status do turno */}
      <div className="text-center">
        {isMyTurn ? (
          <Badge className="bg-green-600 text-xs">Sua vez de jogar</Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-slate-400">Aguardando oponente</Badge>
        )}
      </div>
    </div>
  );
}
