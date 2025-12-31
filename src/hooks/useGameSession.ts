import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface GameSession {
  id: string;
  room_code: string;
  status: 'waiting' | 'setup' | 'playing' | 'finished';
  player1_nickname: string | null;
  player2_nickname: string | null;
  player1_army_id: string | null;
  player2_army_id: string | null;
  current_phase: 'setup' | 'attack' | 'defense' | 'initiative' | 'resolution';
  current_round: number;
  player1_ready: boolean;
  player2_ready: boolean;
  game_state: any;
  created_at: string;
  updated_at: string;
}

export interface PlayedCard {
  id: string;
  session_id: string;
  player_number: 1 | 2;
  round: number;
  phase: 'attack' | 'defense' | 'initiative';
  card_id: string;
  created_at: string;
}

export interface RoundResult {
  id: string;
  session_id: string;
  round: number;
  player1_result: any;
  player2_result: any;
  notes: string | null;
  created_at: string;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useGameSession() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [playedCards, setPlayedCards] = useState<PlayedCard[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [playerNumber, setPlayerNumber] = useState<1 | 2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new game session
  const createSession = async (nickname: string): Promise<string | null> => {
    try {
      setLoading(true);
      const roomCode = generateRoomCode();

      const { data, error: createError } = await supabase
        .from('game_sessions')
        .insert({
          room_code: roomCode,
          player1_nickname: nickname,
          status: 'waiting',
        })
        .select()
        .single();

      if (createError) throw createError;

      setSession(data as GameSession);
      setPlayerNumber(1);
      toast.success(`Sala criada! Código: ${roomCode}`);
      return roomCode;
    } catch (err: any) {
      console.error('Error creating session:', err);
      toast.error('Erro ao criar sala: ' + err.message);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Join an existing session
  const joinSession = async (roomCode: string, nickname: string): Promise<boolean> => {
    try {
      setLoading(true);

      // Find the session
      const { data: existingSession, error: findError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single();

      if (findError || !existingSession) {
        toast.error('Sala não encontrada!');
        return false;
      }

      if (existingSession.player2_nickname) {
        toast.error('Sala já está cheia!');
        return false;
      }

      // Join the session
      const { data, error: updateError } = await supabase
        .from('game_sessions')
        .update({
          player2_nickname: nickname,
          status: 'setup',
        })
        .eq('id', existingSession.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setSession(data as GameSession);
      setPlayerNumber(2);
      toast.success('Entrou na sala!');
      return true;
    } catch (err: any) {
      console.error('Error joining session:', err);
      toast.error('Erro ao entrar na sala: ' + err.message);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update session data
  const updateSession = async (updates: Partial<GameSession>) => {
    if (!session) return;

    try {
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update(updates)
        .eq('id', session.id);

      if (updateError) throw updateError;
    } catch (err: any) {
      console.error('Error updating session:', err);
      toast.error('Erro ao atualizar sessão');
    }
  };

  // Select army for current player
  const selectArmy = async (armyId: string) => {
    if (!session || !playerNumber) return;

    const field = playerNumber === 1 ? 'player1_army_id' : 'player2_army_id';
    await updateSession({ [field]: armyId });
  };

  // Set player ready
  const setReady = async (ready: boolean) => {
    if (!session || !playerNumber) return;

    const field = playerNumber === 1 ? 'player1_ready' : 'player2_ready';
    await updateSession({ [field]: ready });
  };

  // Start the game (both players ready)
  const startGame = async () => {
    if (!session) return;

    await updateSession({
      status: 'playing',
      current_phase: 'attack',
      current_round: 1,
      player1_ready: false,
      player2_ready: false,
    });
  };

  // Play a card
  const playCard = async (cardId: string, phase: 'attack' | 'defense' | 'initiative') => {
    if (!session || !playerNumber) return;

    try {
      // Check if already played max cards this phase
      const cardsThisPhase = playedCards.filter(
        c => c.round === session.current_round && 
             c.phase === phase && 
             c.player_number === playerNumber
      );

      if (cardsThisPhase.length >= 5) {
        toast.error('Limite de 5 cartas por fase!');
        return;
      }

      const { error: insertError } = await supabase
        .from('game_played_cards')
        .insert({
          session_id: session.id,
          player_number: playerNumber,
          round: session.current_round,
          phase,
          card_id: cardId,
        });

      if (insertError) throw insertError;
      toast.success('Carta jogada!');
    } catch (err: any) {
      console.error('Error playing card:', err);
      toast.error('Erro ao jogar carta');
    }
  };

  // Remove a played card
  const removePlayedCard = async (cardId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('game_played_cards')
        .delete()
        .eq('id', cardId);

      if (deleteError) throw deleteError;
    } catch (err: any) {
      console.error('Error removing card:', err);
    }
  };

  // Advance to next phase
  const advancePhase = async () => {
    if (!session) return;

    const phases: GameSession['current_phase'][] = ['attack', 'defense', 'initiative', 'resolution'];
    const currentIndex = phases.indexOf(session.current_phase);

    if (currentIndex < phases.length - 1) {
      await updateSession({
        current_phase: phases[currentIndex + 1],
        player1_ready: false,
        player2_ready: false,
      });
    }
  };

  // Submit round results
  const submitRoundResults = async (results: { player1_result: any; player2_result: any; notes?: string }) => {
    if (!session) return;

    try {
      const { error: insertError } = await supabase
        .from('game_round_results')
        .insert({
          session_id: session.id,
          round: session.current_round,
          ...results,
        });

      if (insertError) throw insertError;

      // Start next round or finish game
      await updateSession({
        current_round: session.current_round + 1,
        current_phase: 'attack',
        player1_ready: false,
        player2_ready: false,
      });

      toast.success('Resultados registrados!');
    } catch (err: any) {
      console.error('Error submitting results:', err);
      toast.error('Erro ao registrar resultados');
    }
  };

  // End the game
  const endGame = async () => {
    if (!session) return;
    await updateSession({ status: 'finished' });
  };

  // Leave the session
  const leaveSession = async () => {
    if (!session || !playerNumber) return;

    try {
      if (playerNumber === 1 && !session.player2_nickname) {
        // Delete session if host leaves and no one joined
        await supabase.from('game_sessions').delete().eq('id', session.id);
      } else {
        // Just mark as finished
        await updateSession({ status: 'finished' });
      }

      setSession(null);
      setPlayerNumber(null);
      setPlayedCards([]);
      setRoundResults([]);
    } catch (err: any) {
      console.error('Error leaving session:', err);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!session) return;

    let sessionsChannel: RealtimeChannel;
    let cardsChannel: RealtimeChannel;
    let resultsChannel: RealtimeChannel;

    const setupSubscriptions = async () => {
      // Subscribe to session updates
      sessionsChannel = supabase
        .channel(`session-${session.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_sessions',
            filter: `id=eq.${session.id}`,
          },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              setSession(payload.new as GameSession);
            } else if (payload.eventType === 'DELETE') {
              setSession(null);
              toast.info('Sessão encerrada');
            }
          }
        )
        .subscribe();

      // Subscribe to played cards
      cardsChannel = supabase
        .channel(`cards-${session.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_played_cards',
            filter: `session_id=eq.${session.id}`,
          },
          async () => {
            // Refetch all played cards
            const { data } = await supabase
              .from('game_played_cards')
              .select('*')
              .eq('session_id', session.id);
            setPlayedCards((data || []) as PlayedCard[]);
          }
        )
        .subscribe();

      // Subscribe to round results
      resultsChannel = supabase
        .channel(`results-${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'game_round_results',
            filter: `session_id=eq.${session.id}`,
          },
          async () => {
            const { data } = await supabase
              .from('game_round_results')
              .select('*')
              .eq('session_id', session.id);
            setRoundResults((data || []) as RoundResult[]);
          }
        )
        .subscribe();

      // Initial fetch of played cards and results
      const { data: cardsData } = await supabase
        .from('game_played_cards')
        .select('*')
        .eq('session_id', session.id);
      setPlayedCards((cardsData || []) as PlayedCard[]);

      const { data: resultsData } = await supabase
        .from('game_round_results')
        .select('*')
        .eq('session_id', session.id);
      setRoundResults((resultsData || []) as RoundResult[]);
    };

    setupSubscriptions();

    return () => {
      if (sessionsChannel) supabase.removeChannel(sessionsChannel);
      if (cardsChannel) supabase.removeChannel(cardsChannel);
      if (resultsChannel) supabase.removeChannel(resultsChannel);
    };
  }, [session?.id]);

  return {
    session,
    playerNumber,
    playedCards,
    roundResults,
    loading,
    error,
    createSession,
    joinSession,
    updateSession,
    selectArmy,
    setReady,
    startGame,
    playCard,
    removePlayedCard,
    advancePhase,
    submitRoundResults,
    endGame,
    leaveSession,
  };
}
