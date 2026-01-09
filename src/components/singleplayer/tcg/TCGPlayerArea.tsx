/**
 * TCGPlayerArea - Player's battle area with HP, stats, and role indicator
 */

import { cn } from '@/lib/utils';
import { Heart, Swords, Shield, Zap, Crown } from 'lucide-react';

interface TCGPlayerAreaProps {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  mobility: number;
  isAttacker?: boolean;
  isDefender?: boolean;
  isPlayer?: boolean;
  className?: string;
}

export function TCGPlayerArea({
  name,
  hp,
  maxHp,
  attack,
  defense,
  mobility,
  isAttacker,
  isDefender,
  isPlayer = true,
  className,
}: TCGPlayerAreaProps) {
  const hpPercentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const isLowHp = hpPercentage <= 25;
  const isCriticalHp = hpPercentage <= 10;

  return (
    <div
      className={cn(
        'tcg-player-area',
        isAttacker && 'tcg-player-area--attacker',
        isDefender && 'tcg-player-area--defender',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Role Badge */}
          {(isAttacker || isDefender) && (
            <div className={cn(
              'p-1.5 rounded-lg',
              isAttacker ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
            )}>
              {isAttacker ? <Swords className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            </div>
          )}
          
          {/* Name */}
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1">
              {isPlayer && <Crown className="w-3 h-3 text-yellow-500" />}
              {name}
            </h3>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {isAttacker ? 'Atacante' : isDefender ? 'Defensor' : isPlayer ? 'Seu Exército' : 'Inimigo'}
            </span>
          </div>
        </div>
        
        {/* HP Display */}
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <Heart className={cn(
              'w-4 h-4',
              isCriticalHp ? 'text-red-500 animate-pulse' : 
              isLowHp ? 'text-orange-500' : 
              'text-red-400'
            )} />
            <span className={cn(
              'font-bold text-lg tabular-nums',
              isCriticalHp ? 'text-red-500' : 
              isLowHp ? 'text-orange-500' : ''
            )}>
              {hp}
            </span>
            <span className="text-muted-foreground text-sm">/ {maxHp}</span>
          </div>
        </div>
      </div>
      
      {/* HP Bar */}
      <div className="tcg-hp-bar mb-3">
        <div 
          className={cn(
            'tcg-hp-fill',
            isPlayer ? 'tcg-hp-fill--player' : 'tcg-hp-fill--enemy'
          )}
          style={{ width: `${hpPercentage}%` }}
        />
        <div className="tcg-hp-text">
          {Math.round(hpPercentage)}%
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex gap-2 justify-center">
        <div className="tcg-stat tcg-stat--attack">
          <Swords className="w-3.5 h-3.5" />
          <span>{attack}</span>
        </div>
        <div className="tcg-stat tcg-stat--defense">
          <Shield className="w-3.5 h-3.5" />
          <span>{defense}</span>
        </div>
        <div className="tcg-stat tcg-stat--mobility">
          <Zap className="w-3.5 h-3.5" />
          <span>{mobility}</span>
        </div>
      </div>
    </div>
  );
}
