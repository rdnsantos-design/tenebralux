import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTacticalIntegration } from '@/hooks/useTacticalIntegration';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock do hook de storage
const mockGetCharacter = vi.fn();

vi.mock('@/hooks/useCharacterStorage', () => ({
  useCharacterStorage: () => ({
    getCharacter: mockGetCharacter,
    characters: [],
    filteredCharacters: [],
    isLoading: false,
    error: null,
    stats: { count: 0, maxCount: 50, storageUsed: '0 KB' },
    filters: {},
    setFilters: vi.fn(),
    loadCharacters: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    duplicate: vi.fn(),
    exportAll: vi.fn(),
    importFromJson: vi.fn(),
  }),
}));

// Mock do react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock do sessionStorage
const mockSessionStorageData: Record<string, string> = {};
const sessionStorageMock = {
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorageData[key] = value;
  }),
  getItem: vi.fn((key: string) => mockSessionStorageData[key] || null),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorageData[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockSessionStorageData).forEach(key => delete mockSessionStorageData[key]);
  }),
};

Object.defineProperty(window, 'sessionStorage', { 
  value: sessionStorageMock,
  writable: true
});

// Wrapper com Router
function TestWrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(BrowserRouter, null, children);
}

// Dados de teste
const validCharacterData = {
  id: 'valid-id',
  name: 'Personagem Valido',
  theme: 'akashic',
  factionId: 'hegemonia',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  data: {
    name: 'Personagem Valido',
    theme: 'akashic',
    factionId: 'hegemonia',
    attributes: {
      conhecimento: 3, raciocinio: 3, corpo: 3, reflexos: 3,
      determinacao: 3, coordenacao: 3, carisma: 3, intuicao: 3,
    },
    skills: { luta: 2 },
    virtues: {},
  },
};

const invalidCharacterData = {
  id: 'invalid-id',
  name: '',
  theme: 'akashic',
  factionId: '',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  data: {
    name: '',
    theme: 'akashic',
    factionId: '',
    attributes: {},
    skills: {},
    virtues: {},
  },
};

describe('useTacticalIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.clear();
    
    mockGetCharacter.mockImplementation((id: string) => {
      if (id === 'valid-id') return validCharacterData;
      if (id === 'invalid-id') return invalidCharacterData;
      return null;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Estado inicial', () => {
    it('deve iniciar com isConverting false', () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });
      expect(result.current.isConverting).toBe(false);
    });

    it('deve iniciar com lastResult null', () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });
      expect(result.current.lastResult).toBeNull();
    });

    it('deve iniciar com errors vazio', () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });
      expect(result.current.errors).toHaveLength(0);
    });
  });

  describe('prepareForBattle', () => {
    it('deve converter personagem valido', async () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });

      let conversionResult: unknown;
      await act(async () => {
        conversionResult = await result.current.prepareForBattle('valid-id');
      });

      expect(conversionResult).toBeDefined();
      expect((conversionResult as any)?.unit).toBeDefined();
      expect((conversionResult as any)?.cards).toBeDefined();
    });

    it('deve retornar null para personagem nao encontrado', async () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });

      let conversionResult: unknown;
      await act(async () => {
        conversionResult = await result.current.prepareForBattle('non-existent');
      });

      expect(conversionResult).toBeNull();
      expect(result.current.errors.length).toBeGreaterThan(0);
    });

    it('deve retornar null para personagem invalido', async () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });

      let conversionResult: unknown;
      await act(async () => {
        conversionResult = await result.current.prepareForBattle('invalid-id');
      });

      expect(conversionResult).toBeNull();
      expect(result.current.errors.length).toBeGreaterThan(0);
    });

    it('deve atualizar lastResult apos conversao', async () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.prepareForBattle('valid-id');
      });

      expect(result.current.lastResult).toBeDefined();
    });

    it('deve finalizar com isConverting false', async () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });
      
      await act(async () => {
        await result.current.prepareForBattle('valid-id');
      });

      expect(result.current.isConverting).toBe(false);
    });

    it('deve passar opcoes para o converter', async () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });

      let conversionResult: unknown;
      await act(async () => {
        conversionResult = await result.current.prepareForBattle('valid-id', {
          asCommander: true,
          teamId: 'enemy',
        });
      });

      expect((conversionResult as any)?.unit.isCommander).toBe(true);
      expect((conversionResult as any)?.unit.teamId).toBe('enemy');
    });
  });

  describe('prepareTeam', () => {
    it('deve converter multiplos personagens', async () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });

      mockGetCharacter.mockImplementation((id: string) => ({
        ...validCharacterData,
        id,
        name: 'Personagem ' + id,
        data: {
          ...validCharacterData.data,
          name: 'Personagem ' + id,
        },
      }));

      let teamResult: unknown;
      await act(async () => {
        teamResult = await result.current.prepareTeam(['char-1', 'char-2']);
      });

      expect(teamResult).toBeDefined();
      expect((teamResult as any)?.units).toHaveLength(2);
    });

    it('deve definir comandante quando especificado', async () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });

      mockGetCharacter.mockImplementation((id: string) => ({
        ...validCharacterData,
        id,
        name: 'Personagem ' + id,
        data: {
          ...validCharacterData.data,
          name: 'Personagem ' + id,
        },
      }));

      let teamResult: unknown;
      await act(async () => {
        teamResult = await result.current.prepareTeam(['char-1', 'char-2'], 'char-1');
      });

      expect((teamResult as any)?.commander).toBeDefined();
      expect((teamResult as any)?.commander.isCommander).toBe(true);
    });

    it('deve retornar null se algum personagem nao for encontrado', async () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });

      mockGetCharacter.mockImplementation((id: string) => {
        if (id === 'char-1') return validCharacterData;
        return null;
      });

      let teamResult: unknown;
      await act(async () => {
        teamResult = await result.current.prepareTeam(['char-1', 'non-existent']);
      });

      expect(teamResult).toBeNull();
      expect(result.current.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateCharacter', () => {
    it('deve validar personagem valido', () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });

      const validation = result.current.validateCharacter('valid-id');

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('deve invalidar personagem nao encontrado', () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });

      const validation = result.current.validateCharacter('non-existent');

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('deve invalidar personagem com dados invalidos', () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });

      const validation = result.current.validateCharacter('invalid-id');

      expect(validation.valid).toBe(false);
    });
  });

  describe('goToBattle', () => {
    it('deve salvar dados no sessionStorage', () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });
      const mockUnits = [{ id: 'unit-1', name: 'Test' }];
      const mockCards = [{ id: 'card-1', name: 'Attack' }];

      act(() => {
        result.current.goToBattle(mockUnits as any, mockCards as any);
      });

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'battle_units',
        JSON.stringify(mockUnits)
      );
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'battle_cards',
        JSON.stringify(mockCards)
      );
    });

    it('deve navegar para pagina de batalha tatica', () => {
      const { result } = renderHook(() => useTacticalIntegration(), { wrapper: TestWrapper });

      act(() => {
        result.current.goToBattle([], []);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/tactical');
    });
  });
});
