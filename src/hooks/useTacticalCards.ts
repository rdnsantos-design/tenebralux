import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TacticalCard, TacticalCardType, TacticalCardSubtype, TacticalCulture, UnitType } from '@/types/TacticalCard';
import { toast } from 'sonner';

export function useTacticalCards() {
  const [cards, setCards] = useState<TacticalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tactical_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database rows to TacticalCard type
      const transformedCards: TacticalCard[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        card_type: row.card_type as TacticalCardType,
        subtype: row.subtype as TacticalCardSubtype,
        affected_unit_types: (row.affected_unit_types || []) as UnitType[],
        attack_bonus: row.attack_bonus,
        defense_bonus: row.defense_bonus,
        ranged_bonus: row.ranged_bonus,
        morale_bonus: row.morale_bonus,
        extra_pressure_damage: row.extra_pressure_damage,
        extra_lethal_damage: row.extra_lethal_damage,
        ignores_pressure: row.ignores_pressure,
        targets_outside_commander_unit: row.targets_outside_commander_unit,
        affects_enemy_unit: row.affects_enemy_unit,
        requires_specialization: row.requires_specialization,
        required_command: row.required_command,
        bonus_cultures: (row.bonus_cultures || []) as TacticalCulture[],
        penalty_cultures: (row.penalty_cultures || []) as TacticalCulture[],
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      setCards(transformedCards);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar cartas';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCard = async (card: Omit<TacticalCard, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tactical_cards')
        .insert({
          name: card.name,
          description: card.description,
          card_type: card.card_type,
          subtype: card.subtype,
          affected_unit_types: card.affected_unit_types,
          attack_bonus: card.attack_bonus,
          defense_bonus: card.defense_bonus,
          ranged_bonus: card.ranged_bonus,
          morale_bonus: card.morale_bonus,
          extra_pressure_damage: card.extra_pressure_damage,
          extra_lethal_damage: card.extra_lethal_damage,
          ignores_pressure: card.ignores_pressure,
          targets_outside_commander_unit: card.targets_outside_commander_unit,
          affects_enemy_unit: card.affects_enemy_unit,
          requires_specialization: card.requires_specialization,
          required_command: card.required_command,
          bonus_cultures: card.bonus_cultures,
          penalty_cultures: card.penalty_cultures,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Carta criada com sucesso!');
      await fetchCards();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar carta';
      toast.error(message);
      throw err;
    }
  };

  const updateCard = async (id: string, card: Partial<TacticalCard>) => {
    try {
      const { error } = await supabase
        .from('tactical_cards')
        .update({
          name: card.name,
          description: card.description,
          card_type: card.card_type,
          subtype: card.subtype,
          affected_unit_types: card.affected_unit_types,
          attack_bonus: card.attack_bonus,
          defense_bonus: card.defense_bonus,
          ranged_bonus: card.ranged_bonus,
          morale_bonus: card.morale_bonus,
          extra_pressure_damage: card.extra_pressure_damage,
          extra_lethal_damage: card.extra_lethal_damage,
          ignores_pressure: card.ignores_pressure,
          targets_outside_commander_unit: card.targets_outside_commander_unit,
          affects_enemy_unit: card.affects_enemy_unit,
          requires_specialization: card.requires_specialization,
          required_command: card.required_command,
          bonus_cultures: card.bonus_cultures,
          penalty_cultures: card.penalty_cultures,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Carta atualizada com sucesso!');
      await fetchCards();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar carta';
      toast.error(message);
      throw err;
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tactical_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Carta excluída com sucesso!');
      await fetchCards();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir carta';
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    error,
    fetchCards,
    createCard,
    updateCard,
    deleteCard,
  };
}
