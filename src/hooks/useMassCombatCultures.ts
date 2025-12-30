import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MassCombatCulture } from '@/types/combat/mass-combat-culture';

export function useMassCombatCultures() {
  const [cultures, setCultures] = useState<MassCombatCulture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCultures = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mass_combat_cultures')
        .select('*')
        .order('name');

      if (error) throw error;
      setCultures(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar culturas');
    } finally {
      setLoading(false);
    }
  };

  const createCulture = async (culture: Omit<MassCombatCulture, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('mass_combat_cultures')
      .insert(culture)
      .select()
      .single();

    if (error) throw error;
    await fetchCultures();
    return data;
  };

  const updateCulture = async (id: string, updates: Partial<MassCombatCulture>) => {
    const { data, error } = await supabase
      .from('mass_combat_cultures')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchCultures();
    return data;
  };

  const deleteCulture = async (id: string) => {
    const { error } = await supabase
      .from('mass_combat_cultures')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchCultures();
  };

  useEffect(() => {
    fetchCultures();
  }, []);

  return {
    cultures,
    loading,
    error,
    fetchCultures,
    createCulture,
    updateCulture,
    deleteCulture,
  };
}
