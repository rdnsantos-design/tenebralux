/**
 * SinglePlayerBasicCards - Cartas básicas para o modo single player
 * Cada carta pode ser usada apenas 1x por partida
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Sword, Shield, Zap, RotateCcw, CheckCircle2 } from 'lucide-react';
import { SPBasicCardsUsed, SPCombatPhase } from '@/lib/singlePlayerCombatEngine';

interface BasicCardDef {
  id: keyof SPBasicCardsUsed;
  name: string;
  icon: React.ReactNode;
  effect: string;
  color: string;
  allowedPhases: SPCombatPhase[];
}

const BASIC_CARDS: BasicCardDef[] = [
  { 
    id: 'heal', 
    name: 'Cura', 
    icon: <Heart className="w-4 h-4" />, 
    effect: '-5 dano recebido',
    color: 'text-green-500',
    allowedPhases: ['combat_resolution']
  },
  { 
    id: 'attack', 
    name: 'Ataque', 
    icon: <Sword className="w-4 h-4" />, 
    effect: '+1 ATK na rodada',
    color: 'text-red-500',
    allowedPhases: ['attack_maneuver', 'attack_reaction']
  },
  { 
    id: 'defense', 
    name: 'Defesa', 
    icon: <Shield className="w-4 h-4" />, 
    effect: '+1 DEF na rodada',
    color: 'text-blue-500',
    allowedPhases: ['defense_maneuver', 'defense_reaction']
  },
  { 
    id: 'initiative', 
    name: 'Iniciativa', 
    icon: <Zap className="w-4 h-4" />, 
    effect: '+1 MOB na rodada',
    color: 'text-yellow-500',
    allowedPhases: ['initiative_maneuver', 'initiative_reaction']
  },
  { 
    id: 'countermaneuver', 
    name: 'Contra', 
    icon: <RotateCcw className="w-4 h-4" />, 
    effect: 'Cancela manobra inimiga',
    color: 'text-purple-500',
    allowedPhases: ['initiative_reaction', 'attack_reaction', 'defense_reaction']
  },
];

interface SinglePlayerBasicCardsProps {
  basicCardsUsed: SPBasicCardsUsed;
  currentBonuses: Partial<Record<keyof SPBasicCardsUsed, boolean>>;
  combatPhase: SPCombatPhase;
  onUseCard: (cardType: keyof SPBasicCardsUsed) => void;
  disabled?: boolean;
}

export function SinglePlayerBasicCards({
  basicCardsUsed,
  currentBonuses,
  combatPhase,
  onUseCard,
  disabled,
}: SinglePlayerBasicCardsProps) {
  const canUseCard = (card: BasicCardDef) => {
    return card.allowedPhases.includes(combatPhase);
  };
  
  const hasAnyUsableCard = BASIC_CARDS.some(card => 
    canUseCard(card) && !basicCardsUsed[card.id]
  );
  
  const usedCount = Object.values(basicCardsUsed).filter(Boolean).length;
  const totalCards = BASIC_CARDS.length;
  
  return (
    <Card>
      <CardHeader className="py-2">
        <CardTitle className="text-xs flex items-center justify-between">
          <span>Cartas Básicas (1x por partida)</span>
          <Badge variant="outline" className="text-[10px]">
            {totalCards - usedCount}/{totalCards}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="grid grid-cols-5 gap-1">
          {BASIC_CARDS.map((card) => {
            const isUsed = basicCardsUsed[card.id];
            const isActiveThisRound = currentBonuses[card.id];
            const canUse = canUseCard(card);
            
            return (
              <Button
                key={card.id}
                variant={isActiveThisRound ? 'default' : isUsed ? 'ghost' : 'outline'}
                size="sm"
                className={`h-auto py-1.5 px-1 flex flex-col items-center gap-0.5 ${
                  isUsed ? 'opacity-50' : !canUse ? 'opacity-30' : ''
                }`}
                disabled={disabled || isUsed || !canUse}
                onClick={() => onUseCard(card.id)}
                title={`${card.effect} (${card.allowedPhases.map(p => {
                  const labels: Record<string, string> = {
                    'initiative_maneuver': 'Iniciativa',
                    'initiative_reaction': 'Reação Ini.',
                    'attack_maneuver': 'Ataque',
                    'attack_reaction': 'Reação Atq.',
                    'defense_maneuver': 'Defesa',
                    'defense_reaction': 'Reação Def.',
                    'combat_resolution': 'Resolução'
                  };
                  return labels[p] || p;
                }).join(', ')})`}
              >
                {isUsed ? (
                  <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <span className={canUse ? card.color : 'text-muted-foreground'}>{card.icon}</span>
                )}
                <span className="text-[9px] font-medium truncate w-full text-center">
                  {card.name}
                </span>
              </Button>
            );
          })}
        </div>
        {!hasAnyUsableCard && (
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            Nenhuma carta básica disponível nesta fase
          </p>
        )}
      </CardContent>
    </Card>
  );
}
