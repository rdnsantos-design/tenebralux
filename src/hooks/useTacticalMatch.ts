import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TacticalMatch {
  id: string;
  join_code: string;
  player1_id: string;
  player1_name: string;
  player1_army_id: string | null;
  player1_ready: boolean;
  player2_id: string | null;
  player2_name: string | null;
  player2_army_id: string | null;
  player2_ready: boolean;
  primary_terrain_id: string | null;
  secondary_terrain_ids: string[];
  season_id: string | null;
  max_power_points: number;
  status: 'waiting' | 'ready' | 'playing' | 'finished' | 'abandoned';
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useTacticalMatch() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createMatch = async (playerName: string, playerId?: string): Promise<TacticalMatch | null> => {
    setLoading(true);
    try {
      const id = playerId || crypto.randomUUID();
      const { data, error } = await supabase
        .from('tactical_matches')
        .insert({
          player1_id: id,
          player1_name: playerName,
          join_code: '', // Trigger vai gerar
        })
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Partida criada!', description: `Código: ${data.join_code}` });
      return data as TacticalMatch;
    } catch (error: any) {
      toast({ title: 'Erro ao criar partida', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinMatch = async (joinCode: string, playerName: string, playerId?: string): Promise<TacticalMatch | null> => {
    setLoading(true);
    try {
      const id = playerId || crypto.randomUUID();
      const normalizedCode = joinCode.toUpperCase();

      // Prevent joining as player2 from the same browser identity as player1
      const { data: existing, error: existingError } = await supabase
        .from('tactical_matches')
        .select('id, player1_id, player2_id, status')
        .eq('join_code', normalizedCode)
        .maybeSingle();

      if (existingError) throw existingError;
      if (!existing || existing.status !== 'waiting') {
        toast({ title: 'Erro ao entrar', description: 'Código inválido ou partida não disponível', variant: 'destructive' });
        return null;
      }

      if (existing.player1_id === id) {
        toast({
          title: 'Você já é o Jogador 1',
          description: 'Para entrar como Jogador 2, use uma janela anônima/privada ou gere um novo ID de jogador.',
          variant: 'destructive',
        });
        return null;
      }

      const { data, error } = await supabase
        .from('tactical_matches')
        .update({
          player2_id: id,
          player2_name: playerName,
        })
        .eq('join_code', normalizedCode)
        .eq('status', 'waiting')
        .is('player2_id', null)
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Entrou na partida!', description: `Partida de ${data.player1_name}` });
      return data as TacticalMatch;
    } catch (error: any) {
      toast({ title: 'Erro ao entrar', description: 'Código inválido ou partida não disponível', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getMatch = async (matchId: string): Promise<TacticalMatch | null> => {
    const { data, error } = await supabase
      .from('tactical_matches')
      .select('*')
      .eq('id', matchId)
      .single();
    
    if (error) return null;
    return data as TacticalMatch;
  };

  const findMatchByCode = async (joinCode: string): Promise<TacticalMatch | null> => {
    const { data, error } = await supabase
      .from('tactical_matches')
      .select('*')
      .eq('join_code', joinCode.toUpperCase())
      .single();
    
    if (error) return null;
    return data as TacticalMatch;
  };

  const setArmy = async (matchId: string, playerId: string, armyId: string): Promise<boolean> => {
    const match = await getMatch(matchId);
    if (!match) return false;

    const isPlayer1 = match.player1_id === playerId;
    const updateField = isPlayer1 ? 'player1_army_id' : 'player2_army_id';

    const { error } = await supabase
      .from('tactical_matches')
      .update({ [updateField]: armyId })
      .eq('id', matchId);

    return !error;
  };

  const setReady = async (matchId: string, playerId: string, ready: boolean): Promise<boolean> => {
    const match = await getMatch(matchId);
    if (!match) return false;

    const isPlayer1 = match.player1_id === playerId;
    const updateField = isPlayer1 ? 'player1_ready' : 'player2_ready';

    const { error } = await supabase
      .from('tactical_matches')
      .update({ [updateField]: ready })
      .eq('id', matchId);

    return !error;
  };

  const startMatch = async (matchId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('tactical_matches')
      .update({ status: 'playing' })
      .eq('id', matchId);

    return !error;
  };

  const resetPlayer2 = async (matchId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('tactical_matches')
      .update({
        player2_id: null,
        player2_name: null,
        player2_army_id: null,
        player2_ready: false,
      })
      .eq('id', matchId);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return false;
    }

    toast({ title: 'Vaga do Jogador 2 liberada' });
    return true;
  };

  const subscribeToMatch = (matchId: string, callback: (match: TacticalMatch) => void) => {
    const channel = supabase
      .channel(`tactical_match_${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tactical_matches', filter: `id=eq.${matchId}` },
        (payload) => {
          if (payload.new) {
            callback(payload.new as TacticalMatch);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    loading,
    createMatch,
    joinMatch,
    getMatch,
    findMatchByCode,
    setArmy,
    setReady,
    startMatch,
    resetPlayer2,
    subscribeToMatch,
  };
}
