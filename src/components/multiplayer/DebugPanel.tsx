import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Download, Copy, FileJson } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Room, RoomPlayer, MatchState } from '@/types/multiplayer';

interface DebugPanelProps {
  room: Room;
  players: RoomPlayer[];
  matchState: MatchState | null;
  lastAction?: {
    action_type: string;
    player_number: number;
    state_version: number;
    created_at: string;
  } | null;
}

// Helper to get session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('multiplayer_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('multiplayer_session_id', sessionId);
  }
  return sessionId;
}

export function DebugPanel({ room, players, matchState, lastAction }: DebugPanelProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportData, setExportData] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const sessionId = getSessionId();
      const { data, error } = await supabase.rpc('get_match_state', {
        p_room_id: room.id,
        p_session_id: sessionId
      });

      if (error) throw error;

      const jsonString = JSON.stringify(data, null, 2);
      setExportData(jsonString);
      setIsExportModalOpen(true);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Erro ao exportar match_state');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      toast.success('JSON copiado para clipboard!');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match_state_${room.code}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Download iniciado!');
  };

  return (
    <>
      <Card className="w-full max-w-lg border-dashed border-yellow-500/50 bg-yellow-500/5">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            🔧 Debug Panel
            <Badge variant="outline" className="text-xs">DEV</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 text-xs font-mono space-y-2">
          {/* Room Info */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">room_id:</span>
            <span className="truncate max-w-[180px]">{room.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">phase:</span>
            <Badge variant="secondary" className="text-xs">{room.current_phase}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">status:</span>
            <span>{room.status}</span>
          </div>

          {/* Match State */}
          <div className="border-t border-dashed pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">match_state.version:</span>
              <Badge className="text-xs">{matchState?.version ?? 'N/A'}</Badge>
            </div>
            {matchState && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">logistics_round:</span>
                  <span>{(matchState as unknown as { logistics_round?: number }).logistics_round ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">p1_culture:</span>
                  <span>{matchState.player1_culture ?? '-'} {matchState.player1_culture_confirmed ? '✓' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">p2_culture:</span>
                  <span>{matchState.player2_culture ?? '-'} {matchState.player2_culture_confirmed ? '✓' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">p1_vet_remaining:</span>
                  <span>{(matchState as unknown as { player1_vet_remaining?: number }).player1_vet_remaining ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">p2_vet_remaining:</span>
                  <span>{(matchState as unknown as { player2_vet_remaining?: number }).player2_vet_remaining ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">p1_deck_confirmed:</span>
                  <span>{(matchState as unknown as { player1_deck_confirmed?: boolean }).player1_deck_confirmed ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">p2_deck_confirmed:</span>
                  <span>{(matchState as unknown as { player2_deck_confirmed?: boolean }).player2_deck_confirmed ? '✓' : '✗'}</span>
                </div>
              </>
            )}
          </div>

          {/* Players */}
          <div className="border-t border-dashed pt-2 mt-2">
            <p className="text-muted-foreground mb-1">Players:</p>
            {players.map(p => (
              <div key={p.id} className="flex justify-between">
                <span>P{p.player_number}: {p.nickname}</span>
                <Badge variant={p.status === 'ready' ? 'default' : 'outline'} className="text-xs">
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>

          {/* Last Action */}
          {lastAction && (
            <div className="border-t border-dashed pt-2 mt-2">
              <p className="text-muted-foreground mb-1">Last Action:</p>
              <div className="flex justify-between">
                <span>{lastAction.action_type}</span>
                <span>P{lastAction.player_number} v{lastAction.state_version}</span>
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="border-t border-dashed pt-3 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
              onClick={handleExport}
              disabled={isExporting}
            >
              <FileJson className="w-3 h-3 mr-2" />
              {isExporting ? 'Exportando...' : 'Export match_state JSON'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5" />
              match_state_{room.code}.json
            </DialogTitle>
            <DialogDescription>
              Estado completo da partida exportado do servidor
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="flex-1 overflow-auto border rounded-md bg-muted/50 p-4">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all">
              {exportData}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
