import React from 'react';
import { BattleUnit } from '@/types/tactical-game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Sword, Crosshair, Heart, AlertTriangle, Zap } from 'lucide-react';

interface UnitTooltipProps {
  unit: BattleUnit;
  position: { x: number; y: number };
}

export function UnitTooltip({ unit, position }: UnitTooltipProps) {
  const healthPercent = (unit.currentHealth / unit.maxHealth) * 100;
  const pressurePercent = (unit.currentPressure / unit.maxPressure) * 100;
  
  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: position.x + 20,
        top: position.y,
        transform: 'translateY(-50%)',
      }}
    >
      <Card className="w-64 bg-slate-900/95 border-slate-700 shadow-xl">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm flex items-center justify-between">
            {unit.name}
            <Badge variant={unit.owner === 'player1' ? 'destructive' : 'default'}>
              {unit.owner === 'player1' ? 'P1' : 'P2'}
            </Badge>
          </CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {unit.unitType}
            <span>•</span>
            {unit.experience}
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-1 text-center text-xs">
            <div className="flex flex-col items-center">
              <Sword className="h-3 w-3 text-red-400" />
              <span className="text-foreground">
                {unit.currentAttack}/{unit.baseAttack}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="h-3 w-3 text-blue-400" />
              <span className="text-foreground">
                {unit.currentDefense}/{unit.baseDefense}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Crosshair className="h-3 w-3 text-green-400" />
              <span className="text-foreground">
                {unit.currentRanged}/{unit.baseRanged}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-yellow-400 text-xs">MOV</span>
              <span className="text-foreground">{unit.currentMovement}</span>
            </div>
            <div className="flex flex-col items-center">
              <Heart className="h-3 w-3 text-pink-400" />
              <span className="text-foreground">
                {unit.currentMorale}/{unit.baseMorale}
              </span>
            </div>
          </div>
          
          {/* Vida */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-green-400 flex items-center gap-1">
                <Heart className="h-3 w-3" /> Vida
              </span>
              <span>{unit.currentHealth}/{unit.maxHealth}</span>
            </div>
            <Progress value={healthPercent} className="h-2" />
          </div>
          
          {/* Pressão */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-purple-400 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Pressão
              </span>
              <span>{unit.currentPressure}/{unit.maxPressure}</span>
            </div>
            <Progress value={pressurePercent} className="h-2 [&>div]:bg-purple-500" />
          </div>
          
          {/* Status */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {unit.posture}
            </Badge>
            {unit.isRouting && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Em Fuga!
              </Badge>
            )}
            {unit.hasActedThisTurn && (
              <Badge variant="secondary" className="text-xs">
                Já agiu
              </Badge>
            )}
            {unit.hitsReceived > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unit.hitsReceived} hits
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
