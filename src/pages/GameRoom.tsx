import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameRoom } from '@/hooks/useGameRoom';
import { CreateRoomForm } from '@/components/multiplayer/CreateRoomForm';
import { JoinRoomForm } from '@/components/multiplayer/JoinRoomForm';
import { RoomLobby } from '@/components/multiplayer/RoomLobby';
import { DebugPanel } from '@/components/multiplayer/DebugPanel';
import { GameStepper } from '@/components/multiplayer/GameStepper';
import { CultureSelection } from '@/components/multiplayer/CultureSelection';
import { ScenarioSelection } from '@/components/multiplayer/ScenarioSelection';
import { DeckbuildingPanel } from '@/components/multiplayer/DeckbuildingPanel';
import { DeploymentScreen } from '@/components/multiplayer/DeploymentScreen';
import { CombatScreen } from '@/components/multiplayer/CombatScreen';
import { TestChecklist } from '@/components/multiplayer/TestChecklist';
import { SinglePlayerGame } from '@/components/singleplayer/SinglePlayerGame';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Swords, Bot, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePhaseGuard } from '@/hooks/usePhaseGuard';

export default function GameRoom() {
  const { roomCode } = useParams<{ roomCode?: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'menu' | 'singleplayer' | 'multiplayer'>(roomCode ? 'multiplayer' : 'menu');
  const [lastAction, setLastAction] = useState<{
    action_type: string;
    player_number: number;
    state_version: number;
    created_at: string;
  } | null>(null);
  
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

  // Buscar última ação
  useEffect(() => {
    if (!room?.id) return;

    const fetchLastAction = async () => {
      const { data } = await supabase
        .from('match_actions')
        .select('action_type, player_number, state_version, created_at')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) setLastAction(data);
    };

    fetchLastAction();

    // Subscribe to new actions
    const channel = supabase
      .channel(`actions-${room.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_actions', filter: `room_id=eq.${room.id}` },
        (payload) => {
          if (payload.new) {
            setLastAction(payload.new as typeof lastAction);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room?.id]);

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

  // Hook de auto-correção de fase - deve estar antes de qualquer return condicional
  usePhaseGuard(room, matchState, playerContext?.sessionId || '');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Em sala ativa
  if (room && playerContext && matchState) {
    const currentPhase = room.current_phase;

    return (
      <div className="min-h-screen flex flex-col items-center bg-background p-4">
        <div className="mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Swords className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Mass Combat</h1>
          </div>
        </div>

        <GameStepper currentPhase={currentPhase} />

        <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
          {/* Conteúdo por fase */}
          {currentPhase === 'lobby' && (
            <RoomLobby
              room={room}
              players={players}
              playerContext={playerContext}
              isReady={isReady}
              onSetReady={setReady}
              onLeaveRoom={handleLeaveRoom}
            />
          )}

          {currentPhase === 'culture_selection' && (
            <CultureSelection
              room={room}
              players={players}
              matchState={matchState}
              playerContext={playerContext}
              onLeaveRoom={handleLeaveRoom}
            />
          )}

          {currentPhase === 'scenario_selection' && (
            <ScenarioSelection
              room={room}
              players={players}
              matchState={matchState}
              playerContext={playerContext}
              onLeaveRoom={handleLeaveRoom}
            />
          )}

          {currentPhase === 'deckbuilding' && (
            <DeckbuildingPanel
              room={room}
              players={players}
              matchState={matchState}
              playerContext={playerContext}
              onLeaveRoom={handleLeaveRoom}
            />
          )}

          {currentPhase === 'deployment' && (
            <DeploymentScreen
              room={room}
              players={players}
              matchState={matchState}
              playerContext={playerContext}
              onLeaveRoom={handleLeaveRoom}
            />
          )}

          {(currentPhase === 'combat' || currentPhase === 'combat_setup' || currentPhase === 'resolution') && (
            <CombatScreen
              room={room}
              players={players}
              matchState={matchState}
              playerContext={playerContext}
              onLeaveRoom={handleLeaveRoom}
            />
          )}

          {/* Test Checklist - DEV only */}
          <TestChecklist 
            room={room} 
            matchState={matchState} 
            playerContext={playerContext} 
          />

          {/* Debug Panel */}
          {playerContext && (
            <DebugPanel 
              room={room} 
              players={players} 
              matchState={matchState}
              sessionId={playerContext.sessionId}
              lastAction={lastAction}
            />
          )}
        </div>
      </div>
    );
  }

  // Single Player Mode
  if (mode === 'singleplayer') {
    return <SinglePlayerGame onBack={() => setMode('menu')} />;
  }

  // Multiplayer Mode - Tela inicial
  if (mode === 'multiplayer' && !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Button variant="ghost" className="absolute top-4 left-4" onClick={() => setMode('menu')}>
          ← Voltar
        </Button>
        
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
        
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // Menu inicial - escolher modo
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Swords className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Mass Combat</h1>
        </div>
        <p className="text-muted-foreground">Card Game</p>
      </div>
      
      <div className="grid gap-4 w-full max-w-md">
        <Button 
          size="lg" 
          className="h-20 text-lg"
          onClick={() => setMode('singleplayer')}
        >
          <Bot className="w-6 h-6 mr-3" />
          Single Player (vs Bot)
        </Button>
        
        <Button 
          size="lg" 
          variant="outline"
          className="h-20 text-lg"
          onClick={() => setMode('multiplayer')}
        >
          <Users className="w-6 h-6 mr-3" />
          Multiplayer
        </Button>
      </div>
    </div>
  );
}
