import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterCard } from '@/components/character-manager/CharacterCard';
import { CharacterFilters } from '@/components/character-manager/CharacterFilters';
import { DeleteConfirmDialog } from '@/components/character-manager/DeleteConfirmDialog';
import { ImportExportDialog } from '@/components/character-manager/ImportExportDialog';
import { SavedCharacter, CharacterListFilters } from '@/types/character-storage';
import { CharacterDraft } from '@/types/character-builder';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => 'há 2 dias'),
}));

vi.mock('date-fns/locale', () => ({
  ptBR: {},
}));

// Mock factions data
vi.mock('@/data/character/factions', () => ({
  getFactionById: vi.fn((id: string) => {
    const factions: Record<string, { id: string; name: string }> = {
      'faction-1': { id: 'faction-1', name: 'Ordem da Luz' },
      'faction-2': { id: 'faction-2', name: 'Guilda dos Magos' },
    };
    return factions[id] || null;
  }),
  FACTIONS_BY_THEME: {
    akashic: [
      { id: 'faction-1', name: 'Ordem da Luz' },
      { id: 'faction-2', name: 'Guilda dos Magos' },
    ],
    tenebralux: [
      { id: 'faction-3', name: 'Sombras' },
    ],
  },
}));

// Helper to create mock character
function createMockCharacter(overrides: Partial<SavedCharacter> = {}): SavedCharacter {
  const now = new Date().toISOString();
  return {
    id: 'char-1',
    name: 'Test Hero',
    theme: 'akashic',
    factionId: 'faction-1',
    cultureId: 'culture-1',
    createdAt: now,
    updatedAt: now,
    data: {} as CharacterDraft,
    ...overrides,
  };
}

describe('CharacterCard', () => {
  const defaultProps = {
    character: createMockCharacter(),
    onContinue: vi.fn(),
    onEdit: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render character name', () => {
    render(<CharacterCard {...defaultProps} />);
    expect(screen.getByText('Test Hero')).toBeInTheDocument();
  });

  it('should render faction name', () => {
    render(<CharacterCard {...defaultProps} />);
    expect(screen.getByText('Ordem da Luz')).toBeInTheDocument();
  });

  it('should render theme badge for akashic', () => {
    render(<CharacterCard {...defaultProps} />);
    expect(screen.getByText('Akashic')).toBeInTheDocument();
  });

  it('should render theme badge for tenebralux', () => {
    const char = createMockCharacter({ theme: 'tenebralux' });
    render(<CharacterCard {...defaultProps} character={char} />);
    expect(screen.getByText('Tenebra')).toBeInTheDocument();
  });

  it('should call onContinue when continue button is clicked', async () => {
    const user = userEvent.setup();
    render(<CharacterCard {...defaultProps} />);

    await user.click(screen.getByText('Continuar'));

    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
  });

  it('should show dropdown menu with options', async () => {
    const user = userEvent.setup();
    render(<CharacterCard {...defaultProps} />);

    // Open dropdown
    const menuButton = screen.getByRole('button', { name: '' }); // MoreVertical icon button
    await user.click(menuButton);

    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Duplicar')).toBeInTheDocument();
    expect(screen.getByText('Deletar')).toBeInTheDocument();
  });

  it('should call onEdit when edit menu item is clicked', async () => {
    const user = userEvent.setup();
    render(<CharacterCard {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: '' });
    await user.click(menuButton);
    await user.click(screen.getByText('Editar'));

    expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDuplicate when duplicate menu item is clicked', async () => {
    const user = userEvent.setup();
    render(<CharacterCard {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: '' });
    await user.click(menuButton);
    await user.click(screen.getByText('Duplicar'));

    expect(defaultProps.onDuplicate).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete menu item is clicked', async () => {
    const user = userEvent.setup();
    render(<CharacterCard {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: '' });
    await user.click(menuButton);
    await user.click(screen.getByText('Deletar'));

    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
  });

  it('should display "Sem facção" when faction not found', () => {
    const char = createMockCharacter({ factionId: 'unknown' });
    render(<CharacterCard {...defaultProps} character={char} />);
    expect(screen.getByText('Sem facção')).toBeInTheDocument();
  });

  it('should display relative update time', () => {
    render(<CharacterCard {...defaultProps} />);
    expect(screen.getByText(/Atualizado há 2 dias/)).toBeInTheDocument();
  });
});

describe('CharacterFilters', () => {
  const defaultFilters: CharacterListFilters = {
    theme: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  };

  const defaultProps = {
    filters: defaultFilters,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render filter controls', () => {
    render(<CharacterFilters {...defaultProps} />);
    
    // Check for select elements
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should call onChange when theme changes', async () => {
    const user = userEvent.setup();
    render(<CharacterFilters {...defaultProps} />);

    // Find and click the first combobox (theme select)
    const selects = screen.getAllByRole('combobox');
    await user.click(selects[0]);

    // Select Akashic option
    const akashicOption = await screen.findByText('Akashic');
    await user.click(akashicOption);

    expect(defaultProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'akashic' })
    );
  });

  it('should display current filter values', () => {
    const filters: CharacterListFilters = {
      theme: 'akashic',
      sortBy: 'name',
      sortOrder: 'asc',
    };

    render(<CharacterFilters filters={filters} onChange={vi.fn()} />);

    // The select should show the current value
    expect(screen.getByText('Akashic')).toBeInTheDocument();
  });
});

describe('DeleteConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    characterName: 'Hero to Delete',
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display character name in confirmation message', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    expect(screen.getByText(/Hero to Delete/)).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmDialog {...defaultProps} />);

    const confirmButton = screen.getByText('Deletar');
    await user.click(confirmButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenChange when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmDialog {...defaultProps} />);

    const cancelButton = screen.getByText('Cancelar');
    await user.click(cancelButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not render when closed', () => {
    render(<DeleteConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText(/Hero to Delete/)).not.toBeInTheDocument();
  });
});

describe('ImportExportDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onImport: vi.fn(async () => {}),
    onExport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render import and export tabs', () => {
    render(<ImportExportDialog {...defaultProps} />);
    
    expect(screen.getByText('Importar')).toBeInTheDocument();
    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('should show import tab content by default', () => {
    render(<ImportExportDialog {...defaultProps} />);
    
    expect(screen.getByText('Selecionar Arquivo JSON')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ou cole o conteúdo JSON/)).toBeInTheDocument();
  });

  it('should switch to export tab', async () => {
    const user = userEvent.setup();
    render(<ImportExportDialog {...defaultProps} />);

    await user.click(screen.getByRole('tab', { name: /Exportar/i }));

    expect(screen.getByText('Baixar Arquivo de Backup')).toBeInTheDocument();
  });

  it('should call onExport when export button is clicked', async () => {
    const user = userEvent.setup();
    render(<ImportExportDialog {...defaultProps} />);

    await user.click(screen.getByRole('tab', { name: /Exportar/i }));
    await user.click(screen.getByText('Baixar Arquivo de Backup'));

    expect(defaultProps.onExport).toHaveBeenCalledTimes(1);
  });

  it('should disable import button when textarea is empty', () => {
    render(<ImportExportDialog {...defaultProps} />);
    
    const importButton = screen.getByText('Importar Personagens');
    expect(importButton).toBeDisabled();
  });

  it('should enable import button when text is entered', async () => {
    const user = userEvent.setup();
    render(<ImportExportDialog {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Ou cole o conteúdo JSON/);
    await user.type(textarea, '{"test": "data"}');

    const importButton = screen.getByText('Importar Personagens');
    expect(importButton).not.toBeDisabled();
  });

  it('should call onImport with text content', async () => {
    const user = userEvent.setup();
    render(<ImportExportDialog {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Ou cole o conteúdo JSON/);
    await user.type(textarea, '{"characters":[]}');

    await user.click(screen.getByText('Importar Personagens'));

    expect(defaultProps.onImport).toHaveBeenCalledWith('{"characters":[]}');
  });

  it('should clear textarea after successful import', async () => {
    const user = userEvent.setup();
    render(<ImportExportDialog {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Ou cole o conteúdo JSON/);
    await user.type(textarea, '{"test": "data"}');

    await user.click(screen.getByText('Importar Personagens'));

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('should show loading state during import', async () => {
    const slowImport = vi.fn(async (): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    const user = userEvent.setup();
    
    render(<ImportExportDialog {...defaultProps} onImport={slowImport} />);

    const textarea = screen.getByPlaceholderText(/Ou cole o conteúdo JSON/);
    await user.type(textarea, '{"test": "data"}');

    await user.click(screen.getByText('Importar Personagens'));

    expect(screen.getByText('Importando...')).toBeInTheDocument();
  });
});
