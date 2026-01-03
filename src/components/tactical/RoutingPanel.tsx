import React from 'react';
import { BattleUnit, BattleCommander, hexToKey } from '@/types/tactical-game';
import { useTacticalGame } from '@/contexts/TacticalGameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Flag, Users, Crown } from 'lucide-react';
import { getNeighbors, hexKey } from '@/lib/hexUtils';

export function RoutingPanel() {
  const { gameState, myPlayerId, isMyTurn, rallyUnit } = useTacticalGame();
  
  if (!gameState) return null;
  
  // Encontrar unidades em debandada do meu time
  const myRoutingUnits = Object.values(gameState.units).filter(
    u => u.owner === myPlayerId && u.isRouting && u.currentHealth > 0
  );
  
  // Encontrar comandantes disponíveis para rally
  const myCommanders = Object.values(gameState.commanders).filter(
    c => c.owner === myPlayerId && !c.hasActedThisTurn
  );
  
  if (myRoutingUnits.length === 0) return null;
  
  const canRally = gameState.phase === 'rout' && isMyTurn;
  
  return (
    <Card className="bg-orange-950/50 border-orange-500/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-orange-400">
          <AlertTriangle className="h-4 w-4" />
          Unidades em Debandada ({myRoutingUnits.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {myRoutingUnits.map(unit => (
          <RoutingUnitItem 
            key={unit.id} 
            unit={unit} 
            commanders={myCommanders}
            canRally={canRally}
          />
        ))}
        
        {gameState.phase !== 'rout' && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Rally disponível na fase de Debandada
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface RoutingUnitItemProps {
  unit: BattleUnit;
  commanders: BattleCommander[];
  canRally: boolean;
}

function RoutingUnitItem({ unit, commanders, canRally }: RoutingUnitItemProps) {
  const { rallyUnit, gameState } = useTacticalGame();
  
  // Verificar se há comandante adjacente ou próximo que pode fazer rally
  const getAvailableRallyCommanders = (): BattleCommander[] => {
    if (!gameState) return [];
    
    return commanders.filter(cmd => {
      // Comandante adjacente (distância 1)
      const dq = Math.abs(cmd.position.q - unit.position.q);
      const dr = Math.abs(cmd.position.r - unit.position.r);
      const ds = Math.abs((-cmd.position.q - cmd.position.r) - (-unit.position.q - unit.position.r));
      const distance = Math.max(dq, dr, ds);
      
      // Rally normal: adjacente (distância 1)
      return distance <= 1;
    });
  };
  
  // Verificar se há unidade aliada desengajada adjacente
  const hasAdjacentAlly = (): boolean => {
    if (!gameState) return false;
    
    const neighbors = getNeighbors(unit.position);
    
    for (const neighbor of neighbors) {
      const key = hexKey(neighbor);
      const hex = gameState.hexes[key];
      if (hex?.unitId) {
        const adjacentUnit = gameState.units[hex.unitId];
        if (adjacentUnit && 
            adjacentUnit.owner === unit.owner && 
            !adjacentUnit.isRouting &&
            adjacentUnit.currentHealth > 0) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  const availableCommanders = getAvailableRallyCommanders();
  const canRallyWithAlly = hasAdjacentAlly();
  const canPerformRally = canRally && (availableCommanders.length > 0 || canRallyWithAlly);
  
  const handleRally = async (commanderId?: string) => {
    // Para rally com aliado adjacente, passa undefined/empty - o contexto deve tratar isso
    await rallyUnit(commanderId ?? '', unit.id);
  };
  
  return (
    <div className="p-2 rounded bg-orange-900/30 border border-orange-500/20">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Flag className="h-3 w-3 text-orange-400" />
          <span className="text-sm font-medium">{unit.name}</span>
        </div>
        <Badge variant="destructive" className="text-xs">
          Em Fuga
        </Badge>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">
        Vida: {unit.currentHealth}/{unit.maxHealth} | 
        Pressão: {unit.currentPressure}/{unit.maxPressure}
      </p>
      
      {canPerformRally ? (
        <div className="space-y-1">
          {availableCommanders.map(cmd => (
            <Button
              key={cmd.id}
              size="sm"
              variant="outline"
              className="w-full text-xs border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
              onClick={() => handleRally(cmd.id)}
            >
              <Crown className="h-3 w-3 mr-1" />
              Rally com {cmd.name}
            </Button>
          ))}
          
          {canRallyWithAlly && availableCommanders.length === 0 && (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
              onClick={() => handleRally()}
            >
              <Users className="h-3 w-3 mr-1" />
              Rally com Aliado Adjacente
            </Button>
          )}
        </div>
      ) : (
        <p className="text-xs text-orange-300/70 italic">
          {!canRally ? 'Aguarde a fase de Debandada' : 'Sem comandante ou aliado próximo para rally'}
        </p>
      )}
    </div>
  );
}
