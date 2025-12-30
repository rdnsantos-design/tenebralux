import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MassCombatTacticalCard,
} from '@/types/MassCombatTacticalCard';
import { Crown, Users, Sword, Crosshair, Castle, Flag, Mountain, Cloud, Sparkles, Globe } from 'lucide-react';

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

        {/* Effect - Main Body */}
        <div className="p-4 flex-1 flex flex-col justify-center">
          <p className="text-xs font-semibold text-primary mb-2 text-center uppercase tracking-wide">Efeito</p>
          <p className="text-sm text-center leading-relaxed">
            {card.description || "Sem efeito definido"}
          </p>
        </div>

        {/* Requirements Footer */}
        <div className="bg-muted/50 p-3 border-t border-border/50">
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
