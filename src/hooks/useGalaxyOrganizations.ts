import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type OrganizationType = 'corporacao' | 'militar' | 'criminosa' | 'cientifica' | 'social';

export interface GalaxyOrganization {
  id: string;
  name: string;
  organization_type: OrganizationType;
  description: string | null;
  content: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const ORGANIZATION_TYPES: { id: OrganizationType; label: string; color: string }[] = [
  { id: 'corporacao', label: 'Corporação', color: 'text-amber-400' },
  { id: 'militar', label: 'Militar', color: 'text-red-400' },
  { id: 'criminosa', label: 'Criminosa', color: 'text-purple-400' },
  { id: 'cientifica', label: 'Científica', color: 'text-blue-400' },
  { id: 'social', label: 'Social', color: 'text-green-400' },
];

export function useGalaxyOrganizations() {
  const queryClient = useQueryClient();

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['galaxy-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('galaxy_organizations')
        .select('*')
        .order('organization_type')
        .order('sort_order');
      
      if (error) throw error;
      return data as GalaxyOrganization[];
    }
  });

  const createOrganization = useMutation({
    mutationFn: async (org: Omit<GalaxyOrganization, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('galaxy_organizations')
        .insert(org);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galaxy-organizations'] });
      toast.success('Organização criada!');
    },
    onError: (error) => {
      toast.error('Erro ao criar: ' + error.message);
    }
  });

  const updateOrganization = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GalaxyOrganization> & { id: string }) => {
      const { error } = await supabase
        .from('galaxy_organizations')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galaxy-organizations'] });
      toast.success('Organização atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  const deleteOrganization = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('galaxy_organizations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galaxy-organizations'] });
      toast.success('Organização removida!');
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + error.message);
    }
  });

  const getByType = (type: OrganizationType) => 
    organizations.filter(o => o.organization_type === type);

  return {
    organizations,
    isLoading,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getByType
  };
}
