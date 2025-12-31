import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { 
  CharacterCard, 
  CharacterAbility, 
  SystemConfig,
  DEFAULT_CONFIG,
  CharacterType,
  Specialty,
  PassiveBonusType
} from '@/types/CharacterCard';
import { toast } from 'sonner';

export function useCharacterCards() {
  const [cards, setCards] = useState<CharacterCard[]>([]);
  const [abilities, setAbilities] = useState<CharacterAbility[]>([]);
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all character cards
  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('character_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedCards: CharacterCard[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        character_type: (row.character_type || []) as CharacterType[],
        culture: row.culture,
        is_pc: row.is_pc ?? false,
        player_name: row.player_name,
        regent_id: row.regent_id,
        comando: row.comando,
        estrategia: row.estrategia,
        guarda: row.guarda,
        passive_bonus_type: row.passive_bonus_type as PassiveBonusType | undefined,
        passive_bonus_value: row.passive_bonus_value || 0,
        passive_affects_area: row.passive_affects_area || false,
        specialties: (row.specialties || []) as Specialty[],
        ability_id: row.ability_id,
        custom_ability_name: row.custom_ability_name,
        custom_ability_description: row.custom_ability_description,
        custom_ability_power_cost: Number(row.custom_ability_power_cost) || 0,
        total_power_cost: Number(row.total_power_cost) || 0,
        power_cost_override: row.power_cost_override ? Number(row.power_cost_override) : undefined,
        portrait_url: row.portrait_url,
        coat_of_arms_url: row.coat_of_arms_url,
        domain: row.domain,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      setCards(transformedCards);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar personagens';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all abilities
  const fetchAbilities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('character_abilities')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const transformedAbilities: CharacterAbility[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        ability_type: row.ability_type as CharacterAbility['ability_type'],
        effect_type: row.effect_type as CharacterAbility['effect_type'],
        affected_attribute: row.affected_attribute,
        attribute_modifier: row.attribute_modifier || 0,
        conditional_type: row.conditional_type as CharacterAbility['conditional_type'],
        conditional_description: row.conditional_description,
        range_type: row.range_type as CharacterAbility['range_type'],
        base_power_cost: Number(row.base_power_cost) || 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      setAbilities(transformedAbilities);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar habilidades';
      toast.error(message);
    }
  }, []);

  // Fetch system configuration
  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('character_system_config')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const configMap: Record<string, unknown> = {};
        data.forEach(row => {
          configMap[row.config_key] = row.config_value;
        });

        setConfig({
          attribute_costs: configMap.attribute_costs as SystemConfig['attribute_costs'] || DEFAULT_CONFIG.attribute_costs,
          passive_bonus_costs: configMap.passive_bonus_costs as SystemConfig['passive_bonus_costs'] || DEFAULT_CONFIG.passive_bonus_costs,
          passive_area_cost: Number(configMap.passive_area_cost) || DEFAULT_CONFIG.passive_area_cost,
          conditional_discounts: configMap.conditional_discounts as SystemConfig['conditional_discounts'] || DEFAULT_CONFIG.conditional_discounts,
          ability_cost_rules: configMap.ability_cost_rules as SystemConfig['ability_cost_rules'] || DEFAULT_CONFIG.ability_cost_rules,
          cultures: (configMap.cultures as string[]) || DEFAULT_CONFIG.cultures,
          specialties: (configMap.specialties as string[]) || DEFAULT_CONFIG.specialties,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar configuração';
      toast.error(message);
    }
  }, []);

  // Create a new character card
  const createCard = async (card: Omit<CharacterCard, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('character_cards')
        .insert({
          name: card.name,
          character_type: card.character_type,
          culture: card.culture,
          is_pc: card.is_pc,
          player_name: card.player_name,
          regent_id: card.regent_id,
          comando: card.comando,
          estrategia: card.estrategia,
          guarda: card.guarda,
          passive_bonus_type: card.passive_bonus_type,
          passive_bonus_value: card.passive_bonus_value,
          passive_affects_area: card.passive_affects_area,
          specialties: card.specialties,
          ability_id: card.ability_id,
          custom_ability_name: card.custom_ability_name,
          custom_ability_description: card.custom_ability_description,
          custom_ability_power_cost: card.custom_ability_power_cost,
          total_power_cost: card.total_power_cost,
          power_cost_override: card.power_cost_override,
          portrait_url: card.portrait_url,
          coat_of_arms_url: card.coat_of_arms_url,
          domain: card.domain,
          notes: card.notes,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Personagem criado com sucesso!');
      await fetchCards();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar personagem';
      toast.error(message);
      throw err;
    }
  };

  // Update a character card
  const updateCard = async (id: string, card: Partial<CharacterCard>) => {
    try {
      const { error } = await supabase
        .from('character_cards')
        .update({
          name: card.name,
          character_type: card.character_type,
          culture: card.culture,
          is_pc: card.is_pc,
          player_name: card.player_name,
          regent_id: card.regent_id,
          comando: card.comando,
          estrategia: card.estrategia,
          guarda: card.guarda,
          passive_bonus_type: card.passive_bonus_type,
          passive_bonus_value: card.passive_bonus_value,
          passive_affects_area: card.passive_affects_area,
          specialties: card.specialties,
          ability_id: card.ability_id,
          custom_ability_name: card.custom_ability_name,
          custom_ability_description: card.custom_ability_description,
          custom_ability_power_cost: card.custom_ability_power_cost,
          total_power_cost: card.total_power_cost,
          power_cost_override: card.power_cost_override,
          portrait_url: card.portrait_url,
          coat_of_arms_url: card.coat_of_arms_url,
          domain: card.domain,
          notes: card.notes,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Personagem atualizado com sucesso!');
      await fetchCards();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar personagem';
      toast.error(message);
      throw err;
    }
  };

  // Delete a character card
  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('character_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Personagem excluído com sucesso!');
      await fetchCards();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir personagem';
      toast.error(message);
      throw err;
    }
  };

  // Create a new ability
  const createAbility = async (ability: Omit<CharacterAbility, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('character_abilities')
        .insert({
          name: ability.name,
          description: ability.description,
          ability_type: ability.ability_type,
          effect_type: ability.effect_type,
          affected_attribute: ability.affected_attribute,
          attribute_modifier: ability.attribute_modifier,
          conditional_type: ability.conditional_type,
          conditional_description: ability.conditional_description,
          range_type: ability.range_type,
          base_power_cost: ability.base_power_cost,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Habilidade criada com sucesso!');
      await fetchAbilities();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar habilidade';
      toast.error(message);
      throw err;
    }
  };

  // Update an ability
  const updateAbility = async (id: string, ability: Partial<CharacterAbility>) => {
    try {
      const { error } = await supabase
        .from('character_abilities')
        .update({
          name: ability.name,
          description: ability.description,
          ability_type: ability.ability_type,
          effect_type: ability.effect_type,
          affected_attribute: ability.affected_attribute,
          attribute_modifier: ability.attribute_modifier,
          conditional_type: ability.conditional_type,
          conditional_description: ability.conditional_description,
          range_type: ability.range_type,
          base_power_cost: ability.base_power_cost,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Habilidade atualizada com sucesso!');
      await fetchAbilities();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar habilidade';
      toast.error(message);
      throw err;
    }
  };

  // Delete an ability
  const deleteAbility = async (id: string) => {
    try {
      const { error } = await supabase
        .from('character_abilities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Habilidade excluída com sucesso!');
      await fetchAbilities();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir habilidade';
      toast.error(message);
      throw err;
    }
  };

  // Update system configuration
  const updateConfig = async (key: string, value: Json) => {
    try {
      const { error } = await supabase
        .from('character_system_config')
        .update({ config_value: value })
        .eq('config_key', key);

      if (error) throw error;

      toast.success('Configuração atualizada com sucesso!');
      await fetchConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar configuração';
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    Promise.all([fetchCards(), fetchAbilities(), fetchConfig()]);
  }, [fetchCards, fetchAbilities, fetchConfig]);

  return {
    cards,
    abilities,
    config,
    loading,
    error,
    fetchCards,
    fetchAbilities,
    fetchConfig,
    createCard,
    updateCard,
    deleteCard,
    createAbility,
    updateAbility,
    deleteAbility,
    updateConfig,
  };
}
