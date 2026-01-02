import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameRoom } from '@/hooks/useGameRoom';
import { CreateRoomForm } from '@/components/multiplayer/CreateRoomForm';
import { JoinRoomForm } from '@/components/multiplayer/JoinRoomForm';
import { RoomLobby } from '@/components/multiplayer/RoomLobby';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Swords } from 'lucide-react';

export default function GameRoom() {
  const { roomCode } = useParams<{ roomCode?: string }>();
  const navigate = useNavigate();
  
  const {
    room,
    players,
    matchState,
    playerContext,
    loading,
    error,
    createRoom,
    joinRoom,
    setReady,
    leaveRoom,
    isReady
  } = useGameRoom({ roomCode });

  // Quando o jogo iniciar, redirecionar para próxima fase
  useEffect(() => {
    if (room?.current_phase === 'culture_selection') {
      // TODO: Fase 1 - redirecionar para seleção de cultura
      console.log('Jogo iniciado! Fase:', room.current_phase);
    }
  }, [room?.current_phase]);

  const handleCreateRoom = async (nickname: string) => {
    const result = await createRoom(nickname);
    if (result) {
      navigate(`/game/${result.room_code}`, { replace: true });
    }
  };

  const handleJoinRoom = async (code: string, nickname: string) => {
    const result = await joinRoom(code, nickname);
    if (result) {
      navigate(`/game/${code}`, { replace: true });
    }
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    navigate('/game', { replace: true });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se está em uma sala ativa
  if (room && playerContext) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Swords className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Mass Combat</h1>
          </div>
          <p className="text-muted-foreground">Card Game Multiplayer</p>
        </div>
        
        <RoomLobby
          room={room}
          players={players}
          playerContext={playerContext}
          isReady={isReady}
          onSetReady={setReady}
          onLeaveRoom={handleLeaveRoom}
        />
      </div>
    );
  }

  // Tela inicial - Criar ou Entrar
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Swords className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Mass Combat</h1>
        </div>
        <p className="text-muted-foreground">Card Game Multiplayer</p>
      </div>
      
      <Tabs defaultValue={roomCode ? 'join' : 'create'} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Criar Sala</TabsTrigger>
          <TabsTrigger value="join">Entrar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="mt-4">
          <CreateRoomForm onCreateRoom={handleCreateRoom} loading={loading} />
        </TabsContent>
        
        <TabsContent value="join" className="mt-4">
          <JoinRoomForm 
            onJoinRoom={handleJoinRoom} 
            initialRoomCode={roomCode || ''} 
            loading={loading} 
          />
        </TabsContent>
      </Tabs>
      
      {error && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
