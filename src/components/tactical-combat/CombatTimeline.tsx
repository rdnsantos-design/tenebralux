/**
 * Timeline de Combate
 * 
 * Visualiza ticks 0-20 com marcadores de combatentes e ações pendentes
 */

import React from 'react';
import { Combatant, CombatAction } from '@/types/tactical-combat';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ArrowRight, Swords, Shield, User, Skull } from 'lucide-react';

interface CombatTimelineProps {
  currentTick: number;
  maxTick?: number;
  combatants: Combatant[];
  pendingActions?: CombatAction[];
  round: number;
}

export function CombatTimeline({
  currentTick,
  maxTick = 20,
  combatants,
  pendingActions = [],
  round
}: CombatTimelineProps) {
  // Gerar array de ticks
  const ticks = Array.from({ length: maxTick + 1 }, (_, i) => i);
  
  // Agrupar combatentes por tick
  const combatantsByTick = combatants.reduce((acc, c) => {
    if (c.stats.isDown) return acc;
    const tick = c.stats.currentTick % (maxTick + 1);
    if (!acc[tick]) acc[tick] = [];
    acc[tick].push(c);
    return acc;
  }, {} as Record<number, Combatant[]>);
  
  // Agrupar ações pendentes por tick de execução
  const actionsByTick = pendingActions.reduce((acc, a) => {
    const tick = a.executesAtTick % (maxTick + 1);
    if (!acc[tick]) acc[tick] = [];
    acc[tick].push(a);
    return acc;
  }, {} as Record<number, CombatAction[]>);
  
  // Próximos a agir
  const readyToAct = combatants
    .filter(c => !c.stats.isDown && c.stats.currentTick === currentTick)
    .map(c => c.name);
  
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline de Combate
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Rodada {round}</Badge>
            <Badge variant="secondary">Tick {currentTick}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline visual */}
        <div className="relative">
          {/* Linha base */}
          <div className="flex items-center gap-0.5 overflow-x-auto pb-2">
            {ticks.map((tick) => {
              const isCurrent = tick === currentTick % (maxTick + 1);
              const hasCombatants = combatantsByTick[tick]?.length > 0;
              const hasActions = actionsByTick[tick]?.length > 0;
              
              return (
                <div key={tick} className="flex flex-col items-center min-w-[32px]">
                  {/* Marcadores de combatentes */}
                  <div className="h-8 flex flex-col items-center justify-end gap-0.5 mb-1">
                    {combatantsByTick[tick]?.map((c, i) => (
                      <div
                        key={c.id}
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                          c.team === 'player' 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-destructive text-destructive-foreground"
                        )}
                        title={c.name}
                      >
                        {c.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                  
                  {/* Tick */}
                  <div
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center text-xs font-mono",
                      isCurrent 
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" 
                        : hasCombatants
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tick}
                  </div>
                  
                  {/* Ações pendentes */}
                  <div className="h-6 flex items-start justify-center mt-1">
                    {hasActions && (
                      <div 
                        className="w-4 h-4 bg-amber-500 rounded-sm flex items-center justify-center"
                        title={`${actionsByTick[tick].length} ação(ões) pendente(s)`}
                      >
                        <Swords className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Indicador de loop */}
            <div className="flex items-center text-muted-foreground ml-2">
              <ArrowRight className="h-4 w-4" />
              <span className="text-xs ml-1">0</span>
            </div>
          </div>
        </div>
        
        {/* Info adicional */}
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {readyToAct.length > 0 && (
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">Prontos (tick {currentTick}):</span>{' '}
              {readyToAct.join(', ')}
            </div>
          )}
        </div>
        
        {/* Legenda */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Jogador</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span>Inimigo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded-sm" />
            <span>Ação pendente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary rounded ring-1 ring-offset-1" />
            <span>Tick atual</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
