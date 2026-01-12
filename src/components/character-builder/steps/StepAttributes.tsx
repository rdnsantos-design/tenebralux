import React, { useMemo, useEffect } from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { useTheme } from '@/themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ATTRIBUTES, getAttributesByVirtue, getAttributeById } from '@/data/character/attributes';
import { VIRTUES } from '@/data/character/virtues';
import { getFactionById, getFactionAttributeBonuses } from '@/data/character/factions';
import { CharacterAttributes } from '@/core/types';
import { Minus, Plus, RotateCcw, Info, Gift } from 'lucide-react';
import * as Icons from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const TOTAL_POINTS = 25;
const MIN_VALUE = 1;
const MAX_VALUE = 6;

export function StepAttributes() {
  const { draft, updateDraft, getStepValidation } = useCharacterBuilder();
  const { activeTheme } = useTheme();
  const validation = getStepValidation(2);

  // Bônus de atributos da facção
  const factionBonuses = useMemo(() => {
    if (!draft.factionId) return [];
    return getFactionAttributeBonuses(draft.factionId);
  }, [draft.factionId]);

  const faction = draft.factionId ? getFactionById(draft.factionId) : null;

  const attributes = draft.attributes || {
    conhecimento: 1,
    raciocinio: 1,
    corpo: 1,
    reflexos: 1,
    determinacao: 1,
    coordenacao: 1,
    carisma: 1,
    intuicao: 1,
  };

  // Aplicar bônus de facção automaticamente quando a facção muda
  useEffect(() => {
    if (factionBonuses.length > 0) {
      const currentAttrs = draft.attributes || {
        conhecimento: 1,
        raciocinio: 1,
        corpo: 1,
        reflexos: 1,
        determinacao: 1,
        coordenacao: 1,
        carisma: 1,
        intuicao: 1,
      };
      
      // Verifica se os bônus já foram aplicados (valor > 1 nos atributos com bônus)
      const bonusesAlreadyApplied = factionBonuses.every(
        attrId => (currentAttrs[attrId as keyof CharacterAttributes] || 1) > 1
      );
      
      if (!bonusesAlreadyApplied) {
        const newAttrs = { ...currentAttrs };
        factionBonuses.forEach(attrId => {
          const currentVal = newAttrs[attrId as keyof CharacterAttributes] || 1;
          newAttrs[attrId as keyof CharacterAttributes] = Math.min(currentVal + 1, MAX_VALUE);
        });
        updateDraft({ attributes: newAttrs });
      }
    }
  }, [draft.factionId, factionBonuses]);

  const usedPoints = useMemo(() => {
    return Object.values(attributes).reduce((sum, val) => sum + (val || 0), 0);
  }, [attributes]);

  const remainingPoints = TOTAL_POINTS - usedPoints;

  const handleAttributeChange = (attrId: string, delta: number) => {
    const currentValue = attributes[attrId as keyof CharacterAttributes] || 1;
    const newValue = currentValue + delta;

    // Validações
    if (newValue < MIN_VALUE || newValue > MAX_VALUE) return;
    if (delta > 0 && remainingPoints <= 0) return;

    updateDraft({
      attributes: {
        ...attributes,
        [attrId]: newValue,
      },
    });
  };

  const handleReset = () => {
    // Ao resetar, reaplicar os bônus de facção
    const baseAttrs: Partial<CharacterAttributes> = {
      conhecimento: 1,
      raciocinio: 1,
      corpo: 1,
      reflexos: 1,
      determinacao: 1,
      coordenacao: 1,
      carisma: 1,
      intuicao: 1,
    };
    
    // Aplicar bônus de facção
    factionBonuses.forEach(attrId => {
      const currentVal = baseAttrs[attrId as keyof CharacterAttributes] || 1;
      baseAttrs[attrId as keyof CharacterAttributes] = currentVal + 1;
    });
    
    updateDraft({ attributes: baseAttrs });
  };

  const attributeError = validation.errors.find(e => e.field === 'attributes');

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Atributos</h2>
            <p className="text-muted-foreground">
              Distribua {TOTAL_POINTS} pontos entre os 8 atributos do seu personagem.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar
          </Button>
        </div>

        {/* Pontos restantes */}
        <Card className={cn(
          "transition-colors",
          remainingPoints === 0 && "border-green-500 bg-green-500/5",
          remainingPoints < 0 && "border-red-500 bg-red-500/5",
          attributeError && "border-red-500"
        )}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Pontos Restantes</span>
              <span className={cn(
                "text-2xl font-bold",
                remainingPoints === 0 && "text-green-500",
                remainingPoints > 0 && "text-amber-500",
                remainingPoints < 0 && "text-red-500"
              )}>
                {remainingPoints}
              </span>
            </div>
            <Progress 
              value={(usedPoints / TOTAL_POINTS) * 100} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{usedPoints} usados</span>
              <span>{TOTAL_POINTS} total</span>
            </div>
            {attributeError && (
              <p className="text-sm text-red-500 mt-2">{attributeError.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Bônus de Facção */}
        {factionBonuses.length > 0 && faction && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium text-primary mb-1">
                    Bônus de {faction.name}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {factionBonuses.map(attrId => {
                      const attr = getAttributeById(attrId);
                      return attr ? (
                        <Badge key={attrId} variant="secondary" className="gap-1">
                          +1 {attr.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Estes bônus já foram aplicados aos seus atributos. 
                    Cada ponto extra de atributo permite comprar mais 1 ponto de perícia.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Atributos por Virtude */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VIRTUES.map((virtue) => (
            <VirtueGroup
              key={virtue.id}
              virtue={virtue}
              attributes={attributes}
              theme={activeTheme}
              remainingPoints={remainingPoints}
              factionBonuses={factionBonuses}
              onAttributeChange={handleAttributeChange}
            />
          ))}
        </div>

        {/* Legenda */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4" />
              <span>
                Cada atributo pode ter valor entre {MIN_VALUE} e {MAX_VALUE}. 
                Os atributos definem suas perícias e características derivadas.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

// Componente de grupo de virtude
interface VirtueGroupProps {
  virtue: typeof VIRTUES[0];
  attributes: Partial<CharacterAttributes>;
  theme: 'akashic' | 'tenebralux';
  remainingPoints: number;
  factionBonuses: string[];
  onAttributeChange: (attrId: string, delta: number) => void;
}

function VirtueGroup({ virtue, attributes, theme, remainingPoints, factionBonuses, onAttributeChange }: VirtueGroupProps) {
  const virtueAttributes = getAttributesByVirtue(virtue.id);
  const IconComponent = (Icons as any)[virtue.icon] || Icons.Circle;

  return (
    <Card 
      className="overflow-hidden"
      style={{ borderColor: `${virtue.color}40` }}
    >
      <CardHeader 
        className="py-3"
        style={{ backgroundColor: `${virtue.color}15` }}
      >
        <CardTitle className="flex items-center gap-2 text-base">
          <IconComponent className="w-5 h-5" style={{ color: virtue.color }} />
          <span>{virtue.name}</span>
          <span className="text-xs text-muted-foreground font-normal">
            ({virtue.latin})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {virtueAttributes.map((attr) => (
          <AttributeRow
            key={attr.id}
            attribute={attr}
            value={attributes[attr.id as keyof CharacterAttributes] || 1}
            theme={theme}
            virtueColor={virtue.color}
            canIncrease={remainingPoints > 0}
            hasBonus={factionBonuses.includes(attr.id)}
            onIncrease={() => onAttributeChange(attr.id, 1)}
            onDecrease={() => onAttributeChange(attr.id, -1)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// Componente de linha de atributo
interface AttributeRowProps {
  attribute: typeof ATTRIBUTES[0];
  value: number;
  theme: 'akashic' | 'tenebralux';
  virtueColor: string;
  canIncrease: boolean;
  hasBonus?: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
}

function AttributeRow({ 
  attribute, 
  value, 
  theme, 
  virtueColor,
  canIncrease, 
  hasBonus,
  onIncrease, 
  onDecrease 
}: AttributeRowProps) {
  const IconComponent = (Icons as any)[attribute.icon] || Icons.Circle;
  const isMin = value <= MIN_VALUE;
  const isMax = value >= MAX_VALUE;

  return (
    <div className="flex items-center gap-3">
      {/* Ícone e Nome */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 min-w-[140px] cursor-help">
            <IconComponent className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{attribute.name}</span>
            {hasBonus && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 text-primary border-primary/50">
                +1
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[250px]">
          <p className="text-sm">{attribute.description[theme]}</p>
          {hasBonus && (
            <p className="text-xs text-primary mt-1">Este atributo recebe +1 da sua facção.</p>
          )}
        </TooltipContent>
      </Tooltip>

      {/* Controles */}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onDecrease}
          disabled={isMin}
        >
          <Minus className="w-4 h-4" />
        </Button>

        {/* Valor com indicador visual */}
        <div className="relative w-16">
          <div className="flex justify-center gap-0.5">
            {Array.from({ length: MAX_VALUE }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-6 rounded-sm transition-colors",
                  i < value 
                    ? "opacity-100" 
                    : "opacity-20"
                )}
                style={{ 
                  backgroundColor: i < value ? virtueColor : '#888' 
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-bold text-lg drop-shadow-sm" style={{ 
              textShadow: '0 0 4px rgba(0,0,0,0.5)' 
            }}>
              {value}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onIncrease}
          disabled={isMax || !canIncrease}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
