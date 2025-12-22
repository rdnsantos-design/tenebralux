import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FieldCommander } from '@/types/FieldCommander';
import { toast } from 'sonner';

export function useFieldCommanders() {
  const [commanders, setCommanders] = useState<FieldCommander[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommanders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('field_commanders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCommanders(data as FieldCommander[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar comandantes';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const createCommander = async (commander: Omit<FieldCommander, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error: insertError } = await supabase
        .from('field_commanders')
        .insert([commander]);

      if (insertError) throw insertError;

      toast.success('Comandante criado com sucesso!');
      await fetchCommanders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar comandante';
      toast.error(message);
      throw err;
    }
  };

  const updateCommander = async (id: string, updates: Partial<FieldCommander>) => {
    try {
      const { error: updateError } = await supabase
        .from('field_commanders')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Comandante atualizado com sucesso!');
      await fetchCommanders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar comandante';
      toast.error(message);
      throw err;
    }
  };

  const deleteCommander = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('field_commanders')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Comandante removido com sucesso!');
      await fetchCommanders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover comandante';
      toast.error(message);
      throw err;
    }
  };

  const evolveCommander = async (id: string, updates: Partial<FieldCommander>) => {
    try {
      const { error: updateError } = await supabase
        .from('field_commanders')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Comandante evoluído com sucesso!');
      await fetchCommanders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao evoluir comandante';
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchCommanders();
  }, []);

  return {
    commanders,
    loading,
    error,
    fetchCommanders,
    createCommander,
    updateCommander,
    deleteCommander,
    evolveCommander
  };
}
