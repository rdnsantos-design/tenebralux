import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Swords, Shield, Zap, RotateCcw, Filter, Edit2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useMassCombatTacticalCards } from '@/hooks/useMassCombatTacticalCards';
import { MassCombatTacticalCardEditor } from './MassCombatTacticalCardEditor';
import { MassCombatTacticalCard } from '@/types/MassCombatTacticalCard';

// Calculate VET cost locally for display
function calculateVetCost(card: any): number {
  const bonusCost = (card.attack_bonus || 0) + (card.defense_bonus || 0) + (card.mobility_bonus || 0);
  const minorEffectCost = card.minor_effect?.trim() ? 2 : 0;
  const majorEffectCost = card.major_effect?.trim() ? 4 : 0;
  const minorConditionReduction = card.minor_condition?.trim() ? 1 : 0;
  const majorConditionReduction = card.major_condition?.trim() ? 2 : 0;
  return Math.max(0, bonusCost + minorEffectCost + majorEffectCost - minorConditionReduction - majorConditionReduction);
}

interface CardAnalysis {
  id: string;
  name: string;
  description: string;
  specialization: string;
  culture: string | null;
  command: number;
  attributes: string;
  phaseType: 'Ataque' | 'Defesa' | 'Iniciativa' | 'Reação';
  minorEffect: string;
  majorEffect: string;
  minorCondition: string;
  majorCondition: string;
  vetCost: number;
  originalCard: any;
}

// Análise automática baseada no conteúdo da carta
function analyzeCard(card: any): CardAnalysis {
  const desc = (card.description || '').toLowerCase();
  
  // Determinar tipo de fase baseado na descrição
  let phaseType: CardAnalysis['phaseType'] = 'Ataque';
  
  if (desc.includes('reação') || desc.includes('após sofrer') || desc.includes('cancela') || 
      desc.includes('anule') || desc.includes('untap') || desc.includes('retorna à mão')) {
    phaseType = 'Reação';
  } else if (desc.includes('defesa') || desc.includes('defendendo') || desc.includes('ignora') || 
             desc.includes('anula') || desc.includes('escudo') || desc.includes('+1 def') || 
             desc.includes('+2 def') || card.defense_bonus > 0) {
    phaseType = 'Defesa';
  } else if (desc.includes('iniciativa') || desc.includes('mobilidade') || desc.includes('movimento') ||
             card.mobility_bonus > 0) {
    phaseType = 'Iniciativa';
  } else if (desc.includes('ataque') || desc.includes('dano') || desc.includes('+1 atq') || 
             desc.includes('+2 atq') || card.attack_bonus > 0) {
    phaseType = 'Ataque';
  }
  
  // Construir string de atributos
  const attrs: string[] = [];
  if (card.attack_bonus > 0) attrs.push(`+${card.attack_bonus} Atq`);
  if (card.defense_bonus > 0) attrs.push(`+${card.defense_bonus} Def`);
  if (card.mobility_bonus > 0) attrs.push(`+${card.mobility_bonus} Mob`);
  if (card.attack_penalty > 0) attrs.push(`-${card.attack_penalty} Atq`);
  if (card.defense_penalty > 0) attrs.push(`-${card.defense_penalty} Def`);
  if (card.mobility_penalty > 0) attrs.push(`-${card.mobility_penalty} Mob`);
  
  // Extrair efeitos menores e maiores da descrição
  let minorEffect = card.minor_effect || '';
  let majorEffect = card.major_effect || '';
  let minorCondition = card.minor_condition || '';
  let majorCondition = card.major_condition || '';
  
  // Análise automática se não estiver preenchido
  if (!minorEffect && !majorEffect) {
    if (desc.includes('ignora')) minorEffect = 'Ignora penalidade';
    if (desc.includes('+1')) minorEffect = minorEffect || 'Bônus +1';
    if (desc.includes('dano') || desc.includes('tap') || desc.includes('cancela')) majorEffect = 'Efeito especial';
    if (desc.includes('+2') || desc.includes('duas cartas')) majorEffect = majorEffect || 'Bônus significativo';
  }
  
  if (!minorCondition && !majorCondition) {
    if (desc.includes('se vencer') || desc.includes('se tiver iniciativa')) minorCondition = 'Condicional vitória';
    if (desc.includes('terreno') || desc.includes('inverno') || desc.includes('calor')) majorCondition = 'Req. terreno/clima';
  }
  
  return {
    id: card.id,
    name: card.name,
    description: card.description || '',
    specialization: card.unit_type || 'Genérica',
    culture: card.culture,
    command: card.command_required,
    attributes: attrs.length > 0 ? attrs.join(', ') : '-',
    phaseType,
    minorEffect: minorEffect || '-',
    majorEffect: majorEffect || '-',
    minorCondition: minorCondition || '-',
    majorCondition: majorCondition || '-',
    vetCost: calculateVetCost(card),
    originalCard: card
  };
}

const phaseConfig = {
  'Ataque': { icon: Swords, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  'Defesa': { icon: Shield, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'Iniciativa': { icon: Zap, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  'Reação': { icon: RotateCcw, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
};

const specializationColors: Record<string, string> = {
  'Infantaria': 'bg-orange-500/20 text-orange-400',
  'Cavalaria': 'bg-amber-500/20 text-amber-400',
  'Arqueria': 'bg-green-500/20 text-green-400',
  'Cerco': 'bg-stone-500/20 text-stone-400',
  'Genérica': 'bg-slate-500/20 text-slate-400',
  'Terreno': 'bg-emerald-500/20 text-emerald-400',
  'Estação': 'bg-cyan-500/20 text-cyan-400'
};

const cultureColors: Record<string, string> = {
  'Anuire': 'bg-blue-600/20 text-blue-400',
  'Brecht': 'bg-amber-600/20 text-amber-400',
  'Khinasi': 'bg-orange-600/20 text-orange-400',
  'Rjurik': 'bg-green-600/20 text-green-400',
  'Vos': 'bg-red-600/20 text-red-400'
};

export function CardAnalysisTable() {
  const { cards, loading, createCard, updateCard, fetchCards } = useMassCombatTacticalCards();
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [specFilter, setSpecFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingCard, setEditingCard] = useState<MassCombatTacticalCard | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const analyzedCards = useMemo(() => {
    return cards.map(analyzeCard);
  }, [cards]);
  
  const filteredCards = useMemo(() => {
    return analyzedCards.filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(search.toLowerCase()) ||
                           card.description.toLowerCase().includes(search.toLowerCase());
      const matchesPhase = phaseFilter === 'all' || card.phaseType === phaseFilter;
      const matchesSpec = specFilter === 'all' || card.specialization === specFilter;
      return matchesSearch && matchesPhase && matchesSpec;
    });
  }, [analyzedCards, search, phaseFilter, specFilter]);
  
  // Estatísticas
  const stats = useMemo(() => {
    const byPhase = analyzedCards.reduce((acc, card) => {
      acc[card.phaseType] = (acc[card.phaseType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const bySpec = analyzedCards.reduce((acc, card) => {
      acc[card.specialization] = (acc[card.specialization] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const withCulture = analyzedCards.filter(c => c.culture).length;
    
    return { byPhase, bySpec, withCulture, total: analyzedCards.length };
  }, [analyzedCards]);

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleEditCard = (card: CardAnalysis) => {
    setEditingCard(card.originalCard);
  };

  const handleSaveCard = async (cardData: Omit<MassCombatTacticalCard, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingCard) {
      await updateCard(editingCard.id, cardData);
      await fetchCards();
      setEditingCard(null);
    }
  };

  const handleCreateCard = async (cardData: Omit<MassCombatTacticalCard, 'id' | 'created_at' | 'updated_at'>) => {
    await createCard(cardData);
    await fetchCards();
    setIsCreating(false);
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Carregando análise...
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Dialog de Edição */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Carta: {editingCard?.name}</DialogTitle>
          </DialogHeader>
          {editingCard && (
            <MassCombatTacticalCardEditor
              card={editingCard}
              onSave={handleSaveCard}
              onCancel={() => setEditingCard(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Criação */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Carta</DialogTitle>
          </DialogHeader>
          <MassCombatTacticalCardEditor
            onSave={handleCreateCard}
            onCancel={() => setIsCreating(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Botão de Criar + Estatísticas */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cartas Táticas</h2>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Carta
        </Button>
      </div>

      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(phaseConfig).map(([phase, config]) => {
          const Icon = config.icon;
          return (
            <Card key={phase} className="bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.byPhase[phase] || 0}</p>
                  <p className="text-xs text-muted-foreground">{phase}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Fase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Fases</SelectItem>
                <SelectItem value="Ataque">Ataque</SelectItem>
                <SelectItem value="Defesa">Defesa</SelectItem>
                <SelectItem value="Iniciativa">Iniciativa</SelectItem>
                <SelectItem value="Reação">Reação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={specFilter} onValueChange={setSpecFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Especialização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Infantaria">Infantaria</SelectItem>
                <SelectItem value="Cavalaria">Cavalaria</SelectItem>
                <SelectItem value="Arqueria">Arqueria</SelectItem>
                <SelectItem value="Cerco">Cerco</SelectItem>
                <SelectItem value="Genérica">Genérica</SelectItem>
                <SelectItem value="Terreno">Terreno</SelectItem>
                <SelectItem value="Estação">Estação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabela Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Cartas</CardTitle>
          <CardDescription>
            {filteredCards.length} de {stats.total} cartas | {stats.withCulture} com cultura específica | Clique em uma linha para ver a descrição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="font-semibold">Especialização</TableHead>
                  <TableHead className="font-semibold">Cultura</TableHead>
                  <TableHead className="font-semibold text-center">Cmd</TableHead>
                  <TableHead className="font-semibold">Atributos</TableHead>
                  <TableHead className="font-semibold">Fase</TableHead>
                  <TableHead className="font-semibold text-center">VET</TableHead>
                  <TableHead className="font-semibold">Efeito Menor</TableHead>
                  <TableHead className="font-semibold">Efeito Maior</TableHead>
                  <TableHead className="font-semibold">Cond. Menor</TableHead>
                  <TableHead className="font-semibold">Cond. Maior</TableHead>
                  <TableHead className="font-semibold w-[60px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCards.map((card) => {
                  const PhaseIcon = phaseConfig[card.phaseType].icon;
                  const isExpanded = expandedRows.has(card.id);
                  return (
                    <React.Fragment key={card.id}>
                      <TableRow 
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => toggleRowExpansion(card.id)}
                      >
                        <TableCell className="p-2">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{card.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={specializationColors[card.specialization] || ''}>
                            {card.specialization}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {card.culture ? (
                            <Badge variant="outline" className={cultureColors[card.culture] || ''}>
                              {card.culture}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono">{card.command}</TableCell>
                        <TableCell className="text-sm">{card.attributes}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={phaseConfig[card.phaseType].color}>
                            <PhaseIcon className="h-3 w-3 mr-1" />
                            {card.phaseType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono font-bold">
                            {card.vetCost}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[120px] truncate" title={card.minorEffect}>
                          {card.minorEffect}
                        </TableCell>
                        <TableCell className="text-sm max-w-[120px] truncate" title={card.majorEffect}>
                          {card.majorEffect}
                        </TableCell>
                        <TableCell className="text-sm max-w-[120px] truncate" title={card.minorCondition}>
                          {card.minorCondition}
                        </TableCell>
                        <TableCell className="text-sm max-w-[120px] truncate" title={card.majorCondition}>
                          {card.majorCondition}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCard(card);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={13} className="py-3 px-4">
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-muted-foreground">Descrição:</div>
                              <div className="text-sm p-3 bg-background rounded-md border">
                                {card.description || <span className="text-muted-foreground italic">Sem descrição</span>}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
