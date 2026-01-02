import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle2, Circle, ChevronDown, ChevronUp, 
  FlaskConical, AlertCircle, Lightbulb
} from 'lucide-react';
import type { Room, MatchState, PlayerContext, GamePhase } from '@/types/multiplayer';

interface TestChecklistProps {
  room: Room;
  matchState: MatchState;
  playerContext: PlayerContext;
}

interface PhaseCheck {
  phase: GamePhase;
  label: string;
  instruction: string;
  checks: {
    label: string;
    condition: (ms: any, pNum: number) => boolean;
  }[];
}

const PHASE_CHECKS: PhaseCheck[] = [
  {
    phase: 'lobby',
    label: 'Lobby',
    instruction: 'Marque-se como pronto e aguarde o outro jogador.',
    checks: [
      { label: 'Ambos jogadores na sala', condition: () => true },
      { label: 'Ambos prontos', condition: () => true }, // Fase já passou se estamos aqui
    ]
  },
  {
    phase: 'culture_selection',
    label: 'Seleção de Cultura',
    instruction: 'Selecione sua cultura e confirme.',
    checks: [
      { label: 'Sua cultura confirmada', condition: (ms, pNum) => 
        pNum === 1 ? ms.player1_culture_confirmed : ms.player2_culture_confirmed },
      { label: 'Oponente confirmou', condition: (ms, pNum) => 
        pNum === 1 ? ms.player2_culture_confirmed : ms.player1_culture_confirmed },
    ]
  },
  {
    phase: 'scenario_selection',
    label: 'Seleção de Cenário',
    instruction: 'Faça sua aposta de logística nos 2 rounds.',
    checks: [
      { label: 'Terreno escolhido', condition: (ms) => !!ms.chosen_terrain_id },
      { label: 'Estação escolhida', condition: (ms) => !!ms.chosen_season_id },
    ]
  },
  {
    phase: 'deckbuilding',
    label: 'Deckbuilding',
    instruction: 'Configure atributos, comandantes e cartas. Confirme quando pronto.',
    checks: [
      { label: 'Atributos definidos', condition: (ms, pNum) => {
        const attrs = pNum === 1 ? ms.player1_army_attributes : ms.player2_army_attributes;
        return attrs && (attrs.attack + attrs.defense + attrs.mobility > 0);
      }},
      { label: 'General definido', condition: (ms, pNum) => 
        pNum === 1 ? !!ms.player1_general_id : !!ms.player2_general_id },
      { label: 'Seu deck confirmado', condition: (ms, pNum) => 
        pNum === 1 ? ms.player1_deck_confirmed : ms.player2_deck_confirmed },
      { label: 'Oponente confirmou deck', condition: (ms, pNum) => 
        pNum === 1 ? ms.player2_deck_confirmed : ms.player1_deck_confirmed },
    ]
  },
  {
    phase: 'deployment',
    label: 'Deployment',
    instruction: 'Escolha sua formação e confirme.',
    checks: [
      { label: 'Sua formação confirmada', condition: (ms, pNum) => 
        pNum === 1 ? ms.player1_deployment_confirmed : ms.player2_deployment_confirmed },
      { label: 'Oponente confirmou', condition: (ms, pNum) => 
        pNum === 1 ? ms.player2_deployment_confirmed : ms.player1_deployment_confirmed },
    ]
  },
  {
    phase: 'combat',
    label: 'Combate',
    instruction: 'Selecione cartas e confirme em cada fase.',
    checks: [
      { label: 'Combate iniciado', condition: (ms) => ms.combat_round >= 1 },
      { label: 'Fase de iniciativa', condition: (ms) => ms.combat_phase === 'initiative' },
      { label: 'Fase principal', condition: (ms) => ms.combat_phase === 'main' },
    ]
  },
];

const PHASE_ORDER: GamePhase[] = [
  'lobby', 'culture_selection', 'scenario_selection', 
  'deckbuilding', 'deployment', 'combat', 'resolution'
];

export function TestChecklist({ room, matchState, playerContext }: TestChecklistProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Só mostra em DEV
  if (import.meta.env.PROD) return null;
  
  const currentPhase = room.current_phase;
  const pNum = playerContext.playerNumber;
  const currentPhaseIndex = PHASE_ORDER.indexOf(currentPhase);
  
  // Encontrar instrução atual
  const currentPhaseCheck = PHASE_CHECKS.find(p => p.phase === currentPhase);
  
  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-2 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-500" />
                <span className="text-amber-600">Test Checklist (DEV)</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  v{(matchState as any).version ?? 0}
                </Badge>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3 space-y-3">
            {/* Instrução Atual */}
            {currentPhaseCheck && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm text-primary">
                      O que fazer agora ({currentPhaseCheck.label}):
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {currentPhaseCheck.instruction}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Lista de Fases */}
            <div className="space-y-2">
              {PHASE_CHECKS.map((phaseCheck, index) => {
                const phaseIndex = PHASE_ORDER.indexOf(phaseCheck.phase);
                const isCompleted = phaseIndex < currentPhaseIndex;
                const isCurrent = phaseCheck.phase === currentPhase;
                const isLocked = phaseIndex > currentPhaseIndex;
                
                return (
                  <div 
                    key={phaseCheck.phase}
                    className={`p-2 rounded-lg border ${
                      isCurrent ? 'border-primary bg-primary/5' :
                      isCompleted ? 'border-green-500/30 bg-green-500/5' :
                      'border-muted bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : isCurrent ? (
                        <AlertCircle className="w-4 h-4 text-primary animate-pulse" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={`text-sm font-medium ${
                        isLocked ? 'text-muted-foreground' : ''
                      }`}>
                        {phaseCheck.label}
                      </span>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-xs ml-auto">
                          ATUAL
                        </Badge>
                      )}
                    </div>
                    
                    {/* Checklist items para fase atual */}
                    {isCurrent && (
                      <div className="mt-2 pl-6 space-y-1">
                        {phaseCheck.checks.map((check, i) => {
                          const passed = check.condition(matchState as any, pNum);
                          return (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {passed ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                              ) : (
                                <Circle className="w-3 h-3 text-muted-foreground" />
                              )}
                              <span className={passed ? 'text-green-600' : 'text-muted-foreground'}>
                                {check.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Info sobre estado */}
            <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span>Player: {pNum}</span>
                <span>Phase: {currentPhase}</span>
                <span>Round: {(matchState as any).combat_round ?? '-'}</span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
