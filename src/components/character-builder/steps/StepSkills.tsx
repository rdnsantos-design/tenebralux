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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ATTRIBUTES } from '@/data/character/attributes';
import { SKILLS, getSkillsByAttribute, getSkillLabel } from '@/data/character/skills';
import { getVirtueByAttribute } from '@/data/character/virtues';
import { getFactionFreeSkillPoints } from '@/data/character/factions';
import { CharacterAttributes } from '@/core/types';
import { Minus, Plus, RotateCcw, Check, AlertCircle, Sparkles, Loader2, Star } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useRpgSkillSpecializations, RpgSkillSpecialization } from '@/hooks/useRpgSkills';
import { SkillSpecialization } from '@/types/character-builder';

// Configurações do sistema de perícias
const MAX_SKILL_LEVEL = 6; // Nível máximo absoluto de perícia
const MAX_SKILL_FROM_ATTRIBUTES = 3; // Máximo que pontos de atributo podem elevar
const MAX_FREE_POINTS_PER_SKILL = 1; // Máximo de pontos livres por perícia
const MAX_SKILL_CREATION = 4; // Máximo na criação de personagem (com pontos livres)
const MIN_SKILL_VALUE = 0;

export function StepSkills() {
  const { draft, updateDraft } = useCharacterBuilder();
  const { activeTheme } = useTheme();
  const { data: allSpecializations = [], isLoading: specsLoading } = useRpgSkillSpecializations();

  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null);
  const [pendingAttributeId, setPendingAttributeId] = useState<string | null>(null);
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
  const skillSpecializations: Record<string, SkillSpecialization> = draft.skillSpecializations || {};

  // Pontos livres disponíveis baseado na facção
  const factionFreePoints = getFactionFreeSkillPoints(draft.factionId || '');

  // ===== CÁLCULOS DE PONTOS DE ATRIBUTO =====
  
  // Verifica se uma especialização foi adquirida via ponto de atributo
  // Uma especialização vem de ponto de atributo se skills[skillId] >= 3
  // (pois o jogador precisa de nível 3 para poder adicionar especialização)
  const isSpecFromAttributePoints = (skillId: string): boolean => {
    const fromAttr = skills[skillId] || 0;
    // Se tem 3+ pontos de atributo, a especialização veio de atributo
    return fromAttr >= 3;
  };

  // Pontos de atributo usados por atributo (NÃO conta especializações de pontos livres)
  const getUsedAttributePointsFor = (attributeId: string): number => {
    const attrSkills = getSkillsByAttribute(attributeId);
    return attrSkills.reduce((sum, skill) => {
      const baseValue = skills[skill.id] || 0;
      const hasSpec = skillSpecializations[skill.id] !== undefined;
      // Só conta a especialização se ela veio de pontos de atributo
      const specFromAttr = hasSpec && isSpecFromAttributePoints(skill.id) ? 1 : 0;
      return sum + baseValue + specFromAttr;
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
  
  // Nível total de uma perícia (atributo + livre + especialização)
  const getEffectiveSkillLevel = (skillId: string): number => {
    const fromAttr = skills[skillId] || 0;
    const fromFree = freeSkillPoints[skillId] || 0;
    const hasSpec = skillSpecializations[skillId] !== undefined;
    return fromAttr + fromFree + (hasSpec ? 1 : 0);
  };

  // Nível base (sem especialização)
  const getBaseSkillLevel = (skillId: string): number => {
    const fromAttr = skills[skillId] || 0;
    const fromFree = freeSkillPoints[skillId] || 0;
    return fromAttr + fromFree;
  };

  // ===== HANDLERS DE PONTOS DE ATRIBUTO =====

  const handleAttributeSkillIncrease = (skillId: string, attributeId: string) => {
    const currentFromAttr = skills[skillId] || 0;
    const hasSpec = skillSpecializations[skillId] !== undefined;
    const effectiveLevel = getEffectiveSkillLevel(skillId);

    // Verificações
    if (currentFromAttr >= MAX_SKILL_FROM_ATTRIBUTES) return; // Máximo de pontos de atributo
    if (effectiveLevel >= MAX_SKILL_CREATION) return; // Máximo na criação
    if (getRemainingAttributePointsFor(attributeId) <= 0) return; // Sem pontos

    // Se vai para o nível 4 efetivo, oferece escolha de especialização
    if (effectiveLevel === 3 && !hasSpec) {
      setPendingSkillId(skillId);
      setPendingAttributeId(attributeId);
      setSpecDialogOpen(true);
      return;
    }

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
    const hasSpec = skillSpecializations[skillId] !== undefined;

    // Primeiro remove especialização
    if (hasSpec) {
      const newSpecs = { ...skillSpecializations };
      delete newSpecs[skillId];
      updateDraft({ skillSpecializations: newSpecs });
      return;
    }

    // Depois remove pontos livres
    if (currentFromFree > 0) {
      updateDraft({
        freeSkillPoints: {
          ...freeSkillPoints,
          [skillId]: currentFromFree - 1,
        },
      });
      return;
    }

    // Por último remove pontos de atributo
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
    const hasSpec = skillSpecializations[skillId] !== undefined;
    const effectiveLevel = getEffectiveSkillLevel(skillId);

    // Verificações
    // Pontos livres podem elevar até MAX_SKILL_CREATION, mas máximo de 1 ponto livre por perícia
    if (currentFromFree >= MAX_FREE_POINTS_PER_SKILL) return; // Máximo de pontos livres por perícia
    if (effectiveLevel >= MAX_SKILL_CREATION) return; // Máximo na criação
    if (getRemainingFreePoints() <= 0) return; // Sem pontos livres

    // Se vai para o nível 4 efetivo, oferece escolha de especialização
    if (effectiveLevel === 3 && !hasSpec) {
      setPendingSkillId(skillId);
      setPendingAttributeId(null); // null indica que é ponto livre
      setSpecDialogOpen(true);
      return;
    }

    updateDraft({
      freeSkillPoints: {
        ...freeSkillPoints,
        [skillId]: currentFromFree + 1,
      },
    });
  };

  const handleFreeSkillDecrease = (skillId: string) => {
    const currentFromFree = freeSkillPoints[skillId] || 0;
    const hasSpec = skillSpecializations[skillId] !== undefined;

    // Se tem especialização e ela veio de ponto livre
    if (hasSpec) {
      const fromAttr = skills[skillId] || 0;
      // Se tem 3 de atributo e especialização, a spec veio de atributo
      // Se tem menos de 3 de atributo, a spec pode ter vindo de livre
      if (fromAttr < 3) {
        const newSpecs = { ...skillSpecializations };
        delete newSpecs[skillId];
        updateDraft({ skillSpecializations: newSpecs });
        return;
      }
    }

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

  // ===== HANDLERS DE ESPECIALIZAÇÃO =====

  const handleChooseNormalLevel = () => {
    if (!pendingSkillId) return;
    
    // Determina se o ponto vem de atributo ou livre
    if (pendingAttributeId) {
      // Ponto de atributo
      const currentFromAttr = skills[pendingSkillId] || 0;
      updateDraft({
        skills: {
          ...skills,
          [pendingSkillId]: currentFromAttr + 1,
        },
      });
    } else {
      // Ponto livre
      const currentFromFree = freeSkillPoints[pendingSkillId] || 0;
      updateDraft({
        freeSkillPoints: {
          ...freeSkillPoints,
          [pendingSkillId]: currentFromFree + 1,
        },
      });
    }
    
    setSpecDialogOpen(false);
    setPendingSkillId(null);
    setPendingAttributeId(null);
  };

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

  // ===== RESET =====

  const handleResetAll = () => {
    updateDraft({ skills: {}, freeSkillPoints: {}, skillSpecializations: {} });
  };

  const handleResetAttribute = (attributeId: string) => {
    const attrSkills = getSkillsByAttribute(attributeId);
    const newSkills = { ...skills };
    const newFreeSkills = { ...freeSkillPoints };
    const newSpecs = { ...skillSpecializations };
    
    attrSkills.forEach(skill => {
      delete newSkills[skill.id];
      delete newFreeSkills[skill.id];
      delete newSpecs[skill.id];
    });
    
    updateDraft({ skills: newSkills, freeSkillPoints: newFreeSkills, skillSpecializations: newSpecs });
  };

  const handleResetFreePoints = () => {
    // Remove pontos livres mas mantém pontos de atributo
    // Remove especializações que dependiam de pontos livres
    const newSpecs = { ...skillSpecializations };
    
    Object.keys(freeSkillPoints).forEach(skillId => {
      const fromAttr = skills[skillId] || 0;
      // Se tinha menos de 3 de atributo e tinha especialização, remove
      if (fromAttr < 3 && newSpecs[skillId]) {
        delete newSpecs[skillId];
      }
    });
    
    updateDraft({ freeSkillPoints: {}, skillSpecializations: newSpecs });
  };

  // ===== CÁLCULOS GERAIS =====

  // Verificar se todos os pontos de atributo foram distribuídos
  const allAttributePointsDistributed = useMemo(() => {
    return ATTRIBUTES.every(attr => getRemainingAttributePointsFor(attr.id) === 0);
  }, [attributes, skills, skillSpecializations]);

  // Verificar se todos os pontos livres foram distribuídos
  const allFreePointsDistributed = useMemo(() => {
    return getRemainingFreePoints() === 0;
  }, [freeSkillPoints]);

  // Totais de pontos de atributo
  const totalAttributePointsAvailable = useMemo(() => {
    return Object.values(attributes).reduce((sum, val) => sum + (val || 0), 0);
  }, [attributes]);

  const totalAttributePointsUsed = useMemo(() => {
    const skillPoints = Object.values(skills).reduce((sum, val) => sum + (val || 0), 0);
    // Só conta especializações que vieram de pontos de atributo
    const specPointsFromAttr = Object.keys(skillSpecializations).filter(skillId => 
      isSpecFromAttributePoints(skillId)
    ).length;
    return skillPoints + specPointsFromAttr;
  }, [skills, skillSpecializations]);

  // Especializações da perícia pendente
  const pendingSkillSpecs = useMemo(() => {
    if (!pendingSkillId) return [];
    return allSpecializations.filter(s => s.skill_id === pendingSkillId);
  }, [pendingSkillId, allSpecializations]);

  const pendingSkillLabel = pendingSkillId ? getSkillLabel(pendingSkillId, activeTheme) : '';

  // Perícias com pontos (para aba de pontos livres)
  const skillsWithPoints = useMemo(() => {
    return SKILLS.map(skill => ({
      ...skill,
      fromAttr: skills[skill.id] || 0,
      fromFree: freeSkillPoints[skill.id] || 0,
      hasSpec: skillSpecializations[skill.id] !== undefined,
      specialization: skillSpecializations[skill.id],
      effectiveLevel: getEffectiveSkillLevel(skill.id),
    })).sort((a, b) => b.effectiveLevel - a.effectiveLevel);
  }, [skills, freeSkillPoints, skillSpecializations]);

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
                        const fromAttr = skills[skill.id] || 0;
                        const fromFree = freeSkillPoints[skill.id] || 0;
                        const specialization = skillSpecializations[skill.id];
                        const effectiveLevel = fromAttr + fromFree + (specialization ? 1 : 0);
                        
                        return (
                          <SkillRow
                            key={skill.id}
                            skillId={skill.id}
                            label={getSkillLabel(skill.id, activeTheme)}
                            fromAttr={fromAttr}
                            fromFree={fromFree}
                            specialization={specialization}
                            effectiveLevel={effectiveLevel}
                            maxLevelDisplay={MAX_SKILL_CREATION}
                            virtueColor={virtue?.color || '#888'}
                            canIncrease={remaining > 0 && fromAttr < MAX_SKILL_FROM_ATTRIBUTES && effectiveLevel < MAX_SKILL_CREATION}
                            onIncrease={() => handleAttributeSkillIncrease(skill.id, attribute.id)}
                            onDecrease={() => handleAttributeSkillDecrease(skill.id)}
                            mode="attributes"
                          />
                        );
                      })}
                    </div>
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
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  <span className="font-medium">Pontos Livres</span>
                </div>
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
              <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-muted-foreground">
                Adicione até 1 ponto livre por perícia para elevá-la ao nível 4.
              </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={handleResetFreePoints}
                >
                  Resetar Livres
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Todas as Perícias */}
          <Card>
            <CardContent className="py-4">
              <div className="space-y-2">
                {skillsWithPoints.map((skill) => {
                  const virtue = getVirtueByAttribute(skill.attributeId);
                  
                  return (
                    <SkillRow
                      key={skill.id}
                      skillId={skill.id}
                      label={getSkillLabel(skill.id, activeTheme)}
                      fromAttr={skill.fromAttr}
                      fromFree={skill.fromFree}
                      specialization={skill.specialization}
                      effectiveLevel={skill.effectiveLevel}
                      maxLevelDisplay={MAX_SKILL_CREATION}
                      virtueColor={virtue?.color || '#888'}
                      // Pontos livres: pode adicionar se nível < 4 e ainda não usou ponto livre nessa perícia
                      canIncrease={getRemainingFreePoints() > 0 && skill.effectiveLevel < MAX_SKILL_CREATION && skill.fromFree < MAX_FREE_POINTS_PER_SKILL}
                      onIncrease={() => handleFreeSkillIncrease(skill.id)}
                      onDecrease={() => handleFreeSkillDecrease(skill.id)}
                      mode="free"
                      attributeName={ATTRIBUTES.find(a => a.id === skill.attributeId)?.name}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Legenda */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p>
                <strong>Pontos de Atributo:</strong> Cada atributo fornece pontos iguais ao seu valor. 
                Podem elevar perícias até o nível <strong>3</strong>.
              </p>
              <p>
                <strong>Pontos Livres ({factionFreePoints}):</strong> Adicione até <strong>1</strong> ponto 
                por perícia para elevá-la ao nível <strong>4</strong> (máximo na criação).
              </p>
              <p>
                <Sparkles className="w-3 h-3 inline mr-1" />
                <strong>Especialização:</strong> No 4º nível, pode trocar por uma ênfase específica.
              </p>
              <p className="text-xs opacity-75">
                Obs: Perícias podem chegar até {MAX_SKILL_LEVEL} durante o jogo, mas na criação o máximo é {MAX_SKILL_CREATION}.
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

// ===== COMPONENTE DE LINHA DE PERÍCIA =====

interface SkillRowProps {
  skillId: string;
  label: string;
  fromAttr: number;
  fromFree: number;
  specialization?: SkillSpecialization;
  effectiveLevel: number;
  maxLevelDisplay: number;
  virtueColor: string;
  canIncrease: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  mode: 'attributes' | 'free';
  attributeName?: string;
}

function SkillRow({ 
  label, 
  fromAttr,
  fromFree,
  specialization,
  effectiveLevel,
  maxLevelDisplay,
  virtueColor,
  canIncrease, 
  onIncrease, 
  onDecrease,
  mode,
  attributeName,
}: SkillRowProps) {
  const isMin = effectiveLevel <= MIN_SKILL_VALUE;
  const isMax = effectiveLevel >= maxLevelDisplay;
  const baseLevel = fromAttr + fromFree;

  return (
    <div className="flex items-center gap-3 py-1">
      {/* Nome da Perícia */}
      <div className={cn(
        "min-w-[140px] flex-1",
        effectiveLevel > 0 ? "font-medium" : "text-muted-foreground"
      )}>
        <div className="flex items-center gap-2">
          <span className="text-sm">{label}</span>
          {mode === 'free' && attributeName && (
            <span className="text-xs text-muted-foreground">({attributeName})</span>
          )}
        </div>
        {specialization && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className="mt-1 text-xs gap-1 cursor-help"
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

      {/* Info de pontos */}
      {mode === 'free' && (fromAttr > 0 || fromFree > 0) && (
        <div className="text-xs text-muted-foreground flex gap-2">
          {fromAttr > 0 && <span>Atr: {fromAttr}</span>}
          {fromFree > 0 && <span className="text-primary">Livre: {fromFree}</span>}
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center gap-2">
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
          {Array.from({ length: maxLevelDisplay }).map((_, i) => {
            const isFilled = i < effectiveLevel;
            const isFromAttr = i < fromAttr;
            const isFromFree = i >= fromAttr && i < baseLevel;
            const isSpecSlot = i === baseLevel && specialization;
            
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
                  backgroundColor: isFilled 
                    ? isFromFree 
                      ? 'hsl(var(--primary))' 
                      : virtueColor 
                    : 'transparent',
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
