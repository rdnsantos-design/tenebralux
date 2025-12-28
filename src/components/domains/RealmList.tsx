import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRealms, useCreateRealm, useUpdateRealm, useDeleteRealm } from '@/hooks/useDomains';
import { Edit, Trash2, Plus, Check, X, Loader2 } from 'lucide-react';
import { Realm, REALM_REGIONS, REALM_CULTURES } from '@/types/Domain';

interface RealmListProps {
  onSelectRealm: (realm: Realm | null) => void;
  selectedRealmId?: string;
}

export const RealmList = ({ onSelectRealm, selectedRealmId }: RealmListProps) => {
  const { data: realms, isLoading } = useRealms();
  const createRealm = useCreateRealm();
  const updateRealm = useUpdateRealm();
  const deleteRealm = useDeleteRealm();

  const [newRealmName, setNewRealmName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingRegion, setEditingRegion] = useState<string>('');
  const [editingCulture, setEditingCulture] = useState<string>('');

  const handleCreate = () => {
    if (!newRealmName.trim()) return;
    createRealm.mutate(newRealmName.trim());
    setNewRealmName('');
  };

  const handleUpdate = (id: string) => {
    if (!editingName.trim()) return;
    updateRealm.mutate({ 
      id, 
      name: editingName.trim(),
      region: editingRegion || undefined,
      culture: editingCulture || undefined,
    });
    setEditingId(null);
    setEditingName('');
    setEditingRegion('');
    setEditingCulture('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza? Todas as províncias deste reino serão excluídas.')) {
      deleteRealm.mutate(id);
      if (selectedRealmId === id) {
        onSelectRealm(null);
      }
    }
  };

  const startEditing = (realm: Realm) => {
    setEditingId(realm.id);
    setEditingName(realm.name);
    setEditingRegion(realm.region || '');
    setEditingCulture(realm.culture || '');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Reinos ({realms?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add new realm */}
        <div className="flex gap-2">
          <Input
            placeholder="Nome do novo reino..."
            value={newRealmName}
            onChange={(e) => setNewRealmName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button 
            size="icon" 
            onClick={handleCreate}
            disabled={!newRealmName.trim() || createRealm.isPending}
          >
            {createRealm.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        {/* Realm list */}
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {/* All realms option */}
          <div
            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
              !selectedRealmId ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
            }`}
            onClick={() => onSelectRealm(null)}
          >
            <span className="font-medium">Todos os Reinos</span>
          </div>

          {realms?.map((realm) => (
            <div
              key={realm.id}
              className={`p-2 rounded cursor-pointer transition-colors ${
                selectedRealmId === realm.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
              }`}
            >
              {editingId === realm.id ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(realm.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="h-8"
                      placeholder="Nome"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleUpdate(realm.id)}>
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={editingRegion} onValueChange={setEditingRegion}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Região..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {REALM_REGIONS.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={editingCulture} onValueChange={setEditingCulture}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Cultura..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {REALM_CULTURES.map((culture) => (
                          <SelectItem key={culture} value={culture}>
                            {culture}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div 
                    className="flex-1"
                    onClick={() => onSelectRealm(realm)}
                  >
                    <span className="font-medium">{realm.name}</span>
                    {(realm.region || realm.culture) && (
                      <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                        {realm.region && <span>{realm.region}</span>}
                        {realm.region && realm.culture && <span>•</span>}
                        {realm.culture && <span>{realm.culture}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(realm);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(realm.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
