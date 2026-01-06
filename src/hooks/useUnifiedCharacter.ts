/**
 * Hook para gerenciamento de personagens unificados
 * Conecta Character (RPG) com projeções táticas e de domínio
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  UnifiedCharacter, 
  TacticalProjection, 
  DomainProjection,
  characterToUnified,
  generateTacticalProjection,
  generateDomainProjection,
  validateUnifiedCharacter
} from '@/core/types/unified-character';
import { Character, calculateDerivedStats, calculateRegencyStats } from '@/core/types/character';
import { ThemeId } from '@/themes/types';
import { Json } from '@/integrations/supabase/types';

// ============================================
// DATABASE CONVERSION
// ============================================

interface CharacterRow {
  id: string;
  name: string;
  theme: string;
  data: Json;
  user_id: string;
  faction_id?: string | null;
  culture_id?: string | null;
  is_public?: boolean | null;
  share_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

function dbRowToUnified(row: CharacterRow): UnifiedCharacter {
  const data = row.data as Record<string, unknown>;
  const theme = row.theme as ThemeId;
  
  // Extrair dados do JSON
  const attributes = data.attributes as UnifiedCharacter['attributes'];
  const skills = (data.skills as Record<string, number>) || {};
  const virtues = data.virtues as UnifiedCharacter['virtues'];
  const blessings = (data.blessings as UnifiedCharacter['blessings']) || [];
  const equipment = (data.equipment as UnifiedCharacter['equipment']) || [];
  
  // Calcular stats se tiver atributos
  let derivedStats: UnifiedCharacter['derivedStats'];
  let regencyStats: UnifiedCharacter['regencyStats'];
  let tactical: TacticalProjection | undefined;
  let domain: DomainProjection | undefined;
  
  if (attributes) {
    derivedStats = calculateDerivedStats(attributes, skills);
    regencyStats = calculateRegencyStats(attributes, skills, theme);
    
    // Gerar projeções automáticas
    tactical = generateTacticalProjection(
      regencyStats,
      derivedStats,
      row.culture_id || 'Anuire',
      data.tacticalOptions as Parameters<typeof generateTacticalProjection>[3]
    );
    
    domain = generateDomainProjection(
      regencyStats,
      data.domainOptions as Parameters<typeof generateDomainProjection>[1]
    );
  }
  
  return {
    id: row.id,
    name: row.name,
    theme,
    created_at: row.created_at || undefined,
    updated_at: row.updated_at || undefined,
    
    faction: row.faction_id || undefined,
    culture: row.culture_id || undefined,
    isPC: true,
    
    attributes,
    skills,
    virtues,
    blessings,
    equipment,
    
    derivedStats,
    regencyStats,
    tactical,
    domain,
    
    capabilities: {
      rpg: !!attributes,
      tactical: !!tactical,
      domain: !!domain,
      campaign: !!attributes,
    },
    
    portraitUrl: data.portraitUrl as string | undefined,
    coatOfArmsUrl: data.coatOfArmsUrl as string | undefined,
    notes: data.notes as string | undefined,
  };
}

function unifiedToDbRow(char: UnifiedCharacter, userId: string): Omit<CharacterRow, 'id'> & { id?: string } {
  const data: Record<string, unknown> = {
    attributes: char.attributes,
    skills: char.skills,
    virtues: char.virtues,
    blessings: char.blessings,
    equipment: char.equipment,
    experiencePoints: char.experiencePoints,
    portraitUrl: char.portraitUrl,
    coatOfArmsUrl: char.coatOfArmsUrl,
    notes: char.notes,
  };
  
  if (char.tactical) {
    data.tacticalOptions = {
      characterTypes: char.tactical.characterTypes,
      specialties: char.tactical.specialties,
      passiveBonus: char.tactical.passiveBonus,
      ability: typeof char.tactical.ability === 'string' 
        ? char.tactical.ability 
        : char.tactical.ability,
    };
  }
  
  if (char.domain) {
    data.domainOptions = {
      bloodlineStrength: char.domain.bloodlineStrength,
      bloodlineType: char.domain.bloodlineType,
      regencyPoints: char.domain.regencyPoints,
    };
  }
  
  return {
    id: char.id,
    name: char.name,
    theme: char.theme,
    user_id: userId,
    faction_id: char.faction,
    culture_id: char.culture,
    data: data as unknown as Json,
  };
}

// ============================================
// HOOKS
// ============================================

/**
 * Lista todos os personagens unificados do usuário
 */
export function useUnifiedCharacters() {
  return useQuery({
    queryKey: ['unified-characters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(dbRowToUnified);
    },
  });
}

/**
 * Busca um personagem unificado por ID
 */
export function useUnifiedCharacterById(id: string | undefined) {
  return useQuery({
    queryKey: ['unified-character', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return dbRowToUnified(data);
    },
    enabled: !!id,
  });
}

/**
 * Filtra personagens por capacidade
 */
export function useUnifiedCharactersByCapability(capability: keyof UnifiedCharacter['capabilities']) {
  const { data: characters, ...rest } = useUnifiedCharacters();
  
  const filtered = useMemo(() => {
    if (!characters) return [];
    return characters.filter(c => c.capabilities[capability]);
  }, [characters, capability]);
  
  return { data: filtered, ...rest };
}

/**
 * Personagens aptos para combate tático
 */
export function useTacticalCharacters() {
  return useUnifiedCharactersByCapability('tactical');
}

/**
 * Personagens aptos para domínio
 */
export function useDomainCharacters() {
  return useUnifiedCharactersByCapability('domain');
}

/**
 * Cria um novo personagem unificado
 */
export function useCreateUnifiedCharacter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (char: Omit<UnifiedCharacter, 'id'> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const newChar: UnifiedCharacter = {
        ...char,
        id: char.id || crypto.randomUUID(),
      };
      
      const validation = validateUnifiedCharacter(newChar);
      if (!validation.isValid) {
        throw new Error(validation.errors.map(e => e.message).join(', '));
      }
      
      const row = unifiedToDbRow(newChar, user.id);
      
      const { data, error } = await supabase
        .from('characters')
        .insert(row)
        .select()
        .single();
      
      if (error) throw error;
      return dbRowToUnified(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-characters'] });
    },
  });
}

/**
 * Atualiza um personagem unificado
 */
export function useUpdateUnifiedCharacter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UnifiedCharacter> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Buscar existente
      const { data: existing, error: fetchError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const current = dbRowToUnified(existing);
      const merged: UnifiedCharacter = { ...current, ...updates, id };
      
      const validation = validateUnifiedCharacter(merged);
      if (!validation.isValid) {
        throw new Error(validation.errors.map(e => e.message).join(', '));
      }
      
      const row = unifiedToDbRow(merged, user.id);
      
      const { data, error } = await supabase
        .from('characters')
        .update(row)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return dbRowToUnified(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['unified-characters'] });
      queryClient.invalidateQueries({ queryKey: ['unified-character', variables.id] });
    },
  });
}

/**
 * Deleta um personagem unificado
 */
export function useDeleteUnifiedCharacter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-characters'] });
    },
  });
}

/**
 * Recalcula projeções de um personagem
 */
export function useRecalculateProjections() {
  const updateMutation = useUpdateUnifiedCharacter();
  
  return useCallback(async (char: UnifiedCharacter) => {
    if (!char.attributes || !char.skills) {
      console.warn('Personagem não tem dados RPG para recalcular');
      return char;
    }
    
    const derivedStats = calculateDerivedStats(char.attributes, char.skills);
    const regencyStats = calculateRegencyStats(char.attributes, char.skills, char.theme);
    
    const tactical = char.capabilities.tactical
      ? generateTacticalProjection(regencyStats, derivedStats, char.culture || 'Anuire', {
          characterTypes: char.tactical?.characterTypes,
          specialties: char.tactical?.specialties,
          passiveBonus: char.tactical?.passiveBonus,
          ability: char.tactical?.ability,
        })
      : undefined;
    
    const domain = char.capabilities.domain
      ? generateDomainProjection(regencyStats, {
          bloodlineStrength: char.domain?.bloodlineStrength,
          bloodlineType: char.domain?.bloodlineType,
          regencyPoints: char.domain?.regencyPoints,
        })
      : undefined;
    
    return updateMutation.mutateAsync({
      id: char.id,
      derivedStats,
      regencyStats,
      tactical,
      domain,
    });
  }, [updateMutation]);
}
