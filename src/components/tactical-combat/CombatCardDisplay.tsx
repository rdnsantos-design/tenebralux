/**
 * Display de Carta de Combate
 */

import { CombatCard } from '@/types/tactical-combat';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Crosshair, Move } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CombatCardDisplayProps {
  card: CombatCard;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  theme?: 'akashic' | 'tenebralux';
}

export function CombatCardDisplay({
  card,
  isSelected = false,
  isDisabled = false,
  onClick,
  theme = 'akashic'
}: CombatCardDisplayProps) {
  const name = card.name[theme];
  const description = card.description[theme];

  return (
    <Card
      className={cn(
        'relative transition-all duration-200 min-w-[140px] max-w-[160px]',
        card.type === 'basic' && 'border-muted',
        card.type === 'tactical' && 'border-primary',
        card.type === 'special' && 'border-amber-500',
        isSelected && 'ring-2 ring-primary scale-105 shadow-lg',
        isDisabled && 'opacity-50 cursor-not-allowed',
        !isDisabled && onClick && 'cursor-pointer hover:shadow-md hover:scale-102'
      )}
      onClick={isDisabled ? undefined : onClick}
    >
      {/* Tipo da carta */}
      <div className="absolute -top-2 left-2">
        <Badge 
          variant={card.type === 'basic' ? 'secondary' : 'default'}
          className="text-xs capitalize"
        >
          {card.type === 'basic' ? 'Básica' : card.type === 'tactical' ? 'Tática' : 'Especial'}
        </Badge>
      </div>

      <CardContent className="p-3 pt-4 space-y-2">
        {/* Nome */}
        <h5 className="font-semibold text-sm text-center truncate">
          {name}
        </h5>

        {/* Modificadores */}
        <div className="flex justify-center gap-2 text-xs">
          <div className={cn(
            'flex items-center gap-0.5 px-1.5 py-0.5 rounded',
            card.speedModifier <= 1 ? 'bg-green-500/20 text-green-700' : 
            card.speedModifier <= 3 ? 'bg-yellow-500/20 text-yellow-700' : 
            'bg-red-500/20 text-red-700'
          )}>
            <Zap className="h-3 w-3" />
            +{card.speedModifier}
          </div>
          
          <div className={cn(
            'flex items-center gap-0.5 px-1.5 py-0.5 rounded',
            card.attackModifier >= 2 ? 'bg-green-500/20 text-green-700' : 
            card.attackModifier >= 0 ? 'bg-yellow-500/20 text-yellow-700' : 
            'bg-red-500/20 text-red-700'
          )}>
            <Crosshair className="h-3 w-3" />
            {card.attackModifier >= 0 ? '+' : ''}{card.attackModifier}
          </div>
          
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted">
            <Move className="h-3 w-3" />
            {card.movementModifier}m
          </div>
        </div>

        {/* Descrição curta */}
        <p className="text-xs text-muted-foreground text-center line-clamp-2">
          {description}
        </p>

        {/* Efeito especial */}
        {card.effect && (
          <div className="text-xs text-center italic text-primary">
            ✨ {card.effect}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
