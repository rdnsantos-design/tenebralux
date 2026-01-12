import React, { useEffect, useMemo, useState } from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  VIRTUES, 
  getVirtueById, 
  getStartingVirtue,
  VirtueDefinition,
  VirtuePower
} from '@/data/character/virtues';
import { VirtuePowerChoice } from '@/types/character-builder';
import { 
  Sparkles, 
  Sword, 
  Mountain, 
  Users, 
  Info,
  Check,
  Lock,
  Zap,
  ChevronRight
} from 'lucide-react';

// Mapeamento de ícones
const VIRTUE_ICONS: Record<string, React.ElementType> = {
  sabedoria: Sparkles,
  coragem: Sword,
  perseveranca: Mountain,
  harmonia: Users,
};

export function StepVirtues() {
  const { draft, updateDraft, getStepValidation } = useCharacterBuilder();
  const validation = getStepValidation(6);
  
  // Determinar virtude inicial baseado na facção
  const startingVirtueId = useMemo(() => {
    return getStartingVirtue(draft.factionId);
  }, [draft.factionId]);

  const needsChoice = startingVirtueId === 'choice';
  
  // Se precisa escolher e ainda não escolheu, usar state local
  const [selectedVirtue, setSelectedVirtue] = useState<string | null>(
    draft.startingVirtue || null
  );

  // Atualizar draft quando selecionar virtude
  useEffect(() => {
    if (needsChoice && selectedVirtue) {
      updateDraft({ startingVirtue: selectedVirtue });
    } else if (!needsChoice && startingVirtueId !== 'choice') {
      updateDraft({ startingVirtue: startingVirtueId });
    }
  }, [needsChoice, selectedVirtue, startingVirtueId, updateDraft]);

  // Virtude ativa (selecionada ou definida pela facção)
  const activeVirtueId = needsChoice 
    ? (selectedVirtue || draft.startingVirtue) 
    : startingVirtueId;

  // Construir objeto de virtudes para o draft
  const virtuesObject = useMemo(() => {
    const virtues: Record<string, number> = {
      sabedoria: 0,
      coragem: 0,
      perseveranca: 0,
      harmonia: 0,
    };
    if (activeVirtueId && activeVirtueId !== 'choice') {
      virtues[activeVirtueId] = 1;
    }
    return virtues;
  }, [activeVirtueId]);

  // Atualizar draft com virtudes
  useEffect(() => {
    updateDraft({ virtues: virtuesObject });
  }, [virtuesObject, updateDraft]);

  // Função para selecionar poder
  const handleSelectPower = (virtueId: string, level: number, power: VirtuePower) => {
    const key = `${virtueId}_${level}`;
    const newPowers: Record<string, VirtuePowerChoice> = {
      ...(draft.virtuePowers || {}),
      [key]: {
        virtueId,
        level,
        powerId: power.id,
        powerName: power.name,
      }
    };
    updateDraft({ virtuePowers: newPowers });
  };

  // Obter poder selecionado para uma virtude/nível
  const getSelectedPower = (virtueId: string, level: number): string | null => {
    const key = `${virtueId}_${level}`;
    return draft.virtuePowers?.[key]?.powerId || null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Virtudes</h2>
        <p className="text-muted-foreground">
          As quatro virtudes representam caminhos de evolução espiritual e pessoal.
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              {needsChoice ? (
                <p>
                  Sua facção permite <strong>escolha livre</strong> da virtude inicial. 
                  Selecione uma das quatro virtudes para começar no nível 1.
                </p>
              ) : (
                <p>
                  Sua facção define <strong>{getVirtueById(startingVirtueId)?.name}</strong> como 
                  virtude inicial. Você começa no nível 1 nessa virtude.
                </p>
              )}
              <p className="mt-1">
                <strong>Ao subir de nível em uma virtude, escolha 1 entre 2 poderes disponíveis.</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seletor de Virtude (se necessário) */}
      {needsChoice && (
        <Card className={cn(
          "transition-colors",
          selectedVirtue && "border-green-500 bg-green-500/5"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {selectedVirtue ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Info className="w-5 h-5 text-amber-500" />
              )}
              Escolha sua Virtude Inicial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedVirtue || ''}
              onValueChange={setSelectedVirtue}
              className="grid grid-cols-2 gap-3"
            >
              {VIRTUES.map((virtue) => {
                const IconComponent = VIRTUE_ICONS[virtue.id] || Sparkles;
                return (
                  <Label
                    key={virtue.id}
                    htmlFor={`virtue-${virtue.id}`}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      "hover:border-primary/50",
                      "[&:has([data-state=checked])]:border-2",
                      selectedVirtue === virtue.id && "ring-2 ring-offset-2"
                    )}
                    style={{
                      borderColor: selectedVirtue === virtue.id ? virtue.color : undefined,
                      ['--tw-ring-color' as string]: virtue.color,
                    }}
                  >
                    <RadioGroupItem 
                      value={virtue.id} 
                      id={`virtue-${virtue.id}`}
                    />
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: virtue.color }}
                    />
                    <div>
                      <span className="font-medium">{virtue.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({virtue.latin})
                      </span>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Cards de Virtudes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {VIRTUES.map((virtue) => (
          <VirtueCard
            key={virtue.id}
            virtue={virtue}
            currentLevel={virtuesObject[virtue.id] || 0}
            isActive={activeVirtueId === virtue.id}
            isLocked={!needsChoice && activeVirtueId !== virtue.id}
            getSelectedPower={getSelectedPower}
            onSelectPower={handleSelectPower}
          />
        ))}
      </div>

      {/* Validação */}
      {validation.errors.length > 0 && (
        <Card className="border-amber-500 bg-amber-500/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-500">
              <Info className="w-4 h-4" />
              <span className="text-sm">
                {validation.errors.map(e => e.message).join('. ')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente de Card de Virtude
interface VirtueCardProps {
  virtue: VirtueDefinition;
  currentLevel: number;
  isActive: boolean;
  isLocked: boolean;
  getSelectedPower: (virtueId: string, level: number) => string | null;
  onSelectPower: (virtueId: string, level: number, power: VirtuePower) => void;
}

function VirtueCard({ 
  virtue, 
  currentLevel, 
  isActive, 
  isLocked,
  getSelectedPower,
  onSelectPower
}: VirtueCardProps) {
  const IconComponent = VIRTUE_ICONS[virtue.id] || Sparkles;

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isActive && "ring-2 ring-offset-2",
      isLocked && "opacity-50"
    )}
    style={{
      borderColor: isActive ? virtue.color : undefined,
      ['--tw-ring-color' as string]: virtue.color,
    }}
    >
      <CardHeader 
        className="pb-2"
        style={{ backgroundColor: `${virtue.color}15` }}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <IconComponent 
              className="w-5 h-5" 
              style={{ color: virtue.color }}
            />
            {virtue.name}
            <span className="text-sm font-normal text-muted-foreground">
              ({virtue.latin})
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge style={{ backgroundColor: virtue.color }}>
                Ativa
              </Badge>
            )}
            {isLocked && (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
        <CardDescription>{virtue.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {/* Progress bar de níveis */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Nível {currentLevel}</span>
            <span>Máximo: 3</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors",
                  level <= currentLevel 
                    ? "" 
                    : "bg-muted"
                )}
                style={{
                  backgroundColor: level <= currentLevel ? virtue.color : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {/* Lista de níveis com poderes */}
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3 pr-2">
            {virtue.levels.slice(1).map((levelData) => {
              const isUnlocked = levelData.level <= currentLevel;
              const selectedPowerId = getSelectedPower(virtue.id, levelData.level);
              
              return (
                <div 
                  key={levelData.level}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    isUnlocked ? "bg-card" : "bg-muted/30 opacity-60",
                    levelData.level === currentLevel && isActive && "ring-1 ring-offset-1"
                  )}
                  style={{
                    borderColor: isUnlocked ? `${virtue.color}40` : undefined,
                    ['--tw-ring-color' as string]: virtue.color,
                  }}
                >
                  {/* Header do nível */}
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant={isUnlocked ? "default" : "outline"} 
                      className="text-xs"
                      style={{
                        backgroundColor: isUnlocked ? virtue.color : undefined,
                      }}
                    >
                      Nível {levelData.level}
                    </Badge>
                    <span className="font-medium text-sm">{levelData.name}</span>
                    {!isUnlocked && <Lock className="w-3 h-3 text-muted-foreground ml-auto" />}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3">
                    {levelData.description}
                  </p>

                  {/* Opções de poderes */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Zap className="w-3 h-3" />
                      Escolha um poder:
                    </div>
                    
                    <RadioGroup
                      value={selectedPowerId || ''}
                      onValueChange={(powerId) => {
                        const power = levelData.powers.find(p => p.id === powerId);
                        if (power) {
                          onSelectPower(virtue.id, levelData.level, power);
                        }
                      }}
                      className="space-y-2"
                      disabled={!isUnlocked && !isActive}
                    >
                      {levelData.powers.map((power) => (
                        <Label
                          key={power.id}
                          htmlFor={`power-${virtue.id}-${levelData.level}-${power.id}`}
                          className={cn(
                            "flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-all text-sm",
                            "hover:bg-muted/50",
                            selectedPowerId === power.id && "border-2 bg-muted/30",
                            (!isUnlocked && !isActive) && "cursor-not-allowed opacity-50"
                          )}
                          style={{
                            borderColor: selectedPowerId === power.id ? virtue.color : undefined,
                          }}
                        >
                          <RadioGroupItem 
                            value={power.id} 
                            id={`power-${virtue.id}-${levelData.level}-${power.id}`}
                            className="mt-0.5"
                            disabled={!isUnlocked && !isActive}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <ChevronRight className="w-3 h-3 shrink-0" style={{ color: virtue.color }} />
                              <span className="font-medium">{power.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {power.description}
                            </p>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
