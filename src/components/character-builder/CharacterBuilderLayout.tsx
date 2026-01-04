import React from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { WIZARD_STEPS, WizardStep } from '@/types/character-builder';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Check, Circle, User, BarChart3, ListChecks, Calculator, Gift, Sparkles, Swords, FileText } from 'lucide-react';

interface CharacterBuilderLayoutProps {
  children: React.ReactNode;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  BarChart3,
  ListChecks,
  Calculator,
  Gift,
  Sparkles,
  Swords,
  FileText,
};

export function CharacterBuilderLayout({ children }: CharacterBuilderLayoutProps) {
  const { 
    currentStep, 
    draft, 
    nextStep, 
    prevStep, 
    goToStep,
    getStepValidation,
    canProceedToStep 
  } = useCharacterBuilder();

  const getStepStatus = (step: number) => {
    if (step < currentStep) {
      const validation = getStepValidation(step as WizardStep);
      return validation.isValid ? 'complete' : 'error';
    }
    if (step === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Criador de Personagem</h1>
              {draft.name && (
                <p className="text-muted-foreground">{draft.name}</p>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Etapa {currentStep} de 8
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Steps */}
          <aside className="hidden lg:block w-64 shrink-0">
            <nav className="sticky top-24 space-y-1">
              {WIZARD_STEPS.map((stepDef) => {
                const status = getStepStatus(stepDef.step);
                const canGo = canProceedToStep(stepDef.step);
                const IconComponent = ICON_MAP[stepDef.icon] || Circle;

                return (
                  <button
                    key={stepDef.step}
                    onClick={() => canGo && goToStep(stepDef.step)}
                    disabled={!canGo}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                      status === 'current' && "bg-primary text-primary-foreground",
                      status === 'complete' && "bg-green-500/10 text-green-500 hover:bg-green-500/20",
                      status === 'error' && "bg-destructive/10 text-destructive",
                      status === 'pending' && "text-muted-foreground",
                      canGo && status !== 'current' && "hover:bg-accent cursor-pointer",
                      !canGo && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                      status === 'current' && "bg-primary-foreground/20",
                      status === 'complete' && "bg-green-500/20",
                      status === 'pending' && "bg-muted"
                    )}>
                      {status === 'complete' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <IconComponent className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{stepDef.name}</div>
                      <div className="text-xs opacity-70 truncate">{stepDef.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-card rounded-lg border p-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Footer - Navigation */}
      <footer className="border-t bg-card/50 backdrop-blur sticky bottom-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <div className="flex items-center gap-2">
              {WIZARD_STEPS.map((stepDef) => (
                <div
                  key={stepDef.step}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    stepDef.step === currentStep && "bg-primary w-4",
                    stepDef.step < currentStep && "bg-green-500",
                    stepDef.step > currentStep && "bg-muted"
                  )}
                />
              ))}
            </div>

            <Button
              onClick={() => nextStep()}
              disabled={currentStep === 8}
            >
              {currentStep === 8 ? 'Finalizar' : 'Próximo'}
              {currentStep < 8 && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
