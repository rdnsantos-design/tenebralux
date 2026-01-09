/**
 * Arena de Combate - interface principal de batalha
 */

import { useEffect, useState } from 'react';
import { Combatant, CombatCard } from '@/types/tactical-combat';
import { CombatantCard } from './CombatantCard';
import { CombatCardDisplay } from './CombatCardDisplay';
import { BattleLog } from './BattleLog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Swords, 
  Clock, 
  RotateCcw, 
  Trophy, 
  Skull,
  PlayCircle,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CombatArenaProps {
  battleState: {
    currentTick: number;
    round: number;
    phase: string;
    combatants: Combatant[];
    log: Array<{ tick: number; round: number; message: string; type: 'action' | 'damage' | 'effect' | 'system'; combatantId?: string }>;
  };
  currentCombatant: Combatant | null;
  isPlayerTurn: boolean;
  playerCombatants: Combatant[];
  enemyCombatants: Combatant[];
  availableCards: CombatCard[];
  selectedCard: CombatCard | null;
  selectedTarget: string | null;
  onSelectCard: (card: CombatCard | null) => void;
  onSelectTarget: (targetId: string | null) => void;
  onConfirmAction: () => void;
  onAIAction: () => void;
  onReset: () => void;
  phase: 'setup' | 'battle' | 'victory' | 'defeat';
}

export function CombatArena({
  battleState,
  currentCombatant,
  isPlayerTurn,
  playerCombatants,
  enemyCombatants,
  availableCards,
  selectedCard,
  selectedTarget,
  onSelectCard,
  onSelectTarget,
  onConfirmAction,
  onAIAction,
  onReset,
  phase
}: CombatArenaProps) {
  const [autoPlayAI, setAutoPlayAI] = useState(true);

  // Auto-executar turno da IA
  useEffect(() => {
    if (autoPlayAI && !isPlayerTurn && currentCombatant && phase === 'battle') {
      const timer = setTimeout(() => {
        onAIAction();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, currentCombatant, phase, autoPlayAI, onAIAction]);

  // Tela de Vitória/Derrota
  if (phase === 'victory' || phase === 'defeat') {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-8">
          {phase === 'victory' ? (
            <>
              <Trophy className="h-20 w-20 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-3xl font-bold text-primary mb-2">Vitória!</h2>
              <p className="text-muted-foreground mb-6">
                Você derrotou todos os inimigos!
              </p>
            </>
          ) : (
            <>
              <Skull className="h-20 w-20 mx-auto text-destructive mb-4" />
              <h2 className="text-3xl font-bold text-destructive mb-2">Derrota</h2>
              <p className="text-muted-foreground mb-6">
                Seu personagem foi derrotado.
              </p>
            </>
          )}
          <Button onClick={onReset} size="lg">
            <RotateCcw className="h-4 w-4 mr-2" />
            Nova Batalha
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com info da batalha */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            Tick: {battleState.currentTick}
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Rodada: {battleState.round}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
        </div>
      </div>

      {/* Campo de Batalha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Inimigos */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <Skull className="h-4 w-4" />
              Inimigos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {enemyCombatants.map((enemy) => (
              <CombatantCard
                key={enemy.id}
                combatant={enemy}
                isActive={currentCombatant?.id === enemy.id}
                isTargetable={isPlayerTurn && selectedCard !== null && !enemy.stats.isDown}
                isSelected={selectedTarget === enemy.id}
                onClick={() => {
                  if (isPlayerTurn && selectedCard && !enemy.stats.isDown) {
                    onSelectTarget(selectedTarget === enemy.id ? null : enemy.id);
                  }
                }}
              />
            ))}
          </CardContent>
        </Card>

        {/* Centro - Ação Atual */}
        <Card className="lg:col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Swords className="h-4 w-4" />
              {isPlayerTurn ? 'Sua Vez!' : 'Turno do Inimigo...'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Combatente ativo */}
            {currentCombatant && (
              <div className="text-center">
                <Badge variant={isPlayerTurn ? 'default' : 'destructive'}>
                  {currentCombatant.name}
                </Badge>
              </div>
            )}

            {/* Seleção de carta (só se for turno do jogador) */}
            {isPlayerTurn && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    Escolha uma Carta
                  </h4>
                  <ScrollArea className="h-[250px]">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {availableCards.map((card) => (
                        <CombatCardDisplay
                          key={card.id}
                          card={card}
                          isSelected={selectedCard?.id === card.id}
                          onClick={() => onSelectCard(
                            selectedCard?.id === card.id ? null : card
                          )}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Instrução de alvo */}
                {selectedCard && !selectedTarget && (
                  <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Target className="h-4 w-4" />
                    Clique em um inimigo para atacar
                  </div>
                )}

                {/* Botão de confirmar */}
                {selectedCard && selectedTarget && (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={onConfirmAction}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Executar Ação!
                  </Button>
                )}
              </>
            )}

            {/* Indicador de IA processando */}
            {!isPlayerTurn && phase === 'battle' && (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Inimigo pensando...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jogadores */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-primary">
              <Swords className="h-4 w-4" />
              Aliados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {playerCombatants.map((player) => (
              <CombatantCard
                key={player.id}
                combatant={player}
                isActive={currentCombatant?.id === player.id}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Log de Combate */}
      <BattleLog entries={battleState.log} maxHeight="150px" />
    </div>
  );
}
