import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Regent } from '@/types/Domain';
import { toast } from 'sonner';

export const useRegents = () => {
  return useQuery({
    queryKey: ['regents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regents')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Regent[];
    },
  });
};

export const useCreateRegent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (regent: Omit<Regent, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('regents')
        .insert(regent)
        .select()
        .single();
      
      if (error) throw error;
      return data as Regent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regents'] });
      toast.success('Regente criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar regente: ${error.message}`);
    },
  });
};

export const useUpdateRegent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Regent> & { id: string }) => {
      const { data, error } = await supabase
        .from('regents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Regent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regents'] });
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      toast.success('Regente atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar regente: ${error.message}`);
    },
  });
};

export const useDeleteRegent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('regents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regents'] });
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      toast.success('Regente excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir regente: ${error.message}`);
    },
  });
};

export const useBulkImportRegents = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (regents: Array<{ code: string; name: string; full_name?: string }>) => {
      let created = 0;
      let updated = 0;
      
      for (const regent of regents) {
        // Check if regent exists by code
        const { data: existingRegent } = await supabase
          .from('regents')
          .select('id')
          .eq('code', regent.code)
          .maybeSingle();
        
        if (existingRegent) {
          await supabase
            .from('regents')
            .update({ name: regent.name, full_name: regent.full_name })
            .eq('id', existingRegent.id);
          updated++;
        } else {
          await supabase
            .from('regents')
            .insert(regent);
          created++;
        }
      }
      
      return { created, updated };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['regents'] });
      toast.success(`Importação concluída! ${result.created} criados, ${result.updated} atualizados.`);
    },
    onError: (error: Error) => {
      toast.error(`Erro na importação: ${error.message}`);
    },
  });
};
