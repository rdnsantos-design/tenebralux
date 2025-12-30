import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MassCombatCommanderTemplate {
  id: string;
  numero: number;
  comando: number;
  estrategia: number;
  guarda: number;
  especializacao: string;
  custo_vet: number;
  created_at?: string;
  updated_at?: string;
}

export function useMassCombatCommanderTemplates() {
  const [templates, setTemplates] = useState<MassCombatCommanderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('mass_combat_commander_templates')
        .select('*')
        .order('numero', { ascending: true });

      if (fetchError) throw fetchError;

      setTemplates(data as MassCombatCommanderTemplate[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar templates';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (template: Omit<MassCombatCommanderTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error: insertError } = await supabase
        .from('mass_combat_commander_templates')
        .insert([template]);

      if (insertError) throw insertError;

      toast.success('Template criado com sucesso!');
      await fetchTemplates();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar template';
      toast.error(message);
      throw err;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<MassCombatCommanderTemplate>) => {
    try {
      const { error: updateError } = await supabase
        .from('mass_combat_commander_templates')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Template atualizado com sucesso!');
      await fetchTemplates();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar template';
      toast.error(message);
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('mass_combat_commander_templates')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Template removido com sucesso!');
      await fetchTemplates();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover template';
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate
  };
}
