import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RpgAttribute {
  id: string;
  name: string;
  virtue_id: string;
  description: string;
  icon: string;
  theme: string;
  focus_label?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useRpgAttributes(theme?: string) {
  return useQuery({
    queryKey: ['rpg-attributes', theme],
    queryFn: async () => {
      let query = supabase
        .from('rpg_attributes')
        .select('*')
        .order('sort_order');
      
      if (theme) {
        query = query.eq('theme', theme);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RpgAttribute[];
    },
  });
}

export function useUpdateRpgAttribute() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attribute: Partial<RpgAttribute> & { id: string }) => {
      const { data, error } = await supabase
        .from('rpg_attributes')
        .update({
          name: attribute.name,
          description: attribute.description,
          icon: attribute.icon,
          focus_label: attribute.focus_label,
          virtue_id: attribute.virtue_id,
          sort_order: attribute.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attribute.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg-attributes'] });
      toast.success('Atributo atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar atributo: ' + error.message);
    },
  });
}

export function useCreateRpgAttribute() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attribute: Omit<RpgAttribute, 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('rpg_attributes')
        .insert({
          id: attribute.id,
          name: attribute.name,
          description: attribute.description,
          icon: attribute.icon,
          focus_label: attribute.focus_label,
          virtue_id: attribute.virtue_id,
          theme: attribute.theme,
          sort_order: attribute.sort_order,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg-attributes'] });
      toast.success('Atributo criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar atributo: ' + error.message);
    },
  });
}

export function useDeleteRpgAttribute() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rpg_attributes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg-attributes'] });
      toast.success('Atributo excluído com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir atributo: ' + error.message);
    },
  });
}
