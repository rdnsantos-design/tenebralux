import React, { useMemo } from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { useTheme } from '@/themes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ATTRIBUTES } from '@/data/character/attributes';
import { getSkillsByAttribute, getSkillLabel } from '@/data/character/skills';
import { getVirtueByAttribute } from '@/data/character/virtues';
import { CharacterAttributes } from '@/core/types';
import { Minus, Plus, RotateCcw, Check, AlertCircle } from 'lucide-react';
import * as Icons from 'lucide-react';

const MAX_SKILL_VALUE = 3;
const MIN_SKILL_VALUE = 0;

export function StepSkills() {
  const { draft, updateDraft } = useCharacterBuilder();
  const { activeTheme } = useTheme();

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

  const skills = draft.skills || {};

  // Calcular pontos usados por atributo
  const getUsedPointsForAttribute = (attributeId: string): number => {
    const attrSkills = getSkillsByAttribute(attributeId);
    return attrSkills.reduce((sum, skill) => sum + (skills[skill.id] || 0), 0);
  };

  // Calcular pontos restantes por atributo
  const getRemainingPointsForAttribute = (attributeId: string): number => {
    const available = attributes[attributeId as keyof CharacterAttributes] || 1;
    const used = getUsedPointsForAttribute(attributeId);
    return available - used;
  };

  // Handler para mudar valor de perícia
  const handleSkillChange = (skillId: string, attributeId: string, delta: number) => {
    const currentValue = skills[skillId] || 0;
    const newValue = currentValue + delta;

    // Validações
    if (newValue < MIN_SKILL_VALUE || newValue > MAX_SKILL_VALUE) return;
    if (delta > 0 && getRemainingPointsForAttribute(attributeId) <= 0) return;

    updateDraft({
      skills: {
        ...skills,
        [skillId]: newValue,
      },
    });
  };

  // Reset todas as perícias
  const handleResetAll = () => {
    updateDraft({ skills: {} });
  };

  // Reset perícias de um atributo
  const handleResetAttribute = (attributeId: string) => {
    const attrSkills = getSkillsByAttribute(attributeId);
    const newSkills = { ...skills };
    attrSkills.forEach(skill => {
      delete newSkills[skill.id];
    });
    updateDraft({ skills: newSkills });
  };

  // Verificar se todos os pontos foram distribuídos
  const allPointsDistributed = useMemo(() => {
    return ATTRIBUTES.every(attr => getRemainingPointsForAttribute(attr.id) === 0);
  }, [attributes, skills]);

  // Calcular totais
  const totalAvailable = useMemo(() => {
    return Object.values(attributes).reduce((sum, val) => sum + (val || 0), 0);
  }, [attributes]);

  const totalUsed = useMemo(() => {
    return Object.values(skills).reduce((sum, val) => sum + (val || 0), 0);
  }, [skills]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Perícias</h2>
          <p className="text-muted-foreground">
            Distribua os pontos de cada atributo entre suas perícias associadas.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleResetAll}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Resetar Tudo
        </Button>
      </div>

      {/* Resumo Geral */}
      <Card className={cn(
        "transition-colors",
        allPointsDistributed && "border-green-500 bg-green-500/5"
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Progresso Geral</span>
            <span className={cn(
              "text-lg font-bold",
              allPointsDistributed ? "text-green-500" : "text-amber-500"
            )}>
              {totalUsed} / {totalAvailable} pontos
            </span>
          </div>
          <Progress 
            value={(totalUsed / totalAvailable) * 100} 
            className="h-2"
          />
          {!allPointsDistributed && (
            <p className="text-sm text-muted-foreground mt-2">
              Distribua todos os pontos de perícia para continuar.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Accordion de Atributos */}
      <Accordion type="multiple" defaultValue={[ATTRIBUTES[0].id]} className="space-y-3">
        {ATTRIBUTES.map((attribute) => {
          const virtue = getVirtueByAttribute(attribute.id);
          const attrSkills = getSkillsByAttribute(attribute.id);
          const available = attributes[attribute.id as keyof CharacterAttributes] || 1;
          const used = getUsedPointsForAttribute(attribute.id);
          const remaining = available - used;
          const isComplete = remaining === 0;
          const IconComponent = (Icons as any)[attribute.icon] || Icons.Circle;

          return (
            <AccordionItem 
              key={attribute.id} 
              value={attribute.id}
              className={cn(
                "border rounded-lg overflow-hidden",
                isComplete && "border-green-500/50"
              )}
            >
              <AccordionTrigger 
                className={cn(
                  "px-4 py-3 hover:no-underline",
                  isComplete && "bg-green-500/5"
                )}
                style={{ 
                  borderLeft: `4px solid ${virtue?.color || '#888'}` 
                }}
              >
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: virtue?.color }}
                    />
                    <span className="font-semibold">{attribute.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {available} pontos
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <Badge variant="default" className="bg-green-500">
                        <Check className="w-3 h-3 mr-1" />
                        Completo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-500">
                        {remaining} restantes
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  {/* Progress do atributo */}
                  <div className="flex items-center gap-2 mb-4">
                    <Progress 
                      value={(used / available) * 100} 
                      className="h-1.5 flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {used}/{available}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => handleResetAttribute(attribute.id)}
                    >
                      Reset
                    </Button>
                  </div>

                  {/* Lista de Perícias */}
                  {attrSkills.map((skill) => (
                    <SkillRow
                      key={skill.id}
                      skillId={skill.id}
                      label={getSkillLabel(skill.id, activeTheme)}
                      value={skills[skill.id] || 0}
                      virtueColor={virtue?.color || '#888'}
                      canIncrease={remaining > 0}
                      onIncrease={() => handleSkillChange(skill.id, attribute.id, 1)}
                      onDecrease={() => handleSkillChange(skill.id, attribute.id, -1)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Legenda */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p>
                Cada atributo fornece pontos iguais ao seu valor para distribuir entre suas perícias.
              </p>
              <p className="mt-1">
                Perícias podem ter nível de 0 a {MAX_SKILL_VALUE}. Em testes, você rola 
                <span className="font-medium"> Atributo + Perícia</span> dados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de linha de perícia
interface SkillRowProps {
  skillId: string;
  label: string;
  value: number;
  virtueColor: string;
  canIncrease: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
}

function SkillRow({ 
  label, 
  value, 
  virtueColor,
  canIncrease, 
  onIncrease, 
  onDecrease 
}: SkillRowProps) {
  const isMin = value <= MIN_SKILL_VALUE;
  const isMax = value >= MAX_SKILL_VALUE;

  return (
    <div className="flex items-center gap-3 py-1">
      {/* Nome da Perícia */}
      <span className={cn(
        "min-w-[140px] text-sm",
        value > 0 ? "font-medium" : "text-muted-foreground"
      )}>
        {label}
      </span>

      {/* Controles */}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onDecrease}
          disabled={isMin}
        >
          <Minus className="w-3 h-3" />
        </Button>

        {/* Valor com dots */}
        <div className="flex items-center gap-1 w-20 justify-center">
          {Array.from({ length: MAX_SKILL_VALUE }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-4 h-4 rounded-full border-2 transition-all",
                i < value 
                  ? "border-transparent" 
                  : "border-muted-foreground/30 bg-transparent"
              )}
              style={{ 
                backgroundColor: i < value ? virtueColor : 'transparent',
              }}
            />
          ))}
          <span className="ml-2 text-sm font-bold w-4 text-center">{value}</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onIncrease}
          disabled={isMax || !canIncrease}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
