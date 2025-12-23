import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTerrains } from '@/hooks/useTerrains';
import { TerrainHexTile } from './TerrainHexTile';
import { TerrainType } from '@/types/Terrain';
import { Search, Filter, Eye, Hexagon, Loader2 } from 'lucide-react';

interface TerrainListProps {
  onSelectForPrint?: (terrain: TerrainType) => void;
  selectedTerrains?: TerrainType[];
}

export function TerrainList({ onSelectForPrint, selectedTerrains = [] }: TerrainListProps) {
  const { data: terrains, isLoading } = useTerrains();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [previewTerrain, setPreviewTerrain] = useState<TerrainType | null>(null);

  const uniqueTags = useMemo(() => {
    if (!terrains) return [];
    const tags = new Set(terrains.map(t => t.tag).filter(Boolean));
    return Array.from(tags).sort() as string[];
  }, [terrains]);

  const filteredTerrains = useMemo(() => {
    if (!terrains) return [];
    return terrains.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.special?.toLowerCase().includes(search.toLowerCase());
      const matchesTag = tagFilter === 'all' || t.tag === tagFilter || (tagFilter === 'none' && !t.tag);
      return matchesSearch && matchesTag;
    });
  }, [terrains, search, tagFilter]);

  const isSelected = (terrain: TerrainType) => 
    selectedTerrains.some(t => t.id === terrain.id);

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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hexagon className="w-5 h-5" />
          Tipos de Terreno ({filteredTerrains.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar terreno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tags</SelectItem>
                <SelectItem value="none">Sem tag</SelectItem>
                {uniqueTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Tile</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead className="text-center">Nível</TableHead>
                <TableHead className="text-center">Mov</TableHead>
                <TableHead className="text-center">Def</TableHead>
                <TableHead className="text-center">Moral</TableHead>
                <TableHead className="text-center">Tiro</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTerrains.map(terrain => (
                <TableRow key={terrain.id} className={isSelected(terrain) ? 'bg-primary/10' : ''}>
                  <TableCell>
                    <TerrainHexTile terrain={terrain} size="sm" showModifiers={false} />
                  </TableCell>
                  <TableCell className="font-medium">{terrain.name}</TableCell>
                  <TableCell>
                    {terrain.tag && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary">
                        {terrain.tag}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {'★'.repeat(terrain.level) || '—'}
                  </TableCell>
                  <TableCell className="text-center font-mono">{terrain.movement_mod}</TableCell>
                  <TableCell className="text-center font-mono">
                    {terrain.defense_mod > 0 ? `+${terrain.defense_mod}` : terrain.defense_mod}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {terrain.morale_mod > 0 ? `+${terrain.morale_mod}` : terrain.morale_mod}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {terrain.ranged_mod > 0 ? `+${terrain.ranged_mod}` : terrain.ranged_mod}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setPreviewTerrain(terrain)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>{terrain.name}</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col items-center gap-4 py-4">
                            <TerrainHexTile terrain={terrain} size="lg" />
                            
                            {terrain.special && (
                              <p className="text-sm text-muted-foreground text-center">
                                <strong>Especial:</strong> {terrain.special}
                              </p>
                            )}
                            
                            {/* Cultural modifiers */}
                            <div className="w-full space-y-2">
                              <h4 className="font-semibold text-sm">Modificadores Culturais:</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {terrain.mod_anuire && (
                                  <div className="bg-secondary/50 rounded p-2">
                                    <span className="font-medium">Anuire:</span> {terrain.mod_anuire}
                                  </div>
                                )}
                                {terrain.mod_brecht && (
                                  <div className="bg-secondary/50 rounded p-2">
                                    <span className="font-medium">Brecht:</span> {terrain.mod_brecht}
                                  </div>
                                )}
                                {terrain.mod_khinasi && (
                                  <div className="bg-secondary/50 rounded p-2">
                                    <span className="font-medium">Khinasi:</span> {terrain.mod_khinasi}
                                  </div>
                                )}
                                {terrain.mod_rjurik && (
                                  <div className="bg-secondary/50 rounded p-2">
                                    <span className="font-medium">Rjurik:</span> {terrain.mod_rjurik}
                                  </div>
                                )}
                                {terrain.mod_vos && (
                                  <div className="bg-secondary/50 rounded p-2">
                                    <span className="font-medium">Vos:</span> {terrain.mod_vos}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {onSelectForPrint && (
                        <Button
                          variant={isSelected(terrain) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onSelectForPrint(terrain)}
                          className={isSelected(terrain) ? '' : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'}
                        >
                          {isSelected(terrain) ? '✓' : '+'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
