import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MassCombatCulture } from '@/types/combat/mass-combat-culture';

// ========================
// MASS COMBAT CULTURES HOOKS
// ========================

export function useMassCombatCultures() {
  return useQuery({
    queryKey: ['mass-combat-cultures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mass_combat_cultures')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as MassCombatCulture[];
    },
  });
}

export function useCreateMassCombatCulture() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (culture: Omit<MassCombatCulture, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('mass_combat_cultures')
        .insert(culture)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-cultures'] });
    },
  });
}

export function useUpdateMassCombatCulture() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MassCombatCulture> & { id: string }) => {
      const { data, error } = await supabase
        .from('mass_combat_cultures')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-cultures'] });
    },
  });
}

export function useDeleteMassCombatCulture() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mass_combat_cultures')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-cultures'] });
    },
  });
}
