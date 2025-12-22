import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, TrendingUp, Search, Filter, Sword, Brain, Shield, Star } from 'lucide-react';
import { FieldCommander, SPECIALIZATIONS, CULTURES, calculateDerivedFields } from '@/types/FieldCommander';
import { TacticalCulture } from '@/types/TacticalCard';

interface CommanderListProps {
  commanders: FieldCommander[];
  onEdit: (commander: FieldCommander) => void;
  onEvolve: (commander: FieldCommander) => void;
  onDelete: (id: string) => void;
}

export function CommanderList({ commanders, onEdit, onEvolve, onDelete }: CommanderListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCultura, setFilterCultura] = useState<TacticalCulture | 'all'>('all');
  const [filterSpec, setFilterSpec] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nome' | 'comando' | 'estrategia' | 'prestigio'>('nome');

  const filteredCommanders = commanders
    .filter((c) => {
      const matchesSearch = c.nome_comandante.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCultura = filterCultura === 'all' || c.cultura_origem === filterCultura;
      const allSpecs = [c.especializacao_inicial, ...c.especializacoes_adicionais];
      const matchesSpec = filterSpec === 'all' || allSpecs.includes(filterSpec as any);
      return matchesSearch && matchesCultura && matchesSpec;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'comando':
          return b.comando - a.comando;
        case 'estrategia':
          return b.estrategia - a.estrategia;
        case 'prestigio':
          return b.pontos_prestigio - a.pontos_prestigio;
        default:
          return a.nome_comandante.localeCompare(b.nome_comandante);
      }
    });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja deletar o comandante "${name}"?`)) {
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

            <Select value={filterCultura} onValueChange={(v) => setFilterCultura(v as TacticalCulture | 'all')}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Cultura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Culturas</SelectItem>
                {CULTURES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSpec} onValueChange={setFilterSpec}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Especialização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Specs</SelectItem>
                {SPECIALIZATIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nome">Nome</SelectItem>
                <SelectItem value="comando">Comando</SelectItem>
                <SelectItem value="estrategia">Estratégia</SelectItem>
                <SelectItem value="prestigio">Prestígio</SelectItem>
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
                <TableHead>Cultura</TableHead>
                <TableHead className="text-center">
                  <Sword className="w-4 h-4 inline mr-1" />
                  Comando
                </TableHead>
                <TableHead className="text-center">
                  <Brain className="w-4 h-4 inline mr-1" />
                  Estratégia
                </TableHead>
                <TableHead className="text-center">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Guarda
                </TableHead>
                <TableHead className="text-center">
                  <Star className="w-4 h-4 inline mr-1" />
                  PP
                </TableHead>
                <TableHead>Especializações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommanders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum comandante encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommanders.map((commander) => {
                  const allSpecs = [commander.especializacao_inicial, ...commander.especializacoes_adicionais];
                  return (
                    <TableRow key={commander.id}>
                      <TableCell className="font-medium">{commander.nome_comandante}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{commander.cultura_origem}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold text-red-600">{commander.comando}</TableCell>
                      <TableCell className="text-center font-bold text-blue-600">{commander.estrategia}</TableCell>
                      <TableCell className="text-center font-bold text-green-600">{commander.guarda}</TableCell>
                      <TableCell className="text-center font-bold text-yellow-600">{commander.pontos_prestigio}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {allSpecs.map((spec, i) => (
                            <Badge 
                              key={spec} 
                              variant={i === 0 ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEvolve(commander)}
                            title="Evoluir"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(commander)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(commander.id, commander.nome_comandante)}
                            title="Deletar"
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
      {commanders.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Exibindo {filteredCommanders.length} de {commanders.length} comandantes
        </div>
      )}
    </div>
  );
}
