import React, { useState } from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  PRIVILEGE_CATEGORIES,
  getPrivilegesByCategory,
  getPrivilegeById,
  PrivilegeDefinition,
  ChallengeDefinition,
} from '@/data/character/privileges';
import { 
  Gift, 
  AlertTriangle, 
  Check, 
  X, 
  Info,
  Plus,
  Coins,
  GraduationCap,
  Dna,
  Users,
  Sparkles
} from 'lucide-react';

const MAX_PRIVILEGES = 3;

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  recursos: Coins,
  educacao: GraduationCap,
  genetica: Dna,
  conexoes: Users,
  talento: Sparkles,
};

export function StepPrivileges() {
  const { draft, updateDraft, getStepValidation } = useCharacterBuilder();
  const validation = getStepValidation(5);
  
  const selectedPrivileges = draft.blessingIds || [];
  const selectedChallenges = draft.challengeIds || {};
  
  const [expandedPrivilege, setExpandedPrivilege] = useState<string | null>(null);

  const handlePrivilegeToggle = (privilegeId: string) => {
    const isSelected = selectedPrivileges.includes(privilegeId);
    
    if (isSelected) {
      const newPrivileges = selectedPrivileges.filter(id => id !== privilegeId);
      const newChallenges = { ...selectedChallenges };
      delete newChallenges[privilegeId];
      
      updateDraft({
        blessingIds: newPrivileges,
        challengeIds: newChallenges,
      });
      setExpandedPrivilege(null);
    } else if (selectedPrivileges.length < MAX_PRIVILEGES) {
      setExpandedPrivilege(privilegeId);
    }
  };

  const handleChallengeSelect = (privilegeId: string, challengeId: string) => {
    const newPrivileges = selectedPrivileges.includes(privilegeId) 
      ? selectedPrivileges 
      : [...selectedPrivileges, privilegeId];
    
    updateDraft({
      blessingIds: newPrivileges,
      challengeIds: {
        ...selectedChallenges,
        [privilegeId]: challengeId,
      },
    });
    setExpandedPrivilege(null);
  };

  const isPrivilegeComplete = (privilegeId: string): boolean => {
    return selectedPrivileges.includes(privilegeId) && !!selectedChallenges[privilegeId];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Legados</h2>
        <p className="text-muted-foreground">
          Escolha até {MAX_PRIVILEGES} Privilégios que definem a origem do seu personagem.
          Cada privilégio vem com um desafio obrigatório.
        </p>
      </div>

      <Card className={cn(
        "transition-colors",
        selectedPrivileges.length === MAX_PRIVILEGES && "border-green-500 bg-green-500/5"
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-500" />
              <span className="font-medium">Privilégios Selecionados</span>
            </div>
            <Badge variant={selectedPrivileges.length === MAX_PRIVILEGES ? "default" : "secondary"}>
              {selectedPrivileges.length} / {MAX_PRIVILEGES}
            </Badge>
          </div>
          
          {selectedPrivileges.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedPrivileges.map(privilegeId => {
                const privilege = getPrivilegeById(privilegeId);
                const challengeId = selectedChallenges[privilegeId];
                const challenge = privilege?.challenges.find(c => c.id === challengeId);
                
                if (!privilege) return null;
                
                return (
                  <div key={privilegeId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-sm">{privilege.name}</span>
                      {challenge && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline" className="text-red-500 border-red-500/50">
                            {challenge.name}
                          </Badge>
                        </>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handlePrivilegeToggle(privilegeId)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>Privilégios representam vantagens de nascimento ou background. Cada um vem com um preço - você deve escolher um dos dois desafios associados.</p>
              <p className="mt-1">Privilégios são <strong>opcionais</strong> - você pode ter entre 0 e 3.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Accordion type="multiple" defaultValue={[PRIVILEGE_CATEGORIES[0].id]} className="space-y-3">
        {PRIVILEGE_CATEGORIES.map((category) => {
          const categoryPrivileges = getPrivilegesByCategory(category.id);
          const selectedInCategory = categoryPrivileges.filter(p => selectedPrivileges.includes(p.id)).length;
          const IconComponent = CATEGORY_ICONS[category.id] || Gift;

          return (
            <AccordionItem key={category.id} value={category.id} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline" style={{ borderLeft: `4px solid ${category.color}` }}>
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5" style={{ color: category.color }} />
                    <span className="font-semibold">{category.name}</span>
                  </div>
                  {selectedInCategory > 0 && (
                    <Badge variant="secondary">{selectedInCategory} selecionado{selectedInCategory > 1 ? 's' : ''}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  {categoryPrivileges.map((privilege) => (
                    <PrivilegeCard
                      key={privilege.id}
                      privilege={privilege}
                      isSelected={selectedPrivileges.includes(privilege.id)}
                      isComplete={isPrivilegeComplete(privilege.id)}
                      isExpanded={expandedPrivilege === privilege.id}
                      selectedChallengeId={selectedChallenges[privilege.id]}
                      canSelect={selectedPrivileges.length < MAX_PRIVILEGES || selectedPrivileges.includes(privilege.id)}
                      onToggle={() => handlePrivilegeToggle(privilege.id)}
                      onChallengeSelect={(challengeId) => handleChallengeSelect(privilege.id, challengeId)}
                      onExpand={() => setExpandedPrivilege(privilege.id)}
                      onCollapse={() => setExpandedPrivilege(null)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {validation.errors.length > 0 && (
        <Card className="border-amber-500 bg-amber-500/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{validation.errors.map(e => e.message).join('. ')}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface PrivilegeCardProps {
  privilege: PrivilegeDefinition;
  isSelected: boolean;
  isComplete: boolean;
  isExpanded: boolean;
  selectedChallengeId?: string;
  canSelect: boolean;
  onToggle: () => void;
  onChallengeSelect: (challengeId: string) => void;
  onExpand: () => void;
  onCollapse: () => void;
}

function PrivilegeCard({ privilege, isSelected, isComplete, isExpanded, selectedChallengeId, canSelect, onToggle, onChallengeSelect, onExpand, onCollapse }: PrivilegeCardProps) {
  const [pendingChallenge, setPendingChallenge] = useState<string | null>(null);

  const handleCardClick = () => {
    if (isComplete) onToggle();
    else if (canSelect) onExpand();
  };

  const handleConfirm = () => {
    if (pendingChallenge) {
      onChallengeSelect(pendingChallenge);
      setPendingChallenge(null);
    }
  };

  return (
    <Card className={cn("transition-all", isComplete && "border-green-500 bg-green-500/5", isExpanded && "ring-2 ring-primary", !canSelect && !isSelected && "opacity-50")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {isComplete && <Check className="w-4 h-4 text-green-500" />}
              {privilege.name}
            </CardTitle>
            <CardDescription className="mt-1">{privilege.description}</CardDescription>
          </div>
          {!isExpanded && (
            <Button variant={isComplete ? "outline" : "secondary"} size="sm" onClick={handleCardClick} disabled={!canSelect && !isSelected}>
              {isComplete ? (<><X className="w-4 h-4 mr-1" />Remover</>) : (<><Plus className="w-4 h-4 mr-1" />Selecionar</>)}
            </Button>
          )}
        </div>
        {privilege.effect && (
          <div className="mt-2 p-2 rounded bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
            <span className="font-medium">Efeito:</span> {privilege.effect}
          </div>
        )}
      </CardHeader>

      {isExpanded && !isComplete && (
        <CardContent className="pt-0">
          <Separator className="my-3" />
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-red-500">
              <AlertTriangle className="w-4 h-4" />Escolha um Desafio obrigatório:
            </div>
            <RadioGroup value={pendingChallenge || ''} onValueChange={setPendingChallenge} className="space-y-2">
              {privilege.challenges.map((challenge) => (
                <Label key={challenge.id} htmlFor={challenge.id} className={cn("flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-red-500/50 hover:bg-red-500/5 [&:has([data-state=checked])]:border-red-500 [&:has([data-state=checked])]:bg-red-500/10")}>
                  <RadioGroupItem value={challenge.id} id={challenge.id} className="mt-1" />
                  <div className="flex-1">
                    <span className="font-medium text-red-600 dark:text-red-400">{challenge.name}</span>
                    <p className="text-sm text-muted-foreground mt-0.5">{challenge.description}</p>
                    {challenge.effect && <p className="text-xs text-red-500 mt-1">{challenge.effect}</p>}
                  </div>
                </Label>
              ))}
            </RadioGroup>
            <div className="flex gap-2 pt-2">
              <Button variant="default" size="sm" onClick={handleConfirm} disabled={!pendingChallenge} className="flex-1">
                <Check className="w-4 h-4 mr-1" />Confirmar
              </Button>
              <Button variant="outline" size="sm" onClick={onCollapse}>Cancelar</Button>
            </div>
          </div>
        </CardContent>
      )}

      {isComplete && selectedChallengeId && (
        <CardContent className="pt-0">
          <div className="p-2 rounded bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 text-red-500 text-sm font-medium mb-1">
              <AlertTriangle className="w-4 h-4" />Desafio:
            </div>
            {(() => {
              const challenge = privilege.challenges.find(c => c.id === selectedChallengeId);
              return challenge ? (
                <div className="text-sm">
                  <span className="font-medium">{challenge.name}</span>
                  <span className="text-muted-foreground"> - {challenge.description}</span>
                  {challenge.effect && <p className="text-red-600 dark:text-red-400 mt-1">{challenge.effect}</p>}
                </div>
              ) : null;
            })()}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
