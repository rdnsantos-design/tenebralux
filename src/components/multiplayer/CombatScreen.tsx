import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, Shield, Sword, Zap, Heart, Users,
  CheckCircle2, Clock, Trophy, LogOut, Dices, MapPin
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

interface DeployedCommander {
  instance_id: string;
  numero: number;
  especializacao: string;
  comando_base: number;
  estrategia: number;
  guarda_current: number;
  is_general: boolean;
}

interface HandCard {
  id?: string;
  name: string;
  vet_cost?: number;
  mobility_bonus?: number;
  attack_bonus?: number;
  defense_bonus?: number;
  command_required?: number;
  effect_tag?: string;
}

type CombatPhase = 'initiative_maneuver' | 'initiative_reaction' | 'initiative_roll' | 'initiative_post' | 'combat' | 'finished';

const PHASE_LABELS: Record<string, { phase: string; subfase: string }> = {
  'initiative_maneuver': { phase: 'Fase 1: Iniciativa', subfase: 'Manobras' },
  'initiative_reaction': { phase: 'Fase 1: Iniciativa', subfase: 'Reações' },
  'initiative_roll': { phase: 'Fase 1: Iniciativa', subfase: 'Rolagem' },
  'initiative_post': { phase: 'Fase 1: Iniciativa', subfase: 'Escolhas do Vencedor' },
  'combat': { phase: 'Fase 2: Combate', subfase: '' },
  'finished': { phase: 'Fim', subfase: '' },
};

export function CombatScreen({ room, players, matchState, playerContext, onLeaveRoom }: CombatScreenProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedCommanderId, setSelectedCommanderId] = useState<string | null>(null);
  const [showInitiativeResult, setShowInitiativeResult] = useState(false);
  
  const pNum = playerContext.playerNumber;
  const pKey = `p${pNum}` as 'p1' | 'p2';
  const opponentKey = pNum === 1 ? 'p2' : 'p1';
  
  const combatRound = (matchState as any).combat_round ?? 1;
  const combatPhase: CombatPhase = (matchState as any).combat_phase ?? 'initiative_maneuver';
  const board = (matchState as any).combat_board_state ?? {};
  
  const myHand: HandCard[] = pNum === 1 ? (matchState as any).player1_hand ?? [] : (matchState as any).player2_hand ?? [];
  const myHp = pNum === 1 ? (matchState as any).player1_hp ?? 100 : (matchState as any).player2_hp ?? 100;
  const opponentHp = pNum === 1 ? (matchState as any).player2_hp ?? 100 : (matchState as any).player1_hp ?? 100;
  
  const myCmdState = pNum === 1 ? (matchState as any).player1_cmd_state : (matchState as any).player2_cmd_state;
  const generalInfo = myCmdState?.general ?? { cmd_total: 1, cmd_free: 1, strategy_total: 1 };
  
  const myBoard = board[pKey] ?? {};
  const opponentBoard = board[opponentKey] ?? {};
  const myDeployedCommanders: DeployedCommander[] = myBoard.deployed_commanders ?? [];
  const opponentDeployedCommanders: DeployedCommander[] = opponentBoard.deployed_commanders ?? [];
  
  const initiativeResult = board.initiative_result;
  const isInitiativeWinner = initiativeResult?.winner_player_number === pNum;
  
  const opponent = players.find(p => p.player_number !== pNum);
  const phaseLabels = PHASE_LABELS[combatPhase] ?? { phase: combatPhase, subfase: '' };

  // Mostrar resultado da iniciativa
  useEffect(() => {
    if (initiativeResult && combatPhase === 'initiative_post') {
      setShowInitiativeResult(true);
    }
  }, [initiativeResult, combatPhase]);

  // === RPCs ===
  const handleSelectManeuver = async () => {
    if (selectedCardIndex === null || !selectedCommanderId) {
      toast.error('Selecione uma carta e um comandante');
      return;
    }
    setLoading('maneuver');
    try {
      const { error } = await supabase.rpc('select_maneuver_card', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_card_index: selectedCardIndex,
        p_commander_instance_id: selectedCommanderId
      });
      if (error) throw error;
      setSelectedCardIndex(null);
      setSelectedCommanderId(null);
      toast.success('Manobra selecionada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  const handleConfirmManeuver = async () => {
    setLoading('confirm-maneuver');
    try {
      const { error } = await supabase.rpc('confirm_maneuver', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId
      });
      if (error) throw error;
      toast.success('Manobra confirmada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  const handleSelectReaction = async (cardIndex: number | null) => {
    setLoading('reaction');
    try {
      const { error } = await supabase.rpc('select_reaction_card', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_card_index: cardIndex
      });
      if (error) throw error;
      toast.success(cardIndex === null ? 'Passou reação' : 'Reação selecionada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  const handleConfirmReaction = async () => {
    setLoading('confirm-reaction');
    try {
      const { error } = await supabase.rpc('confirm_reaction', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId
      });
      if (error) throw error;
      toast.success('Reação confirmada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  const handleResolveInitiative = async () => {
    setLoading('roll');
    try {
      const { error } = await supabase.rpc('resolve_initiative_roll', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  const handleChooseSecondaryTerrain = async (terrainId: string) => {
    setLoading('terrain');
    try {
      const { error } = await supabase.rpc('choose_secondary_terrain', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_secondary_terrain_id: terrainId
      });
      if (error) throw error;
      toast.success('Terreno secundário escolhido');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  const handleChooseFirstAttacker = async (attackerNum: number) => {
    setLoading('attacker');
    try {
      const { error } = await supabase.rpc('choose_first_attacker', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_attacker_player_number: attackerNum
      });
      if (error) throw error;
      toast.success('Fase 1 completa!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  // Renderizar comandante
  const renderCommander = (cmd: DeployedCommander, isOwn: boolean) => (
    <div 
      key={cmd.instance_id} 
      className={`p-2 rounded border text-xs ${cmd.is_general ? 'border-yellow-500 bg-yellow-500/10' : 'border-border'} ${isOwn && selectedCommanderId === cmd.instance_id ? 'ring-2 ring-primary' : ''}`}
      onClick={() => isOwn && combatPhase === 'initiative_maneuver' && setSelectedCommanderId(cmd.instance_id)}
    >
      <div className="font-medium flex items-center gap-1">
        {cmd.is_general && <Trophy className="w-3 h-3 text-yellow-500" />}
        #{cmd.numero} {cmd.especializacao}
      </div>
      <div className="text-muted-foreground">
        CMD: {myCmdState?.commanders?.[cmd.instance_id]?.cmd_free ?? cmd.comando_base}/{cmd.comando_base} | 
        Guarda: {cmd.guarda_current}
      </div>
    </div>
  );

  // Combate finalizado
  if (combatPhase === 'finished') {
    return (
      <div className="w-full max-w-lg mx-auto">
        <Card className="text-center">
          <CardHeader>
            <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
            <CardTitle className="text-2xl">Combate Finalizado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={onLeaveRoom} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-3">
      {/* Header com Fase */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="py-3">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={onLeaveRoom} className="text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <div className="text-lg font-bold">{phaseLabels.phase}</div>
              {phaseLabels.subfase && <Badge variant="secondary">{phaseLabels.subfase}</Badge>}
            </div>
            <Badge variant="outline">Rodada {combatRound}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* HP */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-primary/50">
          <CardContent className="py-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Você</span>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-bold">{myHp}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardContent className="py-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">{opponent?.nickname || 'Oponente'}</span>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-bold">{opponentHp}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comandantes Baixados (públicos) */}
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Comandantes em Campo
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Seus ({myDeployedCommanders.length})</div>
              <div className="space-y-1">
                {myDeployedCommanders.map(c => renderCommander(c, true))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Oponente ({opponentDeployedCommanders.length})</div>
              <div className="space-y-1">
                {opponentDeployedCommanders.map(c => renderCommander(c, false))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Info */}
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="py-2">
          <div className="flex items-center justify-between text-sm">
            <Badge variant="outline" className="gap-1">
              <Trophy className="w-3 h-3 text-yellow-500" />
              Seu General
            </Badge>
            <span>CMD: {generalInfo.cmd_free}/{generalInfo.cmd_total} | Estratégia: {generalInfo.strategy_total}</span>
          </div>
        </CardContent>
      </Card>

      {/* === SUBFASE: MANOBRAS === */}
      {combatPhase === 'initiative_maneuver' && (
        <Card className="border-yellow-500/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Subfase: Manobras
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Selecione uma carta de manobra e um comandante para vinculá-la. O CMD será descontado do comandante.
            </p>
            
            {myBoard.maneuver && (
              <div className="p-2 bg-primary/10 rounded text-sm">
                Manobra: <strong>{myBoard.maneuver.card?.name}</strong> → Comandante #{myDeployedCommanders.find(c => c.instance_id === myBoard.maneuver.commander_instance_id)?.numero}
              </div>
            )}
            
            {selectedCardIndex !== null && (
              <div className="space-y-2">
                <div className="text-sm">Carta: {myHand[selectedCardIndex]?.name}</div>
                <Select value={selectedCommanderId || ''} onValueChange={setSelectedCommanderId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Escolha um comandante" />
                  </SelectTrigger>
                  <SelectContent>
                    {myDeployedCommanders.filter(c => !c.is_general).map(c => (
                      <SelectItem key={c.instance_id} value={c.instance_id}>
                        #{c.numero} {c.especializacao} (CMD: {myCmdState?.commanders?.[c.instance_id]?.cmd_free ?? c.comando_base})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSelectManeuver} disabled={!selectedCommanderId || loading === 'maneuver'} size="sm">
                  {loading === 'maneuver' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vincular Manobra'}
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={loading !== null}
                onClick={() => { setSelectedCardIndex(null); setSelectedCommanderId(null); handleConfirmManeuver(); }}>
                Sem Manobra
              </Button>
              <Button onClick={handleConfirmManeuver} disabled={loading === 'confirm-maneuver' || myBoard.confirmed_maneuver}>
                {loading === 'confirm-maneuver' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar</>}
              </Button>
            </div>
            
            {myBoard.confirmed_maneuver && <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 mr-1" /> Confirmado</Badge>}
          </CardContent>
        </Card>
      )}

      {/* === SUBFASE: REAÇÕES === */}
      {combatPhase === 'initiative_reaction' && (
        <Card className="border-purple-500/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              Subfase: Reações
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Jogue uma reação (vinculada ao General) ou passe. CMD será descontado do General.
            </p>
            
            {myBoard.reaction && (
              <div className="p-2 bg-purple-500/10 rounded text-sm">
                Reação: <strong>{myBoard.reaction.card?.name}</strong>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={() => handleSelectReaction(null)} variant="outline" size="sm" disabled={loading !== null}>
                Passar
              </Button>
              <Button onClick={handleConfirmReaction} disabled={loading === 'confirm-reaction' || myBoard.confirmed_reaction}>
                {loading === 'confirm-reaction' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar</>}
              </Button>
            </div>
            
            {myBoard.confirmed_reaction && <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 mr-1" /> Confirmado</Badge>}
          </CardContent>
        </Card>
      )}

      {/* === SUBFASE: ROLAGEM === */}
      {combatPhase === 'initiative_roll' && (
        <Card className="border-blue-500/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dices className="w-4 h-4 text-blue-500" />
              Rolagem de Iniciativa
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <p className="text-xs text-muted-foreground mb-3">
              1d20 + Estratégia + Mobilidade + Modificadores
            </p>
            <Button onClick={handleResolveInitiative} disabled={loading === 'roll'}>
              {loading === 'roll' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Dices className="w-4 h-4 mr-1" /> Rolar Iniciativa</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* === SUBFASE: PÓS-INICIATIVA (vencedor escolhe) === */}
      {combatPhase === 'initiative_post' && (
        <Card className="border-green-500/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" />
              {isInitiativeWinner ? 'Você venceu! Escolha:' : 'Aguardando vencedor...'}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            {initiativeResult && (
              <div className="grid grid-cols-2 gap-2 text-xs bg-muted/50 p-2 rounded">
                <div>Você: d20({initiativeResult.p1?.d20}) + {initiativeResult.p1?.strategy} + {initiativeResult.p1?.mobility} + {initiativeResult.p1?.mods} = <strong>{initiativeResult.p1?.total}</strong></div>
                <div>Oponente: d20({initiativeResult.p2?.d20}) + {initiativeResult.p2?.strategy} + {initiativeResult.p2?.mobility} + {initiativeResult.p2?.mods} = <strong>{initiativeResult.p2?.total}</strong></div>
              </div>
            )}
            
            {isInitiativeWinner ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">1. Terreno Secundário:</div>
                <div className="flex gap-2 flex-wrap">
                  {/* MVP: botões placeholder - depois usar tabela real */}
                  <Button size="sm" variant="outline" onClick={() => handleChooseSecondaryTerrain('00000000-0000-0000-0000-000000000001')}>Planície</Button>
                  <Button size="sm" variant="outline" onClick={() => handleChooseSecondaryTerrain('00000000-0000-0000-0000-000000000002')}>Colina</Button>
                </div>
                
                {(matchState as any).chosen_secondary_terrain_id && (
                  <>
                    <div className="text-sm font-medium mt-3">2. Quem ataca primeiro?</div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleChooseFirstAttacker(pNum)}>Eu ataco</Button>
                      <Button size="sm" variant="outline" onClick={() => handleChooseFirstAttacker(pNum === 1 ? 2 : 1)}>Oponente ataca</Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Aguardando {opponent?.nickname} fazer as escolhas...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mão de Cartas */}
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm">Sua Mão ({myHand.length})</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {myHand.map((card, index) => (
                <div 
                  key={index}
                  onClick={() => setSelectedCardIndex(index)}
                  className={`flex-shrink-0 w-32 p-2 rounded border cursor-pointer transition-all ${selectedCardIndex === index ? 'ring-2 ring-primary border-primary' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="text-xs font-medium truncate">{card.name}</div>
                  <div className="flex gap-1 mt-1 text-[10px]">
                    {card.attack_bonus ? <span className="text-red-500">+{card.attack_bonus}A</span> : null}
                    {card.defense_bonus ? <span className="text-blue-500">+{card.defense_bonus}D</span> : null}
                    {card.mobility_bonus ? <span className="text-yellow-500">+{card.mobility_bonus}M</span> : null}
                  </div>
                  {card.effect_tag && <Badge variant="outline" className="text-[10px] mt-1">{card.effect_tag}</Badge>}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <BasicCardsPanel
        roomId={room.id}
        sessionId={playerContext.sessionId}
        playerNumber={pNum as 1 | 2}
        basicCardsUsed={(matchState as any)[`player${pNum}_basic_cards_used`] || {}}
        currentBonuses={(myBoard as any).basic_bonuses || {}}
        combatPhase={combatPhase}
        disabled={false}
      />

      <CombatDebugPanel room={room} matchState={matchState} />
    </div>
  );
}
