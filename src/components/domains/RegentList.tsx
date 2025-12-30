import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRegents, useCreateRegent, useUpdateRegent, useDeleteRegent } from '@/hooks/useRegents';
import { Regent, HOLDING_TYPES } from '@/types/Domain';
import { Crown, Plus, Edit, Trash2, Search, Loader2, Eye, Building, Church, Sparkles, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const holdingIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ordem: Shield,
  guilda: Building,
  templo: Church,
  fonte_magica: Sparkles,
};

export function RegentList() {
  const { data: regents, isLoading } = useRegents();
  const createRegent = useCreateRegent();
  const updateRegent = useUpdateRegent();
  const deleteRegent = useDeleteRegent();
  
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegent, setEditingRegent] = useState<Regent | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    full_name: '',
    notes: '',
  });
  
  const [viewingRegent, setViewingRegent] = useState<Regent | null>(null);
  const [regentHoldings, setRegentHoldings] = useState<any[]>([]);
  const [isLoadingHoldings, setIsLoadingHoldings] = useState(false);

  const handleViewHoldings = async (regent: Regent) => {
    setViewingRegent(regent);
    setIsLoadingHoldings(true);
    
    const { data, error } = await supabase
      .from('holdings')
      .select(`
        *,
        province:provinces(name, realm:realms(name))
      `)
      .eq('regent_id', regent.id);
    
    if (error) {
      toast.error('Erro ao carregar holdings');
      setIsLoadingHoldings(false);
      return;
    }
    
    setRegentHoldings(data || []);
    setIsLoadingHoldings(false);
  };

  const getHoldingLabel = (type: string) => {
    return HOLDING_TYPES.find(h => h.value === type)?.label || type;
  };

  const filteredRegents = regents?.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.code?.toLowerCase().includes(search.toLowerCase()) ||
    r.full_name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleOpenDialog = (regent?: Regent) => {
    if (regent) {
      setEditingRegent(regent);
      setFormData({
        code: regent.code || '',
        name: regent.name,
        full_name: regent.full_name || '',
        notes: regent.notes || '',
      });
    } else {
      setEditingRegent(null);
      setFormData({ code: '', name: '', full_name: '', notes: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      if (editingRegent) {
        await updateRegent.mutateAsync({
          id: editingRegent.id,
          code: formData.code || undefined,
          name: formData.name,
          full_name: formData.full_name || undefined,
          notes: formData.notes || undefined,
          gold_bars: 0,
          regency_points: 0,
          comando: 1,
          estrategia: 1,
        });
      } else {
        await createRegent.mutateAsync({
          code: formData.code || undefined,
          name: formData.name,
          full_name: formData.full_name || undefined,
          notes: formData.notes || undefined,
          gold_bars: 0,
          regency_points: 0,
          comando: 1,
          estrategia: 1,
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este regente?')) {
      await deleteRegent.mutateAsync(id);
    }
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
          <Crown className="w-5 h-5" />
          Regentes ({filteredRegents.length})
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Regente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRegent ? 'Editar Regente' : 'Novo Regente'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: hWIT"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do regente"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome completo com título"
                />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre o regente"
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={createRegent.isPending || updateRegent.isPending}
              >
                {editingRegent ? 'Salvar Alterações' : 'Criar Regente'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar regente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Nome Completo</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegents.map(regent => (
                <TableRow key={regent.id}>
                  <TableCell className="font-mono text-sm">{regent.code || '-'}</TableCell>
                  <TableCell className="font-medium">{regent.name}</TableCell>
                  <TableCell className="text-muted-foreground">{regent.full_name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewHoldings(regent)}
                        title="Ver Holdings"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(regent)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(regent.id)}
                        disabled={deleteRegent.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Dialog para visualizar holdings do regente */}
        <Dialog open={!!viewingRegent} onOpenChange={(open) => !open && setViewingRegent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Holdings de {viewingRegent?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {isLoadingHoldings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : regentHoldings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Este regente não possui holdings.
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Província</TableHead>
                        <TableHead>Reino</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {regentHoldings.map(holding => {
                        const HoldingIcon = holdingIcons[holding.holding_type] || Building;
                        return (
                          <TableRow key={holding.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <HoldingIcon className="w-4 h-4" />
                                {getHoldingLabel(holding.holding_type)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{holding.level}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {holding.province?.name || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {holding.province?.realm?.name || '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
