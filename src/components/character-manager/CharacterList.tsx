import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SavedCharacter } from '@/types/character-storage';
import { SimplifiedCharacter, CHARACTER_LEVELS, SIMPLIFIED_WEAPONS } from '@/types/simplified-character';
import { useCharacterStorageHybrid } from '@/hooks/useCharacterStorageHybrid';
import { CharacterCard } from './CharacterCard';
import { CharacterFilters } from './CharacterFilters';
import { ImportExportDialog } from './ImportExportDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { ConnectionStatus } from './ConnectionStatus';
import { CharacterSheetDialog } from './CharacterSheetDialog';
import { UserMenu } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Upload, 
  Download, 
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Zap,
  Crown,
  Edit,
  Trash2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

interface CharacterListProps {
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onContinue: (id: string) => void;
}

// Component for simplified character card
function SimplifiedCharacterCard({ 
  character, 
  onEdit, 
  onDelete,
  onDuplicate 
}: { 
  character: SimplifiedCharacter;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const levelInfo = CHARACTER_LEVELS.find(l => l.value === character.level);
  const weapon = SIMPLIFIED_WEAPONS[character.weaponType];
  
  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {character.name}
              {character.isRegent && (
                <Crown className="w-4 h-4 text-amber-500" />
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Resumido
              </Badge>
              <Badge variant="outline" className="text-xs">
                {levelInfo?.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center p-1.5 bg-muted rounded">
            <div className="font-semibold">DEF</div>
            <div>{character.defesa}</div>
          </div>
          <div className="text-center p-1.5 bg-muted rounded">
            <div className="font-semibold">EVA</div>
            <div>{character.evasao}</div>
          </div>
          <div className="text-center p-1.5 bg-muted rounded">
            <div className="font-semibold">VIT</div>
            <div>{character.vitalidade}</div>
          </div>
          <div className="text-center p-1.5 bg-muted rounded">
            <div className="font-semibold">MOV</div>
            <div>{character.movimento}</div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Ataques:</span> Tiro {character.tiro} | Luta {character.luta} | Lâminas {character.laminas}
        </div>
        
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Arma:</span> {weapon.name} (Dano {weapon.damage})
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Edit className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            <Copy className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CharacterList({ 
  onCreateNew, 
  onEdit, 
  onContinue 
}: CharacterListProps) {
  const navigate = useNavigate();
  const {
    filteredCharacters,
    isLoading,
    isSyncing,
    error,
    filters,
    setFilters,
    remove,
    duplicate,
    exportAll,
    importFromJson,
    storageMode,
    characters,
    syncNow,
  } = useCharacterStorageHybrid();

  // Simplified characters from localStorage
  const [simplifiedCharacters, setSimplifiedCharacters] = useState<SimplifiedCharacter[]>([]);
  const [deleteSimplifiedTarget, setDeleteSimplifiedTarget] = useState<SimplifiedCharacter | null>(null);

  // Load simplified characters
  useEffect(() => {
    const loadSimplified = () => {
      try {
        const stored = localStorage.getItem('simplifiedCharacters');
        setSimplifiedCharacters(stored ? JSON.parse(stored) : []);
      } catch {
        setSimplifiedCharacters([]);
      }
    };
    loadSimplified();
    
    // Listen for storage changes
    window.addEventListener('storage', loadSimplified);
    return () => window.removeEventListener('storage', loadSimplified);
  }, []);

  // Stats calculados localmente
  const stats = {
    count: characters.length + simplifiedCharacters.length,
    maxCount: 50,
    storageUsed: storageMode === 'cloud' ? 'Cloud' : 'Local',
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SavedCharacter | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [viewSheetCharacter, setViewSheetCharacter] = useState<SavedCharacter | null>(null);

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

  // Funções para personagens simplificados
  const handleDeleteSimplified = (id: string) => {
    const updated = simplifiedCharacters.filter(c => c.id !== id);
    localStorage.setItem('simplifiedCharacters', JSON.stringify(updated));
    setSimplifiedCharacters(updated);
    setDeleteSimplifiedTarget(null);
    toast.success('Personagem simplificado deletado');
  };

  const handleDuplicateSimplified = (character: SimplifiedCharacter) => {
    const newChar: SimplifiedCharacter = {
      ...character,
      id: crypto.randomUUID(),
      name: `${character.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [...simplifiedCharacters, newChar];
    localStorage.setItem('simplifiedCharacters', JSON.stringify(updated));
    setSimplifiedCharacters(updated);
    toast.success(`"${newChar.name}" criado`);
  };

  // Filtrar personagens simplificados pela busca
  const filteredSimplified = simplifiedCharacters.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Sync manual
  const handleSyncNow = async () => {
    try {
      const result = await syncNow();
      if (result.synced > 0) {
        toast.success(`${result.synced} personagem(ns) sincronizado(s)`);
      } else {
        toast.success('Tudo sincronizado!');
      }
      if (result.errors.length > 0) {
        result.errors.forEach(e => toast.error(e));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao sincronizar');
    }
  };

  const totalCharacters = filteredCharacters.length + filteredSimplified.length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Meus Personagens</h1>
            <ConnectionStatus />
          </div>
          <p className="text-muted-foreground ml-11">
            {stats.count} de {stats.maxCount} personagens ({stats.storageUsed})
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <UserMenu />
          {storageMode === 'cloud' && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleSyncNow}
              disabled={isSyncing}
              title="Sincronizar agora"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowImportExport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <Button variant="outline" onClick={exportAll} disabled={stats.count === 0}>
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Novo Personagem</span>
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
      {totalCharacters === 0 ? (
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
          {/* Full characters */}
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onContinue={() => onContinue(character.id)}
              onEdit={() => onEdit(character.id)}
              onDuplicate={() => handleDuplicate(character.id)}
              onDelete={() => setDeleteTarget(character)}
              onViewSheet={() => setViewSheetCharacter(character)}
            />
          ))}
          {/* Simplified characters */}
          {filteredSimplified.map((character) => (
            <SimplifiedCharacterCard
              key={character.id}
              character={character}
              onEdit={() => onEdit(character.id)}
              onDuplicate={() => handleDuplicateSimplified(character)}
              onDelete={() => setDeleteSimplifiedTarget(character)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog - Full character */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        characterName={deleteTarget?.name || ''}
        onConfirm={handleDelete}
      />

      {/* Delete Confirmation Dialog - Simplified character */}
      <DeleteConfirmDialog
        open={!!deleteSimplifiedTarget}
        onOpenChange={(open) => !open && setDeleteSimplifiedTarget(null)}
        characterName={deleteSimplifiedTarget?.name || ''}
        onConfirm={() => deleteSimplifiedTarget && handleDeleteSimplified(deleteSimplifiedTarget.id)}
      />

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        onImport={handleImport}
        onExport={exportAll}
      />

      {/* Character Sheet Dialog */}
      <CharacterSheetDialog
        character={viewSheetCharacter}
        open={!!viewSheetCharacter}
        onOpenChange={(open) => !open && setViewSheetCharacter(null)}
      />
    </div>
  );
}
