import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MassCombatTacticalCard,
} from '@/types/MassCombatTacticalCard';
import { Crown, Users, Sword, Crosshair, Castle, Flag, Sparkles, Globe, Swords, Shield, Zap, Star, AlertTriangle } from 'lucide-react';

interface MassCombatTacticalCardPreviewProps {
  card: MassCombatTacticalCard;
}

const UNIT_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Infantaria: { icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
  Cavalaria: { icon: Sword, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
  Arqueiros: { icon: Crosshair, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' },
  Arqueria: { icon: Crosshair, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' },
  Cerco: { icon: Castle, color: 'text-stone-500', bg: 'bg-stone-500/10 border-stone-500/30' },
  Geral: { icon: Flag, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/30' },
  Genérica: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/30' },
};

export function MassCombatTacticalCardPreview({ card }: MassCombatTacticalCardPreviewProps) {
  const config = UNIT_TYPE_CONFIG[card.unit_type] || UNIT_TYPE_CONFIG.Geral;
  const UnitIcon = config.icon;

  const hasAnyBonus = card.attack_bonus > 0 || card.defense_bonus > 0 || card.mobility_bonus > 0;
  const hasAnyPenalty = card.attack_penalty > 0 || card.defense_penalty > 0 || card.mobility_penalty > 0;
  const hasEffectsOrConditions = card.minor_effect || card.major_effect || card.minor_condition || card.major_condition;

  return (
    <Card className={`overflow-hidden border-2 ${config.bg} transition-all hover:scale-[1.02] flex flex-col`}>
      <CardContent className="p-0 flex flex-col flex-1">
        {/* Header with unit type and VET */}
        <div className={`p-3 border-b ${config.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UnitIcon className={`h-5 w-5 ${config.color}`} />
              <Badge variant="outline" className={config.color}>
                {card.unit_type}
              </Badge>
            </div>
            <div className="flex items-center gap-1 bg-primary/20 px-2 py-1 rounded-full">
              <span className="text-xs text-muted-foreground">VET</span>
              <span className="font-bold text-primary">{card.vet_cost}</span>
            </div>
          </div>
        </div>

        {/* Card Name */}
        <div className="p-3 border-b border-border/50">
          <h3 className="font-bold text-lg text-center">{card.name}</h3>
        </div>

        {/* Attribute Bonuses and Penalties */}
        {(hasAnyBonus || hasAnyPenalty) && (
          <div className="p-3 border-b border-border/50 bg-muted/30">
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Attack */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Swords className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-muted-foreground">ATQ</span>
                </div>
                <div className="font-bold text-sm">
                  {card.attack_bonus > 0 && <span className="text-green-600">+{card.attack_bonus}</span>}
                  {card.attack_bonus > 0 && card.attack_penalty > 0 && ' / '}
                  {card.attack_penalty > 0 && <span className="text-red-600">-{card.attack_penalty}</span>}
                  {card.attack_bonus === 0 && card.attack_penalty === 0 && <span className="text-muted-foreground">-</span>}
                </div>
              </div>
              
              {/* Defense */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Shield className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-muted-foreground">DEF</span>
                </div>
                <div className="font-bold text-sm">
                  {card.defense_bonus > 0 && <span className="text-green-600">+{card.defense_bonus}</span>}
                  {card.defense_bonus > 0 && card.defense_penalty > 0 && ' / '}
                  {card.defense_penalty > 0 && <span className="text-red-600">-{card.defense_penalty}</span>}
                  {card.defense_bonus === 0 && card.defense_penalty === 0 && <span className="text-muted-foreground">-</span>}
                </div>
              </div>
              
              {/* Mobility */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">MOB</span>
                </div>
                <div className="font-bold text-sm">
                  {card.mobility_bonus > 0 && <span className="text-green-600">+{card.mobility_bonus}</span>}
                  {card.mobility_bonus > 0 && card.mobility_penalty > 0 && ' / '}
                  {card.mobility_penalty > 0 && <span className="text-red-600">-{card.mobility_penalty}</span>}
                  {card.mobility_bonus === 0 && card.mobility_penalty === 0 && <span className="text-muted-foreground">-</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Effects and Conditions Box */}
        {hasEffectsOrConditions && (
          <div className="p-3 border-b border-border/50 space-y-2">
            <div className="flex items-center gap-1 text-xs font-semibold text-primary uppercase tracking-wide">
              <Star className="h-3 w-3" />
              Efeitos e Condições
            </div>
            <div className="space-y-1.5 text-xs">
              {card.minor_effect && (
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-medium shrink-0">Efeito Menor:</span>
                  <span className="text-muted-foreground">{card.minor_effect}</span>
                </div>
              )}
              {card.major_effect && (
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-medium shrink-0">Efeito Maior:</span>
                  <span className="text-muted-foreground">{card.major_effect}</span>
                </div>
              )}
              {card.minor_condition && (
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{card.minor_condition}</span>
                </div>
              )}
              {card.major_condition && (
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{card.major_condition}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {card.description && (
          <div className="p-3 flex-1 flex flex-col justify-center">
            <p className="text-xs text-center leading-relaxed text-muted-foreground italic">
              {card.description}
            </p>
          </div>
        )}

        {/* Requirements Footer */}
        <div className="bg-muted/50 p-3 border-t border-border/50 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-500" />
              <span className="text-sm">
                Comando <span className="font-bold">{card.command_required}</span>
              </span>
            </div>
            {card.culture && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{card.culture}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
