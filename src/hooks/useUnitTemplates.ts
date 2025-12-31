import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

// Tipos baseados no schema do Supabase
export type ExperienceLevel = 'Amador' | 'Recruta' | 'Profissional' | 'Veterano' | 'Elite' | 'Lendário';

export interface SpecialAbility {
  id: string;
  name: string;
  level: 1 | 2;
  cost: number;
  description: string;
}

export interface UnitTemplate {
  id: string;
  name: string;
  source_file?: string;
  attack: number;
  defense: number;
  ranged: number;
  movement: number;
  morale: number;
  experience: ExperienceLevel;
  total_force: number;
  maintenance_cost: number;
  special_abilities: SpecialAbility[];
  background_image?: string;
  created_at: string;
  updated_at: string;
}

type UnitTemplateInsert = Omit<UnitTemplate, 'id' | 'created_at' | 'updated_at'>;
type UnitTemplateUpdate = Partial<UnitTemplateInsert>;

// Hook para buscar todos os templates
export const useUnitTemplates = () => {
  return useQuery({
    queryKey: ['unit-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unit_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Parse special_abilities de JSONB para array
      return (data || []).map(template => ({
        ...template,
        special_abilities: (template.special_abilities as unknown as SpecialAbility[]) || [],
      })) as UnitTemplate[];
    },
  });
};

// Hook para criar template
export const useCreateUnitTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: UnitTemplateInsert) => {
      const { data, error } = await supabase
        .from('unit_templates')
        .insert({
          ...template,
          special_abilities: template.special_abilities as unknown as Database['public']['Tables']['unit_templates']['Insert']['special_abilities'],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as UnitTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-templates'] });
      toast.success('Template de unidade criado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar template: ${error.message}`);
    },
  });
};

// Hook para atualizar template
export const useUpdateUnitTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: UnitTemplateUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('unit_templates')
        .update({
          ...updates,
          special_abilities: updates.special_abilities as unknown as Database['public']['Tables']['unit_templates']['Update']['special_abilities'],
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as UnitTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-templates'] });
      toast.success('Template atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar template: ${error.message}`);
    },
  });
};

// Hook para deletar template
export const useDeleteUnitTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('unit_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-templates'] });
      toast.success('Template excluído!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir template: ${error.message}`);
    },
  });
};

// Hook para importar múltiplos templates (do Excel)
export const useBulkImportUnitTemplates = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (templates: UnitTemplateInsert[]) => {
      const { data, error } = await supabase
        .from('unit_templates')
        .insert(templates.map(t => ({
          ...t,
          special_abilities: t.special_abilities as unknown as Database['public']['Tables']['unit_templates']['Insert']['special_abilities'],
        })))
        .select();
      
      if (error) throw error;
      return data as unknown as UnitTemplate[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unit-templates'] });
      toast.success(`${data.length} templates importados!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro na importação: ${error.message}`);
    },
  });
};
