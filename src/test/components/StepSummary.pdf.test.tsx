import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/dom';
import { render } from '@testing-library/react';
import { StepSummary } from '@/components/character-builder/steps/StepSummary';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock do hook useCharacterPDF
const mockDownloadPDF = vi.fn().mockResolvedValue(undefined);
const mockPreviewPDF = vi.fn();
const mockGetPDFBlob = vi.fn().mockResolvedValue(new Blob());

vi.mock('@/hooks/useCharacterPDF', () => ({
  useCharacterPDF: () => ({
    isGenerating: false,
    error: null,
    downloadPDF: mockDownloadPDF,
    getPDFBlob: mockGetPDFBlob,
    previewPDF: mockPreviewPDF,
  }),
}));

// Mock do contexto com personagem válido
vi.mock('@/contexts/CharacterBuilderContext', () => ({
  useCharacterBuilder: () => ({
    draft: {
      name: 'Personagem Teste',
      theme: 'akashic',
      factionId: 'hegemonia',
      culture: 'anuirean',
      attributes: {
        conhecimento: 3, raciocinio: 3, corpo: 3, reflexos: 3,
        determinacao: 3, coordenacao: 3, carisma: 3, intuicao: 3,
      },
      skills: { luta: 2 },
      virtues: { coragem: 1 },
      blessingIds: [],
      challengeIds: {},
    },
    currentStep: 8,
    goToStep: vi.fn(),
    resetBuilder: vi.fn(),
    finalizeCharacter: vi.fn(() => ({ id: 'test-id' })),
    canFinalize: vi.fn(() => true),
  }),
}));

// Mock do theme context
vi.mock('@/themes', () => ({
  useTheme: () => ({
    activeTheme: 'akashic',
    setActiveTheme: vi.fn(),
  }),
}));

// Wrapper para componentes
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

describe('StepSummary - PDF Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar botão de download PDF', () => {
    render(<StepSummary />, { wrapper: TestWrapper });
    expect(screen.getByRole('button', { name: /baixar pdf/i })).toBeInTheDocument();
  });

  it('deve renderizar botão de visualizar PDF', () => {
    render(<StepSummary />, { wrapper: TestWrapper });
    expect(screen.getByRole('button', { name: /visualizar pdf/i })).toBeInTheDocument();
  });

  it('deve renderizar botão de finalizar', () => {
    render(<StepSummary />, { wrapper: TestWrapper });
    expect(screen.getByRole('button', { name: /finalizar personagem/i })).toBeInTheDocument();
  });

  it('deve renderizar nome do personagem no resumo', () => {
    render(<StepSummary />, { wrapper: TestWrapper });
    expect(screen.getByText('Personagem Teste')).toBeInTheDocument();
  });

  it('deve renderizar título do resumo', () => {
    render(<StepSummary />, { wrapper: TestWrapper });
    expect(screen.getByText('Resumo do Personagem')).toBeInTheDocument();
  });

  it('deve renderizar seções do resumo', () => {
    render(<StepSummary />, { wrapper: TestWrapper });
    expect(screen.getByText('Conceito')).toBeInTheDocument();
    expect(screen.getByText('Atributos')).toBeInTheDocument();
    expect(screen.getByText('Perícias')).toBeInTheDocument();
  });
});

describe('StepSummary - Component Structure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar botões de edição para cada seção', () => {
    render(<StepSummary />, { wrapper: TestWrapper });
    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('deve renderizar badge do tema', () => {
    render(<StepSummary />, { wrapper: TestWrapper });
    expect(screen.getByText(/akashic/i)).toBeInTheDocument();
  });
});
