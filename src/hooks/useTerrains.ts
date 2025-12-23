import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TerrainType } from '@/types/Terrain';

export function useTerrains() {
  return useQuery({
    queryKey: ['terrains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('terrain_types')
        .select('*')
        .order('tag', { ascending: true })
        .order('level', { ascending: true });
      
      if (error) throw error;
      return data as TerrainType[];
    },
  });
}

export function useUpdateTerrain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TerrainType> & { id: string }) => {
      const { data, error } = await supabase
        .from('terrain_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terrains'] });
    },
  });
}

export function useCreateTerrain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (terrain: Omit<TerrainType, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('terrain_types')
        .insert(terrain)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terrains'] });
    },
  });
}

export function useDeleteTerrain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('terrain_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terrains'] });
    },
  });
}
