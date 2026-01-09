/**
 * TCGCommander - Commander token styled as a character card
 */

import { cn } from '@/lib/utils';
import { Crown, User, Sparkles } from 'lucide-react';
import { SPCommander } from '@/lib/singlePlayerCombatEngine';

interface TCGCommanderProps {
  commander: SPCommander;
  isSelected?: boolean;
  canSelect?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TCGCommander({
  commander,
  isSelected,
  canSelect = true,
  onClick,
  className,
}: TCGCommanderProps) {
  const cmdPercentage = (commander.cmd_free / commander.comando_base) * 100;

  return (
    <div
      className={cn(
        'tcg-commander',
        isSelected && 'tcg-commander--selected',
        commander.is_general && 'tcg-commander--general',
        !canSelect && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={canSelect ? onClick : undefined}
    >
      {/* General Crown */}
      {commander.is_general && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-background rounded-full p-1">
          <Crown className="w-4 h-4 text-yellow-500" />
        </div>
      )}
      
      {/* Avatar */}
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center mb-1',
        'bg-gradient-to-br from-muted to-muted/50',
        'border-2',
        commander.is_general ? 'border-yellow-500/50' : 'border-border'
      )}>
        <User className="w-5 h-5 text-muted-foreground" />
      </div>
      
      {/* Specialization */}
      <span className="text-[10px] font-bold text-center leading-tight">
        {commander.especializacao}
      </span>
      
      {/* CMD Bar */}
      <div className="w-full mt-1 px-2">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all rounded-full',
              cmdPercentage > 50 ? 'bg-primary' : 
              cmdPercentage > 25 ? 'bg-yellow-500' : 
              'bg-red-500'
            )}
            style={{ width: `${cmdPercentage}%` }}
          />
        </div>
        <div className="text-[9px] text-center mt-0.5 text-muted-foreground">
          {commander.cmd_free}/{commander.comando_base}
        </div>
      </div>
      
      {/* Sparkle effect for general */}
      {commander.is_general && (
        <Sparkles className="absolute -right-1 -bottom-1 w-3 h-3 text-yellow-500 animate-pulse" />
      )}
    </div>
  );
}
