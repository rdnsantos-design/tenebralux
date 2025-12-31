import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Realm, Province, ProvinceWithRealm } from '@/types/Domain';
import { toast } from 'sonner';

// Realms hooks
export const useRealms = () => {
  return useQuery({
    queryKey: ['realms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('realms')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Realm[];
    },
  });
};

export const useCreateRealm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('realms')
        .insert({ name })
        .select()
        .single();
      
      if (error) throw error;
      return data as Realm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realms'] });
      toast.success('Reino criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar reino: ${error.message}`);
    },
  });
};

export const useUpdateRealm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Realm> & { id: string }) => {
      const { data, error } = await supabase
        .from('realms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Realm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realms'] });
      queryClient.invalidateQueries({ queryKey: ['provinces'] });
      toast.success('Reino atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar reino: ${error.message}`);
    },
  });
};

export const useDeleteRealm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('realms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realms'] });
      queryClient.invalidateQueries({ queryKey: ['provinces'] });
      toast.success('Reino excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir reino: ${error.message}`);
    },
  });
};

// Provinces hooks
export const useProvinces = (realmId?: string) => {
  return useQuery({
    queryKey: ['provinces', realmId],
    queryFn: async () => {
      let query = supabase
        .from('provinces')
        .select(`
          *,
          realm:realms(*)
        `)
        .order('name');
      
      if (realmId) {
        query = query.eq('realm_id', realmId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ProvinceWithRealm[];
    },
  });
};

export const useCreateProvince = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (province: Omit<Province, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('provinces')
        .insert(province)
        .select()
        .single();
      
      if (error) throw error;
      return data as Province;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provinces'] });
      toast.success('Província criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar província: ${error.message}`);
    },
  });
};

export const useUpdateProvince = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Province> & { id: string }) => {
      const { data, error } = await supabase
        .from('provinces')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Province;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provinces'] });
      toast.success('Província atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar província: ${error.message}`);
    },
  });
};

export const useDeleteProvince = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('provinces')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provinces'] });
      toast.success('Província excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir província: ${error.message}`);
    },
  });
};

// Bulk import
export const useBulkImportDomains = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { realms: string[]; provinces: Array<{ name: string; realmName: string; development: number; magic: number; cultura: string }> }) => {
      // First, get or create all realms
      const realmMap = new Map<string, string>();
      
      for (const realmName of data.realms) {
        // Check if realm exists
        const { data: existingRealm } = await supabase
          .from('realms')
          .select('id')
          .eq('name', realmName)
          .maybeSingle();
        
        if (existingRealm) {
          realmMap.set(realmName, existingRealm.id);
        } else {
          // Create new realm
          const { data: newRealm, error } = await supabase
            .from('realms')
            .insert({ name: realmName })
            .select('id')
            .single();
          
          if (error) throw error;
          realmMap.set(realmName, newRealm.id);
        }
      }
      
      // Now upsert provinces
      let created = 0;
      let updated = 0;
      
      for (const province of data.provinces) {
        const realmId = realmMap.get(province.realmName);
        if (!realmId) continue;
        
        // Check if province exists in this realm
        const { data: existingProvince } = await supabase
          .from('provinces')
          .select('id')
          .eq('name', province.name)
          .eq('realm_id', realmId)
          .maybeSingle();
        
        if (existingProvince) {
          // Update existing
          await supabase
            .from('provinces')
            .update({ 
              development: province.development, 
              magic: province.magic,
              cultura: province.cultura || null
            })
            .eq('id', existingProvince.id);
          updated++;
        } else {
          // Insert new
          await supabase
            .from('provinces')
            .insert({
              name: province.name,
              realm_id: realmId,
              development: province.development,
              magic: province.magic,
              cultura: province.cultura || null,
            });
          created++;
        }
      }
      
      return { created, updated, totalRealms: realmMap.size };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['realms'] });
      queryClient.invalidateQueries({ queryKey: ['provinces'] });
      toast.success(`Importação concluída! ${result.totalRealms} reinos, ${result.created} províncias criadas, ${result.updated} atualizadas.`);
    },
    onError: (error: Error) => {
      toast.error(`Erro na importação: ${error.message}`);
    },
  });
};
