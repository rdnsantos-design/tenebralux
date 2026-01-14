/**
 * Arena de Combate - interface principal de batalha
 */

import { useEffect, useState } from 'react';
import { Combatant, CombatCard, HexMap, HexCoord, CombatAction } from '@/types/tactical-combat';
import { CombatantCard } from './CombatantCard';
import { CombatCardDisplay } from './CombatCardDisplay';
import { BattleLog } from './BattleLog';
import { CombatTimeline } from './CombatTimeline';
import { CombatDebugPanel } from './CombatDebugPanel';
import { HexCombatMap } from './HexCombatMap';
import { getCardById } from '@/data/combat/cards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Swords, 
  Clock, 
  RotateCcw, 
  Trophy, 
  Skull,
  PlayCircle,
  Target,
  Map,
  ListOrdered,
  Move,
  Crosshair
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CombatArenaProps {
  battleState: {
    currentTick: number;
    maxTick?: number;
    round: number;
    phase: string; // 'choosing' | 'combat' | 'victory' | 'defeat'
    combatants: Combatant[];
    log: Array<{ tick: number; round: number; message: string; type: 'action' | 'damage' | 'effect' | 'system' | 'fatigue' | 'opportunity'; combatantId?: string }>;
    pendingActions?: CombatAction[];
    map?: HexMap;
  };
  currentCombatant: Combatant | null;
  playerCombatantToChoose?: Combatant | null; // Combatente que precisa escolher card
  isPlayerTurn: boolean;
  playerNeedsToChoose?: boolean; // Se está na fase de escolha
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
  onHexClick?: (coord: HexCoord) => void;
  onCombatantClick?: (combatant: Combatant) => void;
  validMoveHexes?: HexCoord[];
  validTargetHexes?: HexCoord[];
  actionMode?: 'move' | 'attack';
  onToggleActionMode?: () => void;
}

export function CombatArena({
  battleState,
  currentCombatant,
  playerCombatantToChoose,
  isPlayerTurn,
  playerNeedsToChoose = false,
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
  phase,
  onHexClick,
  onCombatantClick,
  validMoveHexes = [],
  validTargetHexes = [],
  actionMode = 'attack',
  onToggleActionMode
}: CombatArenaProps) {
  const [autoPlayAI, setAutoPlayAI] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');

  // O combatente relevante para exibir é quem precisa escolher (choosing) ou quem vai agir (combat)
  const activeCombatant = playerCombatantToChoose || currentCombatant;
  
  // Determinar se estamos na fase de escolha
  const isChoosingPhase = battleState.phase === 'choosing';

  // Auto-executar turno da IA
  useEffect(() => {
    if (autoPlayAI && !isPlayerTurn && currentCombatant && phase === 'battle') {
      const timer = setTimeout(() => {
        onAIAction();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, currentCombatant, phase, autoPlayAI, onAIAction]);

  // Função para obter cartas de um combatente
  const getCombatantCards = (combatant: Combatant): CombatCard[] => {
    return combatant.stats.availableCards
      .map(id => getCardById(id))
      .filter((c): c is CombatCard => c !== undefined);
  };

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
          {isChoosingPhase && (
            <Badge variant="default" className="text-lg px-4 py-2 bg-amber-600">
              ⚔️ Fase de Escolha
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {battleState.map && (
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'cards' | 'map')}>
              <TabsList className="h-9">
                <TabsTrigger value="cards" className="gap-1 text-xs">
                  <ListOrdered className="h-3.5 w-3.5" />
                  Cards
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-1 text-xs">
                  <Map className="h-3.5 w-3.5" />
                  Mapa
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
        </div>
      </div>

      {/* Timeline de Combate */}
      <CombatTimeline
        currentTick={battleState.currentTick}
        maxTick={battleState.maxTick}
        combatants={battleState.combatants}
        pendingActions={battleState.pendingActions}
        round={battleState.round}
      />

      {/* Mapa Hexagonal (se disponível e selecionado) */}
      {battleState.map && viewMode === 'map' && (
        <div className="space-y-4">
          {/* Painel de Ação no Modo Mapa */}
          {isPlayerTurn && (
            <Card className="border-primary/50 bg-background/95">
              <CardContent className="py-3">
                <div className="flex items-center gap-4">
                  {/* Botões de modo */}
                  {onToggleActionMode && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={actionMode === 'move' ? 'default' : 'outline'}
                        onClick={() => actionMode !== 'move' && onToggleActionMode()}
                        className="gap-1"
                      >
                        <Move className="h-3.5 w-3.5" />
                        Mover
                      </Button>
                      <Button
                        size="sm"
                        variant={actionMode === 'attack' ? 'default' : 'outline'}
                        onClick={() => actionMode !== 'attack' && onToggleActionMode()}
                        className="gap-1"
                      >
                        <Crosshair className="h-3.5 w-3.5" />
                        Atacar
                      </Button>
                    </div>
                  )}
                  
                  <Separator orientation="vertical" className="h-8" />
                  
                  {/* Info do combatente */}
                  <div className="flex-shrink-0">
                    <Badge variant="default" className="text-sm">
                      {activeCombatant?.name}
                    </Badge>
                    {activeCombatant && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Mov: {activeCombatant.stats.currentMovement}/{activeCombatant.stats.movement}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Cards (modo ataque) - fase de escolha */}
                  {actionMode === 'attack' && isChoosingPhase && (
                    <>
                      <Separator orientation="vertical" className="h-8" />
                      <ScrollArea className="flex-1">
                        <div className="flex gap-2">
                          {availableCards.map((card) => (
                            <CombatCardDisplay
                              key={card.id}
                              card={card}
                              isSelected={selectedCard?.id === card.id}
                              onClick={() => onSelectCard(
                                selectedCard?.id === card.id ? null : card
                              )}
                              theme="akashic"
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    </>
                  )}
                  
                  {/* Card já escolhido - fase de combate */}
                  {actionMode === 'attack' && !isChoosingPhase && currentCombatant?.stats.chosenCardId && (
                    <>
                      <Separator orientation="vertical" className="h-8" />
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm">
                          Carta: {(() => {
                            const card = getCardById(currentCombatant.stats.chosenCardId);
                            if (!card) return 'Desconhecida';
                            return typeof card.name === 'string' ? card.name : card.name.akashic;
                          })()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          → Mova se quiser, depois clique em "Executar Ataque!"
                        </span>
                      </div>
                    </>
                  )}
                  
                  {/* Instruções de movimento */}
                  {actionMode === 'move' && (
                    <div className="flex-1 text-center text-sm text-muted-foreground">
                      {validMoveHexes.length > 0 ? (
                        <span className="flex items-center justify-center gap-2">
                          <Move className="h-4 w-4" />
                          Clique em um hex verde para mover ({validMoveHexes.length} posições disponíveis)
                        </span>
                      ) : (
                        <span className="text-amber-600">Sem movimento restante nesta rodada</span>
                      )}
                    </div>
                  )}
                  
                  {/* Botão confirmar - fase de escolha */}
                  {isChoosingPhase && actionMode === 'attack' && selectedCard && selectedTarget && (
                    <Button 
                      size="sm"
                      onClick={onConfirmAction}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Confirmar Carta
                    </Button>
                  )}
                  
                  {/* Botão executar ataque - fase de combate (jogador já escolheu card) */}
                  {!isChoosingPhase && isPlayerTurn && currentCombatant?.stats.chosenCardId && (
                    <Button 
                      size="sm"
                      variant="destructive"
                      onClick={onConfirmAction}
                    >
                      <Swords className="h-4 w-4 mr-1" />
                      Executar Ataque!
                    </Button>
                  )}
                </div>
                
                {actionMode === 'attack' && selectedCard && !selectedTarget && (
                  <div className="text-center text-sm text-muted-foreground mt-2 flex items-center justify-center gap-2">
                    <Target className="h-4 w-4" />
                    Clique em um inimigo no mapa para selecionar alvo
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {!isPlayerTurn && phase === 'battle' && !isChoosingPhase && (
            <Card className="border-destructive/50 bg-background/95">
              <CardContent className="py-3 flex items-center justify-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-destructive border-t-transparent rounded-full" />
                <span className="text-muted-foreground">Turno do inimigo...</span>
              </CardContent>
            </Card>
          )}
          
          {!isPlayerTurn && isChoosingPhase && (
            <Card className="border-amber-500/50 bg-background/95">
              <CardContent className="py-3 flex items-center justify-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full" />
                <span className="text-muted-foreground">Inimigos escolhendo cartas...</span>
              </CardContent>
            </Card>
          )}

          <HexCombatMap
            map={battleState.map}
            combatants={battleState.combatants}
            selectedCombatant={currentCombatant}
            validMoveHexes={actionMode === 'move' ? validMoveHexes : []}
            validTargetHexes={actionMode === 'attack' ? validTargetHexes : []}
            onHexClick={onHexClick || (() => {})}
            onCombatantClick={(combatant) => {
              // Permite selecionar inimigos como alvo ao clicar neles
              if (isPlayerTurn && actionMode === 'attack' && selectedCard && combatant.team === 'enemy' && !combatant.stats.isDown) {
                onSelectTarget(selectedTarget === combatant.id ? null : combatant.id);
              }
              onCombatantClick?.(combatant);
            }}
            showLoS={actionMode === 'attack' && selectedCard !== null && selectedCard.attackModifier !== 0}
          />
        </div>
      )}

      {/* Vista de Cards (padrão) */}
      {viewMode === 'cards' && (
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
          <Card className={cn(
            "lg:col-span-1",
            isPlayerTurn && "ring-2 ring-primary ring-offset-2"
          )}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Swords className="h-4 w-4" />
                {isChoosingPhase 
                  ? (isPlayerTurn ? '⚔️ Escolha sua Carta!' : '⏳ Aguardando...')
                  : (isPlayerTurn ? '🎯 Sua Vez!' : '⏳ Turno do Inimigo...')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Combatente ativo */}
              {activeCombatant && (
                <div className="text-center space-y-2">
                  <Badge variant={isPlayerTurn ? 'default' : 'destructive'} className="text-base px-4 py-1">
                    {activeCombatant.name}
                  </Badge>
                  
                  {/* Info de Tick e Escolha */}
                  <div className="text-xs text-muted-foreground">
                    {isChoosingPhase ? (
                      activeCombatant.stats.chosenCardId ? (
                        <span className="text-green-600">✓ Card escolhido - Tick de ação: <strong>{activeCombatant.stats.currentTick}</strong></span>
                      ) : (
                        <span className="text-amber-600">Aguardando escolha...</span>
                      )
                    ) : (
                      <>Tick do combatente: <strong>{activeCombatant.stats.currentTick}</strong></>
                    )}
                  </div>
                  
                  {/* Info adicional de fadiga e ferimentos */}
                  <div className="flex justify-center gap-2 text-xs">
                    {activeCombatant.stats.fatigue > 0 && (
                      <Badge variant="outline" className="text-amber-600">
                        Fadiga: {activeCombatant.stats.fatigue}
                      </Badge>
                    )}
                    {activeCombatant.stats.wounds > 0 && (
                      <Badge variant="outline" className="text-red-600">
                        Ferimentos: {activeCombatant.stats.wounds}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Seleção de carta (só se for turno do jogador) */}
              {isPlayerTurn && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      {isChoosingPhase ? 'Escolha uma Carta (define quando você age)' : 'Escolha uma Carta'}
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
                      {isChoosingPhase 
                        ? 'Clique em um inimigo para selecionar alvo'
                        : 'Clique em um inimigo para atacar'}
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
                      {isChoosingPhase ? 'Confirmar Escolha!' : 'Executar Ação!'}
                    </Button>
                  )}
                  
                  {/* Mostrar velocidade da carta selecionada */}
                  {selectedCard && isChoosingPhase && (
                    <div className="text-center text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <span>Velocidade da carta: <strong>{selectedCard.speedModifier}</strong></span>
                      {activeCombatant?.stats.weapon && (
                        <span> + Arma: <strong>{activeCombatant.stats.weapon.speedModifier}</strong></span>
                      )}
                      <span> = Tick de ação: <strong>
                        {selectedCard.speedModifier + (activeCombatant?.stats.weapon?.speedModifier || 0) + (activeCombatant?.stats.armor?.speedPenalty || 0)}
                      </strong></span>
                    </div>
                  )}
                </>
              )}

              {/* Indicador de IA processando */}
              {!isPlayerTurn && phase === 'battle' && !isChoosingPhase && (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Inimigo pensando...</p>
                </div>
              )}
              
              {!isPlayerTurn && isChoosingPhase && (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Inimigos escolhendo cartas...</p>
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
      )}

      {/* Log de Combate */}
      <BattleLog entries={battleState.log} maxHeight="200px" />

      {/* Painel de Debug */}
      <CombatDebugPanel
        combatants={battleState.combatants}
        currentTick={battleState.currentTick}
        round={battleState.round}
        getAllCards={getCombatantCards}
      />
    </div>
  );
}
