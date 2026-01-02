import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bug, Copy, Check, Filter, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { MatchState, Room } from '@/types/multiplayer';
import type { Json } from '@/integrations/supabase/types';

interface MatchAction {
  id: string;
  room_id: string;
  player_number: number;
  action_type: string;
  action_data: Json | null;
  phase: string;
  state_version: number;
  created_at: string;
}

interface CombatDebugPanelProps {
  room: Room;
  matchState: MatchState;
}

export function CombatDebugPanel({ room, matchState }: CombatDebugPanelProps) {
  const [actions, setActions] = useState<MatchAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<MatchAction | null>(null);
  const [filterType, setFilterType] = useState('');
  const [limit, setLimit] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch actions
  const fetchActions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('match_actions')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filterType.trim()) {
        query = query.ilike('action_type', `%${filterType}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setActions(data || []);
    } catch (err) {
      console.error('Error fetching actions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and subscribe to realtime
  useEffect(() => {
    fetchActions();

    const channel = supabase
      .channel(`match_actions_debug_${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_actions',
          filter: `room_id=eq.${room.id}`
        },
        (payload) => {
          setActions(prev => [payload.new as MatchAction, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, limit, filterType]);

  // Copy to clipboard
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Copiado!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Falha ao copiar');
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    });
    const ms = d.getMilliseconds().toString().padStart(3, '0');
    return `${time}.${ms}`;
  };

  // Prepare match state for display
  const currentStateData = {
    combat_phase: (matchState as any).combat_phase,
    combat_round: (matchState as any).combat_round,
    player1_hp: (matchState as any).player1_hp,
    player2_hp: (matchState as any).player2_hp,
    player1_hand: (matchState as any).player1_hand,
    player2_hand: (matchState as any).player2_hand,
    player1_discard: (matchState as any).player1_discard,
    player2_discard: (matchState as any).player2_discard,
    player1_deck_confirmed: (matchState as any).player1_deck_confirmed,
    player2_deck_confirmed: (matchState as any).player2_deck_confirmed,
    combat_board_state: (matchState as any).combat_board_state,
    version: (matchState as any).version
  };

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="debug" className="border rounded-lg bg-muted/20">
          <AccordionTrigger className="px-4 py-2 hover:no-underline">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-sm">Debug / Recent Actions</span>
              <Badge variant="secondary" className="ml-2">{actions.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {/* Filtros */}
              <div className="flex gap-2 items-center flex-wrap">
                <div className="flex items-center gap-1">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar action_type..."
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-8 w-40 text-xs"
                  />
                </div>
                <select 
                  value={limit} 
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="h-8 px-2 rounded border text-xs bg-background"
                >
                  <option value={30}>Últimos 30</option>
                  <option value={50}>Últimos 50</option>
                  <option value={100}>Últimos 100</option>
                </select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchActions}
                  disabled={loading}
                  className="h-8"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>

              {/* Estado Atual */}
              <Card className="bg-background">
                <CardHeader className="py-2 px-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-medium">Estado Atual (match_state)</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => copyToClipboard(JSON.stringify(currentStateData, null, 2), 'state')}
                    >
                      {copiedId === 'state' ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="py-2 px-3">
                  <ScrollArea className="h-32">
                    <pre className="text-[10px] font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(currentStateData, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Lista de Actions */}
              <Card className="bg-background">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs font-medium">Recent Actions</CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-0">
                  <ScrollArea className="h-64">
                    {actions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Nenhuma ação registrada
                      </p>
                    ) : (
                      <div className="divide-y">
                        {actions.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => setSelectedAction(action)}
                            className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge 
                                    variant={action.player_number === 1 ? 'default' : 'secondary'}
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    P{action.player_number}
                                  </Badge>
                                  <span className="font-mono text-xs font-medium text-primary">
                                    {action.action_type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                  <span>{action.phase}</span>
                                  <span>v{action.state_version}</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {formatDate(action.created_at)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Modal de detalhes */}
      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant={selectedAction?.player_number === 1 ? 'default' : 'secondary'}>
                P{selectedAction?.player_number}
              </Badge>
              <span className="font-mono">{selectedAction?.action_type}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedAction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Phase:</span>
                  <span className="ml-2 font-medium">{selectedAction.phase}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Version:</span>
                  <span className="ml-2 font-medium">{selectedAction.state_version}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Created at:</span>
                  <span className="ml-2 font-medium">{new Date(selectedAction.created_at).toLocaleString('pt-BR')}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">action_data</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(
                      JSON.stringify(selectedAction.action_data, null, 2), 
                      selectedAction.id
                    )}
                  >
                    {copiedId === selectedAction.id ? (
                      <><Check className="w-3 h-3 mr-1 text-green-500" /> Copiado</>
                    ) : (
                      <><Copy className="w-3 h-3 mr-1" /> Copy JSON</>
                    )}
                  </Button>
                </div>
                <ScrollArea className="h-64 rounded border bg-muted/30 p-3">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                    {selectedAction.action_data 
                      ? JSON.stringify(selectedAction.action_data, null, 2)
                      : 'null'}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
