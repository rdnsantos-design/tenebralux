/**
 * HOOKS UNIFICADOS PARA CARTAS
 * 
 * Fonte única para cartas usadas em todos os modos de jogo.
 * Mapeia dados do banco para os tipos unificados.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  UnifiedGameCard, 
  UnifiedCardGameMode,
  SkirmishModifiers,
  WarfareModifiers,
} from './types';

// === CONVERSORES ===

// Converte carta do banco (mass_combat_tactical_cards) para formato unificado
function dbToUnifiedCard(row: any): UnifiedGameCard {
  const gameModes: UnifiedCardGameMode[] = [];
  
  // Determina modos baseado em game_mode do banco
  if (row.game_mode === 'skirmish' || row.game_mode === 'board') {
    gameModes.push('skirmish');
  }
  if (row.game_mode === 'warfare' || row.game_mode === 'strategic') {
    gameModes.push('warfare');
  }
  if (row.game_mode === 'all') {
    gameModes.push('skirmish', 'warfare');
  }
  if (gameModes.length === 0) {
    gameModes.push('warfare'); // Default
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    gameModes,
    cardType: row.card_type || 'ofensiva',
    subtype: row.effect_type as UnifiedGameCard['subtype'],
    requirements: {
      command: row.command_required,
      strategy: row.strategy_required,
      culture: row.culture,
      unitType: row.unit_type,
    },
    skirmishBonuses: {
      attack: row.attack_bonus,
      defense: row.defense_bonus,
      mobility: row.mobility_bonus,
    },
    skirmishPenalties: {
      attack: row.attack_penalty,
      defense: row.defense_penalty,
      mobility: row.mobility_penalty,
    },
    warfareBonuses: {
      attack: row.attack_bonus,
      defense: row.defense_bonus,
      mobility: row.mobility_bonus,
    },
    warfarePenalties: {
      attack: row.attack_penalty,
      defense: row.defense_penalty,
      mobility: row.mobility_penalty,
    },
    effects: {
      minorEffect: row.minor_effect,
      majorEffect: row.major_effect,
      minorCondition: row.minor_condition,
      majorCondition: row.major_condition,
      effectTag: row.effect_tag,
      effectType: row.effect_type,
    },
    vetCost: row.vet_cost,
    vetCostOverride: row.vet_cost_override,
    affectedUnitTypes: row.unit_type ? [row.unit_type] : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Converte carta unificada para formato do banco
function unifiedToDbCard(card: Partial<UnifiedGameCard>) {
  // Determina game_mode baseado em gameModes
  let game_mode = 'strategic';
  if (card.gameModes?.includes('skirmish') && card.gameModes?.includes('warfare')) {
    game_mode = 'all';
  } else if (card.gameModes?.includes('skirmish')) {
    game_mode = 'board';
  } else if (card.gameModes?.includes('warfare')) {
    game_mode = 'strategic';
  }

  const bonuses = card.warfareBonuses || card.skirmishBonuses || {};
  const penalties = card.warfarePenalties || card.skirmishPenalties || {};

  return {
    name: card.name,
    description: card.description,
    game_mode,
    card_type: card.cardType || 'ofensiva',
    unit_type: card.requirements?.unitType || 'Geral',
    attack_bonus: bonuses.attack || 0,
    defense_bonus: bonuses.defense || 0,
    mobility_bonus: bonuses.mobility || 0,
    attack_penalty: penalties.attack || 0,
    defense_penalty: penalties.defense || 0,
    mobility_penalty: penalties.mobility || 0,
    command_required: card.requirements?.command || 1,
    strategy_required: card.requirements?.strategy || 0,
    culture: card.requirements?.culture,
    minor_effect: card.effects?.minorEffect,
    major_effect: card.effects?.majorEffect,
    minor_condition: card.effects?.minorCondition,
    major_condition: card.effects?.majorCondition,
    effect_tag: card.effects?.effectTag,
    effect_type: card.effects?.effectType || card.subtype,
    vet_cost: card.vetCost || 0,
    vet_cost_override: card.vetCostOverride,
  };
}

// === HOOKS ===

export function useUnifiedCards(mode?: UnifiedCardGameMode) {
  return useQuery({
    queryKey: ['unified-cards', mode],
    queryFn: async (): Promise<UnifiedGameCard[]> => {
      let query = supabase
        .from('mass_combat_tactical_cards')
        .select('*')
        .order('name');

      // Filtra por modo se especificado
      if (mode === 'skirmish') {
        query = query.in('game_mode', ['board', 'skirmish', 'all']);
      } else if (mode === 'warfare') {
        query = query.in('game_mode', ['strategic', 'warfare', 'all']);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(dbToUnifiedCard);
    },
  });
}

export function useUnifiedCardById(id: string | null) {
  return useQuery({
    queryKey: ['unified-card', id],
    queryFn: async (): Promise<UnifiedGameCard | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('mass_combat_tactical_cards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? dbToUnifiedCard(data) : null;
    },
    enabled: !!id,
  });
}

export function useCreateUnifiedCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (card: Omit<UnifiedGameCard, 'id' | 'created_at' | 'updated_at'>) => {
      const dbCard = unifiedToDbCard(card);

      const { data, error } = await supabase
        .from('mass_combat_tactical_cards')
        .insert(dbCard)
        .select()
        .single();

      if (error) throw error;
      return dbToUnifiedCard(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-cards'] });
    },
  });
}

export function useUpdateUnifiedCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...card }: Partial<UnifiedGameCard> & { id: string }) => {
      const dbCard = unifiedToDbCard(card);

      const { data, error } = await supabase
        .from('mass_combat_tactical_cards')
        .update(dbCard)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return dbToUnifiedCard(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-cards'] });
    },
  });
}

export function useDeleteUnifiedCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mass_combat_tactical_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-cards'] });
    },
  });
}

// === HELPERS ===

export function useCardsByUnitType(unitType: string) {
  const { data: cards = [] } = useUnifiedCards();
  return cards.filter(c => c.requirements?.unitType === unitType || c.requirements?.unitType === 'Geral');
}

export function useCardsByCulture(culture: string) {
  const { data: cards = [] } = useUnifiedCards();
  return cards.filter(c => !c.requirements?.culture || c.requirements.culture === culture);
}
