import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RpgSkill {
  id: string;
  name: string;
  attribute_id: string;
  description: string;
  theme: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RpgSkillSpecialization {
  id: string;
  skill_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useRpgSkills(theme?: string) {
  return useQuery({
    queryKey: ['rpg-skills', theme],
    queryFn: async () => {
      let query = supabase
        .from('rpg_skills')
        .select('*')
        .order('attribute_id')
        .order('sort_order');
      
      if (theme) {
        query = query.eq('theme', theme);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RpgSkill[];
    },
  });
}

export function useRpgSkillSpecializations(skillId?: string) {
  return useQuery({
    queryKey: ['rpg-skill-specializations', skillId],
    queryFn: async () => {
      let query = supabase
        .from('rpg_skill_specializations')
        .select('*')
        .order('sort_order');
      
      if (skillId) {
        query = query.eq('skill_id', skillId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RpgSkillSpecialization[];
    },
  });
}

export function useUpdateRpgSkill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (skill: Partial<RpgSkill> & { id: string }) => {
      const { data, error } = await supabase
        .from('rpg_skills')
        .update({
          name: skill.name,
          description: skill.description,
          attribute_id: skill.attribute_id,
          sort_order: skill.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', skill.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg-skills'] });
      toast.success('Perícia atualizada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar perícia: ' + error.message);
    },
  });
}

export function useCreateRpgSkill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (skill: Omit<RpgSkill, 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('rpg_skills')
        .insert({
          id: skill.id,
          name: skill.name,
          description: skill.description,
          attribute_id: skill.attribute_id,
          theme: skill.theme,
          sort_order: skill.sort_order,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg-skills'] });
      toast.success('Perícia criada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar perícia: ' + error.message);
    },
  });
}

export function useDeleteRpgSkill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rpg_skills')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg-skills'] });
      toast.success('Perícia excluída com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir perícia: ' + error.message);
    },
  });
}

// Specializations CRUD
export function useCreateRpgSpecialization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (spec: Omit<RpgSkillSpecialization, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('rpg_skill_specializations')
        .insert({
          skill_id: spec.skill_id,
          name: spec.name,
          description: spec.description,
          sort_order: spec.sort_order,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg-skill-specializations'] });
      toast.success('Especialização criada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar especialização: ' + error.message);
    },
  });
}

export function useUpdateRpgSpecialization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (spec: Partial<RpgSkillSpecialization> & { id: string }) => {
      const { data, error } = await supabase
        .from('rpg_skill_specializations')
        .update({
          name: spec.name,
          description: spec.description,
          sort_order: spec.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', spec.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg-skill-specializations'] });
      toast.success('Especialização atualizada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar especialização: ' + error.message);
    },
  });
}

export function useDeleteRpgSpecialization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rpg_skill_specializations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg-skill-specializations'] });
      toast.success('Especialização excluída com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir especialização: ' + error.message);
    },
  });
}
