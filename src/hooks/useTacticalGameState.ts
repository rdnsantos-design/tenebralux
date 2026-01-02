import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TacticalGameState, GameAction } from '@/types/tactical-game';
import { Json } from '@/integrations/supabase/types';

export function useTacticalGameState() {
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState<TacticalGameState | null>(null);

  const loadGameState = async (matchId: string): Promise<TacticalGameState | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tactical_game_states')
        .select('*')
        .eq('match_id', matchId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      const state = data.state as unknown as TacticalGameState;
      setGameState(state);
      return state;
    } catch (error) {
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveGameState = async (matchId: string, state: TacticalGameState): Promise<boolean> => {
    try {
      // Buscar versão atual
      const { data: current } = await supabase
        .from('tactical_game_states')
        .select('version')
        .eq('match_id', matchId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      const newVersion = (current?.version || 0) + 1;

      const { error } = await supabase
        .from('tactical_game_states')
        .upsert({
          match_id: matchId,
          state: state as unknown as Json,
          version: newVersion,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setGameState(state);
      return true;
    } catch (error) {
      console.error('Error saving game state:', error);
      return false;
    }
  };

  const initializeGameState = async (matchId: string, initialState: TacticalGameState): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tactical_game_states')
        .insert({
          match_id: matchId,
          state: initialState as unknown as Json,
          version: 1,
        });

      if (error) throw error;
      setGameState(initialState);
      return true;
    } catch (error) {
      console.error('Error initializing game state:', error);
      return false;
    }
  };

  const subscribeToGameState = (matchId: string, callback: (state: TacticalGameState) => void) => {
    const channel = supabase
      .channel(`tactical_game_${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tactical_game_states', filter: `match_id=eq.${matchId}` },
        (payload) => {
          if (payload.new) {
            const state = (payload.new as any).state as TacticalGameState;
            setGameState(state);
            callback(state);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const logAction = async (matchId: string, playerId: string, action: GameAction): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tactical_game_actions')
        .insert({
          match_id: matchId,
          player_id: playerId,
          action_type: action.type,
          action_data: action as unknown as Json,
        });

      return !error;
    } catch (error) {
      return false;
    }
  };

  return {
    loading,
    gameState,
    loadGameState,
    saveGameState,
    initializeGameState,
    subscribeToGameState,
    logAction,
  };
}
