/**
 * TCGPhaseIndicator - Current phase display with instructions
 */

import { cn } from '@/lib/utils';
import { SPCombatPhase } from '@/lib/singlePlayerCombatEngine';
import { Swords, Zap, Shield, Dice6, CheckCircle, AlertCircle, Hourglass } from 'lucide-react';

interface PhaseConfig {
  label: string;
  icon: React.ReactNode;
  instruction: string;
  actor: 'player' | 'bot' | 'system';
}

const PHASE_CONFIG: Record<string, PhaseConfig> = {
  'initiative_maneuver': { 
    label: 'Manobra de Iniciativa', 
    icon: <Zap className="w-5 h-5" />,
    instruction: 'Selecione uma carta de MOVIMENTAÇÃO e um comandante para jogar, ou passe.',
    actor: 'player'
  },
  'initiative_reaction': { 
    label: 'Reação à Iniciativa', 
    icon: <Zap className="w-5 h-5" />,
    instruction: 'Você pode jogar uma carta de REAÇÃO para contrapor a manobra do oponente.',
    actor: 'player'
  },
  'initiative_roll': { 
    label: 'Rolagem de Iniciativa', 
    icon: <Dice6 className="w-5 h-5" />,
    instruction: 'Clique para rolar os dados e determinar quem ataca primeiro.',
    actor: 'system'
  },
  'initiative_post': { 
    label: 'Escolha de Posição', 
    icon: <CheckCircle className="w-5 h-5" />,
    instruction: 'Você venceu! Escolha se quer ATACAR ou DEFENDER neste round.',
    actor: 'player'
  },
  'attack_maneuver': { 
    label: 'Fase de Ataque', 
    icon: <Swords className="w-5 h-5" />,
    instruction: 'Selecione cartas OFENSIVAS e comandantes para atacar. Confirme quando pronto.',
    actor: 'player'
  },
  'attack_reaction': { 
    label: 'Reação ao Ataque', 
    icon: <Swords className="w-5 h-5" />,
    instruction: 'Você pode jogar uma carta de REAÇÃO para contrapor o ataque inimigo.',
    actor: 'player'
  },
  'defense_maneuver': { 
    label: 'Fase de Defesa', 
    icon: <Shield className="w-5 h-5" />,
    instruction: 'Selecione cartas DEFENSIVAS e comandantes para defender. Confirme quando pronto.',
    actor: 'player'
  },
  'defense_reaction': { 
    label: 'Reação à Defesa', 
    icon: <Shield className="w-5 h-5" />,
    instruction: 'Você pode jogar uma carta de REAÇÃO para contrapor a defesa inimiga.',
    actor: 'player'
  },
  'combat_roll': { 
    label: 'Combate', 
    icon: <Dice6 className="w-5 h-5" />,
    instruction: 'Clique para resolver o combate e calcular o dano.',
    actor: 'system'
  },
  'combat_resolution': { 
    label: 'Resolução', 
    icon: <CheckCircle className="w-5 h-5" />,
    instruction: 'Combate resolvido! Clique para avançar ao próximo round.',
    actor: 'system'
  },
  'round_end': { 
    label: 'Fim do Round', 
    icon: <CheckCircle className="w-5 h-5" />,
    instruction: 'Round finalizado. Preparando próximo round...',
    actor: 'system'
  },
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
  awaitingPlayer?: boolean;
  botName?: string;
  className?: string;
}

export function TCGPhaseIndicator({ 
  currentPhase, 
  round, 
  awaitingPlayer = true,
  botName = 'Capitão',
  className 
}: TCGPhaseIndicatorProps) {
  const currentConfig = PHASE_CONFIG[currentPhase] || { 
    label: currentPhase, 
    icon: null,
    instruction: '',
    actor: 'system' as const
  };
  
  // Determine which main phase we're in
  const getPhaseIndex = (phase: SPCombatPhase) => {
    if (phase.startsWith('initiative')) return phase === 'initiative_roll' ? 1 : 0;
    if (phase === 'attack_maneuver' || phase === 'attack_reaction') return 2;
    if (phase === 'defense_maneuver' || phase === 'defense_reaction') return 3;
    if (phase === 'combat_roll' || phase === 'combat_resolution') return 4;
    return 0;
  };

  const currentIndex = getPhaseIndex(currentPhase);
  
  // Adjust instruction based on who's acting
  const getInstruction = () => {
    if (!awaitingPlayer && currentConfig.actor === 'player') {
      return `${botName} está decidindo sua jogada...`;
    }
    return currentConfig.instruction;
  };
  
  const isWaiting = !awaitingPlayer && currentConfig.actor === 'player';

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Phase Header Card */}
      <div className="tcg-card w-full max-w-lg relative overflow-hidden">
        <div className="tcg-card-frame" />
        
        {/* Round Badge */}
        <div className="absolute top-2 right-2 z-10">
          <div className="tcg-round text-sm">
            R{round}
          </div>
        </div>
        
        <div className="p-3">
          {/* Phase Title */}
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "p-2 rounded-lg",
              isWaiting ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
            )}>
              {isWaiting ? <Hourglass className="w-5 h-5 animate-pulse" /> : currentConfig.icon}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-base leading-tight">
                {currentConfig.label}
              </h2>
              <span className={cn(
                "text-xs uppercase tracking-wider",
                isWaiting ? "text-amber-500" : "text-primary"
              )}>
                {isWaiting ? `Vez do ${botName}` : 'Sua vez'}
              </span>
            </div>
          </div>
          
          {/* Instruction */}
          <div className={cn(
            "flex items-start gap-2 p-2 rounded-lg text-sm",
            isWaiting 
              ? "bg-amber-500/10 border border-amber-500/20" 
              : "bg-primary/10 border border-primary/20"
          )}>
            <AlertCircle className={cn(
              "w-4 h-4 mt-0.5 shrink-0",
              isWaiting ? "text-amber-500" : "text-primary"
            )} />
            <p className="leading-snug">{getInstruction()}</p>
          </div>
        </div>
      </div>
      
      {/* Phase Stepper */}
      <div className="flex items-center gap-1 bg-card/50 backdrop-blur-sm px-3 py-2 rounded-full border border-border/50">
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
                  isCurrent && 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30',
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
                    isPast ? 'bg-primary/50' : 'bg-border'
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
