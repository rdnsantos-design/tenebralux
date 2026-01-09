/**
 * TCGBattleLog - Battle log styled as a scroll/parchment
 */

import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Scroll } from 'lucide-react';

interface LogEntry {
  message: string;
  type?: 'info' | 'damage' | 'effect' | 'phase';
}

interface TCGBattleLogProps {
  logs: LogEntry[];
  maxEntries?: number;
  className?: string;
}

export function TCGBattleLog({ logs, maxEntries = 8, className }: TCGBattleLogProps) {
  const displayedLogs = logs.slice(-maxEntries).reverse();

  return (
    <div className={cn('tcg-log', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
        <Scroll className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Registro de Batalha
        </span>
      </div>
      
      {/* Log Entries */}
      <ScrollArea className="h-24">
        <div className="py-1">
          {displayedLogs.map((log, i) => (
            <div
              key={i}
              className={cn(
                'tcg-log-entry',
                log.type === 'damage' && 'tcg-log-entry--damage',
                log.type === 'effect' && 'tcg-log-entry--effect',
                log.type === 'phase' && 'tcg-log-entry--phase'
              )}
            >
              {log.message}
            </div>
          ))}
          {displayedLogs.length === 0 && (
            <div className="tcg-log-entry text-muted-foreground italic">
              Aguardando início do combate...
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
