import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  MassCombatPrimaryTerrain, 
  MassCombatSecondaryTerrain, 
  MassCombatTerrainCompatibility,
  INITIAL_PRIMARY_TERRAINS,
  INITIAL_SECONDARY_TERRAINS,
  TERRAIN_COMPATIBILITY_MAP
} from '@/types/MassCombatTerrain';

// Primary Terrains
export function useMassCombatPrimaryTerrains() {
  return useQuery({
    queryKey: ['mass-combat-primary-terrains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mass_combat_primary_terrains')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as MassCombatPrimaryTerrain[];
    },
  });
}

export function useCreateMassCombatPrimaryTerrain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (terrain: Omit<MassCombatPrimaryTerrain, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('mass_combat_primary_terrains')
        .insert(terrain)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-primary-terrains'] });
    },
  });
}

export function useUpdateMassCombatPrimaryTerrain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MassCombatPrimaryTerrain> & { id: string }) => {
      const { data, error } = await supabase
        .from('mass_combat_primary_terrains')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-primary-terrains'] });
    },
  });
}

export function useDeleteMassCombatPrimaryTerrain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mass_combat_primary_terrains')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-primary-terrains'] });
    },
  });
}

// Secondary Terrains
export function useMassCombatSecondaryTerrains() {
  return useQuery({
    queryKey: ['mass-combat-secondary-terrains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mass_combat_secondary_terrains')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as MassCombatSecondaryTerrain[];
    },
  });
}

export function useCreateMassCombatSecondaryTerrain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (terrain: Omit<MassCombatSecondaryTerrain, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('mass_combat_secondary_terrains')
        .insert(terrain)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-secondary-terrains'] });
    },
  });
}

export function useUpdateMassCombatSecondaryTerrain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MassCombatSecondaryTerrain> & { id: string }) => {
      const { data, error } = await supabase
        .from('mass_combat_secondary_terrains')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-secondary-terrains'] });
    },
  });
}

export function useDeleteMassCombatSecondaryTerrain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mass_combat_secondary_terrains')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-secondary-terrains'] });
    },
  });
}

// Terrain Compatibility
export function useMassCombatTerrainCompatibility() {
  return useQuery({
    queryKey: ['mass-combat-terrain-compatibility'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mass_combat_terrain_compatibility')
        .select('*');
      
      if (error) throw error;
      return data as MassCombatTerrainCompatibility[];
    },
  });
}

export function useSetTerrainCompatibility() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      primaryTerrainId, 
      secondaryTerrainIds 
    }: { 
      primaryTerrainId: string; 
      secondaryTerrainIds: string[] 
    }) => {
      // First, delete existing compatibility for this primary terrain
      await supabase
        .from('mass_combat_terrain_compatibility')
        .delete()
        .eq('primary_terrain_id', primaryTerrainId);
      
      // Then, insert new compatibility records
      if (secondaryTerrainIds.length > 0) {
        const { error } = await supabase
          .from('mass_combat_terrain_compatibility')
          .insert(
            secondaryTerrainIds.map(secondaryId => ({
              primary_terrain_id: primaryTerrainId,
              secondary_terrain_id: secondaryId,
            }))
          );
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-terrain-compatibility'] });
    },
  });
}

// Seed initial data
export function useSeedMassCombatTerrains() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Check if data already exists
      const { data: existing } = await supabase
        .from('mass_combat_primary_terrains')
        .select('id')
        .limit(1);
      
      if (existing && existing.length > 0) {
        throw new Error('Dados já existem. Delete todos os terrenos antes de recarregar.');
      }
      
      // Insert primary terrains
      const { data: primaryData, error: primaryError } = await supabase
        .from('mass_combat_primary_terrains')
        .insert(INITIAL_PRIMARY_TERRAINS)
        .select();
      
      if (primaryError) throw primaryError;
      
      // Insert secondary terrains
      const { data: secondaryData, error: secondaryError } = await supabase
        .from('mass_combat_secondary_terrains')
        .insert(INITIAL_SECONDARY_TERRAINS)
        .select();
      
      if (secondaryError) throw secondaryError;
      
      // Create compatibility map
      const primaryMap = new Map(primaryData.map(p => [p.name, p.id]));
      const secondaryMap = new Map(secondaryData.map(s => [s.name, s.id]));
      
      const compatibilityRecords: { primary_terrain_id: string; secondary_terrain_id: string }[] = [];
      
      for (const [secondaryName, primaryNames] of Object.entries(TERRAIN_COMPATIBILITY_MAP)) {
        const secondaryId = secondaryMap.get(secondaryName);
        if (!secondaryId) continue;
        
        for (const primaryName of primaryNames) {
          const primaryId = primaryMap.get(primaryName);
          if (primaryId) {
            compatibilityRecords.push({
              primary_terrain_id: primaryId,
              secondary_terrain_id: secondaryId,
            });
          }
        }
      }
      
      if (compatibilityRecords.length > 0) {
        const { error: compatError } = await supabase
          .from('mass_combat_terrain_compatibility')
          .insert(compatibilityRecords);
        
        if (compatError) throw compatError;
      }
      
      return { primaryCount: primaryData.length, secondaryCount: secondaryData.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-combat-primary-terrains'] });
      queryClient.invalidateQueries({ queryKey: ['mass-combat-secondary-terrains'] });
      queryClient.invalidateQueries({ queryKey: ['mass-combat-terrain-compatibility'] });
    },
  });
}
