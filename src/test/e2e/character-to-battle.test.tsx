import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender as render } from '@/test/test-utils';
import { CharacterCard } from '@/components/character-manager/CharacterCard';
import { SavedCharacter } from '@/types/character-storage';

// Mock do hook de tactical integration
const mockPrepareForBattle = vi.fn();
const mockValidateCharacter = vi.fn();
const mockGoToBattle = vi.fn();

vi.mock('@/hooks/useTacticalIntegration', () => ({
  useTacticalIntegration: () => ({
    isConverting: false,
    errors: [],
    prepareForBattle: mockPrepareForBattle,
    validateCharacter: mockValidateCharacter,
    goToBattle: mockGoToBattle,
  }),
}));

// Mock do toast
vi.mock('sonner', () => ({
  toast: { 
    success: vi.fn(), 
    error: vi.fn(), 
    warning: vi.fn() 
  },
}));

// Mock do sessionStorage
const mockSessionStorage: Record<string, string> = {};
const sessionStorageMock = {
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage[key] = value;
  }),
  getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage[key];
  }),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', { 
  value: sessionStorageMock,
  writable: true 
});

const mockCharacter: SavedCharacter = {
  id: 'char-1',
  name: 'Herói Pronto',
  theme: 'akashic',
  factionId: 'hegemonia',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  data: {
    name: 'Herói Pronto',
    theme: 'akashic',
    factionId: 'hegemonia',
    attributes: {
      conhecimento: 3, raciocinio: 3, corpo: 4, reflexos: 4,
      determinacao: 3, coordenacao: 3, carisma: 2, intuicao: 3,
    },
    skills: { luta: 3, esquiva: 2 },
    virtues: { coragem: 1 },
    startingVirtue: 'coragem',
  },
};

describe('E2E: Character → Battle Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.clear();
    Object.keys(mockSessionStorage).forEach(key => delete mockSessionStorage[key]);
    
    mockValidateCharacter.mockReturnValue({ valid: true, errors: [] });
    mockPrepareForBattle.mockResolvedValue({
      unit: { 
        id: 'unit-1', 
        name: 'Herói Pronto',
        type: 'infantry',
        teamId: 'player',
        hp: 12,
        maxHp: 12,
        defense: 5,
        evasion: 4,
        speed: 4,
        initiative: 4,
        morale: 8,
        maxMorale: 8,
        stress: 2,
        position: { x: 0, y: 0 },
        isCommander: false,
        isActive: true,
        hasActed: false,
      },
      cards: [
        { id: 'card-1', name: 'Golpe de Luta', type: 'attack', unitId: 'unit-1' },
        { id: 'card-2', name: 'Postura Defensiva', type: 'defense', unitId: 'unit-1' },
      ],
      warnings: [],
    });
  });

  it('deve completar fluxo: Card → Dialog → Batalha', async () => {
    const user = userEvent.setup();
    
    render(
      <CharacterCard 
        character={mockCharacter}
        onContinue={vi.fn()} 
        onEdit={vi.fn()} 
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // 1. Verificar personagem no card
    expect(screen.getByText('Herói Pronto')).toBeInTheDocument();

    // 2. Clicar no botão de batalha (icon button)
    const battleButton = screen.getByRole('button', { name: '' });
    await user.click(battleButton);

    // 3. Verificar dialog aberto
    await waitFor(() => {
      expect(screen.getByText(/preparar para batalha/i)).toBeInTheDocument();
    });

    // 4. Confirmar
    const confirmButton = screen.getByText(/ir para batalha/i);
    await user.click(confirmButton);

    // 5. Verificar que prepareForBattle foi chamado
    await waitFor(() => {
      expect(mockPrepareForBattle).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({
          asCommander: false,
          generateCards: true,
        })
      );
    });

    // 6. Verificar navegação
    await waitFor(() => {
      expect(mockGoToBattle).toHaveBeenCalled();
    });
  });

  it('deve permitir entrar como comandante', async () => {
    const user = userEvent.setup();
    
    render(
      <CharacterCard 
        character={mockCharacter}
        onContinue={vi.fn()} 
        onEdit={vi.fn()} 
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Abrir dialog
    await user.click(screen.getByRole('button', { name: '' }));
    await waitFor(() => screen.getByText(/preparar para batalha/i));

    // Marcar checkbox de comandante
    await user.click(screen.getByLabelText(/comandante/i));

    // Confirmar
    await user.click(screen.getByText(/ir para batalha/i));

    // Verificar que foi chamado com asCommander: true
    await waitFor(() => {
      expect(mockPrepareForBattle).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({
          asCommander: true,
        })
      );
    });
  });

  it('deve mostrar erro se personagem inválido', async () => {
    const { toast } = await import('sonner');
    mockValidateCharacter.mockReturnValue({
      valid: false,
      errors: ['Atributos incompletos', 'Nome é obrigatório'],
    });

    const user = userEvent.setup();
    
    render(
      <CharacterCard 
        character={mockCharacter}
        onContinue={vi.fn()} 
        onEdit={vi.fn()} 
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Clicar no botão de batalha
    await user.click(screen.getByRole('button', { name: '' }));

    // Verificar que toast de erro foi mostrado
    expect(toast.error).toHaveBeenCalled();

    // Dialog não deve abrir
    expect(screen.queryByText(/preparar para batalha/i)).not.toBeInTheDocument();
  });

  it('deve mostrar warnings da conversão', async () => {
    const { toast } = await import('sonner');
    mockPrepareForBattle.mockResolvedValue({
      unit: { id: 'unit-1', name: 'Test' },
      cards: [],
      warnings: ['HP muito baixo', 'Comando baixo para comandante'],
    });

    const user = userEvent.setup();
    
    render(
      <CharacterCard 
        character={mockCharacter}
        onContinue={vi.fn()} 
        onEdit={vi.fn()} 
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: '' }));
    await waitFor(() => screen.getByText(/ir para batalha/i));
    await user.click(screen.getByText(/ir para batalha/i));

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith('HP muito baixo');
      expect(toast.warning).toHaveBeenCalledWith('Comando baixo para comandante');
    });
  });
});

describe('E2E: Character Card Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateCharacter.mockReturnValue({ valid: true, errors: [] });
    mockPrepareForBattle.mockResolvedValue({
      unit: { id: 'unit-1' },
      cards: [{ id: 'card-1' }],
      warnings: [],
    });
  });

  it('deve mostrar botão de batalha no CharacterCard', () => {
    render(
      <CharacterCard 
        character={mockCharacter}
        onContinue={vi.fn()} 
        onEdit={vi.fn()} 
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Deve haver botões: Continuar e Batalha
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('deve mostrar nome e facção no CharacterCard', () => {
    render(
      <CharacterCard 
        character={mockCharacter}
        onContinue={vi.fn()} 
        onEdit={vi.fn()} 
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Herói Pronto')).toBeInTheDocument();
  });

  it('deve mostrar tema no CharacterCard', () => {
    render(
      <CharacterCard 
        character={mockCharacter}
        onContinue={vi.fn()} 
        onEdit={vi.fn()} 
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/akashic/i)).toBeInTheDocument();
  });
});
