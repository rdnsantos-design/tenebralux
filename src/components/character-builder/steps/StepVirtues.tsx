import React, { useEffect, useMemo, useState } from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  VIRTUES, 
  getVirtueById, 
  getStartingVirtue,
  VirtueDefinition 
} from '@/data/character/virtues';
import { 
  Sparkles, 
  Sword, 
  Mountain, 
  Users, 
  Info,
  Check,
  Lock
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
                Virtudes evoluem durante o jogo através de ações e decisões roleplay.
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VIRTUES.map((virtue) => (
          <VirtueCard
            key={virtue.id}
            virtue={virtue}
            currentLevel={virtuesObject[virtue.id] || 0}
            isActive={activeVirtueId === virtue.id}
            isLocked={!needsChoice && activeVirtueId !== virtue.id}
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
}

function VirtueCard({ virtue, currentLevel, isActive, isLocked }: VirtueCardProps) {
  const IconComponent = VIRTUE_ICONS[virtue.id] || Sparkles;
  const currentLevelData = virtue.levels[currentLevel];

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

        {/* Nível atual */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              Nível {currentLevel}
            </Badge>
            <span className="font-medium text-sm">{currentLevelData.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {currentLevelData.description}
          </p>
          {currentLevelData.benefits && currentLevelData.benefits.length > 0 && (
            <ul className="mt-2 space-y-1">
              {currentLevelData.benefits.map((benefit, i) => (
                <li key={i} className="text-xs flex items-start gap-1">
                  <Check className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Preview do próximo nível */}
        {currentLevel < 3 && (
          <div className="p-3 rounded-lg border border-dashed opacity-60">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                Próximo: Nível {currentLevel + 1}
              </Badge>
              <span className="font-medium text-sm">
                {virtue.levels[currentLevel + 1].name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {virtue.levels[currentLevel + 1].description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
