/**
 * Log de Batalha - mostra eventos do combate
 */

import { BattleLogEntry } from '@/types/tactical-combat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface BattleLogProps {
  entries: BattleLogEntry[];
  maxHeight?: string;
}

export function BattleLog({ entries, maxHeight = '200px' }: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para baixo quando novas entradas são adicionadas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="border rounded-lg bg-muted/30">
      <div className="px-3 py-2 border-b bg-muted/50">
        <h4 className="text-sm font-semibold">Log de Combate</h4>
      </div>
      <ScrollArea className="p-2" style={{ maxHeight }} ref={scrollRef}>
        <div className="space-y-1">
          {entries.map((entry, index) => (
            <div
              key={index}
              className={cn(
                'text-xs px-2 py-1 rounded',
                entry.type === 'system' && 'bg-primary/10 text-primary font-medium',
                entry.type === 'action' && 'bg-muted',
                entry.type === 'damage' && 'bg-destructive/10 text-destructive',
                entry.type === 'effect' && 'bg-amber-500/10 text-amber-700'
              )}
            >
              <span className="text-muted-foreground mr-2">
                [{entry.round}.{entry.tick}]
              </span>
              {entry.message}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
