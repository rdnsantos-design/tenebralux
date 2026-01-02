import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Loader2, Shield, Sword, Crown, Zap, Heart, 
  Play, SkipForward, History, AlertTriangle, LogOut
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Room, RoomPlayer, MatchState, PlayerContext } from '@/types/multiplayer';

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
}

interface BasicCardState {
  attack: boolean;
  defense: boolean;
  initiative: boolean;
  heal: boolean;
  countermaneuver: boolean;
}

interface CmdState {
  commanders: Record<string, { cmd_total: number; cmd_spent: number; cmd_free: number }>;
  general: { cmd_total: number; cmd_spent: number; cmd_free: number };
}

interface ActionLogEntry {
  id: string;
  player_number: number;
  action_type: string;
  action_data: Record<string, any>;
  phase: string;
  state_version: number;
  created_at: string;
}

const PHASE_LABELS: Record<string, string> = {
  'pre_combat': 'Pré-Combate',
  'deployment': 'Posicionamento',
  'initiative': 'Iniciativa',
  'actions': 'Ações',
  'resolve': 'Resolução',
  'end_round': 'Fim da Rodada',
};

const BASIC_CARDS = [
  { key: 'attack', label: '+1 ATK', icon: Sword, color: 'text-red-500' },
  { key: 'defense', label: '+1 DEF', icon: Shield, color: 'text-blue-500' },
  { key: 'initiative', label: '+1 INI', icon: Zap, color: 'text-yellow-500' },
  { key: 'heal', label: '+1 CURA', icon: Heart, color: 'text-green-500' },
  { key: 'countermaneuver', label: 'Contra', icon: AlertTriangle, color: 'text-purple-500' },
];

export function CombatScreen({ room, players, matchState, playerContext, onLeaveRoom }: CombatScreenProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [selectedCard, setSelectedCard] = useState<HandCard | null>(null);
  const [showCardDialog, setShowCardDialog] = useState(false);
  
  const combatRound = (matchState as any).combat_round ?? 1;
  const combatPhase = (matchState as any).combat_phase ?? 'initiative';
  
  const myHand: HandCard[] = playerContext.playerNumber === 1 
    ? (matchState as any).player1_hand ?? []
    : (matchState as any).player2_hand ?? [];
  
  const myDiscard: HandCard[] = playerContext.playerNumber === 1 
    ? (matchState as any).player1_discard ?? []
    : (matchState as any).player2_discard ?? [];
  
  const myBasicState: BasicCardState = playerContext.playerNumber === 1
    ? (matchState as any).player1_basic_cards_state ?? {}
    : (matchState as any).player2_basic_cards_state ?? {};
  
  const myCmdState: CmdState = playerContext.playerNumber === 1
    ? (matchState as any).player1_cmd_state ?? { commanders: {}, general: { cmd_total: 0, cmd_spent: 0, cmd_free: 0 } }
    : (matchState as any).player2_cmd_state ?? { commanders: {}, general: { cmd_total: 0, cmd_spent: 0, cmd_free: 0 } };
  
  const myHp = playerContext.playerNumber === 1
    ? (matchState as any).player1_hp ?? 100
    : (matchState as any).player2_hp ?? 100;
  
  const opponentHp = playerContext.playerNumber === 1
    ? (matchState as any).player2_hp ?? 100
    : (matchState as any).player1_hp ?? 100;
  
  const opponent = players.find(p => p.player_number !== playerContext.playerNumber);
  
  // Fetch action log
  useEffect(() => {
    const fetchLog = async () => {
      const { data } = await supabase
        .from('match_actions')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(15);
      
      if (data) {
        setActionLog(data as ActionLogEntry[]);
      }
    };
    
    fetchLog();
    
    // Subscribe to new actions
    const channel = supabase
      .channel(`combat-log-${room.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_actions', filter: `room_id=eq.${room.id}` },
        (payload) => {
          if (payload.new) {
            setActionLog(prev => [payload.new as ActionLogEntry, ...prev].slice(0, 15));
          }
        }
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [room.id]);
  
  const handlePlayCard = async (card: HandCard) => {
    const cardId = card.card_id || card.id;
    if (!cardId) return;
    
    setLoading(`play-${cardId}`);
    try {
      const { error } = await supabase.rpc('play_card', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_card_id: cardId,
        p_target: {}
      });
      
      if (error) throw error;
      toast.success(`${card.name} jogada!`);
      setShowCardDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao jogar carta');
    } finally {
      setLoading(null);
    }
  };
  
  const handleUseBasicCard = async (cardKey: string) => {
    setLoading(`basic-${cardKey}`);
    try {
      const { error } = await supabase.rpc('use_basic_card', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_basic_card_key: cardKey,
        p_target: {}
      });
      
      if (error) throw error;
      toast.success('Carta básica usada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao usar carta');
    } finally {
      setLoading(null);
    }
  };
  
  const handleAdvancePhase = async () => {
    setLoading('advance');
    try {
      const { error } = await supabase.rpc('advance_combat_phase', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId
      });
      
      if (error) throw error;
      toast.success('Fase avançada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao avançar fase');
    } finally {
      setLoading(null);
    }
  };
  
  return (
    <div className="w-full max-w-5xl space-y-3">
      {/* Combat Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="py-3">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={onLeaveRoom} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
            
            <div className="text-center">
              <div className="flex items-center gap-3 justify-center">
                <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                  Rodada {combatRound}
                </Badge>
                <Badge className="text-lg px-3 py-1">
                  {PHASE_LABELS[combatPhase] || combatPhase}
                </Badge>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAdvancePhase}
              disabled={loading === 'advance'}
            >
              {loading === 'advance' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <SkipForward className="w-4 h-4 mr-1" />
                  Avançar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* HP Bars */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-primary/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="font-bold">Você</span>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold">{myHp}</span>
                <span className="text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="mt-2 h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                style={{ width: `${myHp}%` }}
              />
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Crown className="w-4 h-4" />
              <span>CMD Livre do General: <strong>{myCmdState.general?.cmd_free ?? 0}</strong></span>
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
                <span className="text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="mt-2 h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
                style={{ width: `${opponentHp}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Basic Cards */}
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Cartas Básicas (1x cada, sem custo)
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex gap-2 flex-wrap">
            {BASIC_CARDS.map(({ key, label, icon: Icon, color }) => {
              const isUsed = myBasicState[key as keyof BasicCardState];
              const isLoading = loading === `basic-${key}`;
              
              return (
                <Button
                  key={key}
                  variant={isUsed ? "ghost" : "outline"}
                  size="sm"
                  disabled={isUsed || isLoading}
                  onClick={() => handleUseBasicCard(key)}
                  className={isUsed ? 'opacity-50 line-through' : ''}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Icon className={`w-4 h-4 mr-1 ${color}`} />
                  )}
                  {label}
                  {isUsed && ' ✓'}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Hand */}
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Play className="w-4 h-4" />
            Sua Mão ({myHand.length} cartas)
          </CardTitle>
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
                  const isLoading = loading === `play-${cardId}`;
                  
                  return (
                    <Button
                      key={cardId}
                      variant="outline"
                      className="h-auto py-2 px-3 flex-shrink-0 min-w-[120px]"
                      disabled={isLoading}
                      onClick={() => {
                        setSelectedCard(card);
                        setShowCardDialog(true);
                      }}
                    >
                      <div className="text-left">
                        <div className="font-medium text-xs truncate max-w-[100px]">
                          {card.name}
                        </div>
                        <div className="flex gap-1 mt-1 text-[10px] text-muted-foreground">
                          {card.attack_bonus ? <span className="text-red-500">+{card.attack_bonus}A</span> : null}
                          {card.defense_bonus ? <span className="text-blue-500">+{card.defense_bonus}D</span> : null}
                          {card.mobility_bonus ? <span className="text-yellow-500">+{card.mobility_bonus}M</span> : null}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      {/* Action Log */}
      <Card className="border-dashed">
        <CardHeader className="py-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="w-4 h-4" />
            Log de Ações (últimas 10)
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <ScrollArea className="h-32">
            <div className="space-y-1 text-xs font-mono">
              {actionLog.length === 0 ? (
                <p className="text-muted-foreground text-center py-2">Nenhuma ação registrada</p>
              ) : (
                actionLog.map((action) => (
                  <div 
                    key={action.id}
                    className="flex items-center gap-2 py-1 border-b border-dashed last:border-0"
                  >
                    <Badge variant="outline" className="text-[10px] px-1">
                      P{action.player_number}
                    </Badge>
                    <span className="text-muted-foreground">
                      {action.action_type}
                    </span>
                    {action.action_data?.card_name && (
                      <span className="text-primary">{action.action_data.card_name}</span>
                    )}
                    {action.action_data?.basic_card && (
                      <span className="text-primary">{action.action_data.basic_card}</span>
                    )}
                    <span className="ml-auto text-muted-foreground">
                      v{action.state_version}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Card Play Dialog */}
      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCard?.name}</DialogTitle>
            <DialogDescription>
              Tipo: {selectedCard?.unit_type || 'Geral'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCard && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                {selectedCard.attack_bonus ? (
                  <Badge variant="outline" className="text-red-500">
                    +{selectedCard.attack_bonus} Ataque
                  </Badge>
                ) : null}
                {selectedCard.defense_bonus ? (
                  <Badge variant="outline" className="text-blue-500">
                    +{selectedCard.defense_bonus} Defesa
                  </Badge>
                ) : null}
                {selectedCard.mobility_bonus ? (
                  <Badge variant="outline" className="text-yellow-500">
                    +{selectedCard.mobility_bonus} Mobilidade
                  </Badge>
                ) : null}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => handlePlayCard(selectedCard)}
                  disabled={loading === `play-${selectedCard.card_id || selectedCard.id}`}
                >
                  {loading === `play-${selectedCard.card_id || selectedCard.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Jogar Carta
                </Button>
                <Button variant="outline" onClick={() => setShowCardDialog(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
