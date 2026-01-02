import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export function DebugPanel({ room, players, matchState, lastAction }: DebugPanelProps) {
  return (
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
      </CardContent>
    </Card>
  );
}
