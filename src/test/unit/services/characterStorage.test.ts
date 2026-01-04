import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAllCharacters,
  getCharacterById,
  saveCharacter,
  deleteCharacter,
  duplicateCharacter,
  filterCharacters,
  exportCharacters,
  exportSingleCharacter,
  importCharacters,
  getStorageStats,
} from '@/services/storage/characterStorage';
import { SavedCharacter, CharacterListFilters } from '@/types/character-storage';
import { CharacterDraft } from '@/types/character-builder';

const STORAGE_KEY = 'akashic_characters';

// Mock localStorage
const mockStorage: { [key: string]: string } = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  }),
};

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

// Helper para criar um draft válido
function createMockDraft(overrides: Partial<CharacterDraft> = {}): CharacterDraft {
  return {
    name: 'Test Character',
    theme: 'akashic',
    factionId: 'faction-1',
    culture: 'culture-1',
    attributes: {},
    skills: {},
    virtues: [],
    blessings: [],
    equipment: [],
    background: '',
    notes: '',
    ...overrides,
  } as CharacterDraft;
}

// Helper para criar um personagem salvo válido
function createMockSavedCharacter(overrides: Partial<SavedCharacter> = {}): SavedCharacter {
  const now = new Date().toISOString();
  return {
    id: 'char-' + Math.random().toString(36).substr(2, 9),
    name: 'Saved Character',
    theme: 'akashic',
    factionId: 'faction-1',
    cultureId: 'culture-1',
    createdAt: now,
    updatedAt: now,
    data: createMockDraft(),
    ...overrides,
  };
}

describe('characterStorage', () => {
  beforeEach(() => {
    // Reset localStorage mock
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // getAllCharacters
  // ═══════════════════════════════════════════════════════════════
  describe('getAllCharacters', () => {
    it('should return empty array when storage is empty', () => {
      const result = getAllCharacters();
      expect(result).toEqual([]);
    });

    it('should return characters sorted by updatedAt descending', () => {
      const older = createMockSavedCharacter({
        id: 'older',
        name: 'Older',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      const newer = createMockSavedCharacter({
        id: 'newer',
        name: 'Newer',
        updatedAt: '2024-01-02T00:00:00.000Z',
      });

      mockStorage[STORAGE_KEY] = JSON.stringify([older, newer]);

      const result = getAllCharacters();
      expect(result[0].id).toBe('newer');
      expect(result[1].id).toBe('older');
    });

    it('should handle invalid JSON gracefully', () => {
      mockStorage[STORAGE_KEY] = 'invalid json';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = getAllCharacters();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getCharacterById
  // ═══════════════════════════════════════════════════════════════
  describe('getCharacterById', () => {
    it('should return null when character not found', () => {
      const result = getCharacterById('non-existent');
      expect(result).toBeNull();
    });

    it('should return the correct character by id', () => {
      const char = createMockSavedCharacter({ id: 'target-id', name: 'Target' });
      mockStorage[STORAGE_KEY] = JSON.stringify([char]);

      const result = getCharacterById('target-id');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Target');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // saveCharacter
  // ═══════════════════════════════════════════════════════════════
  describe('saveCharacter', () => {
    it('should create a new character with generated id', () => {
      const draft = createMockDraft({ name: 'New Hero' });

      const result = saveCharacter(draft);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('New Hero');
      expect(result.data).toEqual(draft);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should update existing character when existingId is provided', () => {
      const existing = createMockSavedCharacter({ id: 'existing-id', name: 'Old Name' });
      mockStorage[STORAGE_KEY] = JSON.stringify([existing]);

      const updatedDraft = createMockDraft({ name: 'Updated Name' });
      const result = saveCharacter(updatedDraft, 'existing-id');

      expect(result.id).toBe('existing-id');
      expect(result.name).toBe('Updated Name');
    });

    it('should throw error when updating non-existent character', () => {
      expect(() => {
        saveCharacter(createMockDraft(), 'non-existent');
      }).toThrow('Personagem não encontrado para atualização');
    });

    it('should throw error when character limit is reached', () => {
      // Create 50 characters
      const chars = Array.from({ length: 50 }, (_, i) =>
        createMockSavedCharacter({ id: `char-${i}` })
      );
      mockStorage[STORAGE_KEY] = JSON.stringify(chars);

      expect(() => {
        saveCharacter(createMockDraft());
      }).toThrow('Limite de 50 personagens atingido');
    });

    it('should use default name when draft name is empty', () => {
      const draft = createMockDraft({ name: '' });

      const result = saveCharacter(draft);

      expect(result.name).toBe('Sem Nome');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // deleteCharacter
  // ═══════════════════════════════════════════════════════════════
  describe('deleteCharacter', () => {
    it('should return false when character not found', () => {
      const result = deleteCharacter('non-existent');
      expect(result).toBe(false);
    });

    it('should delete character and return true', () => {
      const char = createMockSavedCharacter({ id: 'to-delete' });
      mockStorage[STORAGE_KEY] = JSON.stringify([char]);

      const result = deleteCharacter('to-delete');

      expect(result).toBe(true);
      
      const remaining = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(remaining).toHaveLength(0);
    });

    it('should only delete the specified character', () => {
      const char1 = createMockSavedCharacter({ id: 'keep' });
      const char2 = createMockSavedCharacter({ id: 'delete' });
      mockStorage[STORAGE_KEY] = JSON.stringify([char1, char2]);

      deleteCharacter('delete');

      const remaining = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('keep');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // duplicateCharacter
  // ═══════════════════════════════════════════════════════════════
  describe('duplicateCharacter', () => {
    it('should throw error when original not found', () => {
      expect(() => {
        duplicateCharacter('non-existent');
      }).toThrow('Personagem não encontrado para duplicação');
    });

    it('should create a copy with " (Cópia)" suffix', () => {
      const original = createMockSavedCharacter({ id: 'original', name: 'Hero' });
      mockStorage[STORAGE_KEY] = JSON.stringify([original]);

      const result = duplicateCharacter('original');

      expect(result.id).not.toBe('original');
      expect(result.name).toBe('Hero (Cópia)');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // filterCharacters
  // ═══════════════════════════════════════════════════════════════
  describe('filterCharacters', () => {
    const chars: SavedCharacter[] = [
      createMockSavedCharacter({
        id: '1',
        name: 'Alpha Warrior',
        theme: 'akashic',
        factionId: 'faction-a',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
      }),
      createMockSavedCharacter({
        id: '2',
        name: 'Beta Mage',
        theme: 'tenebralux',
        factionId: 'faction-b',
        updatedAt: '2024-01-02T00:00:00.000Z',
        createdAt: '2024-01-02T00:00:00.000Z',
      }),
      createMockSavedCharacter({
        id: '3',
        name: 'Gamma Rogue',
        theme: 'akashic',
        factionId: 'faction-a',
        updatedAt: '2024-01-03T00:00:00.000Z',
        createdAt: '2024-01-03T00:00:00.000Z',
      }),
    ];

    it('should return all characters when no filters applied', () => {
      const result = filterCharacters(chars, {});
      expect(result).toHaveLength(3);
    });

    it('should filter by theme', () => {
      const result = filterCharacters(chars, { theme: 'akashic' });
      expect(result).toHaveLength(2);
      expect(result.every(c => c.theme === 'akashic')).toBe(true);
    });

    it('should not filter when theme is "all"', () => {
      const result = filterCharacters(chars, { theme: 'all' });
      expect(result).toHaveLength(3);
    });

    it('should filter by faction', () => {
      const result = filterCharacters(chars, { faction: 'faction-a' });
      expect(result).toHaveLength(2);
    });

    it('should filter by search query (case insensitive)', () => {
      const result = filterCharacters(chars, { searchQuery: 'WARRIOR' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alpha Warrior');
    });

    it('should sort by name ascending', () => {
      const result = filterCharacters(chars, { sortBy: 'name', sortOrder: 'asc' });
      expect(result[0].name).toBe('Alpha Warrior');
      expect(result[1].name).toBe('Beta Mage');
      expect(result[2].name).toBe('Gamma Rogue');
    });

    it('should sort by name descending', () => {
      const result = filterCharacters(chars, { sortBy: 'name', sortOrder: 'desc' });
      expect(result[0].name).toBe('Gamma Rogue');
      expect(result[2].name).toBe('Alpha Warrior');
    });

    it('should sort by createdAt', () => {
      const result = filterCharacters(chars, { sortBy: 'createdAt', sortOrder: 'asc' });
      expect(result[0].id).toBe('1');
      expect(result[2].id).toBe('3');
    });

    it('should sort by updatedAt (default)', () => {
      const result = filterCharacters(chars, { sortOrder: 'desc' });
      expect(result[0].id).toBe('3');
      expect(result[2].id).toBe('1');
    });

    it('should combine multiple filters', () => {
      const result = filterCharacters(chars, {
        theme: 'akashic',
        faction: 'faction-a',
        searchQuery: 'gamma',
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Gamma Rogue');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // exportCharacters
  // ═══════════════════════════════════════════════════════════════
  describe('exportCharacters', () => {
    it('should export all characters when no ids provided', () => {
      const chars = [
        createMockSavedCharacter({ id: '1' }),
        createMockSavedCharacter({ id: '2' }),
      ];
      mockStorage[STORAGE_KEY] = JSON.stringify(chars);

      const result = exportCharacters();
      const parsed = JSON.parse(result);

      expect(parsed.version).toBe('1.0');
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.characters).toHaveLength(2);
    });

    it('should export only selected characters', () => {
      const chars = [
        createMockSavedCharacter({ id: '1' }),
        createMockSavedCharacter({ id: '2' }),
        createMockSavedCharacter({ id: '3' }),
      ];
      mockStorage[STORAGE_KEY] = JSON.stringify(chars);

      const result = exportCharacters(['1', '3']);
      const parsed = JSON.parse(result);

      expect(parsed.characters).toHaveLength(2);
      expect(parsed.characters.map((c: SavedCharacter) => c.id)).toEqual(['1', '3']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // exportSingleCharacter
  // ═══════════════════════════════════════════════════════════════
  describe('exportSingleCharacter', () => {
    it('should throw error when character not found', () => {
      expect(() => {
        exportSingleCharacter('non-existent');
      }).toThrow('Personagem não encontrado');
    });

    it('should export single character in correct format', () => {
      const char = createMockSavedCharacter({ id: 'export-me', name: 'Exported' });
      mockStorage[STORAGE_KEY] = JSON.stringify([char]);

      const result = exportSingleCharacter('export-me');
      const parsed = JSON.parse(result);

      expect(parsed.version).toBe('1.0');
      expect(parsed.character).toBeDefined();
      expect(parsed.character.name).toBe('Exported');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // importCharacters
  // ═══════════════════════════════════════════════════════════════
  describe('importCharacters', () => {
    it('should import multiple characters', () => {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        characters: [
          createMockSavedCharacter({ id: 'import-1', name: 'Import 1' }),
          createMockSavedCharacter({ id: 'import-2', name: 'Import 2' }),
        ],
      };

      const result = importCharacters(JSON.stringify(exportData));

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should import single character format', () => {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        character: createMockSavedCharacter({ id: 'single', name: 'Single' }),
      };

      const result = importCharacters(JSON.stringify(exportData));

      expect(result.imported).toBe(1);
    });

    it('should generate new id for duplicate ids', () => {
      const existingChar = createMockSavedCharacter({ id: 'duplicate-id', name: 'Existing' });
      mockStorage[STORAGE_KEY] = JSON.stringify([existingChar]);

      const exportData = {
        version: '1.0',
        characters: [
          createMockSavedCharacter({ id: 'duplicate-id', name: 'Imported' }),
        ],
      };

      const result = importCharacters(JSON.stringify(exportData));

      expect(result.imported).toBe(1);

      const allChars = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(allChars).toHaveLength(2);
      expect(allChars[0].name).toBe('Imported (Importado)');
    });

    it('should skip invalid characters', () => {
      const exportData = {
        version: '1.0',
        characters: [
          { id: 'invalid', name: '' }, // Missing data
          createMockSavedCharacter({ id: 'valid', name: 'Valid' }),
        ],
      };

      const result = importCharacters(JSON.stringify(exportData));

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        importCharacters('invalid json');
      }).toThrow('Erro ao processar arquivo');
    });

    it('should throw error when no characters found', () => {
      expect(() => {
        importCharacters(JSON.stringify({ version: '1.0' }));
      }).toThrow('Nenhum personagem encontrado no arquivo');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getStorageStats
  // ═══════════════════════════════════════════════════════════════
  describe('getStorageStats', () => {
    it('should return correct count and maxCount', () => {
      const chars = [
        createMockSavedCharacter({ id: '1' }),
        createMockSavedCharacter({ id: '2' }),
      ];
      mockStorage[STORAGE_KEY] = JSON.stringify(chars);

      const stats = getStorageStats();

      expect(stats.count).toBe(2);
      expect(stats.maxCount).toBe(50);
    });

    it('should return storage used in human-readable format', () => {
      const chars = [createMockSavedCharacter({ id: '1' })];
      mockStorage[STORAGE_KEY] = JSON.stringify(chars);

      const stats = getStorageStats();

      expect(stats.storageUsed).toMatch(/\d+(\.\d+)?\s*(Bytes|KB|MB)/);
    });

    it('should return 0 Bytes when storage is empty', () => {
      const stats = getStorageStats();
      expect(stats.count).toBe(0);
      expect(stats.storageUsed).toBe('0 Bytes');
    });
  });
});
