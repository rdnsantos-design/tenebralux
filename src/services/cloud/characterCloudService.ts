import { supabase } from '@/integrations/supabase/client';
import { CharacterDraft } from '@/types/character-builder';
import { SavedCharacter } from '@/types/character-storage';
import { Json } from '@/integrations/supabase/types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface CharacterRow {
  id: string;
  user_id: string;
  name: string;
  theme: string;
  faction_id: string | null;
  culture_id: string | null;
  data: Json;
  is_public: boolean;
  share_code: string | null;
  created_at: string;
  updated_at: string;
}

interface CharacterInsert {
  id?: string;
  user_id: string;
  name: string;
  theme: string;
  faction_id?: string | null;
  culture_id?: string | null;
  data: Json;
  is_public?: boolean;
  share_code?: string | null;
}

interface CharacterUpdate {
  name?: string;
  theme?: string;
  faction_id?: string | null;
  culture_id?: string | null;
  data?: Json;
  is_public?: boolean;
  share_code?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// CONVERSÃO LOCAL ↔ CLOUD
// ═══════════════════════════════════════════════════════════════

export function localToCloud(
  local: SavedCharacter,
  userId: string
): CharacterInsert {
  return {
    id: local.id,
    user_id: userId,
    name: local.name,
    theme: local.theme,
    faction_id: local.factionId || null,
    culture_id: local.cultureId || null,
    data: JSON.parse(JSON.stringify(local.data)) as Json,
    is_public: false,
  };
}

export function cloudToLocal(cloud: CharacterRow): SavedCharacter {
  return {
    id: cloud.id,
    name: cloud.name,
    theme: cloud.theme as 'akashic' | 'tenebralux',
    factionId: cloud.faction_id || '',
    cultureId: cloud.culture_id || undefined,
    createdAt: cloud.created_at,
    updatedAt: cloud.updated_at,
    data: cloud.data as CharacterDraft,
  };
}

// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════

export async function fetchAllCharacters(): Promise<SavedCharacter[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(row => cloudToLocal(row as CharacterRow));
}

export async function fetchCharacterById(id: string): Promise<SavedCharacter | null> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(error.message);
  }

  return data ? cloudToLocal(data as CharacterRow) : null;
}

export async function createCharacter(
  draft: CharacterDraft,
  userId: string
): Promise<SavedCharacter> {
  const insert: CharacterInsert = {
    user_id: userId,
    name: draft.name || 'Sem Nome',
    theme: draft.theme || 'akashic',
    faction_id: draft.factionId || null,
    culture_id: draft.culture || null,
    data: JSON.parse(JSON.stringify(draft)) as Json,
  };

  const { data, error } = await supabase
    .from('characters')
    .insert([insert])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return cloudToLocal(data as CharacterRow);
}

export async function updateCharacter(
  id: string,
  draft: CharacterDraft
): Promise<SavedCharacter> {
  const updateData = {
    name: draft.name || 'Sem Nome',
    theme: draft.theme,
    faction_id: draft.factionId || null,
    culture_id: draft.culture || null,
    data: JSON.parse(JSON.stringify(draft)) as Json,
  };

  const { data, error } = await supabase
    .from('characters')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return cloudToLocal(data as CharacterRow);
}

export async function deleteCharacter(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}

// ═══════════════════════════════════════════════════════════════
// COMPARTILHAMENTO
// ═══════════════════════════════════════════════════════════════

export async function shareCharacter(id: string): Promise<string> {
  // Gerar código único via função do banco
  const { data: code, error: rpcError } = await supabase.rpc('generate_share_code');
  
  if (rpcError) throw new Error(rpcError.message);

  const { error } = await supabase
    .from('characters')
    .update({ share_code: code })
    .eq('id', id);

  if (error) throw new Error(error.message);
  return code;
}

export async function unshareCharacter(id: string): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ share_code: null })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function fetchByShareCode(code: string): Promise<SavedCharacter | null> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('share_code', code.toUpperCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return data ? cloudToLocal(data as CharacterRow) : null;
}

export async function togglePublic(id: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ is_public: isPublic })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ═══════════════════════════════════════════════════════════════
// SINCRONIZAÇÃO LOCAL ↔ CLOUD
// ═══════════════════════════════════════════════════════════════

export async function syncFromLocal(
  localCharacters: SavedCharacter[],
  userId: string
): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  for (const local of localCharacters) {
    try {
      // Verificar se já existe no cloud
      const existing = await fetchCharacterById(local.id);

      if (existing) {
        // Comparar timestamps
        const localDate = new Date(local.updatedAt);
        const cloudDate = new Date(existing.updatedAt);

        if (localDate > cloudDate) {
          await updateCharacter(local.id, local.data);
          synced++;
        }
      } else {
        // Criar no cloud
        const cloudChar = localToCloud(local, userId);
        await supabase.from('characters').insert([cloudChar]);
        synced++;
      }
    } catch (e) {
      errors.push(`${local.name}: ${e instanceof Error ? e.message : 'Erro'}`);
    }
  }

  return { synced, errors };
}

export async function syncToLocal(): Promise<SavedCharacter[]> {
  return fetchAllCharacters();
}
