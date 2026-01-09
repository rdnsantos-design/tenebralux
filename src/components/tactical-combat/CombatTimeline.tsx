/**
 * Timeline de Combate
 * 
 * Visualiza ticks 0-20 com marcadores de combatentes e ações pendentes
 * 
 * COMO FUNCIONA O SISTEMA DE TICKS:
 * - Cada combatente tem seu próprio "currentTick" que indica QUANDO ele pode agir
 * - O tick da batalha avança para o menor currentTick entre os combatentes ativos
 * - Quando um combatente age, seu currentTick aumenta baseado na velocidade da ação
 * - Ticks menores = age primeiro
 */

import React from 'react';
import { Combatant, CombatAction } from '@/types/tactical-combat';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ArrowRight, Swords, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  
  // Agrupar combatentes por tick (usando o tick do combatente, não o global)
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
  
  // Próximo a agir (menor tick)
  const nextToAct = combatants
    .filter(c => !c.stats.isDown)
    .sort((a, b) => a.stats.currentTick - b.stats.currentTick)[0];
  
  // Todos prontos para agir no tick atual
  const readyToAct = combatants
    .filter(c => !c.stats.isDown && c.stats.currentTick <= currentTick);
  
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline de Combate
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">Como funciona:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Cada combatente tem um <strong>tick</strong> indicando quando age</li>
                    <li>• Quem tem o <strong>menor tick</strong> age primeiro</li>
                    <li>• Após agir, o tick aumenta baseado na velocidade da ação</li>
                    <li>• A timeline faz loop do 20 para o 0</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Rodada {round}</Badge>
            <Badge variant="secondary">Tick Global: {currentTick}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Info do próximo a agir */}
        {nextToAct && (
          <div className="mb-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Próximo a agir:</span>
              <Badge variant={nextToAct.team === 'player' ? 'default' : 'destructive'}>
                {nextToAct.name}
              </Badge>
              <span className="text-muted-foreground">
                (Tick {nextToAct.stats.currentTick})
              </span>
              {nextToAct.team === 'player' && (
                <span className="text-green-600 font-medium ml-auto">
                  ✓ Sua vez!
                </span>
              )}
              {nextToAct.team === 'enemy' && (
                <span className="text-red-500 font-medium ml-auto">
                  Aguardando inimigo...
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Timeline visual */}
        <div className="relative">
          {/* Linha base */}
          <div className="flex items-center gap-0.5 overflow-x-auto pb-2">
            {ticks.map((tick) => {
              const isCurrent = tick === currentTick % (maxTick + 1);
              const hasCombatants = combatantsByTick[tick]?.length > 0;
              const hasActions = actionsByTick[tick]?.length > 0;
              const isNextToAct = nextToAct && (nextToAct.stats.currentTick % (maxTick + 1)) === tick;
              
              return (
                <div key={tick} className="flex flex-col items-center min-w-[32px]">
                  {/* Marcadores de combatentes */}
                  <div className="h-8 flex flex-col items-center justify-end gap-0.5 mb-1">
                    {combatantsByTick[tick]?.map((c) => (
                      <TooltipProvider key={c.id}>
                        <Tooltip>
                          <TooltipTrigger>
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                c.team === 'player' 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-destructive text-destructive-foreground",
                                isNextToAct && c.id === nextToAct?.id && "ring-2 ring-yellow-400 ring-offset-1"
                              )}
                            >
                              {c.name.charAt(0)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{c.name}</p>
                            <p className="text-xs text-muted-foreground">Tick: {c.stats.currentTick}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                  
                  {/* Tick */}
                  <div
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center text-xs font-mono transition-all",
                      isCurrent 
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" 
                        : isNextToAct
                        ? "bg-yellow-500 text-yellow-950 ring-1 ring-yellow-400"
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
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span>Próximo a agir</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary rounded ring-1 ring-offset-1" />
            <span>Tick global</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded-sm" />
            <span>Ação pendente</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
