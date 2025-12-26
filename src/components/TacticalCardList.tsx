import { useState, useMemo } from 'react';
import { TacticalCard, CARD_TYPES, CARD_SUBTYPES, UNIT_TYPES, CULTURES, calculateCardCost, TacticalCardType, TacticalCardSubtype, UnitType, TacticalCulture } from '@/types/TacticalCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Search, Download, FileJson, FileSpreadsheet, Eye } from 'lucide-react';
import { TacticalCardPreview } from './TacticalCardPreview';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import * as XLSX from 'xlsx';

interface TacticalCardListProps {
  cards: TacticalCard[];
  onEdit: (card: TacticalCard) => void;
  onDelete: (id: string) => void;
}

export function TacticalCardList({ cards, onEdit, onDelete }: TacticalCardListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubtype, setFilterSubtype] = useState<string>('all');
  const [filterUnitType, setFilterUnitType] = useState<string>('all');
  const [filterCulture, setFilterCulture] = useState<string>('all');
  const [previewCard, setPreviewCard] = useState<TacticalCard | null>(null);

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // Filtro por texto
      if (searchTerm && !card.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por tipo
      if (filterType !== 'all' && card.card_type !== filterType) {
        return false;
      }

      // Filtro por subtipo
      if (filterSubtype !== 'all' && card.subtype !== filterSubtype) {
        return false;
      }

      // Filtro por tipo de unidade
      if (filterUnitType !== 'all' && !card.affected_unit_types.includes(filterUnitType as UnitType)) {
        return false;
      }

      // Filtro por cultura (bônus ou penalidade)
      if (filterCulture !== 'all') {
        const hasCulture = card.bonus_cultures.includes(filterCulture as TacticalCulture) || 
                          card.penalty_cultures.includes(filterCulture as TacticalCulture);
        if (!hasCulture) return false;
      }

      return true;
    });
  }, [cards, searchTerm, filterType, filterSubtype, filterUnitType, filterCulture]);

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredCards, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileName = `cartas_taticas_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };

  const exportToExcel = () => {
    const exportData = filteredCards.map(card => ({
      'Nome': card.name,
      'Descrição': card.description || '',
      'Tipo': card.card_type,
      'Subtipo': card.subtype,
      'Unidades Afetadas': card.affected_unit_types.join(', '),
      'Bônus Ataque': card.attack_bonus,
      'Bônus Defesa': card.defense_bonus,
      'Bônus Tiro': card.ranged_bonus,
      'Bônus Moral': card.morale_bonus,
      'Dano Pressão Extra': card.extra_pressure_damage,
      'Dano Letal Extra': card.extra_lethal_damage,
      'Ignora Pressão': card.ignores_pressure ? 'Sim' : 'Não',
      'Fora Unidade Comandante': card.targets_outside_commander_unit ? 'Sim' : 'Não',
      'Afeta Inimigo': card.affects_enemy_unit ? 'Sim' : 'Não',
      'Exige Especialização': card.requires_specialization ? 'Sim' : 'Não',
      'Comando Exigido': card.required_command,
      'Culturas com Bônus': card.bonus_cultures.join(', '),
      'Culturas com Penalidade': card.penalty_cultures.join(', '),
      'Custo Calculado': calculateCardCost(card),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cartas de Combate');
    XLSX.writeFile(wb, `cartas_taticas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Nome da carta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="all">Todos</SelectItem>
                  {CARD_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subtipo</label>
              <Select value={filterSubtype} onValueChange={setFilterSubtype}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="all">Todos</SelectItem>
                  {CARD_SUBTYPES.map(subtype => (
                    <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unidade</label>
              <Select value={filterUnitType} onValueChange={setFilterUnitType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="all">Todas</SelectItem>
                  {UNIT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cultura</label>
              <Select value={filterCulture} onValueChange={setFilterCulture}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="all">Todas</SelectItem>
                  {CULTURES.map(culture => (
                    <SelectItem key={culture} value={culture}>{culture}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações de Exportação */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {filteredCards.length} carta(s) encontrada(s)
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToJSON}>
            <FileJson className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Subtipo</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead className="text-center">Custo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma carta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredCards.map(card => (
                  <TableRow key={card.id}>
                    <TableCell className="font-medium">{card.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{card.card_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{card.subtype}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {card.affected_unit_types.map(type => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-yellow-500 text-yellow-900">
                        {calculateCardCost(card)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setPreviewCard(card)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Preview da Carta</DialogTitle>
                            </DialogHeader>
                            {previewCard && <TacticalCardPreview card={previewCard} />}
                          </DialogContent>
                        </Dialog>

                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onEdit(card)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Carta</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir "{card.name}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(card.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
