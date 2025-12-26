import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MassCombatTacticalCard, MassCombatUnitType, calculateMassCombatVetCost } from '@/types/MassCombatTacticalCard';
import { toast } from 'sonner';

export function useMassCombatTacticalCards() {
  const [cards, setCards] = useState<MassCombatTacticalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mass_combat_tactical_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedCards: MassCombatTacticalCard[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        unit_type: row.unit_type as MassCombatUnitType,
        attack_bonus: row.attack_bonus,
        defense_bonus: row.defense_bonus,
        mobility_bonus: row.mobility_bonus,
        command_required: row.command_required,
        strategy_required: row.strategy_required,
        culture: row.culture,
        description: row.description,
        vet_cost: row.vet_cost,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      setCards(transformedCards);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar cartas táticas';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCard = async (card: Omit<MassCombatTacticalCard, 'id' | 'created_at' | 'updated_at' | 'vet_cost'>) => {
    try {
      const vetCost = calculateMassCombatVetCost(card);
      
      const { data, error } = await supabase
        .from('mass_combat_tactical_cards')
        .insert({
          name: card.name,
          unit_type: card.unit_type,
          attack_bonus: card.attack_bonus,
          defense_bonus: card.defense_bonus,
          mobility_bonus: card.mobility_bonus,
          command_required: card.command_required,
          strategy_required: card.strategy_required,
          culture: card.culture || null,
          description: card.description || null,
          vet_cost: vetCost,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Carta tática criada com sucesso!');
      await fetchCards();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar carta tática';
      toast.error(message);
      throw err;
    }
  };

  const updateCard = async (id: string, card: Partial<MassCombatTacticalCard>) => {
    try {
      const vetCost = calculateMassCombatVetCost(card);
      
      const { error } = await supabase
        .from('mass_combat_tactical_cards')
        .update({
          name: card.name,
          unit_type: card.unit_type,
          attack_bonus: card.attack_bonus,
          defense_bonus: card.defense_bonus,
          mobility_bonus: card.mobility_bonus,
          command_required: card.command_required,
          strategy_required: card.strategy_required,
          culture: card.culture || null,
          description: card.description || null,
          vet_cost: vetCost,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Carta tática atualizada com sucesso!');
      await fetchCards();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar carta tática';
      toast.error(message);
      throw err;
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mass_combat_tactical_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Carta tática excluída com sucesso!');
      await fetchCards();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir carta tática';
      toast.error(message);
      throw err;
    }
  };

  const duplicateCard = async (card: MassCombatTacticalCard) => {
    const newCard = {
      name: `${card.name} (Cópia)`,
      unit_type: card.unit_type,
      attack_bonus: card.attack_bonus,
      defense_bonus: card.defense_bonus,
      mobility_bonus: card.mobility_bonus,
      command_required: card.command_required,
      strategy_required: card.strategy_required,
      culture: card.culture,
      description: card.description,
    };
    return createCard(newCard);
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
    duplicateCard,
  };
}
