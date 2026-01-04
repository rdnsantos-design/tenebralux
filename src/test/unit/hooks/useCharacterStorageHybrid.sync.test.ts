import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock dos módulos necessários
vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(() => ({
    isOnline: true,
    wasOffline: false,
    resetWasOffline: vi.fn(),
  })),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@test.com' },
    isAuthenticated: true,
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do serviço de storage
const mockLocalCharacters = [
  { id: 'local-1', name: 'Local Char', updatedAt: '2024-01-02T00:00:00Z' },
];

const mockCloudCharacters = [
  { id: 'cloud-1', name: 'Cloud Char', updatedAt: '2024-01-01T00:00:00Z' },
];

vi.mock('@/services/storage/characterStorage', () => ({
  getAllCharacters: vi.fn(() => mockLocalCharacters),
  saveCharacter: vi.fn(),
}));

vi.mock('@/services/cloud/characterCloudService', () => ({
  getAllCharactersCloud: vi.fn(() => Promise.resolve(mockCloudCharacters)),
  saveToCloud: vi.fn(() => Promise.resolve()),
  updateInCloud: vi.fn(() => Promise.resolve()),
}));

describe('useCharacterStorageHybrid - Sync Automático', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve ter função syncNow', async () => {
    // Este teste verifica que o hook expõe a função de sync
    const { useCharacterStorageHybrid } = await import('@/hooks/useCharacterStorageHybrid');
    const { result } = renderHook(() => useCharacterStorageHybrid());

    expect(result.current.syncNow).toBeDefined();
    expect(typeof result.current.syncNow).toBe('function');
  });

  it('deve expor isSyncing do hook', async () => {
    const { useCharacterStorageHybrid } = await import('@/hooks/useCharacterStorageHybrid');
    const { result } = renderHook(() => useCharacterStorageHybrid());

    expect(result.current.isSyncing).toBeDefined();
    expect(typeof result.current.isSyncing).toBe('boolean');
  });

  it('deve expor isOnline do hook', async () => {
    const { useCharacterStorageHybrid } = await import('@/hooks/useCharacterStorageHybrid');
    const { result } = renderHook(() => useCharacterStorageHybrid());

    expect(result.current.isOnline).toBeDefined();
    expect(typeof result.current.isOnline).toBe('boolean');
  });

  it('deve expor storageMode do hook', async () => {
    const { useCharacterStorageHybrid } = await import('@/hooks/useCharacterStorageHybrid');
    const { result } = renderHook(() => useCharacterStorageHybrid());

    expect(result.current.storageMode).toBeDefined();
    expect(['local', 'cloud', 'hybrid']).toContain(result.current.storageMode);
  });
});

describe('Sync Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar resultado de sync com synced e errors', async () => {
    const { useCharacterStorageHybrid } = await import('@/hooks/useCharacterStorageHybrid');
    const { result } = renderHook(() => useCharacterStorageHybrid());

    let syncResult: { synced: number; errors: string[] } | undefined;
    
    await act(async () => {
      syncResult = await result.current.syncNow();
    });

    expect(syncResult).toBeDefined();
    expect(typeof syncResult?.synced).toBe('number');
    expect(Array.isArray(syncResult?.errors)).toBe(true);
  });

  it('deve executar sync sem erros', async () => {
    const { useCharacterStorageHybrid } = await import('@/hooks/useCharacterStorageHybrid');
    const { result } = renderHook(() => useCharacterStorageHybrid());

    await act(async () => {
      const syncResult = await result.current.syncNow();
      expect(syncResult).toBeDefined();
    });
  });
});
