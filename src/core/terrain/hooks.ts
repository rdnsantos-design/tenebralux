/**
 * HOOKS UNIFICADOS PARA TERRENOS
 * 
 * Fonte única para terrenos usados em todos os modos de jogo.
 * Mapeia dados do banco para os tipos unificados.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PrimaryTerrain, SecondaryTerrain, TerrainCompatibility } from './types';

// === TERRENOS PRIMÁRIOS ===
export function useUnifiedPrimaryTerrains() {
  return useQuery({
    queryKey: ['unified-primary-terrains'],
    queryFn: async (): Promise<PrimaryTerrain[]> => {
      const { data, error } = await supabase
        .from('mass_combat_primary_terrains')
        .select('*')
        .order('name');

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        default_climate: row.default_climate,
        allowed_climates: row.allowed_climates || [],
        attack_mod: row.attack_mod,
        defense_mod: row.defense_mod,
        mobility_mod: row.mobility_mod,
        visibility: row.visibility as PrimaryTerrain['visibility'],
        image_url: row.image_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    },
  });
}

export function useCreatePrimaryTerrain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (terrain: Omit<PrimaryTerrain, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('mass_combat_primary_terrains')
        .insert({
          name: terrain.name,
          description: terrain.description,
          default_climate: terrain.default_climate,
          allowed_climates: terrain.allowed_climates,
          attack_mod: terrain.attack_mod,
          defense_mod: terrain.defense_mod,
          mobility_mod: terrain.mobility_mod,
          visibility: terrain.visibility,
          image_url: terrain.image_url,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-primary-terrains'] });
    },
  });
}

export function useUpdatePrimaryTerrain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...terrain }: Partial<PrimaryTerrain> & { id: string }) => {
      const { data, error } = await supabase
        .from('mass_combat_primary_terrains')
        .update({
          name: terrain.name,
          description: terrain.description,
          default_climate: terrain.default_climate,
          allowed_climates: terrain.allowed_climates,
          attack_mod: terrain.attack_mod,
          defense_mod: terrain.defense_mod,
          mobility_mod: terrain.mobility_mod,
          visibility: terrain.visibility,
          image_url: terrain.image_url,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-primary-terrains'] });
    },
  });
}

export function useDeletePrimaryTerrain() {
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
      queryClient.invalidateQueries({ queryKey: ['unified-primary-terrains'] });
    },
  });
}

// === TERRENOS SECUNDÁRIOS ===
export function useUnifiedSecondaryTerrains() {
  return useQuery({
    queryKey: ['unified-secondary-terrains'],
    queryFn: async (): Promise<SecondaryTerrain[]> => {
      const { data, error } = await supabase
        .from('mass_combat_secondary_terrains')
        .select('*')
        .order('name');

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        effect_description: row.effect_description,
        attack_mod: row.attack_mod,
        defense_mod: row.defense_mod,
        mobility_mod: row.mobility_mod,
        strategy_mod: row.strategy_mod,
        special_effects: row.special_effects,
        is_universal: row.is_universal,
        image_url: row.image_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    },
  });
}

export function useCreateSecondaryTerrain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (terrain: Omit<SecondaryTerrain, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('mass_combat_secondary_terrains')
        .insert({
          name: terrain.name,
          description: terrain.description,
          effect_description: terrain.effect_description,
          attack_mod: terrain.attack_mod,
          defense_mod: terrain.defense_mod,
          mobility_mod: terrain.mobility_mod,
          strategy_mod: terrain.strategy_mod,
          special_effects: terrain.special_effects,
          is_universal: terrain.is_universal,
          image_url: terrain.image_url,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-secondary-terrains'] });
    },
  });
}

export function useUpdateSecondaryTerrain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...terrain }: Partial<SecondaryTerrain> & { id: string }) => {
      const { data, error } = await supabase
        .from('mass_combat_secondary_terrains')
        .update({
          name: terrain.name,
          description: terrain.description,
          effect_description: terrain.effect_description,
          attack_mod: terrain.attack_mod,
          defense_mod: terrain.defense_mod,
          mobility_mod: terrain.mobility_mod,
          strategy_mod: terrain.strategy_mod,
          special_effects: terrain.special_effects,
          is_universal: terrain.is_universal,
          image_url: terrain.image_url,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-secondary-terrains'] });
    },
  });
}

export function useDeleteSecondaryTerrain() {
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
      queryClient.invalidateQueries({ queryKey: ['unified-secondary-terrains'] });
    },
  });
}

// === COMPATIBILIDADE ===
export function useTerrainCompatibility() {
  return useQuery({
    queryKey: ['terrain-compatibility'],
    queryFn: async (): Promise<TerrainCompatibility[]> => {
      const { data, error } = await supabase
        .from('mass_combat_terrain_compatibility')
        .select('*');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useSetTerrainCompatibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      primaryTerrainId,
      secondaryTerrainIds,
    }: {
      primaryTerrainId: string;
      secondaryTerrainIds: string[];
    }) => {
      // Remove compatibilidades existentes
      const { error: deleteError } = await supabase
        .from('mass_combat_terrain_compatibility')
        .delete()
        .eq('primary_terrain_id', primaryTerrainId);

      if (deleteError) throw deleteError;

      // Insere novas compatibilidades
      if (secondaryTerrainIds.length > 0) {
        const inserts = secondaryTerrainIds.map(secondaryId => ({
          primary_terrain_id: primaryTerrainId,
          secondary_terrain_id: secondaryId,
        }));

        const { error: insertError } = await supabase
          .from('mass_combat_terrain_compatibility')
          .insert(inserts);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terrain-compatibility'] });
    },
  });
}

// === HELPERS ===
export function useCompatibleSecondaryTerrains(primaryTerrainId: string | null) {
  const { data: secondaryTerrains = [] } = useUnifiedSecondaryTerrains();
  const { data: compatibility = [] } = useTerrainCompatibility();

  if (!primaryTerrainId) return [];

  const compatibleIds = compatibility
    .filter(c => c.primary_terrain_id === primaryTerrainId)
    .map(c => c.secondary_terrain_id);

  return secondaryTerrains.filter(
    s => s.is_universal || compatibleIds.includes(s.id)
  );
}
