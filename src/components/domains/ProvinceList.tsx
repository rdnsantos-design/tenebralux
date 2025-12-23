import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProvinces, useCreateProvince, useUpdateProvince, useDeleteProvince, useRealms } from '@/hooks/useDomains';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Plus, Check, X, Loader2 } from 'lucide-react';
import { Province, ProvinceWithRealm } from '@/types/Domain';

interface ProvinceListProps {
  selectedRealmId?: string;
}

export const ProvinceList = ({ selectedRealmId }: ProvinceListProps) => {
  const { data: provinces, isLoading } = useProvinces(selectedRealmId);
  const { data: realms } = useRealms();
  const createProvince = useCreateProvince();
  const updateProvince = useUpdateProvince();
  const deleteProvince = useDeleteProvince();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    realm_id: selectedRealmId || '',
    development: 0,
    magic: 0,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      realm_id: selectedRealmId || '',
      development: 0,
      magic: 0,
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!formData.name.trim() || !formData.realm_id) return;
    createProvince.mutate({
      name: formData.name.trim(),
      realm_id: formData.realm_id,
      development: formData.development,
      magic: formData.magic,
    });
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingId || !formData.name.trim() || !formData.realm_id) return;
    updateProvince.mutate({
      id: editingId,
      name: formData.name.trim(),
      realm_id: formData.realm_id,
      development: formData.development,
      magic: formData.magic,
    });
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta província?')) {
      deleteProvince.mutate(id);
    }
  };

  const startEditing = (province: ProvinceWithRealm) => {
    setEditingId(province.id);
    setFormData({
      name: province.name,
      realm_id: province.realm_id,
      development: province.development,
      magic: province.magic,
    });
    setShowAddForm(true);
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          Províncias ({provinces?.length || 0})
        </CardTitle>
        {!showAddForm && (
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nova Província
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-4 p-4 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs text-muted-foreground">Nome</label>
                <Input
                  placeholder="Nome da província"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Reino</label>
                <Select
                  value={formData.realm_id}
                  onValueChange={(value) => setFormData({ ...formData, realm_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {realms?.map((realm) => (
                      <SelectItem key={realm.id} value={realm.id}>
                        {realm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Desenvolvimento</label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.development}
                  onChange={(e) => setFormData({ ...formData, development: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Magia</label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.magic}
                  onChange={(e) => setFormData({ ...formData, magic: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  size="sm" 
                  onClick={editingId ? handleUpdate : handleCreate}
                  disabled={!formData.name.trim() || !formData.realm_id}
                >
                  <Check className="w-4 h-4 mr-1" />
                  {editingId ? 'Salvar' : 'Criar'}
                </Button>
                <Button size="sm" variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Province Table */}
        {provinces && provinces.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Província</TableHead>
                  {!selectedRealmId && <TableHead>Reino</TableHead>}
                  <TableHead className="text-center w-24">Desenv.</TableHead>
                  <TableHead className="text-center w-24">Magia</TableHead>
                  <TableHead className="text-right w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {provinces.map((province) => (
                  <TableRow key={province.id}>
                    <TableCell className="font-medium">{province.name}</TableCell>
                    {!selectedRealmId && (
                      <TableCell className="text-muted-foreground">
                        {province.realm?.name || '-'}
                      </TableCell>
                    )}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                        {province.development}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 font-semibold">
                        {province.magic}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEditing(province)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(province.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {selectedRealmId 
              ? 'Nenhuma província neste reino. Adicione a primeira!'
              : 'Nenhuma província cadastrada. Adicione a primeira ou importe do Excel!'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};
