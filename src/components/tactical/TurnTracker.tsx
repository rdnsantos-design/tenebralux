import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTacticalGame } from '@/contexts/TacticalGameContext';
import { GamePhase } from '@/types/tactical-game';
import { 
  Dices, 
  Move, 
  Target, 
  Swords, 
  Footprints,
  AlertTriangle, 
  RefreshCw,
  SkipForward,
  Play,
  ChevronRight
} from 'lucide-react';

interface PhaseConfig {
  icon: React.ReactNode;
  label: string;
  color: string;
  description: string;
}

const PHASE_CONFIG: Record<GamePhase, PhaseConfig> = {
  setup: { 
    icon: <Play className="h-4 w-4" />, 
    label: 'Preparação', 
    color: 'bg-slate-600',
    description: 'Posicione suas unidades'
  },
  initiative: { 
    icon: <Dices className="h-4 w-4" />, 
    label: 'Iniciativa', 
    color: 'bg-purple-600',
    description: 'Role para determinar quem age primeiro'
  },
  movement: { 
    icon: <Move className="h-4 w-4" />, 
    label: 'Movimento', 
    color: 'bg-blue-600',
    description: 'Mova suas unidades pelo campo'
  },
  shooting: { 
    icon: <Target className="h-4 w-4" />, 
    label: 'Tiro', 
    color: 'bg-green-600',
    description: 'Unidades com Tiro atacam à distância'
  },
  charge: { 
    icon: <Footprints className="h-4 w-4" />, 
    label: 'Carga', 
    color: 'bg-amber-600',
    description: 'Cavalaria em Carga ataca'
  },
  melee: { 
    icon: <Swords className="h-4 w-4" />, 
    label: 'Combate', 
    color: 'bg-red-600',
    description: 'Unidades adjacentes combatem'
  },
  rout: { 
    icon: <AlertTriangle className="h-4 w-4" />, 
    label: 'Debandada', 
    color: 'bg-orange-600',
    description: 'Unidades em fuga tentam escapar'
  },
  reorganization: { 
    icon: <RefreshCw className="h-4 w-4" />, 
    label: 'Reorganização', 
    color: 'bg-teal-600',
    description: 'Unidades recuperam Pressão'
  },
  end_turn: { 
    icon: <SkipForward className="h-4 w-4" />, 
    label: 'Fim', 
    color: 'bg-slate-600',
    description: 'Preparando próximo turno'
  },
};

const PHASE_ORDER: GamePhase[] = [
  'initiative', 'movement', 'shooting', 'charge', 'melee', 'rout', 'reorganization'
];

export function TurnTracker() {
  const { gameState, isMyTurn, rollInitiative, endPhase } = useTacticalGame();
  
  if (!gameState) return null;
  
  const currentPhase = PHASE_CONFIG[gameState.phase];
  const currentIndex = PHASE_ORDER.indexOf(gameState.phase);
  
  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      {/* Linha superior: Turno e Fase atual */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-3 py-1">
            Turno{' '}
            <span className="font-bold">{gameState.turn}</span>
          </Badge>
          
          <Badge className={`${currentPhase.color} text-white flex items-center gap-2 px-3 py-1`}>
            {currentPhase.icon}
            {currentPhase.label}
          </Badge>
          
          {gameState.initiativeWinner && (
            <Badge variant="secondary" className="text-sm">
              Iniciativa: {gameState.initiativeWinner === 'player1' ? 'P1' : 'P2'} 
              (+{gameState.initiativeAdvantage})
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isMyTurn && (
            <Badge className="bg-green-600 text-white animate-pulse">
              SUA VEZ
            </Badge>
          )}
          
          {gameState.phase === 'initiative' && (
            <Button onClick={rollInitiative} size="sm" variant="default">
              <Dices className="h-4 w-4 mr-2" />
              Rolar Iniciativa
            </Button>
          )}
          
          {isMyTurn && gameState.phase !== 'initiative' && gameState.phase !== 'setup' && (
            <Button onClick={endPhase} size="sm" variant="outline">
              <SkipForward className="h-4 w-4 mr-2" />
              Próxima Fase
            </Button>
          )}
        </div>
      </div>
      
      {/* Linha inferior: Indicadores de fase */}
      <div className="flex items-center justify-center gap-1">
        {PHASE_ORDER.map((phase, index) => {
          const config = PHASE_CONFIG[phase];
          const isActive = phase === gameState.phase;
          const isPast = index < currentIndex;
          
          return (
            <React.Fragment key={phase}>
              <div 
                className={`
                  flex items-center gap-1 px-2 py-1 rounded text-xs transition-all
                  ${isActive ? `${config.color} text-white font-bold scale-110` : ''}
                  ${isPast ? 'bg-muted text-muted-foreground' : ''}
                  ${!isActive && !isPast ? 'bg-muted/50 text-muted-foreground/50' : ''}
                `}
              >
                {config.icon}
                <span className="hidden sm:inline">{config.label}</span>
              </div>
              {index < PHASE_ORDER.length - 1 && (
                <ChevronRight className={`h-3 w-3 ${isPast ? 'text-muted-foreground' : 'text-muted-foreground/30'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Descrição da fase */}
      <p className="text-center text-sm text-muted-foreground">
        {currentPhase.description}
      </p>
    </div>
  );
}
