import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProvinceDistance, TravelSpeed } from '@/types/Travel';
import { toast } from 'sonner';

// Fetch all unique province names from distance matrix
export function useDistanceProvinces() {
  return useQuery({
    queryKey: ['distance-provinces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('province_distances')
        .select('from_province_name, to_province_name');

      if (error) throw error;

      const provinceSet = new Set<string>();
      data?.forEach(row => {
        provinceSet.add(row.from_province_name);
        provinceSet.add(row.to_province_name);
      });

      return Array.from(provinceSet).sort();
    },
  });
}

// Fetch travel speeds
export function useTravelSpeeds() {
  return useQuery({
    queryKey: ['travel-speeds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_speeds')
        .select('*')
        .order('travel_type');

      if (error) throw error;
      return data as TravelSpeed[];
    },
  });
}

// Update travel speed
export function useUpdateTravelSpeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (speed: Partial<TravelSpeed> & { id: string }) => {
      const { data, error } = await supabase
        .from('travel_speeds')
        .update({
          speed_km_per_day: speed.speed_km_per_day,
          label: speed.label,
          description: speed.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', speed.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel-speeds'] });
      toast.success('Velocidade atualizada');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

// Get distance between two provinces
export function useProvinceDistance(from: string, to: string) {
  return useQuery({
    queryKey: ['province-distance', from, to],
    queryFn: async () => {
      if (!from || !to || from === to) return null;

      // Try both directions
      const { data, error } = await supabase
        .from('province_distances')
        .select('*')
        .or(`and(from_province_name.eq.${from},to_province_name.eq.${to}),and(from_province_name.eq.${to},to_province_name.eq.${from})`)
        .limit(1);

      if (error) throw error;
      return data?.[0] as ProvinceDistance | undefined;
    },
    enabled: !!from && !!to && from !== to,
  });
}

// Bulk import distances
export function useBulkImportDistances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (distances: Array<{ from: string; to: string; distance: number }>) => {
      // Remove duplicates - keep only unique from/to pairs
      const uniqueMap = new Map<string, { from: string; to: string; distance: number }>();
      for (const d of distances) {
        // Create a normalized key (sorted alphabetically to treat A->B same as B->A)
        const key = [d.from, d.to].sort().join('|||');
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, d);
        }
      }
      const uniqueDistances = Array.from(uniqueMap.values());

      // Delete existing data first
      const { error: deleteError } = await supabase
        .from('province_distances')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      // Small delay to ensure deletion is committed
      await new Promise(resolve => setTimeout(resolve, 200));

      // Insert in batches of 500
      const batchSize = 500;
      for (let i = 0; i < uniqueDistances.length; i += batchSize) {
        const batch = uniqueDistances.slice(i, i + batchSize).map(d => ({
          from_province_name: d.from,
          to_province_name: d.to,
          distance_km: d.distance,
        }));

        const { error } = await supabase
          .from('province_distances')
          .insert(batch);

        if (error) throw error;
      }

      return uniqueDistances.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['distance-provinces'] });
      queryClient.invalidateQueries({ queryKey: ['distance-count'] });
      queryClient.invalidateQueries({ queryKey: ['province-distance'] });
      toast.success(`${count} distâncias importadas com sucesso`);
    },
    onError: (error) => {
      toast.error(`Erro na importação: ${error.message}`);
    },
  });
}

// Get distance count
export function useDistanceCount() {
  return useQuery({
    queryKey: ['distance-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('province_distances')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
  });
}
