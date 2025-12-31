import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FieldCommander } from '@/types/FieldCommander';
import { toast } from 'sonner';

// ========================
// FIELD COMMANDERS HOOKS
// ========================

export function useFieldCommanders() {
  return useQuery({
    queryKey: ['field-commanders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_commanders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FieldCommander[];
    },
  });
}

export function useCreateFieldCommander() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commander: Omit<FieldCommander, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('field_commanders')
        .insert([commander])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-commanders'] });
      toast.success('Comandante criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar comandante');
    },
  });
}

export function useUpdateFieldCommander() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FieldCommander> & { id: string }) => {
      const { data, error } = await supabase
        .from('field_commanders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-commanders'] });
      toast.success('Comandante atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar comandante');
    },
  });
}

export function useDeleteFieldCommander() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('field_commanders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-commanders'] });
      toast.success('Comandante removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover comandante');
    },
  });
}

export function useEvolveFieldCommander() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FieldCommander> & { id: string }) => {
      const { data, error } = await supabase
        .from('field_commanders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-commanders'] });
      toast.success('Comandante evoluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao evoluir comandante');
    },
  });
}
