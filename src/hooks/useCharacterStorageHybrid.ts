import { useState, useEffect, useCallback } from 'react';
import { SavedCharacter, CharacterListFilters } from '@/types/character-storage';
import { CharacterDraft } from '@/types/character-builder';
import { useAuth } from '@/contexts/AuthContext';

// Serviços locais
import * as localService from '@/services/storage/characterStorage';

// Serviços cloud
import * as cloudService from '@/services/cloud/characterCloudService';

type StorageMode = 'local' | 'cloud' | 'hybrid';

interface UseCharacterStorageHybridReturn {
  // Estado
  characters: SavedCharacter[];
  filteredCharacters: SavedCharacter[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  storageMode: StorageMode;

  // Filtros
  filters: CharacterListFilters;
  setFilters: (filters: CharacterListFilters) => void;

  // CRUD
  loadCharacters: () => Promise<void>;
  getCharacter: (id: string) => Promise<SavedCharacter | null>;
  save: (draft: CharacterDraft, existingId?: string) => Promise<SavedCharacter>;
  remove: (id: string) => Promise<boolean>;
  duplicate: (id: string) => Promise<SavedCharacter>;

  // Cloud específico
  share: (id: string) => Promise<string>;
  unshare: (id: string) => Promise<void>;
  fetchShared: (code: string) => Promise<SavedCharacter | null>;
  syncNow: () => Promise<{ synced: number; errors: string[] }>;

  // Import/Export (local)
  exportAll: () => void;
  importFromJson: (json: string) => Promise<{ imported: number; skipped: number; errors: string[] }>;
}

export function useCharacterStorageHybrid(): UseCharacterStorageHybridReturn {
  const { user, isAuthenticated } = useAuth();
  
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CharacterListFilters>({
    theme: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // Determinar modo de storage
  const storageMode: StorageMode = isAuthenticated ? 'cloud' : 'local';

  // ═══════════════════════════════════════════════════════════════
  // CARREGAR PERSONAGENS
  // ═══════════════════════════════════════════════════════════════

  const loadCharacters = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (storageMode === 'cloud') {
        const cloudChars = await cloudService.fetchAllCharacters();
        setCharacters(cloudChars);
      } else {
        const localChars = localService.getAllCharacters();
        setCharacters(localChars);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
      // Fallback para local em caso de erro
      const localChars = localService.getAllCharacters();
      setCharacters(localChars);
    } finally {
      setIsLoading(false);
    }
  }, [storageMode]);

  // Carregar na montagem e quando auth muda
  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  // ═══════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════

  const getCharacter = useCallback(async (id: string) => {
    if (storageMode === 'cloud') {
      return cloudService.fetchCharacterById(id);
    }
    return localService.getCharacterById(id);
  }, [storageMode]);

  const save = useCallback(async (draft: CharacterDraft, existingId?: string) => {
    setError(null);

    try {
      let saved: SavedCharacter;

      if (storageMode === 'cloud' && user) {
        if (existingId) {
          saved = await cloudService.updateCharacter(existingId, draft);
        } else {
          saved = await cloudService.createCharacter(draft, user.id);
        }
      } else {
        saved = localService.saveCharacter(draft, existingId);
      }

      await loadCharacters();
      return saved;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar';
      setError(message);
      throw err;
    }
  }, [storageMode, user, loadCharacters]);

  const remove = useCallback(async (id: string) => {
    setError(null);

    try {
      if (storageMode === 'cloud') {
        await cloudService.deleteCharacter(id);
      } else {
        localService.deleteCharacter(id);
      }

      await loadCharacters();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar';
      setError(message);
      throw err;
    }
  }, [storageMode, loadCharacters]);

  const duplicate = useCallback(async (id: string) => {
    const original = await getCharacter(id);
    if (!original) throw new Error('Personagem não encontrado');

    const duplicatedDraft: CharacterDraft = {
      ...original.data,
      name: `${original.name} (Cópia)`,
    };

    return save(duplicatedDraft);
  }, [getCharacter, save]);

  // ═══════════════════════════════════════════════════════════════
  // COMPARTILHAMENTO (CLOUD ONLY)
  // ═══════════════════════════════════════════════════════════════

  const share = useCallback(async (id: string) => {
    if (storageMode !== 'cloud') {
      throw new Error('Compartilhamento requer login');
    }
    return cloudService.shareCharacter(id);
  }, [storageMode]);

  const unshare = useCallback(async (id: string) => {
    if (storageMode !== 'cloud') {
      throw new Error('Requer login');
    }
    return cloudService.unshareCharacter(id);
  }, [storageMode]);

  const fetchShared = useCallback(async (code: string) => {
    return cloudService.fetchByShareCode(code);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // SINCRONIZAÇÃO
  // ═══════════════════════════════════════════════════════════════

  const syncNow = useCallback(async () => {
    if (!user) {
      throw new Error('Login necessário para sincronizar');
    }

    setIsSyncing(true);
    setError(null);

    try {
      // Pegar personagens locais
      const localChars = localService.getAllCharacters();
      
      // Sincronizar para cloud
      const result = await cloudService.syncFromLocal(localChars, user.id);

      // Recarregar do cloud
      await loadCharacters();

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao sincronizar';
      setError(message);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [user, loadCharacters]);

  // ═══════════════════════════════════════════════════════════════
  // IMPORT/EXPORT (LOCAL)
  // ═══════════════════════════════════════════════════════════════

  const exportAll = useCallback(() => {
    localService.downloadExportFile();
  }, []);

  const importFromJson = useCallback(async (json: string) => {
    const result = localService.importCharacters(json);
    await loadCharacters();
    return result;
  }, [loadCharacters]);

  // ═══════════════════════════════════════════════════════════════
  // FILTROS
  // ═══════════════════════════════════════════════════════════════

  const filteredCharacters = localService.filterCharacters(characters, filters);

  return {
    characters,
    filteredCharacters,
    isLoading,
    isSyncing,
    error,
    storageMode,
    filters,
    setFilters,
    loadCharacters,
    getCharacter,
    save,
    remove,
    duplicate,
    share,
    unshare,
    fetchShared,
    syncNow,
    exportAll,
    importFromJson,
  };
}
