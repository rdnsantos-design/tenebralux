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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ATTRIBUTES } from '@/data/character/attributes';
import { SKILLS, getSkillsByAttribute, getSkillLabel } from '@/data/character/skills';
import { getVirtueByAttribute } from '@/data/character/virtues';
import { getFactionFreeSkillPoints } from '@/data/character/factions';
import { CharacterAttributes } from '@/core/types';
import { Minus, Plus, RotateCcw, Check, Star } from 'lucide-react';
import * as Icons from 'lucide-react';

// Configurações do sistema de perícias
const MAX_SKILL_FROM_ATTRIBUTES = 3; // Máximo que pontos de atributo podem elevar
const MAX_FREE_POINTS_PER_SKILL = 1; // Máximo de pontos livres por perícia
const MAX_SKILL_CREATION = 4; // Máximo na criação de personagem (com pontos livres)
const MIN_SKILL_VALUE = 0;

export function StepSkills() {
  const { draft, updateDraft } = useCharacterBuilder();
  const { activeTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'attributes' | 'free'>('attributes');

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

  const skills = draft.skills || {}; // Pontos de atributo
  const freeSkillPoints = draft.freeSkillPoints || {}; // Pontos livres

  // Pontos livres disponíveis baseado na facção
  const factionFreePoints = getFactionFreeSkillPoints(draft.factionId || '');

  // ===== CÁLCULOS DE PONTOS DE ATRIBUTO =====
  
  // Pontos de atributo usados por atributo
  const getUsedAttributePointsFor = (attributeId: string): number => {
    const attrSkills = getSkillsByAttribute(attributeId);
    return attrSkills.reduce((sum, skill) => {
      return sum + (skills[skill.id] || 0);
    }, 0);
  };

  // Pontos de atributo restantes por atributo
  const getRemainingAttributePointsFor = (attributeId: string): number => {
    const available = attributes[attributeId as keyof CharacterAttributes] || 1;
    const used = getUsedAttributePointsFor(attributeId);
    return available - used;
  };

  // ===== CÁLCULOS DE PONTOS LIVRES =====
  
  // Pontos livres usados
  const getUsedFreePoints = (): number => {
    return Object.values(freeSkillPoints).reduce((sum, val) => sum + (val || 0), 0);
  };

  // Pontos livres restantes (baseado na facção)
  const getRemainingFreePoints = (): number => {
    return factionFreePoints - getUsedFreePoints();
  };

  // ===== NÍVEL EFETIVO =====
  
  // Nível total de uma perícia (atributo + livre)
  const getEffectiveSkillLevel = (skillId: string): number => {
    const fromAttr = skills[skillId] || 0;
    const fromFree = freeSkillPoints[skillId] || 0;
    return fromAttr + fromFree;
  };

  // ===== HANDLERS DE PONTOS DE ATRIBUTO =====

  const handleAttributeSkillIncrease = (skillId: string, attributeId: string) => {
    const currentFromAttr = skills[skillId] || 0;
    const effectiveLevel = getEffectiveSkillLevel(skillId);

    // Verificações
    if (currentFromAttr >= MAX_SKILL_FROM_ATTRIBUTES) return; // Máximo de pontos de atributo
    if (effectiveLevel >= MAX_SKILL_CREATION) return; // Máximo na criação
    if (getRemainingAttributePointsFor(attributeId) <= 0) return; // Sem pontos

    updateDraft({
      skills: {
        ...skills,
        [skillId]: currentFromAttr + 1,
      },
    });
  };

  const handleAttributeSkillDecrease = (skillId: string) => {
    const currentFromAttr = skills[skillId] || 0;
    const currentFromFree = freeSkillPoints[skillId] || 0;

    // Primeiro remove pontos livres
    if (currentFromFree > 0) {
      updateDraft({
        freeSkillPoints: {
          ...freeSkillPoints,
          [skillId]: currentFromFree - 1,
        },
      });
      return;
    }

    // Depois remove pontos de atributo
    if (currentFromAttr > MIN_SKILL_VALUE) {
      updateDraft({
        skills: {
          ...skills,
          [skillId]: currentFromAttr - 1,
        },
      });
    }
  };

  // ===== HANDLERS DE PONTOS LIVRES =====

  const handleFreeSkillIncrease = (skillId: string) => {
    const currentFromFree = freeSkillPoints[skillId] || 0;
    const effectiveLevel = getEffectiveSkillLevel(skillId);

    // Verificações
    if (currentFromFree >= MAX_FREE_POINTS_PER_SKILL) return; // Máximo de pontos livres por perícia
    if (effectiveLevel >= MAX_SKILL_CREATION) return; // Máximo na criação
    if (getRemainingFreePoints() <= 0) return; // Sem pontos livres

    updateDraft({
      freeSkillPoints: {
        ...freeSkillPoints,
        [skillId]: currentFromFree + 1,
      },
    });
  };

  const handleFreeSkillDecrease = (skillId: string) => {
    const currentFromFree = freeSkillPoints[skillId] || 0;

    // Remove ponto livre
    if (currentFromFree > MIN_SKILL_VALUE) {
      updateDraft({
        freeSkillPoints: {
          ...freeSkillPoints,
          [skillId]: currentFromFree - 1,
        },
      });
    }
  };

  // ===== RESET =====

  const handleResetAll = () => {
    updateDraft({ skills: {}, freeSkillPoints: {} });
  };

  const handleResetAttribute = (attributeId: string) => {
    const attrSkills = getSkillsByAttribute(attributeId);
    const newSkills = { ...skills };
    const newFreeSkills = { ...freeSkillPoints };
    
    attrSkills.forEach(skill => {
      delete newSkills[skill.id];
      delete newFreeSkills[skill.id];
    });
    
    updateDraft({ skills: newSkills, freeSkillPoints: newFreeSkills });
  };

  const handleResetFreePoints = () => {
    updateDraft({ freeSkillPoints: {} });
  };

  // ===== CÁLCULOS GERAIS =====

  // Verificar se todos os pontos de atributo foram distribuídos
  const allAttributePointsDistributed = useMemo(() => {
    return ATTRIBUTES.every(attr => getRemainingAttributePointsFor(attr.id) === 0);
  }, [attributes, skills]);

  // Verificar se todos os pontos livres foram distribuídos
  const allFreePointsDistributed = useMemo(() => {
    return getRemainingFreePoints() === 0;
  }, [freeSkillPoints, factionFreePoints]);

  // Totais de pontos de atributo
  const totalAttributePointsAvailable = useMemo(() => {
    return Object.values(attributes).reduce((sum, val) => sum + (val || 0), 0);
  }, [attributes]);

  const totalAttributePointsUsed = useMemo(() => {
    return Object.values(skills).reduce((sum, val) => sum + (val || 0), 0);
  }, [skills]);

  // Perícias com pontos (para aba de pontos livres)
  const skillsWithPoints = useMemo(() => {
    return SKILLS.map(skill => ({
      ...skill,
      fromAttr: skills[skill.id] || 0,
      fromFree: freeSkillPoints[skill.id] || 0,
      effectiveLevel: getEffectiveSkillLevel(skill.id),
    })).sort((a, b) => b.effectiveLevel - a.effectiveLevel);
  }, [skills, freeSkillPoints]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Perícias</h2>
          <p className="text-muted-foreground">
            Distribua pontos de atributo e pontos livres entre as perícias.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleResetAll}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Resetar Tudo
        </Button>
      </div>

      {/* Tabs: Pontos de Atributo / Pontos Livres */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'attributes' | 'free')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attributes" className="gap-2">
            <Icons.Target className="w-4 h-4" />
            Pontos de Atributo
            {allAttributePointsDistributed ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Badge variant="secondary" className="text-xs">
                {totalAttributePointsAvailable - totalAttributePointsUsed}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="free" className="gap-2" disabled={!allAttributePointsDistributed}>
            <Star className="w-4 h-4" />
            Pontos Livres
            {allFreePointsDistributed ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Badge variant="secondary" className="text-xs">
                {getRemainingFreePoints()}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB: Pontos de Atributo */}
        <TabsContent value="attributes" className="space-y-4 mt-4">
          {/* Resumo de Atributos */}
          <Card className={cn(
            "transition-colors",
            allAttributePointsDistributed && "border-green-500 bg-green-500/5"
          )}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Pontos de Atributo</span>
                <span className={cn(
                  "text-lg font-bold",
                  allAttributePointsDistributed ? "text-green-500" : "text-amber-500"
                )}>
                  {totalAttributePointsUsed} / {totalAttributePointsAvailable} pontos
                </span>
              </div>
              <Progress 
                value={(totalAttributePointsUsed / totalAttributePointsAvailable) * 100} 
                className="h-2"
              />
              {!allAttributePointsDistributed && (
                <p className="text-sm text-muted-foreground mt-2">
                  Distribua os pontos de cada atributo (máximo 3 por perícia).
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
              const used = getUsedAttributePointsFor(attribute.id);
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
                        <span className={cn(
                          "text-sm font-medium",
                          isComplete ? "text-green-500" : "text-amber-500"
                        )}>
                          {remaining} restantes
                        </span>
                        {isComplete && <Check className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-2">
                    <div className="flex justify-end mb-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleResetAttribute(attribute.id)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Resetar
                      </Button>
                    </div>
                    {attrSkills.map(skill => (
                      <SkillRow
                        key={skill.id}
                        skill={skill}
                        fromAttr={skills[skill.id] || 0}
                        fromFree={freeSkillPoints[skill.id] || 0}
                        effectiveLevel={getEffectiveSkillLevel(skill.id)}
                        canIncrease={remaining > 0 && (skills[skill.id] || 0) < MAX_SKILL_FROM_ATTRIBUTES && getEffectiveSkillLevel(skill.id) < MAX_SKILL_CREATION}
                        canDecrease={(skills[skill.id] || 0) > 0 || (freeSkillPoints[skill.id] || 0) > 0}
                        onIncrease={() => handleAttributeSkillIncrease(skill.id, attribute.id)}
                        onDecrease={() => handleAttributeSkillDecrease(skill.id)}
                        virtueColor={virtue?.color}
                        theme={activeTheme}
                        mode="attributes"
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>

        {/* TAB: Pontos Livres */}
        <TabsContent value="free" className="space-y-4 mt-4">
          {/* Resumo de Pontos Livres */}
          <Card className={cn(
            "transition-colors",
            allFreePointsDistributed && "border-green-500 bg-green-500/5"
          )}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Pontos Livres
                </span>
                <span className={cn(
                  "text-lg font-bold",
                  allFreePointsDistributed ? "text-green-500" : "text-amber-500"
                )}>
                  {getUsedFreePoints()} / {factionFreePoints} pontos
                </span>
              </div>
              <Progress 
                value={(getUsedFreePoints() / factionFreePoints) * 100} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Adicione até 1 ponto livre por perícia para elevá-la ao nível 4.
              </p>
              <div className="flex justify-end mt-2">
                <Button variant="ghost" size="sm" onClick={handleResetFreePoints}>
                  Resetar Livres
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Perícias */}
          <div className="space-y-2">
            {skillsWithPoints.map(skill => {
              const virtue = getVirtueByAttribute(skill.attributeId);
              return (
                <SkillRow
                  key={skill.id}
                  skill={skill}
                  fromAttr={skill.fromAttr}
                  fromFree={skill.fromFree}
                  effectiveLevel={skill.effectiveLevel}
                  canIncrease={getRemainingFreePoints() > 0 && skill.fromFree < MAX_FREE_POINTS_PER_SKILL && skill.effectiveLevel < MAX_SKILL_CREATION}
                  canDecrease={skill.fromFree > 0}
                  onIncrease={() => handleFreeSkillIncrease(skill.id)}
                  onDecrease={() => handleFreeSkillDecrease(skill.id)}
                  virtueColor={virtue?.color}
                  theme={activeTheme}
                  mode="free"
                />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Legenda */}
      <Card className="bg-muted/50">
        <CardContent className="py-3">
          <p className="text-sm text-muted-foreground">
            <strong>Sistema de Perícias:</strong> Cada atributo fornece pontos para suas perícias (máx. 3 por perícia).
            Pontos livres ({factionFreePoints} total) adicionam +1 em qualquer perícia, elevando até nível 4.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== COMPONENTE SKILL ROW =====

interface SkillRowProps {
  skill: { id: string; attributeId: string };
  fromAttr: number;
  fromFree: number;
  effectiveLevel: number;
  canIncrease: boolean;
  canDecrease: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  virtueColor?: string;
  theme: string;
  mode: 'attributes' | 'free';
}

function SkillRow({
  skill,
  fromAttr,
  fromFree,
  effectiveLevel,
  canIncrease,
  canDecrease,
  onIncrease,
  onDecrease,
  virtueColor,
  theme,
  mode,
}: SkillRowProps) {
  const skillLabel = getSkillLabel(skill.id, theme as 'akashic' | 'tenebralux');
  const attrDef = ATTRIBUTES.find(a => a.id === skill.attributeId);

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-medium truncate">{skillLabel}</span>
        {mode === 'free' && attrDef && (
          <span className="text-xs text-muted-foreground">({attrDef.name})</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Indicador de pontos */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {fromAttr > 0 && (
            <span>Atr: {fromAttr}</span>
          )}
          {fromFree > 0 && (
            <span className="text-amber-500">Livre: {fromFree}</span>
          )}
        </div>

        {/* Botões */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onDecrease}
          disabled={!canDecrease}
        >
          <Minus className="w-4 h-4" />
        </Button>

        {/* Visualização de nível */}
        <div className="flex items-center gap-1 min-w-[80px] justify-center">
          {[1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={cn(
                "w-4 h-4 rounded-full border-2 transition-colors",
                effectiveLevel >= level
                  ? level <= fromAttr
                    ? "border-transparent"
                    : "border-amber-500 bg-amber-500"
                  : "border-muted-foreground/30"
              )}
              style={{
                backgroundColor: effectiveLevel >= level && level <= fromAttr 
                  ? virtueColor || '#888' 
                  : undefined,
              }}
            />
          ))}
          <span className="ml-2 font-bold text-lg w-4 text-center">{effectiveLevel}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onIncrease}
          disabled={!canIncrease}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
