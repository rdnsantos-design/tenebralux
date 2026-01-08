import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RpgPrivilegeCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface RpgPrivilege {
  id: string;
  name: string;
  category_id: string;
  description: string;
  effect: string | null;
  sort_order: number;
}

export interface RpgChallenge {
  id: string;
  privilege_id: string;
  name: string;
  description: string;
  effect: string | null;
  sort_order: number;
}

// Hook para categorias
export function useRpgPrivilegeCategories() {
  return useQuery({
    queryKey: ['rpg_privilege_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rpg_privilege_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as RpgPrivilegeCategory[];
    },
  });
}

// Hook para privilégios
export function useRpgPrivileges() {
  return useQuery({
    queryKey: ['rpg_privileges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rpg_privileges')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as RpgPrivilege[];
    },
  });
}

// Hook para desafios/vícios
export function useRpgChallenges() {
  return useQuery({
    queryKey: ['rpg_challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rpg_challenges')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as RpgChallenge[];
    },
  });
}

// Mutações para categorias
export function useCreatePrivilegeCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: Omit<RpgPrivilegeCategory, 'sort_order'> & { sort_order?: number }) => {
      const { data, error } = await supabase
        .from('rpg_privilege_categories')
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg_privilege_categories'] });
      toast.success('Categoria criada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar categoria: ' + error.message);
    },
  });
}

export function useUpdatePrivilegeCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RpgPrivilegeCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('rpg_privilege_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg_privilege_categories'] });
      toast.success('Categoria atualizada');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar categoria: ' + error.message);
    },
  });
}

export function useDeletePrivilegeCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rpg_privilege_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg_privilege_categories'] });
      toast.success('Categoria removida');
    },
    onError: (error) => {
      toast.error('Erro ao remover categoria: ' + error.message);
    },
  });
}

// Mutações para privilégios
export function useCreatePrivilege() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (privilege: Omit<RpgPrivilege, 'sort_order'> & { sort_order?: number }) => {
      const { data, error } = await supabase
        .from('rpg_privileges')
        .insert(privilege)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg_privileges'] });
      toast.success('Privilégio criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar privilégio: ' + error.message);
    },
  });
}

export function useUpdatePrivilege() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RpgPrivilege> & { id: string }) => {
      const { data, error } = await supabase
        .from('rpg_privileges')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg_privileges'] });
      toast.success('Privilégio atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar privilégio: ' + error.message);
    },
  });
}

export function useDeletePrivilege() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rpg_privileges')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg_privileges'] });
      queryClient.invalidateQueries({ queryKey: ['rpg_challenges'] });
      toast.success('Privilégio removido');
    },
    onError: (error) => {
      toast.error('Erro ao remover privilégio: ' + error.message);
    },
  });
}

// Mutações para desafios/vícios
export function useCreateChallenge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (challenge: Omit<RpgChallenge, 'sort_order'> & { sort_order?: number }) => {
      const { data, error } = await supabase
        .from('rpg_challenges')
        .insert(challenge)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg_challenges'] });
      toast.success('Desafio criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar desafio: ' + error.message);
    },
  });
}

export function useUpdateChallenge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RpgChallenge> & { id: string }) => {
      const { data, error } = await supabase
        .from('rpg_challenges')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg_challenges'] });
      toast.success('Desafio atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar desafio: ' + error.message);
    },
  });
}

export function useDeleteChallenge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rpg_challenges')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg_challenges'] });
      toast.success('Desafio removido');
    },
    onError: (error) => {
      toast.error('Erro ao remover desafio: ' + error.message);
    },
  });
}
