import React from 'react';
import { useMassCombatSeasons } from '@/hooks/useMassCombatClimates';
import { MassCombatSeason } from '@/types/combat/mass-combat-climate';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Flower2, Sun, Leaf, Snowflake, Swords, Shield, Move, Heart, Printer } from 'lucide-react';

const getSeasonIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('primavera')) return <Flower2 className="h-6 w-6" />;
  if (lowerName.includes('verão') || lowerName.includes('verao')) return <Sun className="h-6 w-6" />;
  if (lowerName.includes('outono')) return <Leaf className="h-6 w-6" />;
  if (lowerName.includes('inverno')) return <Snowflake className="h-6 w-6" />;
  return <Sun className="h-6 w-6" />;
};

const getSeasonColors = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('primavera')) return {
    bg: 'bg-gradient-to-br from-emerald-500/20 to-green-600/30',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    accent: 'bg-emerald-500/20',
  };
  if (lowerName.includes('verão') || lowerName.includes('verao')) return {
    bg: 'bg-gradient-to-br from-amber-500/20 to-orange-600/30',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    accent: 'bg-amber-500/20',
  };
  if (lowerName.includes('outono')) return {
    bg: 'bg-gradient-to-br from-orange-500/20 to-red-600/30',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    accent: 'bg-orange-500/20',
  };
  if (lowerName.includes('inverno')) return {
    bg: 'bg-gradient-to-br from-blue-500/20 to-cyan-600/30',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    accent: 'bg-blue-500/20',
  };
  return {
    bg: 'bg-gradient-to-br from-gray-500/20 to-gray-600/30',
    border: 'border-gray-500/50',
    text: 'text-gray-400',
    accent: 'bg-gray-500/20',
  };
};

const getModifierIcon = (type: string) => {
  switch (type) {
    case 'ataque': return <Swords className="h-4 w-4" />;
    case 'defesa': return <Shield className="h-4 w-4" />;
    case 'mobilidade': return <Move className="h-4 w-4" />;
    case 'pv': return <Heart className="h-4 w-4" />;
    default: return null;
  }
};

const getModifierLabel = (type: string) => {
  switch (type) {
    case 'ataque': return 'ATK';
    case 'defesa': return 'DEF';
    case 'mobilidade': return 'MOB';
    case 'pv': return 'PV';
    default: return type.toUpperCase();
  }
};

interface SeasonCardProps {
  season: MassCombatSeason;
}

function SeasonCard({ season }: SeasonCardProps) {
  const colors = getSeasonColors(season.name);
  const modLabel = getModifierLabel(season.modifier_type);
  
  const conditions = [
    { name: season.condition1_name, mod: season.condition1_modifier, level: 1 },
    { name: season.condition2_name, mod: season.condition2_modifier, level: 2 },
    { name: season.condition3_name, mod: season.condition3_modifier, level: 3 },
  ];

  return (
    <Card className={`overflow-hidden ${colors.bg} ${colors.border} border-2`}>
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.accent}`}>
              <span className={colors.text}>{getSeasonIcon(season.name)}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">{season.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getModifierIcon(season.modifier_type)}
                <span>Afeta {season.modifier_type.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions */}
      <CardContent className="p-4 space-y-3">
        {conditions.map((condition) => (
          <div 
            key={condition.level}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30"
          >
            <div className="flex items-center gap-3">
              <Badge 
                variant={condition.level === 1 ? 'outline' : condition.level === 2 ? 'secondary' : 'destructive'}
                className="w-6 h-6 p-0 flex items-center justify-center text-xs"
              >
                {condition.level}
              </Badge>
              <span className="font-medium">{condition.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-lg ${condition.mod < 0 ? 'text-destructive' : 'text-green-500'}`}>
                {condition.mod > 0 ? '+' : ''}{condition.mod}
              </span>
              <span className="text-xs text-muted-foreground">{modLabel}</span>
            </div>
          </div>
        ))}

        {/* Token indicator */}
        <div className="pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            Use tokens para marcar a condição atual (1-3)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClimateViewer() {
  const { data: seasons, isLoading } = useMassCombatSeasons();

  const handlePrintSeasons = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !seasons) return;

    const getSeasonColor = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('primavera')) return '#10b981';
      if (lower.includes('verão') || lower.includes('verao')) return '#f59e0b';
      if (lower.includes('outono')) return '#f97316';
      if (lower.includes('inverno')) return '#3b82f6';
      return '#6b7280';
    };

    const getModLabel = (type: string) => {
      switch (type) {
        case 'ataque': return 'ATK';
        case 'defesa': return 'DEF';
        case 'mobilidade': return 'MOB';
        case 'pv': return 'PV';
        default: return type.toUpperCase();
      }
    };

    const cardsHtml = seasons.map(season => {
      const color = getSeasonColor(season.name);
      const modLabel = getModLabel(season.modifier_type);

      return `
        <div class="card" style="border-color: ${color}">
          <div class="card-header" style="background: ${color}">${season.name}</div>
          <div class="card-subtitle" style="background: ${color}">Afeta ${season.modifier_type.toUpperCase()}</div>
          <div class="conditions">
            <div class="condition">
              <span class="level">1</span>
              <span class="name">${season.condition1_name}</span>
              <span class="mod">${season.condition1_modifier} ${modLabel}</span>
            </div>
            <div class="condition">
              <span class="level">2</span>
              <span class="name">${season.condition2_name}</span>
              <span class="mod">${season.condition2_modifier} ${modLabel}</span>
            </div>
            <div class="condition">
              <span class="level">3</span>
              <span class="name">${season.condition3_name}</span>
              <span class="mod">${season.condition3_modifier} ${modLabel}</span>
            </div>
          </div>
          <div class="token-hint">🎲 Use tokens para marcar nível</div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cartas de Estação</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, sans-serif; padding: 20px; background: #f5f5f5; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
            .card { 
              width: 200px; height: 280px; 
              background: white; 
              border-radius: 12px; 
              border: 3px solid;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              break-inside: avoid;
            }
            .card-header { 
              color: white; 
              text-align: center; 
              font-size: 20px; 
              font-weight: bold; 
              padding: 12px 8px 4px;
            }
            .card-subtitle {
              color: rgba(255,255,255,0.8);
              text-align: center;
              font-size: 10px;
              text-transform: uppercase;
              padding-bottom: 8px;
            }
            .conditions {
              flex: 1;
              padding: 12px;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .condition {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px;
              background: #f9fafb;
              border-radius: 6px;
            }
            .level {
              width: 24px; height: 24px;
              background: #374151;
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
            }
            .name { flex: 1; font-size: 12px; font-weight: 500; }
            .mod { font-size: 12px; font-weight: bold; color: #dc2626; }
            .token-hint {
              padding: 8px;
              text-align: center;
              font-size: 9px;
              color: #6b7280;
              border-top: 1px dashed #e5e7eb;
            }
            @media print { 
              body { background: white; padding: 0; }
              .grid { grid-template-columns: repeat(4, 1fr); gap: 8px; } 
            }
          </style>
        </head>
        <body>
          <div class="grid">${cardsHtml}</div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1 space-y-2">
          <h2 className="text-2xl font-bold">Estações & Condições Climáticas</h2>
          <p className="text-muted-foreground">
            Cada estação possui 3 níveis de condição que afetam um atributo específico
          </p>
        </div>
        <Button onClick={handlePrintSeasons} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir Estações
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {seasons?.map((season) => (
          <SeasonCard key={season.id} season={season} />
        ))}
      </div>

      {/* Rules card */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2">Regras de Escalonamento (1d20)</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• A cada rodada, role 1d20 para verificar mudança de condição:</p>
            <p>• <strong>1:</strong> Piora 2 níveis (máx. 3)</p>
            <p>• <strong>2-5:</strong> Piora 1 nível (máx. 3)</p>
            <p>• <strong>6-15:</strong> Mantém condição atual</p>
            <p>• <strong>16-19:</strong> Melhora 1 nível (mín. 1)</p>
            <p>• <strong>20:</strong> Melhora 2 níveis (mín. 1)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
