import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  Check, 
  Crown, 
  User, 
  Loader2, 
  CheckCircle2, 
  Circle,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import type { Room, RoomPlayer, PlayerContext } from '@/types/multiplayer';

interface RoomLobbyProps {
  room: Room;
  players: RoomPlayer[];
  playerContext: PlayerContext;
  isReady: boolean;
  onSetReady: (ready: boolean) => Promise<boolean>;
  onLeaveRoom: () => Promise<void>;
}

export function RoomLobby({ 
  room, 
  players, 
  playerContext, 
  isReady,
  onSetReady, 
  onLeaveRoom 
}: RoomLobbyProps) {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const shareUrl = `${window.location.origin}/game/${room.code}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const handleReadyToggle = async () => {
    setIsUpdating(true);
    try {
      await onSetReady(!isReady);
    } finally {
      setIsUpdating(false);
    }
  };

  const player1 = players.find(p => p.player_number === 1);
  const player2 = players.find(p => p.player_number === 2);

  const PlayerSlot = ({ player, number }: { player?: RoomPlayer; number: 1 | 2 }) => {
    const isCurrentPlayer = player?.id === playerContext.playerId;
    const isHost = player?.is_host;
    const isPlayerReady = player?.status === 'ready';

    if (!player) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground">Aguardando jogador {number}...</p>
          </div>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${
        isCurrentPlayer ? 'border-primary bg-primary/5' : 'border-border'
      }`}>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
          isPlayerReady ? 'bg-green-500/20' : 'bg-muted'
        }`}>
          {isHost ? (
            <Crown className={`h-5 w-5 ${isPlayerReady ? 'text-green-500' : 'text-yellow-500'}`} />
          ) : (
            <User className={`h-5 w-5 ${isPlayerReady ? 'text-green-500' : 'text-muted-foreground'}`} />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{player.nickname}</span>
            {isCurrentPlayer && (
              <Badge variant="outline" className="text-xs">Você</Badge>
            )}
            {isHost && (
              <Badge variant="secondary" className="text-xs">Host</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Jogador {number}
          </p>
        </div>
        
        {isPlayerReady ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle>Sala de Jogo</CardTitle>
        <CardDescription>
          Aguardando jogadores ficarem prontos
        </CardDescription>
        
        {/* Código da sala */}
        <div className="mt-4 p-4 rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground mb-2">Código da Sala</p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-3xl font-bold tracking-widest">
              {room.code}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyCode}
              className="h-8 w-8"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Compartilhe este link com seu oponente
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Lista de jogadores */}
        <div className="space-y-3">
          <PlayerSlot player={player1} number={1} />
          <PlayerSlot player={player2} number={2} />
        </div>
        
        <Separator />
        
        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onLeaveRoom}
            className="flex-1"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
          
          <Button
            onClick={handleReadyToggle}
            disabled={isUpdating || players.length < 2}
            className={`flex-1 ${isReady ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isReady ? (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            ) : null}
            {isReady ? 'Pronto!' : 'Ficar Pronto'}
          </Button>
        </div>
        
        {players.length < 2 && (
          <p className="text-center text-sm text-muted-foreground">
            Aguardando oponente entrar na sala...
          </p>
        )}
        
        {players.length === 2 && !players.every(p => p.status === 'ready') && (
          <p className="text-center text-sm text-muted-foreground">
            Ambos jogadores devem ficar prontos para iniciar
          </p>
        )}
      </CardContent>
    </Card>
  );
}
