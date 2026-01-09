/**
 * TCGPhaseIndicator - Current phase display with progress stepper
 */

import { cn } from '@/lib/utils';
import { SPCombatPhase } from '@/lib/singlePlayerCombatEngine';
import { Swords, Zap, Shield, Dice6, CheckCircle } from 'lucide-react';

const PHASE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  'initiative_maneuver': { label: 'Iniciativa', icon: <Zap className="w-4 h-4" /> },
  'initiative_reaction': { label: 'Reação Ini.', icon: <Zap className="w-4 h-4" /> },
  'initiative_roll': { label: 'Rolagem', icon: <Dice6 className="w-4 h-4" /> },
  'initiative_post': { label: 'Escolha', icon: <CheckCircle className="w-4 h-4" /> },
  'attack_maneuver': { label: 'Ataque', icon: <Swords className="w-4 h-4" /> },
  'attack_reaction': { label: 'Reação Atq.', icon: <Swords className="w-4 h-4" /> },
  'defense_maneuver': { label: 'Defesa', icon: <Shield className="w-4 h-4" /> },
  'defense_reaction': { label: 'Reação Def.', icon: <Shield className="w-4 h-4" /> },
  'combat_roll': { label: 'Combate', icon: <Dice6 className="w-4 h-4" /> },
  'combat_resolution': { label: 'Resolução', icon: <CheckCircle className="w-4 h-4" /> },
  'round_end': { label: 'Fim Round', icon: <CheckCircle className="w-4 h-4" /> },
};

const PHASE_ORDER: SPCombatPhase[] = [
  'initiative_maneuver',
  'initiative_roll',
  'attack_maneuver', 
  'defense_maneuver',
  'combat_roll',
];

interface TCGPhaseIndicatorProps {
  currentPhase: SPCombatPhase;
  round: number;
  className?: string;
}

export function TCGPhaseIndicator({ currentPhase, round, className }: TCGPhaseIndicatorProps) {
  const currentConfig = PHASE_CONFIG[currentPhase] || { label: currentPhase, icon: null };
  
  // Determine which main phase we're in
  const getPhaseIndex = (phase: SPCombatPhase) => {
    if (phase.startsWith('initiative')) return 0;
    if (phase === 'attack_maneuver' || phase === 'attack_reaction') return 2;
    if (phase === 'defense_maneuver' || phase === 'defense_reaction') return 3;
    if (phase === 'combat_roll' || phase === 'combat_resolution') return 4;
    return 1;
  };

  const currentIndex = getPhaseIndex(currentPhase);

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Round Number */}
      <div className="tcg-round">
        {round}
      </div>
      
      {/* Current Phase Badge */}
      <div className="tcg-phase-indicator">
        {currentConfig.icon}
        <span className="ml-2">{currentConfig.label}</span>
      </div>
      
      {/* Phase Stepper */}
      <div className="flex items-center gap-1">
        {PHASE_ORDER.map((phase, i) => {
          const isPast = i < currentIndex;
          const isCurrent = getPhaseIndex(currentPhase) === i || 
            (phase === 'initiative_maneuver' && currentPhase === 'initiative_reaction') ||
            (phase === 'initiative_roll' && currentPhase === 'initiative_post') ||
            (phase === 'attack_maneuver' && currentPhase === 'attack_reaction') ||
            (phase === 'defense_maneuver' && currentPhase === 'defense_reaction') ||
            (phase === 'combat_roll' && currentPhase === 'combat_resolution');
          
          const phaseConfig = PHASE_CONFIG[phase];
          
          return (
            <div key={phase} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                  'border-2',
                  isCurrent && 'bg-primary border-primary text-primary-foreground scale-110',
                  isPast && 'bg-muted border-muted-foreground/30 text-muted-foreground',
                  !isCurrent && !isPast && 'bg-background border-border text-muted-foreground'
                )}
                title={phaseConfig?.label}
              >
                {phaseConfig?.icon}
              </div>
              
              {/* Connector Line */}
              {i < PHASE_ORDER.length - 1 && (
                <div 
                  className={cn(
                    'w-4 h-0.5 mx-0.5',
                    isPast ? 'bg-muted-foreground/30' : 'bg-border'
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
