import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender as render } from '@/test/test-utils';
import { BattleButton } from '@/components/character-manager/BattleButton';
import { SavedCharacter } from '@/types/character-storage';

// Mock do hook
const mockPrepareForBattle = vi.fn();
const mockValidateCharacter = vi.fn();
const mockGoToBattle = vi.fn();
let mockIsConverting = false;
let mockErrors: string[] = [];

vi.mock('@/hooks/useTacticalIntegration', () => ({
  useTacticalIntegration: () => ({
    isConverting: mockIsConverting,
    errors: mockErrors,
    prepareForBattle: mockPrepareForBattle,
    validateCharacter: mockValidateCharacter,
    goToBattle: mockGoToBattle,
  }),
}));

// Mock do toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
};

vi.mock('sonner', () => ({
  toast: mockToast,
}));

const mockCharacter: SavedCharacter = {
  id: 'char-1',
  name: 'Guerreiro Teste',
  theme: 'akashic',
  factionId: 'hegemonia',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  data: {
    name: 'Guerreiro Teste',
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

describe('BattleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConverting = false;
    mockErrors = [];
    mockValidateCharacter.mockReturnValue({ valid: true, errors: [] });
    mockPrepareForBattle.mockResolvedValue({
      unit: { id: 'unit-1', name: 'Test' },
      cards: [],
      warnings: [],
    });
  });

  it('deve renderizar botão', () => {
    render(<BattleButton character={mockCharacter} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('deve mostrar texto "Batalha"', () => {
    render(<BattleButton character={mockCharacter} />);
    expect(screen.getByText(/batalha/i)).toBeInTheDocument();
  });

  it('deve abrir dialog ao clicar (se válido)', async () => {
    const user = userEvent.setup();
    render(<BattleButton character={mockCharacter} />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/preparar para batalha/i)).toBeInTheDocument();
    });
  });

  it('deve validar personagem antes de abrir dialog', async () => {
    const user = userEvent.setup();
    render(<BattleButton character={mockCharacter} />);

    await user.click(screen.getByRole('button'));

    expect(mockValidateCharacter).toHaveBeenCalledWith('char-1');
  });

  it('deve mostrar erro se personagem inválido', async () => {
    mockValidateCharacter.mockReturnValue({ 
      valid: false, 
      errors: ['Atributos incompletos'] 
    });

    const user = userEvent.setup();
    render(<BattleButton character={mockCharacter} />);

    await user.click(screen.getByRole('button'));

    expect(mockToast.error).toHaveBeenCalledWith('Atributos incompletos');
  });

  it('deve ter checkbox de comandante no dialog', async () => {
    const user = userEvent.setup();
    render(<BattleButton character={mockCharacter} />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByLabelText(/comandante/i)).toBeInTheDocument();
    });
  });

  it('deve chamar prepareForBattle ao confirmar', async () => {
    const user = userEvent.setup();
    render(<BattleButton character={mockCharacter} />);

    // Abrir dialog
    await user.click(screen.getByRole('button'));

    // Confirmar
    await waitFor(() => {
      expect(screen.getByText(/ir para batalha/i)).toBeInTheDocument();
    });
    await user.click(screen.getByText(/ir para batalha/i));

    expect(mockPrepareForBattle).toHaveBeenCalledWith(
      'char-1',
      expect.objectContaining({
        asCommander: false,
        generateCards: true,
        includeEquipment: true,
        teamId: 'player',
      })
    );
  });

  it('deve passar asCommander=true quando checkbox marcado', async () => {
    const user = userEvent.setup();
    render(<BattleButton character={mockCharacter} />);

    // Abrir dialog
    await user.click(screen.getByRole('button'));

    // Marcar checkbox
    await waitFor(() => {
      expect(screen.getByLabelText(/comandante/i)).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText(/comandante/i));

    // Confirmar
    await user.click(screen.getByText(/ir para batalha/i));

    expect(mockPrepareForBattle).toHaveBeenCalledWith(
      'char-1',
      expect.objectContaining({
        asCommander: true,
      })
    );
  });

  it('deve chamar goToBattle após conversão bem-sucedida', async () => {
    const user = userEvent.setup();
    render(<BattleButton character={mockCharacter} />);

    await user.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText(/ir para batalha/i)).toBeInTheDocument();
    });
    await user.click(screen.getByText(/ir para batalha/i));

    await waitFor(() => {
      expect(mockGoToBattle).toHaveBeenCalled();
    });
  });

  it('deve mostrar toast de sucesso após conversão', async () => {
    const user = userEvent.setup();
    render(<BattleButton character={mockCharacter} />);

    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText(/ir para batalha/i));
    await user.click(screen.getByText(/ir para batalha/i));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('Guerreiro Teste')
      );
    });
  });

  it('deve mostrar warnings como toast.warning', async () => {
    mockPrepareForBattle.mockResolvedValue({
      unit: { id: 'unit-1' },
      cards: [],
      warnings: ['HP muito baixo'],
    });

    const user = userEvent.setup();
    render(<BattleButton character={mockCharacter} />);

    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText(/ir para batalha/i));
    await user.click(screen.getByText(/ir para batalha/i));

    await waitFor(() => {
      expect(mockToast.warning).toHaveBeenCalledWith('HP muito baixo');
    });
  });

  it('deve fechar dialog ao clicar cancelar', async () => {
    const user = userEvent.setup();
    render(<BattleButton character={mockCharacter} />);

    // Abrir dialog
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText(/preparar para batalha/i));

    // Cancelar
    await user.click(screen.getByText(/cancelar/i));

    await waitFor(() => {
      expect(screen.queryByText(/preparar para batalha/i)).not.toBeInTheDocument();
    });
  });

  it('deve mostrar informações do personagem no dialog', async () => {
    const user = userEvent.setup();
    render(<BattleButton character={mockCharacter} />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/hegemonia/i)).toBeInTheDocument();
      expect(screen.getByText(/akashic/i)).toBeInTheDocument();
    });
  });
});

describe('BattleButton - Variants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConverting = false;
    mockErrors = [];
    mockValidateCharacter.mockReturnValue({ valid: true, errors: [] });
  });

  it('deve aceitar variant outline', () => {
    render(<BattleButton character={mockCharacter} variant="outline" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('deve aceitar variant ghost', () => {
    render(<BattleButton character={mockCharacter} variant="ghost" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('deve aceitar size icon (sem texto)', () => {
    render(<BattleButton character={mockCharacter} size="icon" />);
    expect(screen.queryByText(/batalha/i)).not.toBeInTheDocument();
  });

  it('deve aceitar size sm', () => {
    render(<BattleButton character={mockCharacter} size="sm" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('BattleButton - Error States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConverting = false;
    mockErrors = [];
    mockValidateCharacter.mockReturnValue({ valid: true, errors: [] });
  });

  it('não deve abrir dialog se validação falhar', async () => {
    mockValidateCharacter.mockReturnValue({
      valid: false,
      errors: ['Nome é obrigatório'],
    });

    const user = userEvent.setup();
    render(<BattleButton character={mockCharacter} />);

    await user.click(screen.getByRole('button'));

    // Dialog não deve abrir
    expect(screen.queryByText(/preparar para batalha/i)).not.toBeInTheDocument();
  });

  it('não deve chamar goToBattle se conversão falhar', async () => {
    mockPrepareForBattle.mockResolvedValue(null);

    const user = userEvent.setup();
    render(<BattleButton character={mockCharacter} />);

    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText(/ir para batalha/i));
    await user.click(screen.getByText(/ir para batalha/i));

    expect(mockGoToBattle).not.toHaveBeenCalled();
  });
});
