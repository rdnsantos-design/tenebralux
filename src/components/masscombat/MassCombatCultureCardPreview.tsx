import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MassCombatCulture, CULTURE_COLORS } from '@/types/combat/mass-combat-culture';
import { Mountain, Sun, Users, Sparkles, Shield, Sword, Crosshair, TreePine, Snowflake, Droplets, Wheat, Flame } from 'lucide-react';

interface MassCombatCultureCardPreviewProps {
  culture: MassCombatCulture;
  className?: string;
}

const TERRAIN_ICONS: Record<string, React.ElementType> = {
  'Planície': Wheat,
  'Desértico': Sun,
  'Ártico': Snowflake,
  'Alagado': Droplets,
  'Floresta': TreePine,
};

const SEASON_ICONS: Record<string, React.ElementType> = {
  'Primavera': Sparkles,
  'Verão': Flame,
  'Outono': TreePine,
  'Inverno': Snowflake,
};

const SPEC_ICONS: Record<string, React.ElementType> = {
  'Cavalaria': Sword,
  'Infantaria': Shield,
  'Arqueria': Crosshair,
};

export function MassCombatCultureCardPreview({ culture, className = '' }: MassCombatCultureCardPreviewProps) {
  const colors = CULTURE_COLORS[culture.name] || { primary: 'text-gray-600', secondary: 'text-gray-500', bg: 'bg-gray-500/10 border-gray-500/30' };
  
  const TerrainIcon = TERRAIN_ICONS[culture.terrain_affinity] || Mountain;
  const SeasonIcon = SEASON_ICONS[culture.season_affinity] || Sun;
  const SpecIcon = SPEC_ICONS[culture.specialization] || Users;

  return (
    <Card className={`overflow-hidden border-2 ${colors.bg} transition-all hover:scale-[1.02] print:break-inside-avoid ${className}`}>
      <CardContent className="p-0">
        {/* Header with culture name */}
        <div className={`p-4 border-b ${colors.bg}`}>
          <h3 className={`text-xl font-bold text-center ${colors.primary}`}>{culture.name}</h3>
        </div>

        {/* Affinities Section */}
        <div className="p-4 border-b border-border/50">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 text-center uppercase tracking-wider">Afinidades</h4>
          <div className="grid grid-cols-3 gap-2">
            {/* Terrain */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/50">
              <TerrainIcon className={`h-5 w-5 ${colors.secondary}`} />
              <span className="text-[10px] text-muted-foreground">Terreno</span>
              <span className="text-xs font-medium text-center">{culture.terrain_affinity}</span>
            </div>
            
            {/* Season */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/50">
              <SeasonIcon className={`h-5 w-5 ${colors.secondary}`} />
              <span className="text-[10px] text-muted-foreground">Estação</span>
              <span className="text-xs font-medium text-center">{culture.season_affinity}</span>
            </div>
            
            {/* Specialization */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/50">
              <SpecIcon className={`h-5 w-5 ${colors.secondary}`} />
              <span className="text-[10px] text-muted-foreground">Especialização</span>
              <span className="text-xs font-medium text-center">{culture.specialization}</span>
            </div>
          </div>
        </div>

        {/* Special Ability */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 text-center uppercase tracking-wider">Habilidade Especial</h4>
          <div className={`p-3 rounded-lg ${colors.bg} border`}>
            <p className="text-sm text-center leading-relaxed">{culture.special_ability}</p>
          </div>
        </div>

        {/* Description if exists */}
        {culture.description && (
          <div className="px-4 pb-4">
            <p className="text-xs text-muted-foreground italic text-center">
              "{culture.description}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
