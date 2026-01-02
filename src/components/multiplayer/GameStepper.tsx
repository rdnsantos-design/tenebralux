import { CheckCircle2, Circle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GamePhase } from '@/types/multiplayer';

interface Step {
  id: GamePhase;
  label: string;
  disabled?: boolean;
}

const STEPS: Step[] = [
  { id: 'lobby', label: 'Lobby' },
  { id: 'culture_selection', label: 'Cultura' },
  { id: 'scenario_selection', label: 'Cenário' },
  { id: 'deckbuilding', label: 'Deckbuilding' },
  { id: 'combat', label: 'Combate' },
];

const PHASE_ORDER: GamePhase[] = ['lobby', 'culture_selection', 'scenario_selection', 'deckbuilding', 'combat', 'resolution'];

interface GameStepperProps {
  currentPhase: GamePhase;
}

export function GameStepper({ currentPhase }: GameStepperProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = step.id === currentPhase;
          const isDisabled = step.disabled;
          const isAccessible = index <= currentIndex && !isDisabled;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                    isComplete && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-primary/10 text-primary',
                    !isComplete && !isCurrent && !isDisabled && 'border-muted-foreground/30 text-muted-foreground',
                    isDisabled && 'border-muted-foreground/20 text-muted-foreground/40 bg-muted/30'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isDisabled ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs mt-1 text-center whitespace-nowrap',
                    isCurrent && 'font-semibold text-primary',
                    isComplete && 'text-primary',
                    !isComplete && !isCurrent && 'text-muted-foreground',
                    isDisabled && 'text-muted-foreground/40'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2',
                    index < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
