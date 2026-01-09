/**
 * TCGBasicCards - Basic cards styled as small TCG tokens
 * Com seleção + confirmação (pode deselecionar antes de confirmar)
 */

import { cn } from '@/lib/utils';
import { Heart, Sword, Shield, Zap, RotateCcw, CheckCircle2, Check, X } from 'lucide-react';
import { SPBasicCardsUsed, SPCombatPhase } from '@/lib/singlePlayerCombatEngine';
import { Button } from '@/components/ui/button';

interface BasicCardDef {
  id: keyof SPBasicCardsUsed;
  name: string;
  icon: React.ReactNode;
  effect: string;
  colorClass: string;
  bgClass: string;
  allowedPhases: SPCombatPhase[];
}

const BASIC_CARDS: BasicCardDef[] = [
  { 
    id: 'heal', 
    name: 'Cura', 
    icon: <Heart className="w-5 h-5" />, 
    effect: '-5 dano recebido',
    colorClass: 'text-green-400',
    bgClass: 'tcg-basic-card--heal',
    allowedPhases: ['combat_resolution']
  },
  { 
    id: 'attack', 
    name: 'Ataque', 
    icon: <Sword className="w-5 h-5" />, 
    effect: '+1 ATK na rodada',
    colorClass: 'text-red-400',
    bgClass: 'tcg-basic-card--attack',
    allowedPhases: ['attack_maneuver', 'attack_reaction']
  },
  { 
    id: 'defense', 
    name: 'Defesa', 
    icon: <Shield className="w-5 h-5" />, 
    effect: '+1 DEF na rodada',
    colorClass: 'text-blue-400',
    bgClass: 'tcg-basic-card--defense',
    allowedPhases: ['defense_maneuver', 'defense_reaction']
  },
  { 
    id: 'initiative', 
    name: 'Iniciativa', 
    icon: <Zap className="w-5 h-5" />, 
    effect: '+1 MOB na rodada',
    colorClass: 'text-yellow-400',
    bgClass: 'tcg-basic-card--initiative',
    allowedPhases: ['initiative_maneuver', 'initiative_reaction']
  },
  { 
    id: 'countermaneuver', 
    name: 'Contra', 
    icon: <RotateCcw className="w-5 h-5" />, 
    effect: 'Cancela manobra inimiga',
    colorClass: 'text-purple-400',
    bgClass: 'tcg-basic-card--counter',
    allowedPhases: ['initiative_reaction', 'attack_reaction', 'defense_reaction']
  },
];

interface TCGBasicCardsProps {
  basicCardsUsed: SPBasicCardsUsed;
  currentBonuses: Partial<Record<keyof SPBasicCardsUsed, boolean>>;
  combatPhase: SPCombatPhase;
  selectedBasicCard: keyof SPBasicCardsUsed | null;
  onSelectCard: (cardType: keyof SPBasicCardsUsed | null) => void;
  onConfirmCard: () => void;
  disabled?: boolean;
}

export function TCGBasicCards({
  basicCardsUsed,
  currentBonuses,
  combatPhase,
  selectedBasicCard,
  onSelectCard,
  onConfirmCard,
  disabled,
}: TCGBasicCardsProps) {
  const canUseCard = (card: BasicCardDef) => {
    return card.allowedPhases.includes(combatPhase);
  };

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

  const selectedCardInfo = BASIC_CARDS.find(c => c.id === selectedBasicCard);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Cartas Básicas</span>
        <span className="bg-muted px-2 py-0.5 rounded-full font-medium">
          {totalCards - usedCount}/{totalCards}
        </span>
      </div>
      
      {/* Cards Grid */}
      <div className="flex gap-2 flex-wrap justify-center">
        {BASIC_CARDS.map((card) => {
          const isUsed = basicCardsUsed[card.id];
          const isActiveThisRound = currentBonuses[card.id];
          const isSelected = selectedBasicCard === card.id;
          const canUse = canUseCard(card);
          const isDisabled = disabled || isUsed || !canUse;

          return (
            <button
              key={card.id}
              className={cn(
                'tcg-basic-card',
                card.bgClass,
                isUsed && 'tcg-basic-card--used',
                isActiveThisRound && 'tcg-glow ring-2 ring-primary',
                isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110',
                !isDisabled && 'hover:scale-110'
              )}
              disabled={isDisabled}
              onClick={() => handleCardClick(card.id)}
              title={`${card.effect}\n(${card.allowedPhases.join(', ')})`}
            >
              {isUsed ? (
                <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
              ) : (
                <span className={cn(
                  canUse ? card.colorClass : 'text-muted-foreground'
                )}>
                  {card.icon}
                </span>
              )}
              <span className={cn(
                'text-[9px] font-bold',
                isUsed ? 'text-muted-foreground line-through' : ''
              )}>
                {card.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Confirmation buttons when a card is selected */}
      {selectedBasicCard && selectedCardInfo && (
        <div className="flex gap-2 mt-1 items-center">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
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
            Usar {selectedCardInfo.name}
          </Button>
        </div>
      )}
    </div>
  );
}
