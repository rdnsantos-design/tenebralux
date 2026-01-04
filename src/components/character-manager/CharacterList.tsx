import React, { useState } from 'react';
import { SavedCharacter } from '@/types/character-storage';
import { useCharacterStorageHybrid } from '@/hooks/useCharacterStorageHybrid';
import { CharacterCard } from './CharacterCard';
import { CharacterFilters } from './CharacterFilters';
import { ImportExportDialog } from './ImportExportDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { UserMenu } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Upload, 
  Download, 
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface CharacterListProps {
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onContinue: (id: string) => void;
}

export function CharacterList({ 
  onCreateNew, 
  onEdit, 
  onContinue 
}: CharacterListProps) {
  const {
    filteredCharacters,
    isLoading,
    error,
    filters,
    setFilters,
    remove,
    duplicate,
    exportAll,
    importFromJson,
    storageMode,
    characters,
  } = useCharacterStorageHybrid();

  // Stats calculados localmente
  const stats = {
    count: characters.length,
    maxCount: 50,
    storageUsed: storageMode === 'cloud' ? 'Cloud' : 'Local',
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SavedCharacter | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);

  // Atualizar filtro de busca
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters({ ...filters, searchQuery: query });
  };

  // Deletar com confirmação
  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      await remove(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deletado`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Erro ao deletar personagem');
    }
  };

  // Duplicar
  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await duplicate(id);
      toast.success(`"${duplicated.name}" criado`);
    } catch (err) {
      toast.error('Erro ao duplicar personagem');
    }
  };

  // Import
  const handleImport = async (json: string) => {
    try {
      const result = await importFromJson(json);
      
      if (result.imported > 0) {
        toast.success(`${result.imported} personagem(ns) importado(s)`);
      }
      if (result.skipped > 0) {
        toast.warning(`${result.skipped} personagem(ns) ignorado(s)`);
      }
      if (result.errors.length > 0) {
        result.errors.forEach(e => toast.error(e));
      }
      
      setShowImportExport(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao importar');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meus Personagens</h1>
          <p className="text-muted-foreground">
            {stats.count} de {stats.maxCount} personagens ({stats.storageUsed})
          </p>
        </div>

        <div className="flex items-center gap-4">
          <UserMenu />
          <Button variant="outline" onClick={() => setShowImportExport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" onClick={exportAll} disabled={stats.count === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Todos
          </Button>
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Personagem
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <CharacterFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Character Grid */}
      {filteredCharacters.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {stats.count === 0 
              ? 'Nenhum personagem salvo ainda.'
              : 'Nenhum personagem encontrado com os filtros atuais.'
            }
          </p>
          {stats.count === 0 && (
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Personagem
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onContinue={() => onContinue(character.id)}
              onEdit={() => onEdit(character.id)}
              onDuplicate={() => handleDuplicate(character.id)}
              onDelete={() => setDeleteTarget(character)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        characterName={deleteTarget?.name || ''}
        onConfirm={handleDelete}
      />

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        onImport={handleImport}
        onExport={exportAll}
      />
    </div>
  );
}
