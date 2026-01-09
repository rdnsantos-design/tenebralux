/**
 * SinglePlayerBasicCards - Cartas básicas para o modo single player
 * Cada carta pode ser usada apenas 1x por partida
 * Agora com seleção + confirmação (pode deselecionar antes de confirmar)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Sword, Shield, Zap, RotateCcw, CheckCircle2, Check, X } from 'lucide-react';
import { SPBasicCardsUsed, SPCombatPhase } from '@/lib/singlePlayerCombatEngine';
import { cn } from '@/lib/utils';

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
  selectedBasicCard: keyof SPBasicCardsUsed | null;
  onSelectCard: (cardType: keyof SPBasicCardsUsed | null) => void;
  onConfirmCard: () => void;
  disabled?: boolean;
}

export function SinglePlayerBasicCards({
  basicCardsUsed,
  currentBonuses,
  combatPhase,
  selectedBasicCard,
  onSelectCard,
  onConfirmCard,
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

  const handleCardClick = (cardId: keyof SPBasicCardsUsed) => {
    if (selectedBasicCard === cardId) {
      // Deselecionar se clicar na mesma carta
      onSelectCard(null);
    } else {
      // Selecionar nova carta
      onSelectCard(cardId);
    }
  };
  
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
            const isSelected = selectedBasicCard === card.id;
            const canUse = canUseCard(card);
            
            return (
              <Button
                key={card.id}
                variant={isActiveThisRound ? 'default' : isSelected ? 'secondary' : isUsed ? 'ghost' : 'outline'}
                size="sm"
                className={cn(
                  'h-auto py-1.5 px-1 flex flex-col items-center gap-0.5 transition-all',
                  isUsed && 'opacity-50',
                  !canUse && !isUsed && 'opacity-30',
                  isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                )}
                disabled={disabled || isUsed || !canUse}
                onClick={() => handleCardClick(card.id)}
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

        {/* Botões de confirmação quando uma carta está selecionada */}
        {selectedBasicCard && (
          <div className="flex gap-2 mt-2 justify-center">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-3 text-xs"
              onClick={() => onSelectCard(null)}
            >
              <X className="w-3 h-3 mr-1" />
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="default"
              className="h-7 px-3 text-xs"
              onClick={onConfirmCard}
            >
              <Check className="w-3 h-3 mr-1" />
              Confirmar {BASIC_CARDS.find(c => c.id === selectedBasicCard)?.name}
            </Button>
          </div>
        )}

        {!hasAnyUsableCard && !selectedBasicCard && (
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            Nenhuma carta básica disponível nesta fase
          </p>
        )}
      </CardContent>
    </Card>
  );
}
