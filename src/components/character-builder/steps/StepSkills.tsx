import React, { useMemo, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ATTRIBUTES } from '@/data/character/attributes';
import { getSkillsByAttribute, getSkillLabel } from '@/data/character/skills';
import { getVirtueByAttribute } from '@/data/character/virtues';
import { CharacterAttributes } from '@/core/types';
import { Minus, Plus, RotateCcw, Check, AlertCircle, Sparkles, X, Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useRpgSkillSpecializations, RpgSkillSpecialization } from '@/hooks/useRpgSkills';

// Na criação de personagem: máximo 4 níveis por perícia
// O 4º nível pode ser normal OU uma especialização (3 níveis + 1 especialização)
const MAX_SKILL_VALUE_CREATION = 4;
const MIN_SKILL_VALUE = 0;

import { SkillSpecialization } from '@/types/character-builder';

export function StepSkills() {
  const { draft, updateDraft } = useCharacterBuilder();
  const { activeTheme } = useTheme();
  const { data: allSpecializations = [], isLoading: specsLoading } = useRpgSkillSpecializations();

  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null);
  const [pendingAttributeId, setPendingAttributeId] = useState<string | null>(null);

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
  const skillSpecializations: Record<string, SkillSpecialization> = draft.skillSpecializations || {};

  // Calcular pontos usados por atributo (cada nível custa 1, especialização também custa 1)
  const getUsedPointsForAttribute = (attributeId: string): number => {
    const attrSkills = getSkillsByAttribute(attributeId);
    return attrSkills.reduce((sum, skill) => {
      const baseValue = skills[skill.id] || 0;
      const hasSpec = skillSpecializations[skill.id] !== undefined;
      return sum + baseValue + (hasSpec ? 1 : 0);
    }, 0);
  };

  // Calcular pontos restantes por atributo
  const getRemainingPointsForAttribute = (attributeId: string): number => {
    const available = attributes[attributeId as keyof CharacterAttributes] || 1;
    const used = getUsedPointsForAttribute(attributeId);
    return available - used;
  };

  // Obter o "nível efetivo" de uma perícia (níveis + especialização se houver)
  const getEffectiveSkillLevel = (skillId: string): number => {
    const base = skills[skillId] || 0;
    const hasSpec = skillSpecializations[skillId] !== undefined;
    return base + (hasSpec ? 1 : 0);
  };

  // Handler para aumentar perícia
  const handleSkillIncrease = (skillId: string, attributeId: string) => {
    const currentBase = skills[skillId] || 0;
    const hasSpec = skillSpecializations[skillId] !== undefined;
    const effectiveLevel = currentBase + (hasSpec ? 1 : 0);

    // Se já está no máximo (4), não pode aumentar
    if (effectiveLevel >= MAX_SKILL_VALUE_CREATION) return;
    // Se não tem pontos sobrando, não pode aumentar
    if (getRemainingPointsForAttribute(attributeId) <= 0) return;

    // Se vai para o nível 4, oferece escolha: nível normal ou especialização
    if (effectiveLevel === 3 && !hasSpec) {
      // Abre dialog para escolher entre nível 4 ou especialização
      setPendingSkillId(skillId);
      setPendingAttributeId(attributeId);
      setSpecDialogOpen(true);
      return;
    }

    // Caso normal: apenas aumenta o nível
    updateDraft({
      skills: {
        ...skills,
        [skillId]: currentBase + 1,
      },
    });
  };

  // Handler para diminuir perícia
  const handleSkillDecrease = (skillId: string, attributeId: string) => {
    const currentBase = skills[skillId] || 0;
    const hasSpec = skillSpecializations[skillId] !== undefined;

    // Se tem especialização e vai diminuir, remove a especialização primeiro
    if (hasSpec) {
      const newSpecs = { ...skillSpecializations };
      delete newSpecs[skillId];
      updateDraft({ skillSpecializations: newSpecs });
      return;
    }

    // Caso normal: diminui o nível
    if (currentBase <= MIN_SKILL_VALUE) return;

    updateDraft({
      skills: {
        ...skills,
        [skillId]: currentBase - 1,
      },
    });
  };

  // Escolher nível 4 normal
  const handleChooseNormalLevel = () => {
    if (!pendingSkillId) return;
    
    const currentBase = skills[pendingSkillId] || 0;
    updateDraft({
      skills: {
        ...skills,
        [pendingSkillId]: currentBase + 1,
      },
    });
    
    setSpecDialogOpen(false);
    setPendingSkillId(null);
    setPendingAttributeId(null);
  };

  // Escolher especialização
  const handleChooseSpecialization = (spec: RpgSkillSpecialization) => {
    if (!pendingSkillId) return;

    updateDraft({
      skillSpecializations: {
        ...skillSpecializations,
        [pendingSkillId]: {
          skillId: pendingSkillId,
          specializationId: spec.id,
          specializationName: spec.name,
        },
      },
    });

    setSpecDialogOpen(false);
    setPendingSkillId(null);
    setPendingAttributeId(null);
  };

  // Reset todas as perícias
  const handleResetAll = () => {
    updateDraft({ skills: {}, skillSpecializations: {} });
  };

  // Reset perícias de um atributo
  const handleResetAttribute = (attributeId: string) => {
    const attrSkills = getSkillsByAttribute(attributeId);
    const newSkills = { ...skills };
    const newSpecs = { ...skillSpecializations };
    
    attrSkills.forEach(skill => {
      delete newSkills[skill.id];
      delete newSpecs[skill.id];
    });
    
    updateDraft({ skills: newSkills, skillSpecializations: newSpecs });
  };

  // Verificar se todos os pontos foram distribuídos
  const allPointsDistributed = useMemo(() => {
    return ATTRIBUTES.every(attr => getRemainingPointsForAttribute(attr.id) === 0);
  }, [attributes, skills, skillSpecializations]);

  // Calcular totais
  const totalAvailable = useMemo(() => {
    return Object.values(attributes).reduce((sum, val) => sum + (val || 0), 0);
  }, [attributes]);

  const totalUsed = useMemo(() => {
    const skillPoints = Object.values(skills).reduce((sum, val) => sum + (val || 0), 0);
    const specPoints = Object.keys(skillSpecializations).length;
    return skillPoints + specPoints;
  }, [skills, skillSpecializations]);

  // Especializações da perícia pendente
  const pendingSkillSpecs = useMemo(() => {
    if (!pendingSkillId) return [];
    return allSpecializations.filter(s => s.skill_id === pendingSkillId);
  }, [pendingSkillId, allSpecializations]);

  const pendingSkillLabel = pendingSkillId ? getSkillLabel(pendingSkillId, activeTheme) : '';

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
                  {attrSkills.map((skill) => {
                    const baseValue = skills[skill.id] || 0;
                    const specialization = skillSpecializations[skill.id];
                    const effectiveLevel = baseValue + (specialization ? 1 : 0);
                    
                    return (
                      <SkillRow
                        key={skill.id}
                        skillId={skill.id}
                        label={getSkillLabel(skill.id, activeTheme)}
                        baseValue={baseValue}
                        specialization={specialization}
                        effectiveLevel={effectiveLevel}
                        maxLevel={MAX_SKILL_VALUE_CREATION}
                        virtueColor={virtue?.color || '#888'}
                        canIncrease={remaining > 0 && effectiveLevel < MAX_SKILL_VALUE_CREATION}
                        onIncrease={() => handleSkillIncrease(skill.id, attribute.id)}
                        onDecrease={() => handleSkillDecrease(skill.id, attribute.id)}
                      />
                    );
                  })}
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
                Perícias podem ter nível de 0 a {MAX_SKILL_VALUE_CREATION} na criação. 
                No 4º nível, você pode escolher entre um <strong>nível normal</strong> ou uma <strong>especialização</strong>.
              </p>
              <p className="mt-1">
                <Sparkles className="w-3 h-3 inline mr-1" />
                Especialização = 3 níveis + 1 ênfase específica (bônus em situações relacionadas)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Escolha: Nível 4 ou Especialização */}
      <Dialog open={specDialogOpen} onOpenChange={setSpecDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escolha para {pendingSkillLabel}</DialogTitle>
            <DialogDescription>
              Ao alcançar o 4º nível, você pode escolher entre um nível normal ou uma especialização.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Opção: Nível Normal */}
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto py-3"
              onClick={handleChooseNormalLevel}
            >
              <div className="text-left">
                <div className="font-medium">Nível 4 Normal</div>
                <div className="text-xs text-muted-foreground">
                  +1 dado em todos os testes desta perícia
                </div>
              </div>
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Opção: Especialização */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-primary" />
                Escolher Especialização (Ênfase)
              </div>
              
              {specsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : pendingSkillSpecs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma especialização disponível para esta perícia.
                </p>
              ) : (
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {pendingSkillSpecs.map((spec) => (
                    <Button
                      key={spec.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-2 border hover:border-primary"
                      onClick={() => handleChooseSpecialization(spec)}
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">{spec.name}</div>
                        {spec.description && (
                          <div className="text-xs text-muted-foreground">
                            {spec.description}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSpecDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de linha de perícia
interface SkillRowProps {
  skillId: string;
  label: string;
  baseValue: number;
  specialization?: SkillSpecialization;
  effectiveLevel: number;
  maxLevel: number;
  virtueColor: string;
  canIncrease: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
}

function SkillRow({ 
  label, 
  baseValue,
  specialization,
  effectiveLevel,
  maxLevel,
  virtueColor,
  canIncrease, 
  onIncrease, 
  onDecrease 
}: SkillRowProps) {
  const isMin = effectiveLevel <= MIN_SKILL_VALUE;
  const isMax = effectiveLevel >= maxLevel;

  return (
    <div className="flex items-center gap-3 py-1">
      {/* Nome da Perícia */}
      <div className={cn(
        "min-w-[140px]",
        effectiveLevel > 0 ? "font-medium" : "text-muted-foreground"
      )}>
        <span className="text-sm">{label}</span>
        {specialization && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className="ml-2 text-xs gap-1 cursor-help"
                  style={{ backgroundColor: `${virtueColor}20`, color: virtueColor }}
                >
                  <Sparkles className="w-3 h-3" />
                  {specialization.specializationName}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Especialização em {specialization.specializationName}</p>
                <p className="text-xs text-muted-foreground">
                  +1 dado adicional em testes relacionados
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

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
        <div className="flex items-center gap-1 w-28 justify-center">
          {Array.from({ length: maxLevel }).map((_, i) => {
            const isFilled = i < effectiveLevel;
            const isSpecSlot = i === baseValue && specialization;
            
            return (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center",
                  isFilled 
                    ? "border-transparent" 
                    : "border-muted-foreground/30 bg-transparent"
                )}
                style={{ 
                  backgroundColor: isFilled ? virtueColor : 'transparent',
                }}
              >
                {isSpecSlot && (
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                )}
              </div>
            );
          })}
          <span className="ml-2 text-sm font-bold w-4 text-center">{effectiveLevel}</span>
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
