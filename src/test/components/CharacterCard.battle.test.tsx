import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { CharacterCard } from '@/components/character-manager/CharacterCard';
import { SavedCharacter } from '@/types/character-storage';

// Mock do BattleButton
vi.mock('@/components/character-manager/BattleButton', () => ({
  BattleButton: ({ character, variant, size }: any) => (
    <button 
      data-testid="battle-button"
      data-character-id={character.id}
      data-variant={variant}
      data-size={size}
    >
      Batalha
    </button>
  ),
}));

// Mock de funções auxiliares
vi.mock('@/data/character/factions', () => ({
  getFactionById: vi.fn(() => ({ id: 'faction-1', name: 'Facção Teste' })),
  getAvailableFactions: vi.fn(() => [{ id: 'faction-1', name: 'Facção Teste' }]),
}));

vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => 'há 2 dias'),
}));

vi.mock('date-fns/locale', () => ({
  ptBR: {},
}));

const mockCharacter: SavedCharacter = {
  id: 'char-1',
  name: 'Herói Teste',
  theme: 'akashic',
  factionId: 'faction-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  data: {
    name: 'Herói Teste',
    theme: 'akashic',
    factionId: 'faction-1',
    attributes: {
      conhecimento: 3, raciocinio: 3, corpo: 3, reflexos: 3,
      determinacao: 3, coordenacao: 3, carisma: 3, intuicao: 3,
    },
    skills: {},
    virtues: {},
  },
};

describe('CharacterCard - Integração BattleButton', () => {
  const defaultProps = {
    character: mockCharacter,
    onContinue: vi.fn(),
    onEdit: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar BattleButton no card', () => {
    render(<CharacterCard {...defaultProps} />);
    
    const battleButton = screen.getByTestId('battle-button');
    expect(battleButton).toBeInTheDocument();
  });

  it('deve passar character para BattleButton', () => {
    render(<CharacterCard {...defaultProps} />);
    
    const battleButton = screen.getByTestId('battle-button');
    expect(battleButton).toHaveAttribute('data-character-id', 'char-1');
  });

  it('deve ter variant outline no BattleButton', () => {
    render(<CharacterCard {...defaultProps} />);
    
    const battleButton = screen.getByTestId('battle-button');
    expect(battleButton).toHaveAttribute('data-variant', 'outline');
  });

  it('deve ter size icon no BattleButton', () => {
    render(<CharacterCard {...defaultProps} />);
    
    const battleButton = screen.getByTestId('battle-button');
    expect(battleButton).toHaveAttribute('data-size', 'icon');
  });

  it('deve manter botão Continuar ao lado do BattleButton', () => {
    render(<CharacterCard {...defaultProps} />);
    
    const continueButton = screen.getByText('Continuar');
    const battleButton = screen.getByTestId('battle-button');
    
    expect(continueButton).toBeInTheDocument();
    expect(battleButton).toBeInTheDocument();
  });

  it('deve chamar onContinue ao clicar em Continuar', async () => {
    const user = userEvent.setup();
    render(<CharacterCard {...defaultProps} />);
    
    await user.click(screen.getByText('Continuar'));
    
    expect(defaultProps.onContinue).toHaveBeenCalled();
  });
});
