import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { ExperienceLevel, SpecialAbility } from './useUnitTemplates';
import { useAuth } from './useAuth';

export type UnitPosture = 'Ofensiva' | 'Defensiva' | 'Carga' | 'Reorganização';

export interface UnitInstance {
  id: string;
  template_id?: string;
  regent_id?: string;
  army_id?: string;
  commander_id?: string;
  name: string;
  unit_number?: string;
  attack: number;
  defense: number;
  ranged: number;
  movement: number;
  morale: number;
  experience: ExperienceLevel;
  total_force: number;
  maintenance_cost: number;
  creation_cost: number;
  special_abilities: SpecialAbility[];
  current_xp: number;
  battles_fought: number;
  battles_won: number;
  province_id?: string;
  is_garrisoned: boolean;
  background_image?: string;
  custom_background_image?: string;
  current_posture?: UnitPosture;
  normal_pressure: number;
  permanent_pressure: number;
  hits: number;
  is_disbanded: boolean;
  created_at: string;
  updated_at: string;
}

type UnitInstanceInsert = Omit<UnitInstance, 'id' | 'created_at' | 'updated_at'>;
type UnitInstanceUpdate = Partial<UnitInstanceInsert>;

// Hook para buscar todas as instâncias de unidades
export const useUnitInstances = (regentId?: string) => {
  return useQuery({
    queryKey: ['unit-instances', regentId],
    queryFn: async () => {
      let query = supabase
        .from('unit_instances')
        .select('*')
        .order('name');
      
      if (regentId) {
        query = query.eq('regent_id', regentId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(unit => ({
        ...unit,
        special_abilities: (unit.special_abilities as unknown as SpecialAbility[]) || [],
      })) as UnitInstance[];
    },
  });
};

// Hook para buscar unidades de um exército específico
export const useArmyUnits = (armyId?: string) => {
  return useQuery({
    queryKey: ['unit-instances', 'army', armyId],
    queryFn: async () => {
      if (!armyId) return [];
      
      const { data, error } = await supabase
        .from('unit_instances')
        .select('*')
        .eq('army_id', armyId)
        .order('name');
      
      if (error) throw error;
      
      return (data || []).map(unit => ({
        ...unit,
        special_abilities: (unit.special_abilities as unknown as SpecialAbility[]) || [],
      })) as UnitInstance[];
    },
    enabled: !!armyId,
  });
};

// Hook para criar instância de unidade
export const useCreateUnitInstance = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (unit: UnitInstanceInsert) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('unit_instances')
        .insert({
          ...unit,
          special_abilities: unit.special_abilities as unknown as Database['public']['Tables']['unit_instances']['Insert']['special_abilities'],
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as UnitInstance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-instances'] });
      toast.success('Unidade criada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar unidade: ${error.message}`);
    },
  });
};

// Hook para atualizar instância de unidade
export const useUpdateUnitInstance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: UnitInstanceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('unit_instances')
        .update({
          ...updates,
          special_abilities: updates.special_abilities as unknown as Database['public']['Tables']['unit_instances']['Update']['special_abilities'],
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as UnitInstance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-instances'] });
      toast.success('Unidade atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar unidade: ${error.message}`);
    },
  });
};

// Hook para deletar instância de unidade
export const useDeleteUnitInstance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('unit_instances')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-instances'] });
      toast.success('Unidade excluída!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir unidade: ${error.message}`);
    },
  });
};

// Hook para atribuir unidade a um exército
export const useAssignUnitToArmy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ unitId, armyId }: { unitId: string; armyId: string | null }) => {
      const { data, error } = await supabase
        .from('unit_instances')
        .update({ army_id: armyId })
        .eq('id', unitId)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as UnitInstance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-instances'] });
      toast.success('Unidade atribuída ao exército!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atribuir unidade: ${error.message}`);
    },
  });
};

// Hook para atribuir comandante a uma unidade
export const useAssignCommanderToUnit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ unitId, commanderId }: { unitId: string; commanderId: string | null }) => {
      const { data, error } = await supabase
        .from('unit_instances')
        .update({ commander_id: commanderId })
        .eq('id', unitId)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as UnitInstance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-instances'] });
      toast.success('Comandante atribuído!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atribuir comandante: ${error.message}`);
    },
  });
};

// Hook para criar múltiplas unidades de uma vez
export const useBulkCreateUnitInstances = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (units: UnitInstanceInsert[]) => {
      const { data, error } = await supabase
        .from('unit_instances')
        .insert(units.map(u => ({
          ...u,
          special_abilities: u.special_abilities as unknown as Database['public']['Tables']['unit_instances']['Insert']['special_abilities'],
        })))
        .select();
      
      if (error) throw error;
      return data as unknown as UnitInstance[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unit-instances'] });
      toast.success(`${data.length} unidades criadas!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar unidades: ${error.message}`);
    },
  });
};
