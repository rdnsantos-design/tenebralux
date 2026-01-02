import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SecondaryTerrain {
  id: string;
  name: string;
  attack_mod: number;
  defense_mod: number;
  mobility_mod: number;
  description: string | null;
}

export function useCompatibleTerrains(primaryTerrainId: string | null) {
  return useQuery({
    queryKey: ['compatible-terrains', primaryTerrainId],
    queryFn: async () => {
      if (!primaryTerrainId) return [];
      
      const { data, error } = await supabase
        .from('mass_combat_terrain_compatibility')
        .select(`
          secondary_terrain_id,
          mass_combat_secondary_terrains!inner(
            id,
            name,
            attack_mod,
            defense_mod,
            mobility_mod,
            description
          )
        `)
        .eq('primary_terrain_id', primaryTerrainId);
      
      if (error) throw error;
      
      return (data || []).map(row => ({
        id: (row.mass_combat_secondary_terrains as any).id,
        name: (row.mass_combat_secondary_terrains as any).name,
        attack_mod: (row.mass_combat_secondary_terrains as any).attack_mod || 0,
        defense_mod: (row.mass_combat_secondary_terrains as any).defense_mod || 0,
        mobility_mod: (row.mass_combat_secondary_terrains as any).mobility_mod || 0,
        description: (row.mass_combat_secondary_terrains as any).description,
      })) as SecondaryTerrain[];
    },
    enabled: !!primaryTerrainId,
  });
}
