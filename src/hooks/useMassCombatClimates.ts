import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MassCombatSeason, MassCombatClimate } from '@/types/MassCombatClimate';

// Seasons
export function useMassCombatSeasons() {
  return useQuery({
    queryKey: ['mass-combat-seasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mass_combat_seasons')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as MassCombatSeason[];
    },
  });
}

export function useCreateMassCombatSeason() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (season: Omit<MassCombatSeason, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('mass_combat_seasons')
        .insert(season)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-seasons'] });
    },
  });
}

export function useUpdateMassCombatSeason() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MassCombatSeason> & { id: string }) => {
      const { data, error } = await supabase
        .from('mass_combat_seasons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-seasons'] });
    },
  });
}

export function useDeleteMassCombatSeason() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mass_combat_seasons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-seasons'] });
    },
  });
}

// Climates
export function useMassCombatClimates() {
  return useQuery({
    queryKey: ['mass-combat-climates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mass_combat_climates')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as MassCombatClimate[];
    },
  });
}

export function useCreateMassCombatClimate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (climate: Omit<MassCombatClimate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('mass_combat_climates')
        .insert(climate)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-climates'] });
    },
  });
}

export function useUpdateMassCombatClimate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MassCombatClimate> & { id: string }) => {
      const { data, error } = await supabase
        .from('mass_combat_climates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-climates'] });
    },
  });
}

export function useDeleteMassCombatClimate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mass_combat_climates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-climates'] });
    },
  });
}
