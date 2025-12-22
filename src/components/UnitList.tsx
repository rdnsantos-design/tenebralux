import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Search, Shield, Sword, Target, Move, Heart, Star, UserCircle } from 'lucide-react';
import { Unit } from '@/types/Unit';
import { FieldCommander } from '@/types/FieldCommander';

interface UnitListProps {
  units: Unit[];
  commanders: FieldCommander[];
  onEdit: (unit: Unit) => void;
  onDelete: (id: string) => void;
}

export function UnitList({ units, commanders, onEdit, onDelete }: UnitListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExperience, setFilterExperience] = useState<string>('all');

  const getCommanderName = (commanderId?: string) => {
    if (!commanderId) return null;
    const commander = commanders.find(c => c.id === commanderId);
    return commander?.nome_comandante || null;
  };

  const filteredUnits = units
    .filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesExperience = filterExperience === 'all' || u.experience === filterExperience;
      return matchesSearch && matchesExperience;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja deletar a unidade "${name}"?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterExperience} onValueChange={setFilterExperience}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Experiência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Experiências</SelectItem>
                <SelectItem value="Amador">Amador</SelectItem>
                <SelectItem value="Recruta">Recruta</SelectItem>
                <SelectItem value="Profissional">Profissional</SelectItem>
                <SelectItem value="Veterano">Veterano</SelectItem>
                <SelectItem value="Elite">Elite</SelectItem>
                <SelectItem value="Lendário">Lendário</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Experiência</TableHead>
                <TableHead className="text-center">
                  <Sword className="w-4 h-4 inline mr-1" />
                  ATK
                </TableHead>
                <TableHead className="text-center">
                  <Shield className="w-4 h-4 inline mr-1" />
                  DEF
                </TableHead>
                <TableHead className="text-center">
                  <Target className="w-4 h-4 inline mr-1" />
                  TIR
                </TableHead>
                <TableHead className="text-center">
                  <Move className="w-4 h-4 inline mr-1" />
                  MOV
                </TableHead>
                <TableHead className="text-center">
                  <Heart className="w-4 h-4 inline mr-1" />
                  MOR
                </TableHead>
                <TableHead className="text-center">
                  <Star className="w-4 h-4 inline mr-1" />
                  Poder
                </TableHead>
                <TableHead>Comandante</TableHead>
                <TableHead>Exército</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    Nenhuma unidade encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredUnits.map((unit) => {
                  const commanderName = getCommanderName(unit.commanderId);
                  return (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{unit.experience}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold text-red-600">{unit.attack}</TableCell>
                      <TableCell className="text-center font-bold text-blue-600">{unit.defense}</TableCell>
                      <TableCell className="text-center font-bold text-green-600">{unit.ranged}</TableCell>
                      <TableCell className="text-center font-bold text-orange-600">{unit.movement}</TableCell>
                      <TableCell className="text-center font-bold text-purple-600">{unit.morale}</TableCell>
                      <TableCell className="text-center font-bold">{unit.totalForce}</TableCell>
                      <TableCell>
                        {commanderName ? (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <UserCircle className="w-3 h-3" />
                            {commanderName}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {unit.armyId ? (
                          <Badge variant="default">Em exército</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Pool</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(unit)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(unit.id, unit.name)}
                            title="Deletar"
                            disabled={!!unit.armyId}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resumo */}
      {units.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Exibindo {filteredUnits.length} de {units.length} unidades
          {' • '}
          {units.filter(u => !u.armyId).length} no pool
          {' • '}
          {units.filter(u => u.armyId).length} em exércitos
        </div>
      )}
    </div>
  );
}
