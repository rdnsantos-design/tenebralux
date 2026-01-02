import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  Room, 
  RoomPlayer, 
  MatchState, 
  PlayerContext,
  CreateRoomResult,
  JoinRoomResult,
  RoomStatus,
  PlayerStatus,
  GamePhase
} from '@/types/multiplayer';

// Gerar ID de sessão único para este browser (persistido em localStorage para sobreviver reloads)
const getSessionId = () => {
  let sessionId = localStorage.getItem('game_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('game_session_id', sessionId);
  }
  return sessionId;
};

interface UseGameRoomOptions {
  roomCode?: string;
  autoConnect?: boolean;
}

interface UseGameRoomReturn {
  // Estado
  room: Room | null;
  players: RoomPlayer[];
  matchState: MatchState | null;
  playerContext: PlayerContext | null;
  
  // Loading/Error
  loading: boolean;
  error: string | null;
  
  // Ações
  createRoom: (nickname: string) => Promise<CreateRoomResult | null>;
  joinRoom: (roomCode: string, nickname: string) => Promise<JoinRoomResult | null>;
  setReady: (ready: boolean) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  
  // Utils
  isHost: boolean;
  isReady: boolean;
  allPlayersReady: boolean;
  opponentPlayer: RoomPlayer | null;
}

export function useGameRoom(options: UseGameRoomOptions = {}): UseGameRoomReturn {
  const { roomCode, autoConnect = true } = options;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [playerContext, setPlayerContext] = useState<PlayerContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const sessionId = getSessionId();

  // Buscar dados da sala
  const fetchRoomData = useCallback(async (roomId: string) => {
    try {
      // Buscar sala
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      
      if (roomError) throw roomError;
      
      // Cast para nosso tipo
      const typedRoom: Room = {
        ...roomData,
        status: roomData.status as RoomStatus,
        current_phase: roomData.current_phase as GamePhase
      };
      setRoom(typedRoom);
      
      // Buscar jogadores
      const { data: playersData, error: playersError } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomId);
      
      if (playersError) throw playersError;
      
      const typedPlayers: RoomPlayer[] = (playersData || []).map(p => ({
        ...p,
        player_number: p.player_number as 1 | 2,
        status: p.status as PlayerStatus
      }));
      setPlayers(typedPlayers);
      
      // Buscar estado da partida
      const { data: stateData, error: stateError } = await supabase
        .from('match_state')
        .select('*')
        .eq('room_id', roomId)
        .single();
      
      if (stateError && stateError.code !== 'PGRST116') throw stateError;
      
      if (stateData) {
        setMatchState(stateData as unknown as MatchState);
      }
      
      // Identificar jogador atual
      const currentPlayer = typedPlayers.find(p => p.session_id === sessionId);
      if (currentPlayer) {
        setPlayerContext({
          playerId: currentPlayer.id,
          playerNumber: currentPlayer.player_number,
          nickname: currentPlayer.nickname,
          isHost: currentPlayer.is_host,
          sessionId
        });
      }
      
    } catch (err) {
      console.error('Erro ao buscar dados da sala:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar sala');
    }
  }, [sessionId]);

  // Configurar canal realtime
  const setupRealtimeChannel = useCallback((roomId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          console.log('Room update:', payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newRoom = payload.new as Record<string, unknown>;
            setRoom(prev => prev ? {
              ...prev,
              ...newRoom,
              status: newRoom.status as RoomStatus,
              current_phase: newRoom.current_phase as GamePhase
            } : null);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log('Players update:', payload);
          if (payload.eventType === 'INSERT' && payload.new) {
            const newPlayer = payload.new as Record<string, unknown>;
            setPlayers(prev => {
              const exists = prev.some(p => p.id === newPlayer.id);
              if (exists) return prev;
              return [...prev, {
                ...newPlayer,
                player_number: newPlayer.player_number as 1 | 2,
                status: newPlayer.status as PlayerStatus
              } as RoomPlayer];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedPlayer = payload.new as Record<string, unknown>;
            setPlayers(prev => prev.map(p => 
              p.id === updatedPlayer.id 
                ? { ...p, ...updatedPlayer, player_number: updatedPlayer.player_number as 1 | 2, status: updatedPlayer.status as PlayerStatus }
                : p
            ));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const oldPlayer = payload.old as Record<string, unknown>;
            setPlayers(prev => prev.filter(p => p.id !== oldPlayer.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_state', filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log('Match state update:', payload);
          if (payload.new) {
            setMatchState(payload.new as unknown as MatchState);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime channel status:', status);
      });
    
    channelRef.current = channel;
  }, []);

  // Criar sala
  const createRoom = useCallback(async (nickname: string): Promise<CreateRoomResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase
        .rpc('create_room', { 
          p_host_nickname: nickname, 
          p_session_id: sessionId 
        });
      
      if (rpcError) throw rpcError;
      
      if (!data || data.length === 0) {
        throw new Error('Erro ao criar sala');
      }
      
      const result = data[0] as CreateRoomResult;
      
      // Configurar contexto
      setPlayerContext({
        playerId: result.player_id,
        playerNumber: 1,
        nickname,
        isHost: true,
        sessionId
      });
      
      // Buscar dados completos
      await fetchRoomData(result.room_id);
      
      // Configurar realtime
      setupRealtimeChannel(result.room_id);
      
      toast.success(`Sala criada: ${result.room_code}`);
      return result;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar sala';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId, fetchRoomData, setupRealtimeChannel]);

  // Entrar na sala
  const joinRoom = useCallback(async (code: string, nickname: string): Promise<JoinRoomResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase
        .rpc('join_room', { 
          p_room_code: code.toUpperCase(), 
          p_nickname: nickname,
          p_session_id: sessionId 
        });
      
      if (rpcError) throw rpcError;
      
      if (!data || data.length === 0) {
        throw new Error('Erro ao entrar na sala');
      }
      
      const result = data[0] as JoinRoomResult;
      
      // Configurar contexto
      setPlayerContext({
        playerId: result.player_id,
        playerNumber: result.player_number as 1 | 2,
        nickname,
        isHost: false,
        sessionId
      });
      
      // Buscar dados completos
      await fetchRoomData(result.room_id);
      
      // Configurar realtime
      setupRealtimeChannel(result.room_id);
      
      toast.success('Entrou na sala!');
      return result;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar na sala';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId, fetchRoomData, setupRealtimeChannel]);

  // Marcar como pronto
  const setReady = useCallback(async (ready: boolean): Promise<boolean> => {
    if (!playerContext) return false;
    
    try {
      const { data, error: rpcError } = await supabase
        .rpc('set_player_ready', { 
          p_player_id: playerContext.playerId, 
          p_ready: ready 
        });
      
      if (rpcError) throw rpcError;
      
      toast.success(ready ? 'Pronto!' : 'Aguardando...');
      return true;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
      toast.error(message);
      return false;
    }
  }, [playerContext]);

  // Sair da sala
  const leaveRoom = useCallback(async () => {
    if (!playerContext) return;
    
    try {
      await supabase
        .from('room_players')
        .delete()
        .eq('id', playerContext.playerId);
      
      // Limpar estado
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      setRoom(null);
      setPlayers([]);
      setMatchState(null);
      setPlayerContext(null);
      
      toast.info('Saiu da sala');
      
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  }, [playerContext]);

  // Auto-conectar se tiver roomCode
  useEffect(() => {
    if (roomCode && autoConnect) {
      // Buscar sala pelo código
      const loadRoom = async () => {
        setLoading(true);
        try {
          const { data: roomData, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('code', roomCode.toUpperCase())
            .single();
          
          if (roomError) throw roomError;
          
          // Verificar se já é jogador
          const { data: playerData } = await supabase
            .from('room_players')
            .select('*')
            .eq('room_id', roomData.id)
            .eq('session_id', sessionId)
            .single();
          
          if (playerData) {
            // Já é jogador, reconectar
            setPlayerContext({
              playerId: playerData.id,
              playerNumber: playerData.player_number as 1 | 2,
              nickname: playerData.nickname,
              isHost: playerData.is_host,
              sessionId
            });
            
            await fetchRoomData(roomData.id);
            setupRealtimeChannel(roomData.id);
          }
          
        } catch (err) {
          console.error('Erro ao carregar sala:', err);
        } finally {
          setLoading(false);
        }
      };
      
      loadRoom();
    }
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomCode, autoConnect, sessionId, fetchRoomData, setupRealtimeChannel]);

  // Computed values
  const isHost = playerContext?.isHost ?? false;
  
  const currentPlayer = players.find(p => p.id === playerContext?.playerId);
  const isReady = currentPlayer?.status === 'ready';
  
  const allPlayersReady = players.length === 2 && players.every(p => p.status === 'ready');
  
  const opponentPlayer = players.find(p => p.id !== playerContext?.playerId) ?? null;

  return {
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
    isHost,
    isReady,
    allPlayersReady,
    opponentPlayer
  };
}
