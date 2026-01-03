import React from 'react';
import { useTacticalGame } from '@/contexts/TacticalGameContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Move, 
  Swords, 
  Eye,
  EyeOff,
  Grid3X3
} from 'lucide-react';

interface QuickActionsProps {
  showGrid: boolean;
  onToggleGrid: () => void;
  showFacing: boolean;
  onToggleFacing: () => void;
}

export function QuickActions({ 
  showGrid, 
  onToggleGrid,
  showFacing,
  onToggleFacing
}: QuickActionsProps) {
  const { gameState, myPlayerId, isMyTurn, selectedUnitId, validMoves, validTargets } = useTacticalGame();
  
  if (!gameState) return null;
  
  const selectedUnit = selectedUnitId ? gameState.units[selectedUnitId] : null;
  const isMyUnit = selectedUnit?.owner === myPlayerId;
  
  return (
    <div className="bg-slate-800 rounded-lg p-2 space-y-2">
      <h4 className="text-xs text-slate-400">Ações Rápidas</h4>
      
      {/* Info da seleção */}
      {selectedUnit && (
        <div className="space-y-1">
          {isMyUnit && validMoves.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <Move className="h-3 w-3" />
              {validMoves.length} movimentos possíveis
            </div>
          )}
          {isMyUnit && validTargets.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-400">
              <Swords className="h-3 w-3" />
              {validTargets.length} alvos disponíveis
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
