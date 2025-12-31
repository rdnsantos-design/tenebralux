import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Holding, HoldingWithRegent, HoldingType } from '@/types/Domain';
import { toast } from 'sonner';

// Helper to fetch all records with pagination (Supabase default limit is 1000)
async function fetchAllHoldings(provinceId?: string): Promise<HoldingWithRegent[]> {
  const PAGE_SIZE = 1000;
  let allData: HoldingWithRegent[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('holdings')
      .select(`
        *,
        regent:regents(*)
      `)
      .order('holding_type')
      .order('level', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    
    if (provinceId) {
      query = query.eq('province_id', provinceId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      allData = [...allData, ...(data as HoldingWithRegent[])];
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allData;
}

export const useHoldings = (provinceId?: string) => {
  return useQuery({
    queryKey: ['holdings', provinceId],
    queryFn: () => fetchAllHoldings(provinceId),
  });
};

export const useCreateHolding = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (holding: Omit<Holding, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('holdings')
        .insert(holding)
        .select()
        .single();
      
      if (error) throw error;
      return data as Holding;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      toast.success('Holding criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar holding: ${error.message}`);
    },
  });
};

export const useUpdateHolding = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Holding> & { id: string }) => {
      const { data, error } = await supabase
        .from('holdings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Holding;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      toast.success('Holding atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar holding: ${error.message}`);
    },
  });
};

export const useDeleteHolding = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('holdings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      toast.success('Holding excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir holding: ${error.message}`);
    },
  });
};

export const useBulkImportHoldings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (holdings: Array<{
      provinceName: string;
      realmName: string;
      holdingType: HoldingType;
      regentCode: string;
      level: number;
    }>) => {
      let created = 0;
      let skipped = 0;
      
      for (const holding of holdings) {
        // Find province by name and realm
        const { data: realm } = await supabase
          .from('realms')
          .select('id')
          .eq('name', holding.realmName)
          .maybeSingle();
        
        if (!realm) {
          skipped++;
          continue;
        }
        
        const { data: province } = await supabase
          .from('provinces')
          .select('id')
          .eq('name', holding.provinceName)
          .eq('realm_id', realm.id)
          .maybeSingle();
        
        if (!province) {
          skipped++;
          continue;
        }
        
        // Find or create regent
        let regentId: string | undefined;
        if (holding.regentCode) {
          const { data: existingRegent } = await supabase
            .from('regents')
            .select('id')
            .eq('code', holding.regentCode)
            .maybeSingle();
          
          if (existingRegent) {
            regentId = existingRegent.id;
          }
        }
        
        // Create holding
        await supabase
          .from('holdings')
          .insert({
            province_id: province.id,
            holding_type: holding.holdingType,
            regent_id: regentId,
            level: holding.level,
          });
        created++;
      }
      
      return { created, skipped };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      toast.success(`Importação concluída! ${result.created} holdings criados, ${result.skipped} ignorados.`);
    },
    onError: (error: Error) => {
      toast.error(`Erro na importação: ${error.message}`);
    },
  });
};
