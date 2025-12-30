import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MassCombatTacticalCard,
} from '@/types/MassCombatTacticalCard';
import { Swords, Shield, Zap, Crown, Users, Sword, Crosshair, Castle, Flag, Mountain, Cloud, Sparkles } from 'lucide-react';

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
  Terreno: { icon: Mountain, color: 'text-emerald-600', bg: 'bg-emerald-600/10 border-emerald-600/30' },
  Estação: { icon: Cloud, color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/30' },
};

export function MassCombatTacticalCardPreview({ card }: MassCombatTacticalCardPreviewProps) {
  const config = UNIT_TYPE_CONFIG[card.unit_type] || UNIT_TYPE_CONFIG.Geral;
  const UnitIcon = config.icon;

  return (
    <Card className={`overflow-hidden border-2 ${config.bg} transition-all hover:scale-[1.02]`}>
      <CardContent className="p-0">
        {/* Header with unit type */}
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
          {card.culture && (
            <p className="text-center text-xs text-muted-foreground mt-1">
              Cultura: {card.culture}
            </p>
          )}
        </div>

        {/* Bonuses */}
        <div className="grid grid-cols-3 divide-x divide-border/50 border-b border-border/50">
          <div className="p-3 text-center">
            <Swords className="h-4 w-4 text-red-500 mx-auto mb-1" />
            <div className="text-xs text-muted-foreground">Ataque</div>
            <div className={`text-xl font-bold ${card.attack_bonus > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {card.attack_bonus > 0 ? `+${card.attack_bonus}` : '-'}
            </div>
          </div>
          <div className="p-3 text-center">
            <Shield className="h-4 w-4 text-blue-500 mx-auto mb-1" />
            <div className="text-xs text-muted-foreground">Defesa</div>
            <div className={`text-xl font-bold ${card.defense_bonus > 0 ? 'text-blue-500' : 'text-muted-foreground'}`}>
              {card.defense_bonus > 0 ? `+${card.defense_bonus}` : '-'}
            </div>
          </div>
          <div className="p-3 text-center">
            <Zap className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
            <div className="text-xs text-muted-foreground">Mobilidade</div>
            <div className={`text-xl font-bold ${card.mobility_bonus > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
              {card.mobility_bonus > 0 ? `+${card.mobility_bonus}` : '-'}
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-muted/30 p-2 flex items-center justify-center gap-2">
          <Crown className="h-4 w-4 text-purple-500" />
          <span className="text-sm">
            Comando <span className="font-bold">{card.command_required}</span>
          </span>
        </div>

        {/* Condition */}
        {card.description && (
          <div className="p-3 border-t border-border/50">
            <p className="text-xs font-semibold text-amber-600 mb-1 text-center">Condição:</p>
            <p className="text-xs text-muted-foreground italic text-center">
              {card.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
