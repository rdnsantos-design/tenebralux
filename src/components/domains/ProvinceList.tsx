import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProvinces, useCreateProvince, useUpdateProvince, useDeleteProvince, useRealms } from '@/hooks/useDomains';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Plus, Check, X, Loader2, Filter, Anchor, Waves, Route, Castle, Zap, MapPin } from 'lucide-react';
import { ProvinceWithRealm, Province, TERRAIN_TYPES } from '@/types/Domain';

interface ProvinceListProps {
  selectedRealmId?: string;
  onSelectProvince?: (province: Province | null) => void;
  compact?: boolean;
}

export const ProvinceList = ({ selectedRealmId, onSelectProvince, compact }: ProvinceListProps) => {
  const { data: provinces, isLoading } = useProvinces(selectedRealmId);
  const { data: realms } = useRealms();
  const createProvince = useCreateProvince();
  const updateProvince = useUpdateProvince();
  const deleteProvince = useDeleteProvince();

  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [culturaFilter, setCulturaFilter] = useState<string>('all');

  const handleSelectProvince = (province: ProvinceWithRealm) => {
    if (selectedProvinceId === province.id) {
      setSelectedProvinceId(null);
      onSelectProvince?.(null);
    } else {
      setSelectedProvinceId(province.id);
      onSelectProvince?.(province);
    }
  };
  
  // Get unique cultures from provinces
  const uniqueCultures = useMemo(() => {
    if (!provinces) return [];
    const cultures = new Set(provinces.map(p => p.cultura).filter(Boolean));
    return Array.from(cultures).sort() as string[];
  }, [provinces]);

  // Filter provinces by culture
  const filteredProvinces = useMemo(() => {
    if (!provinces) return [];
    if (culturaFilter === 'all') return provinces;
    if (culturaFilter === 'none') return provinces.filter(p => !p.cultura);
    return provinces.filter(p => p.cultura === culturaFilter);
  }, [provinces, culturaFilter]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    realm_id: selectedRealmId || '',
    development: 0,
    magic: 0,
    cultura: '',
    terrain_type: '',
    has_port: false,
    has_river: false,
    has_path: false,
    road_level: 0,
    arcane_line_level: 0,
    fortification_level: 0,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      realm_id: selectedRealmId || '',
      development: 0,
      magic: 0,
      cultura: '',
      terrain_type: '',
      has_port: false,
      has_river: false,
      has_path: false,
      road_level: 0,
      arcane_line_level: 0,
      fortification_level: 0,
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
      cultura: formData.cultura || undefined,
      terrain_type: formData.terrain_type || undefined,
      has_port: formData.has_port,
      has_river: formData.has_river,
      has_path: formData.has_path,
      road_level: formData.road_level,
      arcane_line_level: formData.arcane_line_level,
      fortification_level: formData.fortification_level,
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
      cultura: formData.cultura || undefined,
      terrain_type: formData.terrain_type || undefined,
      has_port: formData.has_port,
      has_river: formData.has_river,
      has_path: formData.has_path,
      road_level: formData.road_level,
      arcane_line_level: formData.arcane_line_level,
      fortification_level: formData.fortification_level,
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
      cultura: province.cultura || '',
      terrain_type: province.terrain_type || '',
      has_port: province.has_port,
      has_river: province.has_river,
      has_path: province.has_path,
      road_level: province.road_level,
      arcane_line_level: province.arcane_line_level,
      fortification_level: province.fortification_level,
    });
    setShowAddForm(true);
  };

  const LevelSelector = ({ 
    label, 
    value, 
    onChange, 
    icon: Icon 
  }: { 
    label: string; 
    value: number; 
    onChange: (val: number) => void; 
    icon: React.ElementType;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((level) => (
          <Button
            key={level}
            type="button"
            size="sm"
            variant={value === level ? 'default' : 'outline'}
            className="h-7 w-7 p-0 text-xs"
            onClick={() => onChange(level)}
          >
            {level}
          </Button>
        ))}
      </div>
    </div>
  );

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
          Províncias ({filteredProvinces.length}{culturaFilter !== 'all' ? ` de ${provinces?.length || 0}` : ''})
        </CardTitle>
        {!compact && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={culturaFilter} onValueChange={setCulturaFilter}>
                <SelectTrigger className="w-[180px] h-9 bg-background">
                  <SelectValue placeholder="Filtrar por cultura" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">Todas as culturas</SelectItem>
                  <SelectItem value="none">Sem cultura</SelectItem>
                  {uniqueCultures.map((cultura) => (
                    <SelectItem key={cultura} value={cultura}>
                      {cultura}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!showAddForm && (
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Nova Província
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Compact mode - simple list for selection */}
        {compact ? (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            <Input
              placeholder="Buscar província..."
              className="mb-2"
            />
            {filteredProvinces.map((province) => (
              <div
                key={province.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedProvinceId === province.id
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleSelectProvince(province)}
              >
                <div className="font-medium">{province.name}</div>
                <div className="text-sm text-muted-foreground">
                  {province.realm?.name} • Dev: {province.development} • Mag: {province.magic}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-4 p-4 border rounded-lg bg-muted/50 space-y-4">
            {/* Row 1: Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    {realms?.map((realm) => (
                      <SelectItem key={realm.id} value={realm.id}>
                        {realm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cultura</label>
                <Input
                  placeholder="Cultura"
                  value={formData.cultura}
                  onChange={(e) => setFormData({ ...formData, cultura: e.target.value })}
                />
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
              <div>
                <label className="text-xs text-muted-foreground">Terreno</label>
                <Select
                  value={formData.terrain_type}
                  onValueChange={(value) => setFormData({ ...formData, terrain_type: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="">Nenhum</SelectItem>
                    {TERRAIN_TYPES.map((terrain) => (
                      <SelectItem key={terrain} value={terrain}>
                        {terrain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Connections */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t">
              <span className="text-xs font-medium text-muted-foreground">Conexões:</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="has_port"
                  checked={formData.has_port}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_port: !!checked })}
                />
                <label htmlFor="has_port" className="text-sm flex items-center gap-1 cursor-pointer">
                  <Anchor className="w-4 h-4 text-blue-500" />
                  Porto
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="has_river"
                  checked={formData.has_river}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_river: !!checked })}
                />
                <label htmlFor="has_river" className="text-sm flex items-center gap-1 cursor-pointer">
                  <Waves className="w-4 h-4 text-cyan-500" />
                  Rio
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="has_path"
                  checked={formData.has_path}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_path: !!checked })}
                />
                <label htmlFor="has_path" className="text-sm flex items-center gap-1 cursor-pointer">
                  <Route className="w-4 h-4 text-amber-600" />
                  Caminho
                </label>
              </div>
            </div>

            {/* Row 3: Structures */}
            <div className="flex flex-wrap items-end gap-6 pt-2 border-t">
              <span className="text-xs font-medium text-muted-foreground self-center">Estruturas:</span>
              <LevelSelector
                label="Estradas"
                value={formData.road_level}
                onChange={(val) => setFormData({ ...formData, road_level: val })}
                icon={Route}
              />
              <LevelSelector
                label="Linha Arcana"
                value={formData.arcane_line_level}
                onChange={(val) => setFormData({ ...formData, arcane_line_level: val })}
                icon={Zap}
              />
              <LevelSelector
                label="Fortificações"
                value={formData.fortification_level}
                onChange={(val) => setFormData({ ...formData, fortification_level: val })}
                icon={Castle}
              />
            </div>

            {/* Row 4: Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button 
                size="sm" 
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={!formData.name.trim() || !formData.realm_id}
              >
                <Check className="w-4 h-4 mr-1" />
                {editingId ? 'Salvar' : 'Criar'}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Province Table */}
        {filteredProvinces.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Província</TableHead>
                  {!selectedRealmId && <TableHead>Reino</TableHead>}
                  <TableHead>Terreno</TableHead>
                  <TableHead>Cultura</TableHead>
                  <TableHead className="text-center w-16">Dev.</TableHead>
                  <TableHead className="text-center w-16">Mag.</TableHead>
                  <TableHead className="text-center">Conexões</TableHead>
                  <TableHead className="text-center">Estruturas</TableHead>
                  <TableHead className="text-right w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProvinces.map((province) => (
                  <TableRow key={province.id}>
                    <TableCell className="font-medium">{province.name}</TableCell>
                    {!selectedRealmId && (
                      <TableCell className="text-muted-foreground">
                        {province.realm?.name || '-'}
                      </TableCell>
                    )}
                    <TableCell>
                      {province.terrain_type ? (
                        <span className="inline-flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3" />
                          {province.terrain_type}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {province.cultura || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {province.development}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-500/10 text-purple-500 font-semibold text-sm">
                        {province.magic}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        {province.has_port && (
                          <span title="Porto" className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-500/10">
                            <Anchor className="w-3.5 h-3.5 text-blue-500" />
                          </span>
                        )}
                        {province.has_river && (
                          <span title="Rio" className="inline-flex items-center justify-center w-6 h-6 rounded bg-cyan-500/10">
                            <Waves className="w-3.5 h-3.5 text-cyan-500" />
                          </span>
                        )}
                        {province.has_path && (
                          <span title="Caminho" className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-600/10">
                            <Route className="w-3.5 h-3.5 text-amber-600" />
                          </span>
                        )}
                        {!province.has_port && !province.has_river && !province.has_path && (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        {province.road_level > 0 && (
                          <span title={`Estradas Nv.${province.road_level}`} className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-600/10 text-xs font-medium text-amber-600">
                            {province.road_level}
                          </span>
                        )}
                        {province.arcane_line_level > 0 && (
                          <span title={`Linha Arcana Nv.${province.arcane_line_level}`} className="inline-flex items-center justify-center w-6 h-6 rounded bg-violet-500/10 text-xs font-medium text-violet-500">
                            {province.arcane_line_level}
                          </span>
                        )}
                        {province.fortification_level > 0 && (
                          <span title={`Fortificações Nv.${province.fortification_level}`} className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-500/10 text-xs font-medium text-slate-500">
                            {province.fortification_level}
                          </span>
                        )}
                        {province.road_level === 0 && province.arcane_line_level === 0 && province.fortification_level === 0 && (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </div>
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
        </>
        )}
      </CardContent>
    </Card>
  );
};