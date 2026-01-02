import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useCompatibleTerrains } from '@/hooks/useCompatibleTerrains';

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
  card_id?: string;
  name: string;
  vet_cost?: number;
  mobility_bonus?: number;
  attack_bonus?: number;
  defense_bonus?: number;
  command_required?: number;
  effect_tag?: string;
  card_type?: 'ofensiva' | 'defensiva' | 'movimentacao' | 'reacao';
}

type CombatPhase = 
  | 'initiative_maneuver' | 'initiative_reaction' | 'initiative_roll' | 'initiative_post' 
  | 'attack_maneuver' | 'attack_reaction' | 'defense_maneuver' | 'defense_reaction' 
  | 'combat_roll' | 'combat_resolution' | 'combat' | 'finished';

// Estrutura de fases:
// Fase 1: Iniciativa (movimentação + reações)
// Fase 2: Ataque (ofensivas + reações)
// Fase 3: Defesa (defensivas + reações)
const PHASE_LABELS: Record<string, { phase: string; subfase: string; allowedCardTypes: string[] }> = {
  'initiative_maneuver': { phase: 'Fase 1: Iniciativa', subfase: 'Manobras', allowedCardTypes: ['movimentacao'] },
  'initiative_reaction': { phase: 'Fase 1: Iniciativa', subfase: 'Reações', allowedCardTypes: ['reacao'] },
  'initiative_roll': { phase: 'Fase 1: Iniciativa', subfase: 'Rolagem', allowedCardTypes: [] },
  'initiative_post': { phase: 'Fase 1: Iniciativa', subfase: 'Escolhas do Vencedor', allowedCardTypes: [] },
  'attack_maneuver': { phase: 'Fase 2: Ataque', subfase: 'Manobras Ofensivas', allowedCardTypes: ['ofensiva'] },
  'attack_reaction': { phase: 'Fase 2: Ataque', subfase: 'Reações', allowedCardTypes: ['reacao'] },
  'defense_maneuver': { phase: 'Fase 3: Defesa', subfase: 'Manobras Defensivas', allowedCardTypes: ['defensiva'] },
  'defense_reaction': { phase: 'Fase 3: Defesa', subfase: 'Reações', allowedCardTypes: ['reacao'] },
  'combat_roll': { phase: 'Resolução', subfase: 'Rolagem de Combate', allowedCardTypes: [] },
  'combat_resolution': { phase: 'Resolução', subfase: 'Aplicar Dano', allowedCardTypes: [] },
  'combat': { phase: 'Combate', subfase: '', allowedCardTypes: [] },
  'finished': { phase: 'Fim', subfase: '', allowedCardTypes: [] },
};

// Mapeamento de card_type para labels amigáveis
const CARD_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  'ofensiva': { label: 'Ataque', color: 'text-red-500 border-red-500/50' },
  'defensiva': { label: 'Defesa', color: 'text-blue-500 border-blue-500/50' },
  'movimentacao': { label: 'Iniciativa', color: 'text-yellow-500 border-yellow-500/50' },
  'reacao': { label: 'Reação', color: 'text-purple-500 border-purple-500/50' },
};

export function CombatScreen({ room, players, matchState, playerContext, onLeaveRoom }: CombatScreenProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedCommanderId, setSelectedCommanderId] = useState<string | null>(null);
  
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
  
  const currentAttacker = board.current_attacker;
  const currentDefender = board.current_defender;
  const reactionTurn = board.reaction_turn;
  const isMyTurnToReact = reactionTurn === pNum;
  const amIAttacker = currentAttacker === pNum;
  const amIDefender = currentDefender === pNum;
  
  const opponent = players.find(p => p.player_number !== pNum);
  const phaseLabels = PHASE_LABELS[combatPhase] ?? { phase: combatPhase, subfase: '', allowedCardTypes: [] };
  
  // Terrenos compatíveis
  const primaryTerrainId = (matchState as any).chosen_terrain_id;
  const { data: compatibleTerrains = [] } = useCompatibleTerrains(primaryTerrainId);

  // === RPCs FASE 1 ===
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
      toast.success('Fase 2 iniciada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  // === RPCs FASE 2 ===
  const handlePlayAttackManeuver = async () => {
    if (selectedCardIndex === null || !selectedCommanderId) {
      toast.error('Selecione uma carta e um comandante');
      return;
    }
    setLoading('attack-maneuver');
    try {
      const { error } = await supabase.rpc('play_attack_maneuver', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_card_index: selectedCardIndex,
        p_commander_instance_id: selectedCommanderId
      });
      if (error) throw error;
      setSelectedCardIndex(null);
      setSelectedCommanderId(null);
      toast.success('Manobra ofensiva jogada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  const handleConfirmAttackManeuvers = async () => {
    setLoading('confirm-attack');
    try {
      const { error } = await supabase.rpc('confirm_attack_maneuvers', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId
      });
      if (error) throw error;
      toast.success('Manobras de ataque confirmadas');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  const handlePlayDefenseManeuver = async () => {
    if (selectedCardIndex === null || !selectedCommanderId) {
      toast.error('Selecione uma carta e um comandante');
      return;
    }
    setLoading('defense-maneuver');
    try {
      const { error } = await supabase.rpc('play_defense_maneuver', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_card_index: selectedCardIndex,
        p_commander_instance_id: selectedCommanderId
      });
      if (error) throw error;
      setSelectedCardIndex(null);
      setSelectedCommanderId(null);
      toast.success('Manobra defensiva jogada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  const handleConfirmDefenseManeuvers = async () => {
    setLoading('confirm-defense');
    try {
      const { error } = await supabase.rpc('confirm_defense_maneuvers', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId
      });
      if (error) throw error;
      toast.success('Manobras de defesa confirmadas');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  const handlePlayReactionTurn = async (cardIndex: number | null) => {
    setLoading('reaction-turn');
    try {
      const { error } = await supabase.rpc('play_reaction_turn', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_card_index: cardIndex
      });
      if (error) throw error;
      toast.success(cardIndex === null ? 'Passou' : 'Reação jogada');
      setSelectedCardIndex(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  const handleResolveCombatRoll = async () => {
    setLoading('combat-roll');
    try {
      const { error } = await supabase.rpc('resolve_combat_roll', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId
      });
      if (error) throw error;
      toast.success('Rolagem resolvida!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(null);
    }
  };

  // Renderizar comandante
  const renderCommander = (cmd: DeployedCommander, isOwn: boolean, canSelect: boolean) => {
    const cmdState = myCmdState?.commanders?.[cmd.instance_id];
    const cmdFree = cmdState?.cmd_free ?? cmd.comando_base;
    
    return (
      <div 
        key={cmd.instance_id} 
        className={`p-2 rounded border text-xs ${cmd.is_general ? 'border-yellow-500 bg-yellow-500/10' : 'border-border'} ${isOwn && canSelect && selectedCommanderId === cmd.instance_id ? 'ring-2 ring-primary' : ''} ${isOwn && canSelect && !cmd.is_general ? 'cursor-pointer hover:border-primary/50' : ''}`}
        onClick={() => isOwn && canSelect && !cmd.is_general && setSelectedCommanderId(cmd.instance_id)}
      >
        <div className="font-medium flex items-center gap-1">
          {cmd.is_general && <Trophy className="w-3 h-3 text-yellow-500" />}
          #{cmd.numero} {cmd.especializacao}
        </div>
        <div className="text-muted-foreground">
          CMD: {cmdFree}/{cmd.comando_base} | Guarda: {cmd.guarda_current}
        </div>
      </div>
    );
  };

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
        <Card className={`border-primary/50 ${amIAttacker ? 'ring-2 ring-red-500/50' : amIDefender ? 'ring-2 ring-blue-500/50' : ''}`}>
          <CardContent className="py-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">
                Você {amIAttacker && <Sword className="inline w-3 h-3 text-red-500" />}{amIDefender && <Shield className="inline w-3 h-3 text-blue-500" />}
              </span>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-bold">{myHp}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-destructive/50 ${!amIAttacker && currentAttacker ? 'ring-2 ring-red-500/50' : !amIDefender && currentDefender ? 'ring-2 ring-blue-500/50' : ''}`}>
          <CardContent className="py-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">
                {opponent?.nickname || 'Oponente'} {!amIAttacker && currentAttacker && <Sword className="inline w-3 h-3 text-red-500" />}{!amIDefender && currentDefender && <Shield className="inline w-3 h-3 text-blue-500" />}
              </span>
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
                {myDeployedCommanders.map(c => renderCommander(c, true, ['initiative_maneuver', 'attack_maneuver', 'defense_maneuver'].includes(combatPhase)))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Oponente ({opponentDeployedCommanders.length})</div>
              <div className="space-y-1">
                {opponentDeployedCommanders.map(c => renderCommander(c, false, false))}
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

      {/* === SUBFASE: MANOBRAS (Fase 1) === */}
      {combatPhase === 'initiative_maneuver' && (
        <Card className="border-yellow-500/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Subfase: Manobras (Iniciativa)
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Selecione uma carta de manobra e um comandante para vinculá-la.
            </p>
            
            {myBoard.maneuver && (
              <div className="p-2 bg-primary/10 rounded text-sm">
                Manobra: <strong>{myBoard.maneuver.card?.name}</strong>
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
                  {loading === 'maneuver' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vincular'}
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={loading !== null} onClick={handleConfirmManeuver}>
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

      {/* === SUBFASE: REAÇÕES (Fase 1) === */}
      {combatPhase === 'initiative_reaction' && (
        <Card className="border-purple-500/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              Subfase: Reações (Iniciativa)
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Jogue uma reação (vinculada ao General) ou passe.
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

      {/* === SUBFASE: ROLAGEM (Fase 1) === */}
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
              {loading === 'roll' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Dices className="w-4 h-4 mr-1" /> Rolar</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* === SUBFASE: PÓS-INICIATIVA === */}
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
                <div>P1: d20({initiativeResult.p1?.d20}) + {initiativeResult.p1?.strategy} + {initiativeResult.p1?.mobility} = <strong>{initiativeResult.p1?.total}</strong></div>
                <div>P2: d20({initiativeResult.p2?.d20}) + {initiativeResult.p2?.strategy} + {initiativeResult.p2?.mobility} = <strong>{initiativeResult.p2?.total}</strong></div>
              </div>
            )}
            
            {isInitiativeWinner ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-2">1. Terreno Secundário:</div>
                  <div className="flex gap-2 flex-wrap">
                    {compatibleTerrains.map(t => (
                      <Button 
                        key={t.id} 
                        size="sm" 
                        variant={(matchState as any).chosen_secondary_terrain_id === t.id ? 'default' : 'outline'}
                        onClick={() => handleChooseSecondaryTerrain(t.id)}
                        disabled={loading === 'terrain'}
                      >
                        {t.name}
                        <span className="ml-1 text-xs opacity-70">
                          {t.attack_mod > 0 && `+${t.attack_mod}A`}
                          {t.defense_mod > 0 && `+${t.defense_mod}D`}
                          {t.mobility_mod > 0 && `+${t.mobility_mod}M`}
                        </span>
                      </Button>
                    ))}
                    {compatibleTerrains.length === 0 && <span className="text-xs text-muted-foreground">Carregando terrenos...</span>}
                  </div>
                </div>
                
                {(matchState as any).chosen_secondary_terrain_id && (
                  <div>
                    <div className="text-sm font-medium mb-2">2. Quem ataca primeiro?</div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleChooseFirstAttacker(pNum)} disabled={loading === 'attacker'}>
                        <Sword className="w-3 h-3 mr-1" /> Eu ataco
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleChooseFirstAttacker(pNum === 1 ? 2 : 1)} disabled={loading === 'attacker'}>
                        <Shield className="w-3 h-3 mr-1" /> Eu defendo
                      </Button>
                    </div>
                  </div>
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

      {/* === FASE 2: MANOBRAS DE ATAQUE === */}
      {combatPhase === 'attack_maneuver' && (
        <Card className="border-red-500/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sword className="w-4 h-4 text-red-500" />
              Manobras de Ataque
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            {amIAttacker ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Jogue manobras ofensivas vinculando a comandantes. CMD será descontado do comandante.
                </p>
                
                {/* Manobras já jogadas */}
                {(myBoard.attack_maneuvers || []).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium">Manobras jogadas:</div>
                    {(myBoard.attack_maneuvers || []).map((m: any, i: number) => (
                      <div key={i} className="p-1 bg-red-500/10 rounded text-xs">
                        {m.card?.name} → Cmd #{myDeployedCommanders.find(c => c.instance_id === m.commander_instance_id)?.numero}
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedCardIndex !== null && (
                  <div className="space-y-2">
                    <div className="text-sm">Carta: {myHand[selectedCardIndex]?.name}</div>
                    <Select value={selectedCommanderId || ''} onValueChange={setSelectedCommanderId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Vincular a comandante" />
                      </SelectTrigger>
                      <SelectContent>
                        {myDeployedCommanders.filter(c => !c.is_general).map(c => (
                          <SelectItem key={c.instance_id} value={c.instance_id}>
                            #{c.numero} {c.especializacao} (CMD: {myCmdState?.commanders?.[c.instance_id]?.cmd_free ?? c.comando_base})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handlePlayAttackManeuver} disabled={!selectedCommanderId || loading === 'attack-maneuver'} size="sm">
                      {loading === 'attack-maneuver' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Jogar Manobra'}
                    </Button>
                  </div>
                )}
                
                <Button onClick={handleConfirmAttackManeuvers} disabled={loading === 'confirm-attack'}>
                  {loading === 'confirm-attack' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar Manobras</>}
                </Button>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Aguardando {opponent?.nickname} jogar manobras de ataque...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === FASE 2: REAÇÕES (ATAQUE/DEFESA) === */}
      {(combatPhase === 'attack_reaction' || combatPhase === 'defense_reaction') && (
        <Card className="border-purple-500/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              Reações ({combatPhase === 'attack_reaction' ? 'Ataque' : 'Defesa'})
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Vez: <strong>{reactionTurn === pNum ? 'SUA VEZ' : opponent?.nickname}</strong> | 
              Reações usadas: {myBoard.reaction_count || 0}/2 (exceto contra-manobra)
            </p>
            
            {/* Reações jogadas nesta subfase */}
            {(board.reactions_this_phase || []).length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium">Reações desta subfase:</div>
                {(board.reactions_this_phase || []).map((r: any, i: number) => (
                  <div key={i} className={`p-1 rounded text-xs ${r.player === pNum ? 'bg-purple-500/10' : 'bg-muted'}`}>
                    {r.player === pNum ? 'Você' : opponent?.nickname}: {r.card?.name}
                  </div>
                ))}
              </div>
            )}
            
            {isMyTurnToReact ? (
              <div className="space-y-2">
                {selectedCardIndex !== null && (
                  <div className="text-sm mb-2">Carta selecionada: {myHand[selectedCardIndex]?.name}</div>
                )}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => selectedCardIndex !== null ? handlePlayReactionTurn(selectedCardIndex) : null} 
                    disabled={selectedCardIndex === null || loading === 'reaction-turn'}
                    size="sm"
                  >
                    {loading === 'reaction-turn' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Jogar Reação'}
                  </Button>
                  <Button onClick={() => handlePlayReactionTurn(null)} variant="outline" size="sm" disabled={loading === 'reaction-turn'}>
                    Passar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-2">
                <Clock className="w-6 h-6 mx-auto mb-1 opacity-50" />
                Aguardando {opponent?.nickname}...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === FASE 2: MANOBRAS DE DEFESA === */}
      {combatPhase === 'defense_maneuver' && (
        <Card className="border-blue-500/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              Manobras de Defesa
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            {amIDefender ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Jogue manobras defensivas vinculando a comandantes.
                </p>
                
                {(myBoard.defense_maneuvers || []).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium">Manobras jogadas:</div>
                    {(myBoard.defense_maneuvers || []).map((m: any, i: number) => (
                      <div key={i} className="p-1 bg-blue-500/10 rounded text-xs">
                        {m.card?.name} → Cmd #{myDeployedCommanders.find(c => c.instance_id === m.commander_instance_id)?.numero}
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedCardIndex !== null && (
                  <div className="space-y-2">
                    <div className="text-sm">Carta: {myHand[selectedCardIndex]?.name}</div>
                    <Select value={selectedCommanderId || ''} onValueChange={setSelectedCommanderId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Vincular a comandante" />
                      </SelectTrigger>
                      <SelectContent>
                        {myDeployedCommanders.filter(c => !c.is_general).map(c => (
                          <SelectItem key={c.instance_id} value={c.instance_id}>
                            #{c.numero} {c.especializacao} (CMD: {myCmdState?.commanders?.[c.instance_id]?.cmd_free ?? c.comando_base})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handlePlayDefenseManeuver} disabled={!selectedCommanderId || loading === 'defense-maneuver'} size="sm">
                      {loading === 'defense-maneuver' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Jogar Manobra'}
                    </Button>
                  </div>
                )}
                
                <Button onClick={handleConfirmDefenseManeuvers} disabled={loading === 'confirm-defense'}>
                  {loading === 'confirm-defense' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar Manobras</>}
                </Button>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Aguardando {opponent?.nickname} jogar manobras de defesa...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === FASE 2: ROLAGEM DE COMBATE === */}
      {combatPhase === 'combat_roll' && (
        <Card className="border-orange-500/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dices className="w-4 h-4 text-orange-500" />
              Rolagem de Combate
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              1d20 + Ataque + Estratégia + Mods vs Defesa + 5 + Estratégia + Mods
            </p>
            <Button onClick={handleResolveCombatRoll} disabled={loading === 'combat-roll'}>
              {loading === 'combat-roll' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Dices className="w-4 h-4 mr-1" /> Resolver Combate</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* === FASE 2: RESOLUÇÃO === */}
      {combatPhase === 'combat_resolution' && board.last_resolution && (
        <Card className="border-yellow-500/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Resultado do Round
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2 bg-red-500/10 rounded">
                <div className="font-medium">Ataque (P{board.last_resolution.attacker})</div>
                <div>d20: {board.last_resolution.d20}</div>
                <div>Base: {board.last_resolution.attack_base}</div>
                <div>Estratégia: +{board.last_resolution.attack_strategy}</div>
                <div>Terreno: +{board.last_resolution.attack_terrain_mod}</div>
                <div>Manobras: +{board.last_resolution.attack_maneuver_mod}</div>
                <div>Reações: +{board.last_resolution.attack_reaction_mod}</div>
                <div className="font-bold text-primary">Total: {board.last_resolution.attack_total}</div>
              </div>
              <div className="p-2 bg-blue-500/10 rounded">
                <div className="font-medium">Defesa (P{board.last_resolution.defender})</div>
                <div>Base: {board.last_resolution.defense_base}</div>
                <div>Fixo: +5</div>
                <div>Estratégia: +{board.last_resolution.defense_strategy}</div>
                <div>Terreno: +{board.last_resolution.defense_terrain_mod}</div>
                <div>Manobras: +{board.last_resolution.defense_maneuver_mod}</div>
                <div>Reações: +{board.last_resolution.defense_reaction_mod}</div>
                <div className="font-bold text-primary">DC: {board.last_resolution.defense_dc}</div>
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded">
              <div className="text-2xl font-bold">
                {board.last_resolution.damage > 0 ? (
                  <span className="text-red-500">-{board.last_resolution.damage} HP</span>
                ) : (
                  <span className="text-green-500">Defesa bem-sucedida!</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                HP do defensor: {board.last_resolution.defender_hp_before} → {board.last_resolution.defender_hp_after}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mão de Cartas - agora mostra card_type e filtra visualmente */}
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Sua Mão ({myHand.length})</span>
            {phaseLabels.allowedCardTypes.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Permitido: {phaseLabels.allowedCardTypes.map(t => CARD_TYPE_LABELS[t]?.label).join(', ')}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {myHand.map((card, index) => {
                const cardType = card.card_type || card.effect_tag || 'ofensiva';
                const typeInfo = CARD_TYPE_LABELS[cardType] || CARD_TYPE_LABELS['ofensiva'];
                const isAllowedInPhase = phaseLabels.allowedCardTypes.length === 0 || 
                                         phaseLabels.allowedCardTypes.includes(cardType);
                
                return (
                  <div 
                    key={index}
                    onClick={() => setSelectedCardIndex(index)}
                    className={`flex-shrink-0 w-36 p-2 rounded border cursor-pointer transition-all 
                      ${selectedCardIndex === index ? 'ring-2 ring-primary border-primary' : 'border-border hover:border-primary/50'}
                      ${!isAllowedInPhase ? 'opacity-40' : ''}`}
                  >
                    <div className="text-xs font-medium truncate">{card.name}</div>
                    <div className="flex gap-1 mt-1 text-[10px] flex-wrap">
                      {card.attack_bonus ? <span className="text-red-500">+{card.attack_bonus}A</span> : null}
                      {card.defense_bonus ? <span className="text-blue-500">+{card.defense_bonus}D</span> : null}
                      {card.mobility_bonus ? <span className="text-yellow-500">+{card.mobility_bonus}M</span> : null}
                    </div>
                    <Badge variant="outline" className={`text-[10px] mt-1 ${typeInfo.color}`}>
                      {typeInfo.label}
                    </Badge>
                    {card.command_required && (
                      <span className="text-[10px] text-muted-foreground ml-1">CMD: {card.command_required}</span>
                    )}
                  </div>
                );
              })}
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
