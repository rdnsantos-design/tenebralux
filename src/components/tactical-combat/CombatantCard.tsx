/**
 * Card de Combatente - mostra stats e status
 */

import { Combatant } from '@/types/tactical-combat';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Heart, Shield, Zap, Move, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CombatantCardProps {
  combatant: Combatant;
  isActive?: boolean;
  isTargetable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export function CombatantCard({
  combatant,
  isActive = false,
  isTargetable = false,
  isSelected = false,
  onClick
}: CombatantCardProps) {
  const { stats, name, team } = combatant;
  const vitalityPercent = (stats.vitality / stats.maxVitality) * 100;
  const isDown = stats.isDown;

  return (
    <Card
      className={cn(
        'relative transition-all duration-200 cursor-pointer',
        team === 'player' ? 'border-primary/50' : 'border-destructive/50',
        isActive && 'ring-2 ring-primary shadow-lg scale-105',
        isTargetable && 'hover:ring-2 hover:ring-destructive cursor-crosshair',
        isSelected && 'ring-2 ring-destructive',
        isDown && 'opacity-50 grayscale',
        onClick && 'hover:shadow-md'
      )}
      onClick={onClick}
    >
      {/* Indicador de turno ativo */}
      {isActive && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="animate-pulse">
            Turno Ativo
          </Badge>
        </div>
      )}

      <CardContent className="p-3 space-y-2">
        {/* Nome e Team */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm truncate">{name}</h4>
          <Badge variant={team === 'player' ? 'default' : 'destructive'} className="text-xs">
            {team === 'player' ? 'Aliado' : 'Inimigo'}
          </Badge>
        </div>

        {/* Barra de Vitalidade */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-destructive" />
              Vitalidade
            </span>
            <span>{stats.vitality}/{stats.maxVitality}</span>
          </div>
          <Progress 
            value={vitalityPercent} 
            className="h-2"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-blue-500" />
            <span>Guarda: {stats.guard}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            <span>Evasão: {stats.evasion}</span>
          </div>
          <div className="flex items-center gap-1">
            <Move className="h-3 w-3 text-green-500" />
            <span>Mov: {stats.currentMovement}m</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-purple-500" />
            <span>Tick: {stats.currentTick}</span>
          </div>
        </div>

        {/* Arma e Armadura */}
        <div className="text-xs text-muted-foreground space-y-0.5">
          {stats.weapon && (
            <div className="truncate">
              🗡️ {stats.weapon.name.akashic} (D{stats.weapon.damage})
            </div>
          )}
          {stats.armor && stats.armor.guardBonus > 0 && (
            <div className="truncate">
              🛡️ {stats.armor.name.akashic}
            </div>
          )}
        </div>

        {/* Status de Down */}
        {isDown && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <span className="text-destructive font-bold text-lg">FORA DE COMBATE</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
