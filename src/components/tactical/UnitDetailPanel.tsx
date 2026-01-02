import React from 'react';
import { BattleUnit, BattleCommander } from '@/types/tactical-game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Sword, 
  Crosshair, 
  Heart, 
  AlertTriangle, 
  Zap, 
  Move, 
  Crown,
  X
} from 'lucide-react';
import { Posture } from '@/types/cards/unit-card';

interface UnitDetailPanelProps {
  unit: BattleUnit | null;
  commander?: BattleCommander | null;
  isMyUnit: boolean;
  canChangePosture: boolean;
  onPostureChange?: (posture: Posture) => void;
  onClose: () => void;
}

export function UnitDetailPanel({ 
  unit, 
  commander,
  isMyUnit, 
  canChangePosture,
  onPostureChange,
  onClose 
}: UnitDetailPanelProps) {
  if (!unit) return null;
  
  const healthPercent = (unit.currentHealth / unit.maxHealth) * 100;
  const pressurePercent = (unit.currentPressure / unit.maxPressure) * 100;
  
  const postureOptions: Posture[] = ['Ofensiva', 'Defensiva', 'Carga', 'Reorganização'];
  
  return (
    <Card className="w-80 bg-card/95 backdrop-blur-sm border-border shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {unit.name}
            <Badge 
              variant={unit.owner === 'player1' ? 'destructive' : 'default'}
              className="text-xs"
            >
              {unit.owner === 'player1' ? 'P1' : 'P2'}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{unit.unitType}</span>
          <span>•</span>
          <span>{unit.experience}</span>
          <span>•</span>
          <Badge variant="outline" className="text-xs">{unit.posture}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-2 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-red-500/20 text-red-500">
              <Sword className="h-4 w-4" />
            </div>
            <span className="text-xs mt-1">{unit.currentAttack}/{unit.baseAttack}</span>
            <span className="text-[10px] text-muted-foreground">ATK</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-500/20 text-blue-500">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-xs mt-1">{unit.currentDefense}/{unit.baseDefense}</span>
            <span className="text-[10px] text-muted-foreground">DEF</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-green-500/20 text-green-500">
              <Crosshair className="h-4 w-4" />
            </div>
            <span className="text-xs mt-1">{unit.currentRanged}/{unit.baseRanged}</span>
            <span className="text-[10px] text-muted-foreground">RNG</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-yellow-500/20 text-yellow-500">
              <Move className="h-4 w-4" />
            </div>
            <span className="text-xs mt-1">{unit.currentMovement}</span>
            <span className="text-[10px] text-muted-foreground">MOV</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-purple-500/20 text-purple-500">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-xs mt-1">{unit.currentMorale}/{unit.baseMorale}</span>
            <span className="text-[10px] text-muted-foreground">MRL</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Health & Pressure bars */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-500" />
                Vida
              </span>
              <span>{unit.currentHealth}/{unit.maxHealth}</span>
            </div>
            <Progress 
              value={healthPercent} 
              className="h-2"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                Pressão
              </span>
              <span>{unit.currentPressure}/{unit.maxPressure}</span>
            </div>
            <Progress 
              value={pressurePercent} 
              className="h-2 [&>div]:bg-orange-500"
            />
          </div>
        </div>
        
        {/* Status */}
        <div className="flex flex-wrap gap-1">
          {unit.isRouting && (
            <Badge variant="destructive" className="text-xs">
              Em Fuga!
            </Badge>
          )}
          {unit.hasActedThisTurn && (
            <Badge variant="secondary" className="text-xs">
              Já agiu
            </Badge>
          )}
          {unit.hitsReceived > 0 && (
            <Badge variant="outline" className="text-xs">
              {unit.hitsReceived} hits
            </Badge>
          )}
        </div>
        
        {/* Commander info if embedded */}
        {commander && commander.embeddedUnitId === unit.id && (
          <>
            <Separator />
            <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Crown className="h-4 w-4 text-yellow-500" />
                {commander.name}
              </div>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                <span>EST: {commander.strategy}</span>
                <span>CMD: {commander.command}</span>
                <span>GRD: {commander.guard}</span>
              </div>
            </div>
          </>
        )}
        
        {/* Posture change (if my unit and allowed) */}
        {isMyUnit && canChangePosture && onPostureChange && (
          <>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground mb-2 block">Mudar Postura:</span>
              <div className="grid grid-cols-2 gap-1">
                {postureOptions.map(posture => (
                  <Button
                    key={posture}
                    size="sm"
                    variant={unit.posture === posture ? 'default' : 'outline'}
                    className="text-xs"
                    onClick={() => onPostureChange(posture)}
                    disabled={unit.posture === posture}
                  >
                    {posture}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
        
        {/* Special Abilities */}
        {unit.specialAbilities.length > 0 && (
          <>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground mb-1 block">Habilidades:</span>
              <div className="space-y-1">
                {unit.specialAbilities.map((ability, i) => (
                  <div key={i} className="text-xs p-1 rounded bg-muted/50">
                    <span className="font-medium">{ability.name}</span>
                    {ability.description && (
                      <span className="text-muted-foreground ml-1">- {ability.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
