/**
 * Display de Carta de Combate
 */

import { CombatCard } from '@/types/tactical-combat';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Crosshair, Move, Sword, Target, Hand, Shield, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CombatCardDisplayProps {
  card: CombatCard;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  theme?: 'akashic' | 'tenebralux';
  /**
   * Se fornecido, mostra valores finais (ficha + manobra + arma + armadura)
   * ao invés dos modificadores crus da carta.
   */
  computedStats?: {
    speed: number; // velocidade final (Reação + mods)
    attack: number; // ataque final (perícia + mods)
    movement: number; // movimento final disponível
  };
}

// Determina o estilo de combate da carta
function getCombatStyle(card: CombatCard): { icon: React.ReactNode; label: string; color: string } {
  const skillId = card.requirements?.skillId;
  
  // Cartas táticas com skill específica
  if (skillId === 'tiro') {
    return { icon: <Target className="h-3 w-3" />, label: 'Tiro', color: 'bg-blue-500/20 text-blue-700 border-blue-500/30' };
  }
  if (skillId === 'laminas') {
    return { icon: <Sword className="h-3 w-3" />, label: 'Lâmina', color: 'bg-orange-500/20 text-orange-700 border-orange-500/30' };
  }
  if (skillId === 'luta') {
    return { icon: <Hand className="h-3 w-3" />, label: 'Luta', color: 'bg-purple-500/20 text-purple-700 border-purple-500/30' };
  }
  
  // Cartas de defesa/postura
  if (card.defenseBonus || card.guardMultiplier || card.type === 'posture') {
    return { icon: <Shield className="h-3 w-3" />, label: 'Defesa', color: 'bg-green-500/20 text-green-700 border-green-500/30' };
  }
  
  // Cartas especiais (reload, swap, rest)
  if (card.id === 'reload' || card.id === 'swap_weapon' || card.id === 'rest') {
    return { icon: <RefreshCw className="h-3 w-3" />, label: 'Ação', color: 'bg-gray-500/20 text-gray-700 border-gray-500/30' };
  }
  
  // Cartas básicas de ataque (universal)
  if (card.attackModifier !== 0 || card.type === 'basic') {
    return { icon: <Crosshair className="h-3 w-3" />, label: 'Universal', color: 'bg-muted text-muted-foreground border-border' };
  }
  
  return { icon: null, label: '', color: '' };
}

export function CombatCardDisplay({
  card,
  isSelected = false,
  isDisabled = false,
  onClick,
  theme = 'akashic',
  computedStats
}: CombatCardDisplayProps) {
  const name = card.name[theme];
  const description = card.description[theme];
  const combatStyle = getCombatStyle(card);

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
      {/* Badge de estilo de combate */}
      <div className="absolute -top-2 -right-2 z-10">
        {combatStyle.icon && (
          <div className={cn(
            'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border',
            combatStyle.color
          )}>
            {combatStyle.icon}
            <span className="hidden sm:inline">{combatStyle.label}</span>
          </div>
        )}
      </div>

      {/* Tipo da carta */}
      <div className="absolute -top-2 left-2">
        <Badge 
          variant={card.type === 'basic' ? 'secondary' : 'default'}
          className="text-xs capitalize"
        >
          {card.type === 'basic' ? 'Básica' : card.type === 'tactical' ? 'Tática' : card.type === 'posture' ? 'Postura' : 'Especial'}
        </Badge>
      </div>

      <CardContent className="p-3 pt-5 space-y-2">
        {/* Nome */}
        <h5 className="font-semibold text-sm text-center truncate">
          {name}
        </h5>

        {/* Modificadores / Valores finais */}
        <div className="flex justify-center gap-2 text-xs">
          {/* Velocidade */}
          <div className={cn(
            'flex items-center gap-0.5 px-1.5 py-0.5 rounded',
            (computedStats?.speed ?? card.speedModifier) <= 1 ? 'bg-green-500/20 text-green-700' :
            (computedStats?.speed ?? card.speedModifier) <= 3 ? 'bg-yellow-500/20 text-yellow-700' :
            'bg-red-500/20 text-red-700'
          )}>
            <Zap className="h-3 w-3" />
            {computedStats ? `T${computedStats.speed}` : `+${card.speedModifier}`}
          </div>

          {/* Ataque */}
          <div className={cn(
            'flex items-center gap-0.5 px-1.5 py-0.5 rounded',
            (computedStats?.attack ?? card.attackModifier) >= 8 ? 'bg-green-500/20 text-green-700' :
            (computedStats?.attack ?? card.attackModifier) >= 0 ? 'bg-yellow-500/20 text-yellow-700' :
            'bg-red-500/20 text-red-700'
          )}>
            <Crosshair className="h-3 w-3" />
            {computedStats ? `ATK ${computedStats.attack}` : `${card.attackModifier >= 0 ? '+' : ''}${card.attackModifier}`}
          </div>

          {/* Movimento */}
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted">
            <Move className="h-3 w-3" />
            {computedStats ? `${computedStats.movement}m` : `${card.movementModifier}m`}
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
