import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Loader2, Shield, Sword, Zap, Heart, 
  CheckCircle2, Clock, Trophy, SkipForward, LogOut
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Room, RoomPlayer, MatchState, PlayerContext } from '@/types/multiplayer';
import { CombatDebugPanel } from './CombatDebugPanel';
import { BasicCardsPanel } from './BasicCardsPanel';

interface CombatScreenProps {
  room: Room;
  players: RoomPlayer[];
  matchState: MatchState;
  playerContext: PlayerContext;
  onLeaveRoom: () => void;
}

interface HandCard {
  card_id?: string;
  id?: string;
  name: string;
  vet_cost?: number;
  unit_type?: string;
  attack_bonus?: number;
  defense_bonus?: number;
  mobility_bonus?: number;
  command_required?: number;
}

interface BoardState {
  step: 'initiative' | 'main';
  p1: { initiative_card: HandCard | null; main_card: HandCard | null; confirmed: boolean };
  p2: { initiative_card: HandCard | null; main_card: HandCard | null; confirmed: boolean };
  last_resolution: Resolution | null;
}

interface Resolution {
  round: number;
  p1: { atk_final: number; def_final: number; mob_final: number; damage_taken: number };
  p2: { atk_final: number; def_final: number; mob_final: number; damage_taken: number };
  initiative_winner: number;
  combat_finished: boolean;
  winner: number | null;
}

export function CombatScreen({ room, players, matchState, playerContext, onLeaveRoom }: CombatScreenProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  
  const pNum = playerContext.playerNumber;
  const pKey = `p${pNum}` as 'p1' | 'p2';
  const opponentKey = pNum === 1 ? 'p2' : 'p1';
  
  // Extrair dados do matchState
  const combatRound = (matchState as any).combat_round ?? 1;
  const combatPhase = (matchState as any).combat_phase ?? 'initiative';
  const defaultBoard: BoardState = {
    step: 'initiative',
    p1: { initiative_card: null, main_card: null, confirmed: false },
    p2: { initiative_card: null, main_card: null, confirmed: false },
    last_resolution: null
  };
  const rawBoard = (matchState as any).combat_board_state;
  const board: BoardState = rawBoard ? {
    ...defaultBoard,
    ...rawBoard,
    p1: { ...defaultBoard.p1, ...(rawBoard.p1 || {}) },
    p2: { ...defaultBoard.p2, ...(rawBoard.p2 || {}) },
  } : defaultBoard;
  
  const myHand: HandCard[] = pNum === 1 
    ? (matchState as any).player1_hand ?? []
    : (matchState as any).player2_hand ?? [];
  
  const myHp = pNum === 1 ? (matchState as any).player1_hp ?? 100 : (matchState as any).player2_hp ?? 100;
  const opponentHp = pNum === 1 ? (matchState as any).player2_hp ?? 100 : (matchState as any).player1_hp ?? 100;
  
  const myBoard = board[pKey];
  const opponentBoard = board[opponentKey];
  const currentStep = board.step;
  
  const opponent = players.find(p => p.player_number !== pNum);
  
  // Mostrar dialog de resolução quando houver nova resolução
  useEffect(() => {
    if (board.last_resolution && board.last_resolution.round === combatRound - 1) {
      setShowResolutionDialog(true);
    }
  }, [board.last_resolution, combatRound]);
  
  // Selecionar carta de iniciativa
  const handleSelectInitiativeCard = async (cardIndex: number | null) => {
    setLoading('select-init');
    try {
      const { error } = await supabase.rpc('select_initiative_card', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_card_index: cardIndex
      });
      if (error) throw error;
      setSelectedCardIndex(null);
      toast.success(cardIndex !== null ? 'Carta de iniciativa selecionada' : 'Sem carta de iniciativa');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao selecionar');
    } finally {
      setLoading(null);
    }
  };
  
  // Confirmar iniciativa
  const handleConfirmInitiative = async () => {
    setLoading('confirm-init');
    try {
      const { error } = await supabase.rpc('confirm_initiative', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId
      });
      if (error) throw error;
      toast.success('Iniciativa confirmada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao confirmar');
    } finally {
      setLoading(null);
    }
  };
  
  // Selecionar carta principal
  const handleSelectMainCard = async (cardIndex: number) => {
    setLoading('select-main');
    try {
      const { error } = await supabase.rpc('select_main_card', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_card_index: cardIndex
      });
      if (error) throw error;
      setSelectedCardIndex(null);
      toast.success('Carta principal selecionada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao selecionar');
    } finally {
      setLoading(null);
    }
  };
  
  // Confirmar carta principal
  const handleConfirmMain = async () => {
    setLoading('confirm-main');
    try {
      const { error } = await supabase.rpc('confirm_main', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId
      });
      if (error) throw error;
      toast.success('Carta confirmada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao confirmar');
    } finally {
      setLoading(null);
    }
  };
  
  // Renderizar carta
  const renderCard = (card: HandCard | null, label: string) => {
    if (!card) {
      return (
        <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-3 text-center text-muted-foreground text-sm">
          {label}
        </div>
      );
    }
    return (
      <div className="border-2 border-primary/50 bg-primary/5 rounded-lg p-3">
        <div className="font-medium text-sm truncate">{card.name}</div>
        <div className="flex gap-2 mt-1 text-xs">
          {card.attack_bonus ? <span className="text-red-500">+{card.attack_bonus}A</span> : null}
          {card.defense_bonus ? <span className="text-blue-500">+{card.defense_bonus}D</span> : null}
          {card.mobility_bonus ? <span className="text-yellow-500">+{card.mobility_bonus}M</span> : null}
        </div>
      </div>
    );
  };
  
  // Combate finalizado
  if (combatPhase === 'finished') {
    const winner = board.last_resolution?.winner;
    const isWinner = winner === pNum;
    
    return (
      <div className="w-full max-w-lg mx-auto">
        <Card className="text-center">
          <CardHeader>
            <Trophy className={`w-16 h-16 mx-auto ${isWinner ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            <CardTitle className="text-2xl">
              {winner === 0 ? 'Empate!' : isWinner ? 'Vitória!' : 'Derrota'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center gap-8">
              <div>
                <div className="text-sm text-muted-foreground">Você</div>
                <div className="text-2xl font-bold">{myHp} HP</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{opponent?.nickname || 'Oponente'}</div>
                <div className="text-2xl font-bold">{opponentHp} HP</div>
              </div>
            </div>
            <Button onClick={onLeaveRoom} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Sala
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-4xl space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="py-3">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={onLeaveRoom} className="text-destructive">
              <LogOut className="w-4 h-4 mr-1" />
              Sair
            </Button>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                Rodada {combatRound}
              </Badge>
              <Badge className={`text-lg px-3 py-1 ${currentStep === 'initiative' ? 'bg-yellow-600' : 'bg-primary'}`}>
                {currentStep === 'initiative' ? 'Iniciativa' : 'Principal'}
              </Badge>
            </div>
            <div className="w-16" />
          </div>
        </CardContent>
      </Card>
      
      {/* HP e Status */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-primary/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="font-bold">Você</span>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold">{myHp}</span>
              </div>
            </div>
            <div className="mt-2 h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                style={{ width: `${myHp}%` }}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {myBoard.confirmed ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Confirmado
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" /> Aguardando
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-destructive/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="font-bold">{opponent?.nickname || 'Oponente'}</span>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold">{opponentHp}</span>
              </div>
            </div>
            <div className="mt-2 h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
                style={{ width: `${opponentHp}%` }}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {opponentBoard.confirmed ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Confirmado
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" /> Aguardando
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Área de Cartas Selecionadas */}
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm">Cartas Selecionadas</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Iniciativa</div>
              {renderCard(myBoard.initiative_card, 'Nenhuma carta')}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Principal</div>
              {renderCard(myBoard.main_card, 'Selecione uma carta')}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Ações por Fase */}
      {currentStep === 'initiative' && !myBoard.confirmed && (
        <Card className="border-yellow-500/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Fase de Iniciativa
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Selecione 0 ou 1 carta para bônus de iniciativa (mobilidade). Depois confirme.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSelectInitiativeCard(null)}
                disabled={loading === 'select-init'}
              >
                Sem carta de iniciativa
              </Button>
              <Button 
                onClick={handleConfirmInitiative}
                disabled={loading === 'confirm-init'}
              >
                {loading === 'confirm-init' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                Confirmar Iniciativa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {currentStep === 'main' && !myBoard.confirmed && (
        <Card className="border-primary/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sword className="w-4 h-4 text-primary" />
              Fase Principal
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Selecione uma carta da sua mão como carta principal e confirme.
            </p>
            {myBoard.main_card && (
              <Button 
                onClick={handleConfirmMain}
                disabled={loading === 'confirm-main'}
              >
                {loading === 'confirm-main' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                Confirmar Carta
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      {myBoard.confirmed && (
        <Card className="border-muted">
          <CardContent className="py-4 text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Aguardando {opponent?.nickname || 'oponente'} confirmar...
          </CardContent>
        </Card>
      )}
      
      {/* Basic Cards Panel */}
      <BasicCardsPanel
        roomId={room.id}
        sessionId={playerContext.sessionId}
        playerNumber={pNum as 1 | 2}
        basicCardsUsed={(matchState as any)[`player${pNum}_basic_cards_used`] || {}}
        currentBonuses={myBoard.basic_bonuses || {}}
        combatPhase={combatPhase}
        disabled={myBoard.confirmed}
      
      {/* Mão */}
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm">Sua Mão ({myHand.length} cartas)</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          {myHand.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma carta na mão
            </p>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {myHand.map((card, index) => {
                  const cardId = card.card_id || card.id || `card-${index}`;
                  const isSelected = selectedCardIndex === index;
                  const canSelect = !myBoard.confirmed && (
                    (currentStep === 'initiative') || 
                    (currentStep === 'main' && !myBoard.main_card)
                  );
                  
                  return (
                    <Button
                      key={cardId}
                      variant={isSelected ? "default" : "outline"}
                      className="h-auto py-2 px-3 flex-shrink-0 min-w-[130px] flex-col items-start"
                      disabled={!canSelect || loading !== null}
                      onClick={() => {
                        if (currentStep === 'initiative') {
                          handleSelectInitiativeCard(index);
                        } else if (currentStep === 'main') {
                          handleSelectMainCard(index);
                        }
                      }}
                    >
                      <div className="font-medium text-xs truncate max-w-[110px]">
                        {card.name}
                      </div>
                      <div className="flex gap-1 mt-1 text-[10px]">
                        {card.attack_bonus ? <span className="text-red-400">+{card.attack_bonus}A</span> : null}
                        {card.defense_bonus ? <span className="text-blue-400">+{card.defense_bonus}D</span> : null}
                        {card.mobility_bonus ? <span className="text-yellow-400">+{card.mobility_bonus}M</span> : null}
                      </div>
                      {card.command_required ? (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          CMD: {card.command_required}
                        </div>
                      ) : null}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      {/* Debug Panel */}
      <CombatDebugPanel room={room} matchState={matchState} />
      
      {/* Dialog de Resolução */}
      <Dialog open={showResolutionDialog} onOpenChange={setShowResolutionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resultado da Rodada {board.last_resolution?.round}</DialogTitle>
            <DialogDescription>
              {board.last_resolution?.initiative_winner === 0 
                ? 'Empate na iniciativa' 
                : `Jogador ${board.last_resolution?.initiative_winner} ganhou a iniciativa`}
            </DialogDescription>
          </DialogHeader>
          
          {board.last_resolution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <div className="font-medium mb-2">Você</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Ataque Final:</span>
                      <span className="font-mono">{pNum === 1 ? board.last_resolution.p1.atk_final : board.last_resolution.p2.atk_final}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Defesa Final:</span>
                      <span className="font-mono">{pNum === 1 ? board.last_resolution.p1.def_final : board.last_resolution.p2.def_final}</span>
                    </div>
                    <div className="flex justify-between text-red-500">
                      <span>Dano Recebido:</span>
                      <span className="font-mono">-{pNum === 1 ? board.last_resolution.p1.damage_taken : board.last_resolution.p2.damage_taken}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-destructive/10">
                  <div className="font-medium mb-2">{opponent?.nickname || 'Oponente'}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Ataque Final:</span>
                      <span className="font-mono">{pNum === 1 ? board.last_resolution.p2.atk_final : board.last_resolution.p1.atk_final}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Defesa Final:</span>
                      <span className="font-mono">{pNum === 1 ? board.last_resolution.p2.def_final : board.last_resolution.p1.def_final}</span>
                    </div>
                    <div className="flex justify-between text-red-500">
                      <span>Dano Recebido:</span>
                      <span className="font-mono">-{pNum === 1 ? board.last_resolution.p2.damage_taken : board.last_resolution.p1.damage_taken}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button className="w-full" onClick={() => setShowResolutionDialog(false)}>
                <SkipForward className="w-4 h-4 mr-2" />
                Próxima Rodada
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
