/**
 * TCGCard - Card component styled as a TCG card
 */

import { cn } from '@/lib/utils';
import { Swords, Shield, Zap, Crown } from 'lucide-react';
import { SPCard } from '@/lib/singlePlayerCombatEngine';

interface TCGCardProps {
  card: SPCard;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-24 h-32',
  md: 'w-32 h-44',
  lg: 'w-40 h-56',
};

const typeStyles = {
  ofensiva: 'tcg-card--offensive',
  defensiva: 'tcg-card--defensive',
  movimentacao: 'tcg-card--movement',
  reacao: 'tcg-card--reaction',
};

const typeIcons = {
  ofensiva: <Swords className="w-4 h-4" />,
  defensiva: <Shield className="w-4 h-4" />,
  movimentacao: <Zap className="w-4 h-4" />,
  reacao: <Crown className="w-4 h-4" />,
};

const typeColors = {
  ofensiva: 'text-red-400',
  defensiva: 'text-blue-400',
  movimentacao: 'text-yellow-400',
  reacao: 'text-purple-400',
};

export function TCGCard({
  card,
  isSelected,
  isPlayable = true,
  onClick,
  onDoubleClick,
  size = 'md',
  className,
}: TCGCardProps) {
  return (
    <div
      className={cn(
        'tcg-card',
        sizeClasses[size],
        typeStyles[card.card_type] || '',
        isSelected && 'tcg-card--selected',
        !isPlayable && 'tcg-card--disabled',
        'flex flex-col cursor-pointer select-none',
        className
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Card Frame */}
      <div className="tcg-card-frame" />
      
      {/* Card Header */}
      <div className="relative px-2 pt-2 pb-1">
        {/* Type Icon */}
        <div className={cn(
          'absolute top-2 right-2 p-1 rounded-full',
          'bg-background/50 backdrop-blur-sm',
          typeColors[card.card_type]
        )}>
          {typeIcons[card.card_type]}
        </div>
        
        {/* Card Name */}
        <h3 className="font-bold text-xs leading-tight pr-6 line-clamp-2">
          {card.name}
        </h3>
      </div>
      
      {/* Card Art Area (placeholder) */}
      <div className="flex-1 mx-2 rounded bg-gradient-to-b from-muted/50 to-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className={cn('w-12 h-12', typeColors[card.card_type])}>
            {typeIcons[card.card_type]}
          </div>
        </div>
        
        {/* VET Cost Badge */}
        <div className="absolute top-1 left-1 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-bold">
          {card.vet_cost} VET
        </div>
        
        {/* Command Requirement */}
        {card.command_required > 0 && (
          <div className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            CMD {card.command_required}
          </div>
        )}
      </div>
      
      {/* Stats Bar */}
      <div className="px-2 py-1.5 flex justify-center gap-2 text-[10px] font-bold">
        {card.attack_bonus !== 0 && (
          <span className="flex items-center gap-0.5 text-red-400">
            <Swords className="w-3 h-3" />
            {card.attack_bonus > 0 ? '+' : ''}{card.attack_bonus}
          </span>
        )}
        {card.defense_bonus !== 0 && (
          <span className="flex items-center gap-0.5 text-blue-400">
            <Shield className="w-3 h-3" />
            {card.defense_bonus > 0 ? '+' : ''}{card.defense_bonus}
          </span>
        )}
        {card.mobility_bonus !== 0 && (
          <span className="flex items-center gap-0.5 text-yellow-400">
            <Zap className="w-3 h-3" />
            {card.mobility_bonus > 0 ? '+' : ''}{card.mobility_bonus}
          </span>
        )}
        {card.attack_bonus === 0 && card.defense_bonus === 0 && card.mobility_bonus === 0 && (
          <span className="text-muted-foreground">Especial</span>
        )}
      </div>
      
      {/* Type Label */}
      <div className={cn(
        'text-center py-0.5 text-[9px] font-medium uppercase tracking-wider',
        'bg-gradient-to-r from-transparent via-foreground/10 to-transparent',
        typeColors[card.card_type]
      )}>
        {card.card_type}
      </div>
    </div>
  );
}
