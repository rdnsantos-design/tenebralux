import React from 'react';
import { BattleUnit } from '@/types/tactical-game';
import { getAttackAngle, getPostureModifiers, getAngleModifiers, getExperienceModifier } from '@/lib/combatEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sword, Shield, AlertTriangle } from 'lucide-react';

interface CombatPreviewProps {
  attacker: BattleUnit;
  defender: BattleUnit;
}

export function CombatPreview({ attacker, defender }: CombatPreviewProps) {
  const direction = getAttackAngle(attacker, defender);
  
  // Calcular modificadores do atacante
  const attackerPosture = getPostureModifiers(attacker);
  const attackerExp = getExperienceModifier(attacker.experience);
  const angleAttackMod = getAngleModifiers(direction).attack;
  
  // Calcular modificadores do defensor
  const defenderPosture = getPostureModifiers(defender);
  const defenderExp = getExperienceModifier(defender.experience);
  const angleDefenseMod = getAngleModifiers(direction).defense;
  
  // Valores efetivos
  const effectiveAttack = Math.max(0, 
    attacker.currentAttack + 
    attackerPosture.attack + 
    attackerExp + 
    angleAttackMod
  );
  
  const effectiveDefense = Math.max(0, 
    defender.currentDefense + 
    defenderPosture.defense + 
    defenderExp + 
    angleDefenseMod
  );
  
  // Diferença base (sem rolagens)
  const expectedDiff = effectiveAttack - effectiveDefense;
  
  // Estimar resultado
  let estimatedResult = 'Empate provável';
  let resultColor = 'text-muted-foreground';
  
  if (expectedDiff >= 5) {
    estimatedResult = 'Vantagem Alta (+Hit)';
    resultColor = 'text-green-400';
  } else if (expectedDiff >= 2) {
    estimatedResult = 'Vantagem Moderada';
    resultColor = 'text-green-400';
  } else if (expectedDiff > 0) {
    estimatedResult = 'Leve Vantagem';
    resultColor = 'text-yellow-400';
  } else if (expectedDiff < -4) {
    estimatedResult = 'Desvantagem Alta';
    resultColor = 'text-red-400';
  } else if (expectedDiff < 0) {
    estimatedResult = 'Desvantagem';
    resultColor = 'text-orange-400';
  }
  
  const directionLabels = {
    front: { label: 'Frontal', color: 'bg-green-600', textColor: 'text-green-400' },
    flank: { label: 'Flanco', color: 'bg-amber-600', textColor: 'text-amber-400' },
    rear: { label: 'Retaguarda', color: 'bg-red-600', textColor: 'text-red-400' },
  };
  
  const dirConfig = directionLabels[direction];
  
  // Calcular bônus exibidos
  const attackBonusTotal = attackerPosture.attack + attackerExp + angleAttackMod;
  const defenseBonusTotal = defenderPosture.defense + defenderExp + angleDefenseMod;
  
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sword className="h-4 w-4" />
            Preview de Combate
          </CardTitle>
          <Badge className={dirConfig.color}>
            {dirConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 space-y-3">
        {/* Atacante */}
        <div className="flex items-center justify-between p-2 bg-red-500/10 rounded border border-red-500/20">
          <div className="flex items-center gap-2">
            <Sword className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium truncate max-w-[100px]">
              {attacker.name}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">ATQ:</span>
            <span className={attackBonusTotal !== 0 ? (attackBonusTotal > 0 ? 'text-green-400' : 'text-red-400') : ''}>
              {effectiveAttack}
            </span>
            {attackBonusTotal !== 0 && (
              <span className={`text-xs ${attackBonusTotal > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({attackBonusTotal > 0 ? '+' : ''}{attackBonusTotal})
              </span>
            )}
          </div>
        </div>
        
        {/* VS */}
        <div className="text-center text-xs text-muted-foreground">vs</div>
        
        {/* Defensor */}
        <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded border border-blue-500/20">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium truncate max-w-[100px]">
              {defender.name}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">DEF:</span>
            <span className={defenseBonusTotal !== 0 ? (defenseBonusTotal > 0 ? 'text-green-400' : 'text-red-400') : ''}>
              {effectiveDefense}
            </span>
            {defenseBonusTotal !== 0 && (
              <span className={`text-xs ${defenseBonusTotal > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({defenseBonusTotal > 0 ? '+' : ''}{defenseBonusTotal})
              </span>
            )}
          </div>
        </div>
        
        {/* Resultado estimado */}
        <div className="pt-2 border-t border-border/50 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimativa:</span>
            <span className={`font-medium ${resultColor}`}>
              {estimatedResult}
            </span>
          </div>
          
          {/* Bônus de flanqueamento */}
          {direction !== 'front' && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Bônus de {dirConfig.label}:</span>
              <span className={dirConfig.textColor}>
                +{angleAttackMod} ATQ / {angleDefenseMod} DEF
              </span>
            </div>
          )}
        </div>
        
        {/* Aviso de contra-ataque */}
        {defender.currentAttack > 0 && defender.posture !== 'Reorganização' && (
          <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded border border-amber-500/20 text-xs text-amber-400">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            <span>Defensor pode contra-atacar!</span>
          </div>
        )}
        
        {/* Modificadores detalhados */}
        <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/30">
          <div className="flex justify-between">
            <span>Postura Atq: {attacker.posture}</span>
            <span>{attackerPosture.attack >= 0 ? '+' : ''}{attackerPosture.attack}</span>
          </div>
          <div className="flex justify-between">
            <span>Postura Def: {defender.posture}</span>
            <span>{defenderPosture.defense >= 0 ? '+' : ''}{defenderPosture.defense}</span>
          </div>
          <div className="flex justify-between">
            <span>Exp Atq: {attacker.experience}</span>
            <span>{attackerExp >= 0 ? '+' : ''}{attackerExp}</span>
          </div>
          <div className="flex justify-between">
            <span>Exp Def: {defender.experience}</span>
            <span>{defenderExp >= 0 ? '+' : ''}{defenderExp}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
