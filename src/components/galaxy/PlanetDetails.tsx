import React from 'react';
import { Planet, Faction, TIER_LIMITS, POSITIVE_TAGS, NEGATIVE_TAGS } from '@/types/galaxy';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  Shield, 
  Factory, 
  ShoppingCart, 
  Users, 
  MapPin, 
  Edit, 
  Target,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Coins
} from 'lucide-react';

interface PlanetDetailsProps {
  planet: Planet | null;
  factions: Faction[];
  onEdit?: (planet: Planet) => void;
  onFocus?: (planet: Planet) => void;
}

export function PlanetDetails({ planet, factions, onEdit, onFocus }: PlanetDetailsProps) {
  const formatPopulation = (pop: number) => {
    if (pop >= 1e12) return `${(pop / 1e12).toFixed(1)} trilhões`;
    if (pop >= 1e9) return `${(pop / 1e9).toFixed(1)} bilhões`;
    if (pop >= 1e6) return `${(pop / 1e6).toFixed(1)} milhões`;
    return pop.toLocaleString();
  };

  const getFactionColor = (factionName: string) => {
    const faction = factions.find(f => f.name === factionName);
    return faction?.color || '#7f8c8d';
  };

  if (!planet) {
    return (
      <div className="h-full flex flex-col bg-background border-l">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Visão Geral</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-muted-foreground">
            <Globe className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Selecione um planeta no mapa para ver detalhes</p>
          </div>
        </div>
      </div>
    );
  }

  const factionColor = getFactionColor(planet.faccao);
  const tierLimit = TIER_LIMITS[planet.tier as 1 | 2 | 3 | 4 | 5];
  const pcpPercent = tierLimit.pcpBase > 0 ? (planet.pcpGasto / tierLimit.pcpBase) * 100 : 0;
  const isOverDeveloped = planet.pcpGasto > planet.pcpTotal;

  // Parsear tags
  const positiveTags = planet.tagsPositivas ? planet.tagsPositivas.split(',').map(t => t.trim()).filter(Boolean) : [];
  const negativeTags = planet.tagsNegativas ? planet.tagsNegativas.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: factionColor }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Globe className="w-5 h-5" style={{ color: factionColor }} />
              {planet.nome}
            </h2>
            <p className="text-muted-foreground text-sm">{planet.funcao}</p>
          </div>
          <Badge 
            variant="outline" 
            style={{ borderColor: factionColor, color: factionColor }}
          >
            Tier {planet.tier} {'⭐'.repeat(planet.tier)}
          </Badge>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: factionColor }}
          />
          <span className="text-sm font-medium">{planet.faccao}</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Atributos */}
          <section>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Atributos
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Desenvolvimento (D)</span>
                  <span className="font-mono">{planet.D}/{tierLimit.maxD}</span>
                </div>
                <Progress value={(planet.D / 10) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Recursos (R)</span>
                  <span className="font-mono">{planet.R}/{tierLimit.maxR}</span>
                </div>
                <Progress value={(planet.R / 10) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Defesa (Def)</span>
                  <span className="font-mono">{planet.Def}/{tierLimit.maxDef}</span>
                </div>
                <Progress value={(planet.Def / 6) * 100} className="h-2" />
              </div>
            </div>
          </section>

          <Separator />

          {/* Slots */}
          <section>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Factory className="w-4 h-4" />
              Slots
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-muted rounded">
                <Factory className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                <div className="text-lg font-bold">{planet.slotsProd}</div>
                <div className="text-xs text-muted-foreground">Produção</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <ShoppingCart className="w-4 h-4 mx-auto mb-1 text-green-500" />
                <div className="text-lg font-bold">{planet.slotsCom}</div>
                <div className="text-xs text-muted-foreground">Comércio</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <Users className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                <div className="text-lg font-bold">{planet.slotsSoc}</div>
                <div className="text-xs text-muted-foreground">Sociedade</div>
              </div>
            </div>
          </section>

          <Separator />

          {/* PCP */}
          <section>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              PCP (Point Creation Pool)
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gasto / Total</span>
                <span className={`font-mono ${isOverDeveloped ? 'text-yellow-500' : ''}`}>
                  {planet.pcpGasto}/{planet.pcpTotal}
                </span>
              </div>
              <Progress 
                value={Math.min(pcpPercent, 100)} 
                className={`h-2 ${isOverDeveloped ? 'bg-yellow-200' : ''}`}
              />
              {isOverDeveloped && (
                <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <AlertTriangle className="w-3 h-3" />
                  Sobre-desenvolvido ({Math.round(pcpPercent)}%)
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Tags */}
          {(positiveTags.length > 0 || negativeTags.length > 0) && (
            <>
              <section>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Tags
                </h3>
                <div className="space-y-2">
                  {positiveTags.map((tag, i) => {
                    const tagInfo = POSITIVE_TAGS.find(t => t.name === tag);
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-green-500">✅</span>
                        <span>{tag}</span>
                        {tagInfo && (
                          <span className="text-xs text-muted-foreground">
                            ({tagInfo.effect})
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {negativeTags.map((tag, i) => {
                    const tagInfo = NEGATIVE_TAGS.find(t => t.name === tag);
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-yellow-500">⚠️</span>
                        <span>{tag}</span>
                        {tagInfo && (
                          <span className="text-xs text-muted-foreground">
                            ({tagInfo.effect})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
              <Separator />
            </>
          )}

          {/* Localização */}
          <section>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Localização
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Região:</span>
                <span>{planet.regiao}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zona:</span>
                <span>{planet.zona}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coordenadas:</span>
                <span className="font-mono">({planet.x}, {planet.y}, {planet.z})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distância:</span>
                <span>{planet.distancia.toFixed(1)} ly</span>
              </div>
            </div>
          </section>

          <Separator />

          {/* População */}
          <section>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              População
            </h3>
            <p className="text-2xl font-bold">
              {formatPopulation(planet.populacao)}
            </p>
          </section>

          {/* Descrição */}
          {planet.descricao && (
            <>
              <Separator />
              <section>
                <h3 className="font-semibold mb-3">Descrição</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {planet.descricao}
                </p>
              </section>
            </>
          )}

          {/* Tipo */}
          <Separator />
          <section>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tipo:</span>
              <Badge variant="secondary">{planet.tipo}</Badge>
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Ações */}
      <div className="p-4 border-t space-y-2">
        <div className="flex gap-2">
          {onEdit && (
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => onEdit(planet)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
          {onFocus && (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onFocus(planet)}
            >
              <Target className="w-4 h-4 mr-2" />
              Focar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
