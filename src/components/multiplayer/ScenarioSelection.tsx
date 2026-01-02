import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, Clock, Plus, Minus, Trophy, MapPin, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Room, RoomPlayer, MatchState, PlayerContext } from '@/types/multiplayer';

interface ScenarioOption {
  id: string;
  name: string;
  order: number;
}

interface ScenarioOptions {
  terrains: ScenarioOption[];
  seasons: ScenarioOption[];
}

interface BidState {
  terrains: Record<string, number>;
  seasons: Record<string, number>;
}

interface ScenarioSelectionProps {
  room: Room;
  players: RoomPlayer[];
  matchState: MatchState;
  playerContext: PlayerContext;
}

export function ScenarioSelection({ room, players, matchState, playerContext }: ScenarioSelectionProps) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [scenarioOptions, setScenarioOptions] = useState<ScenarioOptions | null>(null);
  const [bids, setBids] = useState<BidState>({ terrains: {}, seasons: {} });
  const [roundConfirmed, setRoundConfirmed] = useState(false);

  const LOGISTICS_BUDGET = (matchState as unknown as { logistics_budget?: number }).logistics_budget ?? 10;
  const currentRound = (matchState as unknown as { logistics_round?: number }).logistics_round ?? 0;
  const logisticsResolved = (matchState as unknown as { logistics_resolved?: boolean }).logistics_resolved ?? false;
  
  // Calcular gasto anterior (rodada 1)
  const getMyPreviousSpent = useCallback(() => {
    if (currentRound !== 2) return 0;
    const myRound1Bid = playerContext.playerNumber === 1 
      ? (matchState as unknown as { player1_round1_bid?: BidState }).player1_round1_bid
      : (matchState as unknown as { player2_round1_bid?: BidState }).player2_round1_bid;
    
    if (!myRound1Bid) return 0;
    
    const terrainSpent = Object.values(myRound1Bid.terrains || {}).reduce((a, b) => a + b, 0);
    const seasonSpent = Object.values(myRound1Bid.seasons || {}).reduce((a, b) => a + b, 0);
    return terrainSpent + seasonSpent;
  }, [currentRound, matchState, playerContext.playerNumber]);

  // Verificar se já confirmou nesta rodada
  const hasConfirmedThisRound = useCallback(() => {
    if (currentRound === 1) {
      return playerContext.playerNumber === 1 
        ? (matchState as unknown as { player1_round1_bid?: unknown }).player1_round1_bid !== null
        : (matchState as unknown as { player2_round1_bid?: unknown }).player2_round1_bid !== null;
    } else if (currentRound === 2) {
      return playerContext.playerNumber === 1 
        ? (matchState as unknown as { player1_round2_bid?: unknown }).player1_round2_bid !== null
        : (matchState as unknown as { player2_round2_bid?: unknown }).player2_round2_bid !== null;
    }
    return false;
  }, [currentRound, matchState, playerContext.playerNumber]);

  // Verificar se oponente confirmou
  const opponentConfirmedThisRound = useCallback(() => {
    if (currentRound === 1) {
      return playerContext.playerNumber === 1 
        ? (matchState as unknown as { player2_round1_bid?: unknown }).player2_round1_bid !== null
        : (matchState as unknown as { player1_round1_bid?: unknown }).player1_round1_bid !== null;
    } else if (currentRound === 2) {
      return playerContext.playerNumber === 1 
        ? (matchState as unknown as { player2_round2_bid?: unknown }).player2_round2_bid !== null
        : (matchState as unknown as { player1_round2_bid?: unknown }).player1_round2_bid !== null;
    }
    return false;
  }, [currentRound, matchState, playerContext.playerNumber]);

  const previousSpent = getMyPreviousSpent();
  const remainingBudget = LOGISTICS_BUDGET - previousSpent;

  // Calcular total gasto atual
  const currentSpent = Object.values(bids.terrains).reduce((a, b) => a + b, 0) +
                       Object.values(bids.seasons).reduce((a, b) => a + b, 0);
  const totalSpent = previousSpent + currentSpent;
  const vetCost = Math.ceil(totalSpent / 2);

  // Elegíveis para tiebreak
  const terrainTiebreak = (matchState as unknown as { terrain_tiebreak_eligible?: ScenarioOption[] }).terrain_tiebreak_eligible;
  const seasonTiebreak = (matchState as unknown as { season_tiebreak_eligible?: ScenarioOption[] }).season_tiebreak_eligible;

  // Iniciar seleção de cenário
  useEffect(() => {
    const initScenario = async () => {
      if (currentRound > 0 && matchState.scenario_options) {
        setScenarioOptions(matchState.scenario_options as unknown as ScenarioOptions);
        return;
      }

      if (currentRound === 0 && !logisticsResolved) {
        setLoading(true);
        try {
          const { data, error } = await supabase.rpc('start_scenario_selection', {
            p_room_id: room.id
          });

          if (error) throw error;
          
          const result = data as unknown as { scenario_options?: ScenarioOptions };
          if (result?.scenario_options) {
            setScenarioOptions(result.scenario_options);
          }
        } catch (err) {
          console.error('Erro ao iniciar cenário:', err);
          toast.error('Erro ao carregar opções de cenário');
        } finally {
          setLoading(false);
        }
      }
    };

    initScenario();
  }, [room.id, currentRound, logisticsResolved, matchState.scenario_options]);

  // Atualizar opções quando matchState muda
  useEffect(() => {
    if (matchState.scenario_options) {
      setScenarioOptions(matchState.scenario_options as unknown as ScenarioOptions);
    }
  }, [matchState.scenario_options]);

  // Atualizar estado de confirmação
  useEffect(() => {
    setRoundConfirmed(hasConfirmedThisRound());
  }, [hasConfirmedThisRound]);

  // Ajustar bid
  const adjustBid = (type: 'terrains' | 'seasons', id: string, delta: number) => {
    if (roundConfirmed) return;

    setBids(prev => {
      const current = prev[type][id] || 0;
      const newValue = Math.max(0, current + delta);
      
      // Verificar se ultrapassa orçamento
      const otherTypeBids = type === 'terrains' ? prev.seasons : prev.terrains;
      const otherTotal = Object.values(otherTypeBids).reduce((a, b) => a + b, 0);
      const sameTypeBids = { ...prev[type], [id]: newValue };
      const sameTotal = Object.values(sameTypeBids).reduce((a, b) => a + b, 0);
      
      if (sameTotal + otherTotal > remainingBudget) {
        return prev;
      }

      return {
        ...prev,
        [type]: { ...prev[type], [id]: newValue }
      };
    });
  };

  // Verificar se opção está elegível (para rodada 2)
  const isEligible = (type: 'terrains' | 'seasons', id: string) => {
    if (currentRound !== 2) return true;
    
    const tiebreak = type === 'terrains' ? terrainTiebreak : seasonTiebreak;
    if (!tiebreak) return true; // Se não tem tiebreak para este tipo, todas são elegíveis
    
    return tiebreak.some(opt => opt.id === id);
  };

  // Confirmar rodada
  const handleConfirmRound = async () => {
    setConfirming(true);
    try {
      // Submeter bid
      const { error: bidError } = await supabase.rpc('submit_logistics_bid', {
        p_room_id: room.id,
        p_player_number: playerContext.playerNumber,
        p_round_number: currentRound,
        p_bid: JSON.parse(JSON.stringify(bids))
      });

      if (bidError) throw bidError;
      
      toast.success(`Rodada ${currentRound} confirmada!`);
      setRoundConfirmed(true);

      // Verificar se ambos confirmaram para resolver
      // Pequeno delay para garantir que o estado foi atualizado
      setTimeout(async () => {
        try {
          const { data: resolveData, error: resolveError } = await supabase.rpc('resolve_logistics_round', {
            p_room_id: room.id,
            p_round_number: currentRound
          });

          if (resolveError) {
            // Ignorar erro se ainda esperando oponente
            if (!resolveError.message.includes('precisam apostar')) {
              console.error('Erro ao resolver:', resolveError);
            }
            return;
          }

          if ((resolveData as { needs_round2?: boolean })?.needs_round2) {
            toast.info('Empate no topo! Rodada 2 iniciada.');
            setBids({ terrains: {}, seasons: {} });
          } else if ((resolveData as { resolved?: boolean })?.resolved) {
            toast.success('Cenário definido!');
            // Finalizar cenário
            await supabase.rpc('finalize_scenario', { p_room_id: room.id });
          }
        } catch (err) {
          // Silenciar erros esperados
        }
      }, 500);
    } catch (err) {
      console.error('Erro ao confirmar rodada:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao confirmar');
    } finally {
      setConfirming(false);
    }
  };

  const opponent = players.find(p => p.id !== playerContext.playerId);
  
  // Mostrar resultado final
  if (logisticsResolved) {
    const chosenTerrainId = (matchState as unknown as { chosen_terrain_id?: string }).chosen_terrain_id;
    const chosenSeasonId = (matchState as unknown as { chosen_season_id?: string }).chosen_season_id;
    const chosenTerrain = scenarioOptions?.terrains.find(t => t.id === chosenTerrainId);
    const chosenSeason = scenarioOptions?.seasons.find(s => s.id === chosenSeasonId);
    
    const p1VetRemaining = (matchState as unknown as { player1_vet_remaining?: number }).player1_vet_remaining;
    const p2VetRemaining = (matchState as unknown as { player2_vet_remaining?: number }).player2_vet_remaining;
    const myVetRemaining = playerContext.playerNumber === 1 ? p1VetRemaining : p2VetRemaining;

    return (
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
          <CardTitle>Cenário Definido!</CardTitle>
          <CardDescription>A batalha será travada em:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted text-center">
              <MapPin className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Terreno</p>
              <p className="font-bold text-lg">{chosenTerrain?.name ?? 'N/A'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted text-center">
              <Sun className="w-6 h-6 mx-auto mb-2 text-amber-500" />
              <p className="text-sm text-muted-foreground">Estação</p>
              <p className="font-bold text-lg">{chosenSeason?.name ?? 'N/A'}</p>
            </div>
          </div>

          <Separator />

          <div className="p-4 rounded-lg bg-primary/10 text-center">
            <p className="text-sm text-muted-foreground">Seu VET restante para Deckbuilding</p>
            <p className="font-bold text-2xl text-primary">{myVetRemaining ?? 100} VET</p>
          </div>

          <p className="text-center text-muted-foreground text-sm">
            Aguardando próxima fase (Deckbuilding)...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading || !scenarioOptions) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Sorteando opções de cenário...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle>Seleção de Cenário</CardTitle>
        <CardDescription>
          Rodada {currentRound} - Aposte logística para influenciar o cenário
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="font-medium">Você:</span>
            {roundConfirmed ? (
              <><Badge variant="default">Confirmado</Badge><CheckCircle2 className="w-4 h-4 text-green-500" /></>
            ) : (
              <Badge variant="outline">Apostando...</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{opponent?.nickname ?? 'Oponente'}:</span>
            {opponentConfirmedThisRound() ? (
              <><Badge variant="secondary">Confirmado</Badge><CheckCircle2 className="w-4 h-4 text-green-500" /></>
            ) : (
              <><Badge variant="outline">Apostando...</Badge><Clock className="w-4 h-4 text-muted-foreground animate-pulse" /></>
            )}
          </div>
        </div>

        {/* Orçamento */}
        <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-lg bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground">Logística Restante</p>
            <p className="font-bold text-lg">{remainingBudget - currentSpent}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gasto Total</p>
            <p className="font-bold text-lg">{totalSpent}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Custo VET</p>
            <p className="font-bold text-lg text-primary">{vetCost}</p>
          </div>
        </div>

        {/* Terrenos */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Terrenos
            {currentRound === 2 && terrainTiebreak && (
              <Badge variant="destructive" className="text-xs">Empate - Rodada 2</Badge>
            )}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {scenarioOptions.terrains.map(terrain => {
              const eligible = isEligible('terrains', terrain.id);
              const bid = bids.terrains[terrain.id] || 0;

              return (
                <div 
                  key={terrain.id}
                  className={`p-3 rounded-lg border ${
                    eligible ? 'border-border' : 'border-muted opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">#{terrain.order}</Badge>
                    {bid > 0 && <Badge>{bid}</Badge>}
                  </div>
                  <p className="font-medium text-sm mb-2">{terrain.name}</p>
                  {eligible && !roundConfirmed && (
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-7 w-7"
                        onClick={() => adjustBid('terrains', terrain.id, -1)}
                        disabled={bid === 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center font-mono">{bid}</span>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-7 w-7"
                        onClick={() => adjustBid('terrains', terrain.id, 1)}
                        disabled={currentSpent >= remainingBudget}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Estações */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sun className="w-4 h-4" /> Estações
            {currentRound === 2 && seasonTiebreak && (
              <Badge variant="destructive" className="text-xs">Empate - Rodada 2</Badge>
            )}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {scenarioOptions.seasons.map(season => {
              const eligible = isEligible('seasons', season.id);
              const bid = bids.seasons[season.id] || 0;

              return (
                <div 
                  key={season.id}
                  className={`p-3 rounded-lg border ${
                    eligible ? 'border-border' : 'border-muted opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">#{season.order}</Badge>
                    {bid > 0 && <Badge>{bid}</Badge>}
                  </div>
                  <p className="font-medium text-sm mb-2">{season.name}</p>
                  {eligible && !roundConfirmed && (
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-7 w-7"
                        onClick={() => adjustBid('seasons', season.id, -1)}
                        disabled={bid === 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center font-mono">{bid}</span>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-7 w-7"
                        onClick={() => adjustBid('seasons', season.id, 1)}
                        disabled={currentSpent >= remainingBudget}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Botão confirmar */}
        {!roundConfirmed && (
          <Button 
            onClick={handleConfirmRound}
            disabled={confirming}
            className="w-full"
            size="lg"
          >
            {confirming ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Confirmando...</>
            ) : (
              `Confirmar Rodada ${currentRound}`
            )}
          </Button>
        )}

        {roundConfirmed && !opponentConfirmedThisRound() && (
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Aguardando oponente confirmar...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
