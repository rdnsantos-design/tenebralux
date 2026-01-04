import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCharacterStorage } from '@/hooks/useCharacterStorage';
import * as characterStorage from '@/services/storage/characterStorage';
import { SavedCharacter } from '@/types/character-storage';
import { CharacterDraft } from '@/types/character-builder';

// Mock do serviço de storage
vi.mock('@/services/storage/characterStorage', () => ({
  getAllCharacters: vi.fn(),
  getCharacterById: vi.fn(),
  saveCharacter: vi.fn(),
  deleteCharacter: vi.fn(),
  duplicateCharacter: vi.fn(),
  filterCharacters: vi.fn(),
  importCharacters: vi.fn(),
  downloadExportFile: vi.fn(),
  getStorageStats: vi.fn(),
}));

// Helper para criar um personagem salvo
function createMockSavedCharacter(overrides: Partial<SavedCharacter> = {}): SavedCharacter {
  const now = new Date().toISOString();
  return {
    id: 'char-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Character',
    theme: 'akashic',
    factionId: 'faction-1',
    cultureId: 'culture-1',
    createdAt: now,
    updatedAt: now,
    data: {} as CharacterDraft,
    ...overrides,
  };
}

describe('useCharacterStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(characterStorage.getAllCharacters).mockReturnValue([]);
    vi.mocked(characterStorage.filterCharacters).mockImplementation((chars) => chars);
    vi.mocked(characterStorage.getStorageStats).mockReturnValue({
      count: 0,
      maxCount: 50,
      storageUsed: '0 Bytes',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // Estado Inicial
  // ═══════════════════════════════════════════════════════════════
  describe('Initial State', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useCharacterStorage());
      
      // Initially loading is true, then becomes false after effect
      expect(result.current.isLoading).toBe(false); // After initial load
    });

    it('should load characters on mount', () => {
      const mockChars = [createMockSavedCharacter()];
      vi.mocked(characterStorage.getAllCharacters).mockReturnValue(mockChars);

      const { result } = renderHook(() => useCharacterStorage());

      expect(characterStorage.getAllCharacters).toHaveBeenCalled();
      expect(result.current.characters).toEqual(mockChars);
    });

    it('should have default filter values', () => {
      const { result } = renderHook(() => useCharacterStorage());

      expect(result.current.filters).toEqual({
        theme: 'all',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
    });

    it('should have null error initially', () => {
      const { result } = renderHook(() => useCharacterStorage());
      expect(result.current.error).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // loadCharacters
  // ═══════════════════════════════════════════════════════════════
  describe('loadCharacters', () => {
    it('should update characters state', () => {
      const mockChars = [
        createMockSavedCharacter({ id: '1', name: 'Hero 1' }),
        createMockSavedCharacter({ id: '2', name: 'Hero 2' }),
      ];
      vi.mocked(characterStorage.getAllCharacters).mockReturnValue(mockChars);

      const { result } = renderHook(() => useCharacterStorage());

      act(() => {
        result.current.loadCharacters();
      });

      expect(result.current.characters).toHaveLength(2);
    });

    it('should set error on failure', () => {
      vi.mocked(characterStorage.getAllCharacters).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useCharacterStorage());

      expect(result.current.error).toBe('Storage error');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getCharacter
  // ═══════════════════════════════════════════════════════════════
  describe('getCharacter', () => {
    it('should return character by id', () => {
      const mockChar = createMockSavedCharacter({ id: 'target' });
      vi.mocked(characterStorage.getCharacterById).mockReturnValue(mockChar);

      const { result } = renderHook(() => useCharacterStorage());
      const found = result.current.getCharacter('target');

      expect(characterStorage.getCharacterById).toHaveBeenCalledWith('target');
      expect(found).toEqual(mockChar);
    });

    it('should return null when not found', () => {
      vi.mocked(characterStorage.getCharacterById).mockReturnValue(null);

      const { result } = renderHook(() => useCharacterStorage());
      const found = result.current.getCharacter('non-existent');

      expect(found).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // save
  // ═══════════════════════════════════════════════════════════════
  describe('save', () => {
    it('should save new character', async () => {
      const mockDraft = { name: 'New Hero' } as CharacterDraft;
      const mockSaved = createMockSavedCharacter({ name: 'New Hero' });
      vi.mocked(characterStorage.saveCharacter).mockReturnValue(mockSaved);

      const { result } = renderHook(() => useCharacterStorage());

      let saved: SavedCharacter | undefined;
      await act(async () => {
        saved = await result.current.save(mockDraft);
      });

      expect(characterStorage.saveCharacter).toHaveBeenCalledWith(mockDraft, undefined);
      expect(saved?.name).toBe('New Hero');
    });

    it('should update existing character', async () => {
      const mockDraft = { name: 'Updated' } as CharacterDraft;
      const mockSaved = createMockSavedCharacter({ id: 'existing', name: 'Updated' });
      vi.mocked(characterStorage.saveCharacter).mockReturnValue(mockSaved);

      const { result } = renderHook(() => useCharacterStorage());

      await act(async () => {
        await result.current.save(mockDraft, 'existing');
      });

      expect(characterStorage.saveCharacter).toHaveBeenCalledWith(mockDraft, 'existing');
    });

    it('should reload characters after save', async () => {
      vi.mocked(characterStorage.saveCharacter).mockReturnValue(createMockSavedCharacter());

      const { result } = renderHook(() => useCharacterStorage());
      
      const initialCallCount = vi.mocked(characterStorage.getAllCharacters).mock.calls.length;

      await act(async () => {
        await result.current.save({} as CharacterDraft);
      });

      expect(characterStorage.getAllCharacters).toHaveBeenCalledTimes(initialCallCount + 1);
    });

    it('should set error on save failure', async () => {
      vi.mocked(characterStorage.saveCharacter).mockImplementation(() => {
        throw new Error('Save failed');
      });

      const { result } = renderHook(() => useCharacterStorage());

      await act(async () => {
        try {
          await result.current.save({} as CharacterDraft);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Save failed');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // remove
  // ═══════════════════════════════════════════════════════════════
  describe('remove', () => {
    it('should delete character and return true', async () => {
      vi.mocked(characterStorage.deleteCharacter).mockReturnValue(true);

      const { result } = renderHook(() => useCharacterStorage());

      let deleted: boolean | undefined;
      await act(async () => {
        deleted = await result.current.remove('to-delete');
      });

      expect(characterStorage.deleteCharacter).toHaveBeenCalledWith('to-delete');
      expect(deleted).toBe(true);
    });

    it('should return false when character not found', async () => {
      vi.mocked(characterStorage.deleteCharacter).mockReturnValue(false);

      const { result } = renderHook(() => useCharacterStorage());

      let deleted: boolean | undefined;
      await act(async () => {
        deleted = await result.current.remove('non-existent');
      });

      expect(deleted).toBe(false);
    });

    it('should reload characters after delete', async () => {
      vi.mocked(characterStorage.deleteCharacter).mockReturnValue(true);

      const { result } = renderHook(() => useCharacterStorage());
      
      const initialCallCount = vi.mocked(characterStorage.getAllCharacters).mock.calls.length;

      await act(async () => {
        await result.current.remove('id');
      });

      expect(characterStorage.getAllCharacters).toHaveBeenCalledTimes(initialCallCount + 1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // duplicate
  // ═══════════════════════════════════════════════════════════════
  describe('duplicate', () => {
    it('should duplicate character', async () => {
      const mockDuplicated = createMockSavedCharacter({ name: 'Hero (Cópia)' });
      vi.mocked(characterStorage.duplicateCharacter).mockReturnValue(mockDuplicated);

      const { result } = renderHook(() => useCharacterStorage());

      let duplicated: SavedCharacter | undefined;
      await act(async () => {
        duplicated = await result.current.duplicate('original-id');
      });

      expect(characterStorage.duplicateCharacter).toHaveBeenCalledWith('original-id');
      expect(duplicated?.name).toBe('Hero (Cópia)');
    });

    it('should set error on duplicate failure', async () => {
      vi.mocked(characterStorage.duplicateCharacter).mockImplementation(() => {
        throw new Error('Duplicate failed');
      });

      const { result } = renderHook(() => useCharacterStorage());

      await act(async () => {
        try {
          await result.current.duplicate('id');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Duplicate failed');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Export
  // ═══════════════════════════════════════════════════════════════
  describe('export', () => {
    it('should call downloadExportFile for exportAll', () => {
      const { result } = renderHook(() => useCharacterStorage());

      act(() => {
        result.current.exportAll();
      });

      expect(characterStorage.downloadExportFile).toHaveBeenCalledWith();
    });

    it('should call downloadExportFile with ids for exportSelected', () => {
      const { result } = renderHook(() => useCharacterStorage());

      act(() => {
        result.current.exportSelected(['id1', 'id2']);
      });

      expect(characterStorage.downloadExportFile).toHaveBeenCalledWith(['id1', 'id2']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Import
  // ═══════════════════════════════════════════════════════════════
  describe('importFromJson', () => {
    it('should import characters from JSON', async () => {
      const mockResult = { imported: 3, skipped: 0, errors: [] };
      vi.mocked(characterStorage.importCharacters).mockReturnValue(mockResult);

      const { result } = renderHook(() => useCharacterStorage());

      let importResult: { imported: number; skipped: number; errors: string[] } | undefined;
      await act(async () => {
        importResult = await result.current.importFromJson('{"characters":[]}');
      });

      expect(characterStorage.importCharacters).toHaveBeenCalledWith('{"characters":[]}');
      expect(importResult).toEqual(mockResult);
    });

    it('should reload characters after import', async () => {
      vi.mocked(characterStorage.importCharacters).mockReturnValue({
        imported: 1,
        skipped: 0,
        errors: [],
      });

      const { result } = renderHook(() => useCharacterStorage());
      
      const initialCallCount = vi.mocked(characterStorage.getAllCharacters).mock.calls.length;

      await act(async () => {
        await result.current.importFromJson('{}');
      });

      expect(characterStorage.getAllCharacters).toHaveBeenCalledTimes(initialCallCount + 1);
    });

    it('should set error on import failure', async () => {
      vi.mocked(characterStorage.importCharacters).mockImplementation(() => {
        throw new Error('Import failed');
      });

      const { result } = renderHook(() => useCharacterStorage());

      await act(async () => {
        try {
          await result.current.importFromJson('invalid');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Import failed');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Filters
  // ═══════════════════════════════════════════════════════════════
  describe('filters', () => {
    it('should update filters', () => {
      const { result } = renderHook(() => useCharacterStorage());

      act(() => {
        result.current.setFilters({ theme: 'tenebralux', sortBy: 'name' });
      });

      expect(result.current.filters).toEqual({ theme: 'tenebralux', sortBy: 'name' });
    });

    it('should apply filters to characters', () => {
      const mockChars = [
        createMockSavedCharacter({ id: '1', theme: 'akashic' }),
        createMockSavedCharacter({ id: '2', theme: 'tenebralux' }),
      ];
      vi.mocked(characterStorage.getAllCharacters).mockReturnValue(mockChars);
      vi.mocked(characterStorage.filterCharacters).mockImplementation((chars, filters) => {
        if (filters.theme && filters.theme !== 'all') {
          return chars.filter(c => c.theme === filters.theme);
        }
        return chars;
      });

      const { result } = renderHook(() => useCharacterStorage());

      act(() => {
        result.current.setFilters({ theme: 'akashic' });
      });

      expect(result.current.filteredCharacters).toHaveLength(1);
      expect(result.current.filteredCharacters[0].theme).toBe('akashic');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Stats
  // ═══════════════════════════════════════════════════════════════
  describe('stats', () => {
    it('should return storage stats', () => {
      vi.mocked(characterStorage.getStorageStats).mockReturnValue({
        count: 5,
        maxCount: 50,
        storageUsed: '10.5 KB',
      });

      const { result } = renderHook(() => useCharacterStorage());

      expect(result.current.stats).toEqual({
        count: 5,
        maxCount: 50,
        storageUsed: '10.5 KB',
      });
    });
  });
});
