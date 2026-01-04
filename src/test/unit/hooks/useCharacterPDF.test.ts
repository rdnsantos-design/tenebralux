import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCharacterPDF } from '@/hooks/useCharacterPDF';
import { CharacterDraft } from '@/types/character-builder';

// Mock das funções de PDF
vi.mock('@/services/pdf/characterSheetPDF', () => ({
  downloadCharacterPDF: vi.fn(),
  getCharacterPDFBlob: vi.fn(() => new Blob(['mock'], { type: 'application/pdf' })),
  generateCharacterPDF: vi.fn(() => ({
    output: vi.fn(() => 'blob:mock-url'),
  })),
}));

// Mock do window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(global, 'window', {
  value: {
    ...global.window,
    open: mockWindowOpen,
  },
  writable: true,
});

const mockCharacter: CharacterDraft = {
  name: 'Teste',
  theme: 'akashic',
  factionId: 'hegemonia',
  attributes: {
    conhecimento: 3,
    raciocinio: 3,
    corpo: 3,
    reflexos: 3,
    determinacao: 3,
    coordenacao: 3,
    carisma: 3,
    intuicao: 3,
  },
  skills: {},
  virtues: {},
};

describe('useCharacterPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Estado inicial', () => {
    it('deve iniciar com isGenerating false', () => {
      const { result } = renderHook(() => useCharacterPDF());
      expect(result.current.isGenerating).toBe(false);
    });

    it('deve iniciar com error null', () => {
      const { result } = renderHook(() => useCharacterPDF());
      expect(result.current.error).toBeNull();
    });

    it('deve ter funções definidas', () => {
      const { result } = renderHook(() => useCharacterPDF());
      expect(result.current.downloadPDF).toBeDefined();
      expect(result.current.getPDFBlob).toBeDefined();
      expect(result.current.previewPDF).toBeDefined();
    });
  });

  describe('downloadPDF', () => {
    it('deve chamar downloadCharacterPDF', async () => {
      const { downloadCharacterPDF } = await import('@/services/pdf/characterSheetPDF');
      const { result } = renderHook(() => useCharacterPDF());

      await act(async () => {
        await result.current.downloadPDF(mockCharacter, 'akashic');
      });

      expect(downloadCharacterPDF).toHaveBeenCalledWith(mockCharacter, 'akashic');
    });

    it('deve setar isGenerating false após completar', async () => {
      const { result } = renderHook(() => useCharacterPDF());

      await act(async () => {
        await result.current.downloadPDF(mockCharacter, 'akashic');
      });

      expect(result.current.isGenerating).toBe(false);
    });

    it('deve lançar erro se personagem não tem nome', async () => {
      const { result } = renderHook(() => useCharacterPDF());
      const noNameCharacter = { ...mockCharacter, name: '' };

      await expect(async () => {
        await act(async () => {
          await result.current.downloadPDF(noNameCharacter, 'akashic');
        });
      }).rejects.toThrow('Personagem precisa ter um nome para gerar PDF');
    });

    it('deve setar error em caso de falha', async () => {
      const { result } = renderHook(() => useCharacterPDF());
      const noNameCharacter = { ...mockCharacter, name: '' };

      try {
        await act(async () => {
          await result.current.downloadPDF(noNameCharacter, 'akashic');
        });
      } catch (e) {
        // Esperado
      }

      expect(result.current.error).toBe('Personagem precisa ter um nome para gerar PDF');
    });

    it('deve funcionar com tema tenebralux', async () => {
      const { downloadCharacterPDF } = await import('@/services/pdf/characterSheetPDF');
      const { result } = renderHook(() => useCharacterPDF());
      const tenbraCharacter = { ...mockCharacter, theme: 'tenebralux' as const };

      await act(async () => {
        await result.current.downloadPDF(tenbraCharacter, 'tenebralux');
      });

      expect(downloadCharacterPDF).toHaveBeenCalledWith(tenbraCharacter, 'tenebralux');
    });
  });

  describe('getPDFBlob', () => {
    it('deve retornar Blob', async () => {
      const { result } = renderHook(() => useCharacterPDF());

      let blob: Blob | null = null;
      await act(async () => {
        blob = await result.current.getPDFBlob(mockCharacter, 'akashic');
      });

      expect(blob).toBeInstanceOf(Blob);
    });

    it('deve lançar erro se personagem não tem nome', async () => {
      const { result } = renderHook(() => useCharacterPDF());
      const noNameCharacter = { ...mockCharacter, name: '' };

      await expect(async () => {
        await act(async () => {
          await result.current.getPDFBlob(noNameCharacter, 'akashic');
        });
      }).rejects.toThrow();
    });

    it('deve setar error em caso de falha', async () => {
      const { result } = renderHook(() => useCharacterPDF());
      const noNameCharacter = { ...mockCharacter, name: '' };

      try {
        await act(async () => {
          await result.current.getPDFBlob(noNameCharacter, 'akashic');
        });
      } catch (e) {
        // Esperado
      }

      expect(result.current.error).toBe('Personagem precisa ter um nome para gerar PDF');
    });
  });

  describe('previewPDF', () => {
    it('deve abrir nova janela com URL do PDF', () => {
      const { result } = renderHook(() => useCharacterPDF());

      act(() => {
        result.current.previewPDF(mockCharacter, 'akashic');
      });

      expect(mockWindowOpen).toHaveBeenCalledWith('blob:mock-url', '_blank');
    });

    it('deve setar error em caso de falha', async () => {
      const { generateCharacterPDF } = await import('@/services/pdf/characterSheetPDF');
      vi.mocked(generateCharacterPDF).mockImplementationOnce(() => {
        throw new Error('Falha no preview');
      });

      const { result } = renderHook(() => useCharacterPDF());

      act(() => {
        result.current.previewPDF(mockCharacter, 'akashic');
      });

      expect(result.current.error).toBe('Falha no preview');
    });
  });
});
