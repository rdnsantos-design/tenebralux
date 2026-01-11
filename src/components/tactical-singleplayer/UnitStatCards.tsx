/**
 * Componente para exibir cards de estatísticas de todas as unidades
 * Permite acompanhar os atributos em tempo real
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { BattleUnit } from '@/types/tactical-game';
import { Sword, Shield, Heart, Target, Move, Flag, AlertTriangle, Skull } from 'lucide-react';

interface UnitStatCardsProps {
  units: Record<string, BattleUnit>;
  showAllies?: boolean;
  showEnemies?: boolean;
}

export function UnitStatCards({ 
  units, 
  showAllies = true, 
  showEnemies = true 
}: UnitStatCardsProps) {
  const allUnits = Object.values(units);
  const playerUnits = allUnits.filter(u => u.owner === 'player1');
  const enemyUnits = allUnits.filter(u => u.owner === 'player2');

  return (
    <div className="space-y-4">
      {showAllies && playerUnits.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Suas Unidades
          </h3>
          <div className="space-y-2">
            {playerUnits.map(unit => (
              <UnitCard key={unit.id} unit={unit} isAlly />
            ))}
          </div>
        </div>
      )}

      {showAllies && showEnemies && <Separator />}

      {showEnemies && enemyUnits.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
            <Skull className="w-4 h-4" />
            Unidades Inimigas
          </h3>
          <div className="space-y-2">
            {enemyUnits.map(unit => (
              <UnitCard key={unit.id} unit={unit} isAlly={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface UnitCardProps {
  unit: BattleUnit;
  isAlly: boolean;
}

function UnitCard({ unit, isAlly }: UnitCardProps) {
  const healthPercent = (unit.currentHealth / unit.maxHealth) * 100;
  const pressurePercent = (unit.currentPressure / unit.maxPressure) * 100;
  
  const isDefeated = unit.currentHealth <= 0;
  const isRouting = unit.isRouting;
  
  const borderColor = isAlly ? 'border-primary/50' : 'border-destructive/50';
  const bgColor = isDefeated 
    ? 'bg-muted/50 opacity-60' 
    : isRouting 
    ? 'bg-yellow-500/10' 
    : 'bg-card';

  return (
    <Card className={`${borderColor} ${bgColor} text-xs`}>
      <CardHeader className="py-1.5 px-2">
        <CardTitle className="text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {unit.name}
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {unit.unitType}
            </Badge>
          </span>
          {isDefeated && (
            <Badge variant="destructive" className="text-[10px]">
              MORTO
            </Badge>
          )}
          {isRouting && !isDefeated && (
            <Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-500">
              EM ROTA
            </Badge>
          )}
          {unit.hasActedThisTurn && !isDefeated && !isRouting && (
            <Badge variant="outline" className="text-[10px]">
              Agiu
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0 space-y-2">
        {/* Health & Pressure Bars */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-red-500" />
            <Progress value={healthPercent} className="h-1.5 flex-1" />
            <span className="text-[10px] w-10 text-right">
              {unit.currentHealth}/{unit.maxHealth}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-orange-500" />
            <Progress 
              value={pressurePercent} 
              className="h-1.5 flex-1 [&>div]:bg-orange-500" 
            />
            <span className="text-[10px] w-10 text-right">
              {unit.currentPressure}/{unit.maxPressure}
            </span>
          </div>
        </div>

        {/* Combat Stats Grid */}
        <div className="grid grid-cols-4 gap-1 text-[10px]">
          <StatBox 
            icon={<Sword className="w-2.5 h-2.5" />} 
            label="ATQ" 
            value={unit.currentAttack} 
            base={unit.baseAttack}
          />
          <StatBox 
            icon={<Shield className="w-2.5 h-2.5" />} 
            label="DEF" 
            value={unit.currentDefense} 
            base={unit.baseDefense}
          />
          <StatBox 
            icon={<Target className="w-2.5 h-2.5" />} 
            label="TIR" 
            value={unit.currentRanged} 
            base={unit.baseRanged}
          />
          <StatBox 
            icon={<Move className="w-2.5 h-2.5" />} 
            label="MOV" 
            value={unit.currentMovement} 
            base={unit.baseMovement}
          />
        </div>

        {/* Additional Stats */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
          <span>Moral: {unit.currentMorale}/{unit.baseMorale}</span>
          <span>Exp: {unit.experience}</span>
          <span>Pos: {unit.posture}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  base: number;
}

function StatBox({ icon, label, value, base }: StatBoxProps) {
  const diff = value - base;
  const diffColor = diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : '';
  
  return (
    <div className="flex flex-col items-center p-1 rounded bg-muted/50">
      <div className="flex items-center gap-0.5 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`font-medium ${diffColor}`}>
        {value}
        {diff !== 0 && (
          <span className="text-[8px]">
            ({diff > 0 ? '+' : ''}{diff})
          </span>
        )}
      </span>
    </div>
  );
}
