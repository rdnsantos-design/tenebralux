import { useState, useEffect, useCallback } from 'react';
import { SavedCharacter, CharacterListFilters } from '@/types/character-storage';
import { CharacterDraft } from '@/types/character-builder';
import {
  getAllCharacters,
  getCharacterById,
  saveCharacter,
  deleteCharacter,
  duplicateCharacter,
  filterCharacters,
  importCharacters,
  downloadExportFile,
  getStorageStats,
} from '@/services/storage/characterStorage';

interface UseCharacterStorageReturn {
  // Estado
  characters: SavedCharacter[];
  filteredCharacters: SavedCharacter[];
  isLoading: boolean;
  error: string | null;
  stats: { count: number; maxCount: number; storageUsed: string };

  // Filtros
  filters: CharacterListFilters;
  setFilters: (filters: CharacterListFilters) => void;

  // CRUD
  loadCharacters: () => void;
  getCharacter: (id: string) => SavedCharacter | null;
  save: (draft: CharacterDraft, existingId?: string) => Promise<SavedCharacter>;
  remove: (id: string) => Promise<boolean>;
  duplicate: (id: string) => Promise<SavedCharacter>;

  // Import/Export
  exportAll: () => void;
  exportSelected: (ids: string[]) => void;
  importFromJson: (json: string) => Promise<{ imported: number; skipped: number; errors: string[] }>;
}

export function useCharacterStorage(): UseCharacterStorageReturn {
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CharacterListFilters>({
    theme: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // Carregar personagens
  const loadCharacters = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = getAllCharacters();
      setCharacters(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar na montagem
  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  // Personagens filtrados
  const filteredCharacters = filterCharacters(characters, filters);

  // Stats
  const stats = getStorageStats();

  // Get single
  const getCharacter = useCallback((id: string) => {
    return getCharacterById(id);
  }, []);

  // Save
  const save = useCallback(async (draft: CharacterDraft, existingId?: string) => {
    setError(null);
    try {
      const saved = saveCharacter(draft, existingId);
      loadCharacters();
      return saved;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar';
      setError(message);
      throw err;
    }
  }, [loadCharacters]);

  // Delete
  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      const result = deleteCharacter(id);
      if (result) {
        loadCharacters();
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar';
      setError(message);
      throw err;
    }
  }, [loadCharacters]);

  // Duplicate
  const duplicate = useCallback(async (id: string) => {
    setError(null);
    try {
      const duplicated = duplicateCharacter(id);
      loadCharacters();
      return duplicated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao duplicar';
      setError(message);
      throw err;
    }
  }, [loadCharacters]);

  // Export all
  const exportAll = useCallback(() => {
    downloadExportFile();
  }, []);

  // Export selected
  const exportSelected = useCallback((ids: string[]) => {
    downloadExportFile(ids);
  }, []);

  // Import
  const importFromJson = useCallback(async (json: string) => {
    setError(null);
    try {
      const result = importCharacters(json);
      loadCharacters();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao importar';
      setError(message);
      throw err;
    }
  }, [loadCharacters]);

  return {
    characters,
    filteredCharacters,
    isLoading,
    error,
    stats,
    filters,
    setFilters,
    loadCharacters,
    getCharacter,
    save,
    remove,
    duplicate,
    exportAll,
    exportSelected,
    importFromJson,
  };
}
