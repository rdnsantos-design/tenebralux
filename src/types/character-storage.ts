import { CharacterDraft } from '@/types/character-builder';

export interface SavedCharacter {
  id: string;
  name: string;
  theme: 'akashic' | 'tenebralux';
  factionId: string;
  cultureId?: string;
  createdAt: string;
  updatedAt: string;
  data: CharacterDraft;
}

export interface CharacterStorageState {
  characters: SavedCharacter[];
  isLoading: boolean;
  error: string | null;
}

export interface CharacterListFilters {
  theme?: 'akashic' | 'tenebralux' | 'all';
  faction?: string;
  searchQuery?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
