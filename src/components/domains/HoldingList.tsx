import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHoldings, useCreateHolding, useUpdateHolding, useDeleteHolding } from '@/hooks/useHoldings';
import { useRegents } from '@/hooks/useRegents';
import { useProvinces } from '@/hooks/useDomains';
import { Holding, HoldingWithRegent, HoldingType, HOLDING_TYPES } from '@/types/Domain';
import { Building, Plus, Edit, Trash2, Loader2, Search, Crown, Store, Church, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface HoldingListProps {
  selectedProvinceId?: string;
}

const holdingIcons: Record<HoldingType, React.ReactNode> = {
  ordem: <Crown className="w-4 h-4 text-yellow-500" />,
  guilda: <Store className="w-4 h-4 text-green-500" />,
  templo: <Church className="w-4 h-4 text-blue-500" />,
  fonte_magica: <Sparkles className="w-4 h-4 text-purple-500" />,
};

export function HoldingList({ selectedProvinceId }: HoldingListProps) {
  const { data: holdings, isLoading } = useHoldings(selectedProvinceId);
  const { data: regents } = useRegents();
  const { data: provinces } = useProvinces();
  const createHolding = useCreateHolding();
  const updateHolding = useUpdateHolding();
  const deleteHolding = useDeleteHolding();
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<HoldingWithRegent | null>(null);
  const [formData, setFormData] = useState({
    province_id: '',
    holding_type: 'ordem' as HoldingType,
    regent_id: '',
    level: 0,
    notes: '',
  });

  const filteredHoldings = holdings?.filter(h => {
    const matchesSearch = 
      h.regent?.name.toLowerCase().includes(search.toLowerCase()) ||
      h.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || h.holding_type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const handleOpenDialog = (holding?: HoldingWithRegent) => {
    if (holding) {
      setEditingHolding(holding);
      setFormData({
        province_id: holding.province_id,
        holding_type: holding.holding_type,
        regent_id: holding.regent_id || '',
        level: holding.level,
        notes: holding.notes || '',
      });
    } else {
      setEditingHolding(null);
      setFormData({
        province_id: selectedProvinceId || '',
        holding_type: 'ordem',
        regent_id: '',
        level: 0,
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.province_id) {
      toast.error('Selecione uma província');
      return;
    }

    try {
      if (editingHolding) {
        await updateHolding.mutateAsync({
          id: editingHolding.id,
          province_id: formData.province_id,
          holding_type: formData.holding_type,
          regent_id: formData.regent_id || undefined,
          level: formData.level,
          notes: formData.notes || undefined,
        });
      } else {
        await createHolding.mutateAsync({
          province_id: formData.province_id,
          holding_type: formData.holding_type,
          regent_id: formData.regent_id || undefined,
          level: formData.level,
          notes: formData.notes || undefined,
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este holding?')) {
      await deleteHolding.mutateAsync(id);
    }
  };

  const getHoldingLabel = (type: HoldingType) => {
    return HOLDING_TYPES.find(t => t.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Holdings ({filteredHoldings.length})
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Holding
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingHolding ? 'Editar Holding' : 'Novo Holding'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!selectedProvinceId && (
                <div className="space-y-2">
                  <Label>Província *</Label>
                  <Select
                    value={formData.province_id}
                    onValueChange={(value) => setFormData({ ...formData, province_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma província" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={formData.holding_type}
                    onValueChange={(value) => setFormData({ ...formData, holding_type: value as HoldingType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOLDING_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nível</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Regente</Label>
                <Select
                  value={formData.regent_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, regent_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um regente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem regente</SelectItem>
                    {regents?.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.code ? `[${r.code}] ` : ''}{r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações"
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={createHolding.isPending || updateHolding.isPending}
              >
                {editingHolding ? 'Salvar Alterações' : 'Criar Holding'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por regente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {HOLDING_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Nível</TableHead>
                <TableHead>Regente</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHoldings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {selectedProvinceId 
                      ? 'Nenhum holding nesta província' 
                      : 'Selecione uma província ou adicione holdings'
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredHoldings.map(holding => (
                  <TableRow key={holding.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {holdingIcons[holding.holding_type]}
                        <span>{getHoldingLabel(holding.holding_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold">{holding.level}</TableCell>
                    <TableCell>
                      {holding.regent ? (
                        <span className="flex items-center gap-1">
                          {holding.regent.code && (
                            <span className="text-xs font-mono text-muted-foreground">[{holding.regent.code}]</span>
                          )}
                          {holding.regent.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{holding.notes || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(holding)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(holding.id)}
                          disabled={deleteHolding.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
