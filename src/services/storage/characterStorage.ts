import { SavedCharacter, CharacterListFilters } from '@/types/character-storage';
import { CharacterDraft } from '@/types/character-builder';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'akashic_characters';
const MAX_CHARACTERS = 50;

// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════

export function getAllCharacters(): SavedCharacter[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const characters = JSON.parse(stored) as SavedCharacter[];
    return characters.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error('Erro ao carregar personagens:', error);
    return [];
  }
}

export function getCharacterById(id: string): SavedCharacter | null {
  const characters = getAllCharacters();
  return characters.find(c => c.id === id) || null;
}

export function saveCharacter(draft: CharacterDraft, existingId?: string): SavedCharacter {
  const characters = getAllCharacters();
  const now = new Date().toISOString();

  // Se existingId, é uma atualização
  if (existingId) {
    const index = characters.findIndex(c => c.id === existingId);
    if (index === -1) {
      throw new Error('Personagem não encontrado para atualização');
    }

    const updated: SavedCharacter = {
      ...characters[index],
      name: draft.name || 'Sem Nome',
      theme: draft.theme || 'akashic',
      factionId: draft.factionId || '',
      cultureId: draft.culture,
      updatedAt: now,
      data: draft,
    };

    characters[index] = updated;
    persistCharacters(characters);
    return updated;
  }

  // Novo personagem
  if (characters.length >= MAX_CHARACTERS) {
    throw new Error(`Limite de ${MAX_CHARACTERS} personagens atingido. Delete alguns para criar novos.`);
  }

  const newCharacter: SavedCharacter = {
    id: uuidv4(),
    name: draft.name || 'Sem Nome',
    theme: draft.theme || 'akashic',
    factionId: draft.factionId || '',
    cultureId: draft.culture,
    createdAt: now,
    updatedAt: now,
    data: draft,
  };

  characters.unshift(newCharacter);
  persistCharacters(characters);
  return newCharacter;
}

export function deleteCharacter(id: string): boolean {
  const characters = getAllCharacters();
  const index = characters.findIndex(c => c.id === id);
  
  if (index === -1) return false;

  characters.splice(index, 1);
  persistCharacters(characters);
  return true;
}

export function duplicateCharacter(id: string): SavedCharacter {
  const original = getCharacterById(id);
  if (!original) {
    throw new Error('Personagem não encontrado para duplicação');
  }

  const duplicatedDraft: CharacterDraft = {
    ...original.data,
    name: `${original.name} (Cópia)`,
  };

  return saveCharacter(duplicatedDraft);
}

// ═══════════════════════════════════════════════════════════════
// FILTROS E BUSCA
// ═══════════════════════════════════════════════════════════════

export function filterCharacters(
  characters: SavedCharacter[],
  filters: CharacterListFilters
): SavedCharacter[] {
  let result = [...characters];

  // Filtro por tema
  if (filters.theme && filters.theme !== 'all') {
    result = result.filter(c => c.theme === filters.theme);
  }

  // Filtro por facção
  if (filters.faction) {
    result = result.filter(c => c.factionId === filters.faction);
  }

  // Busca por nome
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    result = result.filter(c => 
      c.name.toLowerCase().includes(query)
    );
  }

  // Ordenação
  const sortBy = filters.sortBy || 'updatedAt';
  const sortOrder = filters.sortOrder || 'desc';

  result.sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'createdAt') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return result;
}

// ═══════════════════════════════════════════════════════════════
// IMPORT / EXPORT
// ═══════════════════════════════════════════════════════════════

export interface ExportData {
  version: string;
  exportedAt: string;
  characters: SavedCharacter[];
}

export function exportCharacters(characterIds?: string[]): string {
  const allCharacters = getAllCharacters();
  
  const charactersToExport = characterIds
    ? allCharacters.filter(c => characterIds.includes(c.id))
    : allCharacters;

  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    characters: charactersToExport,
  };

  return JSON.stringify(exportData, null, 2);
}

export function exportSingleCharacter(id: string): string {
  const character = getCharacterById(id);
  if (!character) {
    throw new Error('Personagem não encontrado');
  }

  return JSON.stringify({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    character: character,
  }, null, 2);
}

export function importCharacters(jsonString: string): { 
  imported: number; 
  skipped: number; 
  errors: string[] 
} {
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  try {
    const data = JSON.parse(jsonString);
    
    // Suporta formato de múltiplos ou único personagem
    const charactersToImport: SavedCharacter[] = data.characters 
      ? data.characters 
      : data.character 
        ? [data.character] 
        : [];

    if (charactersToImport.length === 0) {
      throw new Error('Nenhum personagem encontrado no arquivo');
    }

    const existingCharacters = getAllCharacters();
    const existingIds = new Set(existingCharacters.map(c => c.id));

    for (const char of charactersToImport) {
      try {
        // Validação básica
        if (!char.data || !char.name) {
          errors.push(`Personagem inválido: ${char.name || 'sem nome'}`);
          skipped++;
          continue;
        }

        // Se ID já existe, gera novo
        if (existingIds.has(char.id)) {
          char.id = uuidv4();
          char.name = `${char.name} (Importado)`;
        }

        // Atualiza timestamps
        char.updatedAt = new Date().toISOString();

        existingCharacters.unshift(char);
        existingIds.add(char.id);
        imported++;
      } catch (e) {
        errors.push(`Erro ao importar ${char.name}: ${e}`);
        skipped++;
      }
    }

    // Verifica limite
    if (existingCharacters.length > MAX_CHARACTERS) {
      const excess = existingCharacters.length - MAX_CHARACTERS;
      errors.push(`${excess} personagens não importados: limite de ${MAX_CHARACTERS} atingido`);
      existingCharacters.splice(MAX_CHARACTERS);
    }

    persistCharacters(existingCharacters);

    return { imported, skipped, errors };
  } catch (error) {
    throw new Error(`Erro ao processar arquivo: ${error}`);
  }
}

export function downloadExportFile(characterIds?: string[]): void {
  const jsonString = exportCharacters(characterIds);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `akashic_characters_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function persistCharacters(characters: SavedCharacter[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('Espaço de armazenamento esgotado. Delete alguns personagens.');
    }
    throw error;
  }
}

export function getStorageStats(): {
  count: number;
  maxCount: number;
  storageUsed: string;
} {
  const characters = getAllCharacters();
  const stored = localStorage.getItem(STORAGE_KEY) || '';
  const bytes = new Blob([stored]).size;
  
  return {
    count: characters.length,
    maxCount: MAX_CHARACTERS,
    storageUsed: formatBytes(bytes),
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
