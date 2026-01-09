import React from 'react';
import { Search, Filter, Eye, EyeOff, Link, Unlink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { GalaxyFilters as FiltersType, Faction, PLANET_TYPES, PLANET_FUNCTIONS, REGIONS } from '@/types/galaxy';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface GalaxyFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  factions: Faction[];
  stats: {
    totalPlanets: number;
    totalPopulation: number;
    tierCounts: number[];
  };
}

export function GalaxyFiltersPanel({ filters, onFiltersChange, factions, stats }: GalaxyFiltersProps) {
  const [openSections, setOpenSections] = React.useState({
    factions: true,
    tiers: false,
    types: false,
    functions: false,
    regions: false
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFaction = (factionId: string) => {
    const newFactions = filters.factions.includes(factionId)
      ? filters.factions.filter(f => f !== factionId)
      : [...filters.factions, factionId];
    onFiltersChange({ ...filters, factions: newFactions });
  };

  const toggleTier = (tier: number) => {
    const newTiers = filters.tiers.includes(tier)
      ? filters.tiers.filter(t => t !== tier)
      : [...filters.tiers, tier];
    onFiltersChange({ ...filters, tiers: newTiers });
  };

  const toggleType = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: newTypes });
  };

  const toggleFunction = (func: string) => {
    const newFunctions = filters.functions.includes(func)
      ? filters.functions.filter(f => f !== func)
      : [...filters.functions, func];
    onFiltersChange({ ...filters, functions: newFunctions });
  };

  const toggleRegion = (region: string) => {
    const newRegions = filters.regions.includes(region)
      ? filters.regions.filter(r => r !== region)
      : [...filters.regions, region];
    onFiltersChange({ ...filters, regions: newRegions });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      factions: [],
      tiers: [],
      types: [],
      functions: [],
      regions: [],
      searchQuery: '',
      showLabels: filters.showLabels,
      showConnections: filters.showConnections
    });
  };

  // Dados para gráfico de pizza
  const pieData = factions.map(f => ({
    name: f.name,
    value: f.planets_count,
    color: f.color
  }));

  const formatPopulation = (pop: number) => {
    if (pop >= 1e12) return `${(pop / 1e12).toFixed(1)} tri`;
    if (pop >= 1e9) return `${(pop / 1e9).toFixed(1)} bi`;
    if (pop >= 1e6) return `${(pop / 1e6).toFixed(1)} mi`;
    return pop.toLocaleString();
  };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </h2>
        
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar planeta..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Controles de visualização */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Mostrar nomes</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, showLabels: !filters.showLabels })}
              >
                {filters.showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Via Victoria</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, showConnections: !filters.showConnections })}
              >
                {filters.showConnections ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Facções */}
          <Collapsible open={openSections.factions} onOpenChange={() => toggleSection('factions')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
              <span>Facções</span>
              {openSections.factions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {factions.map(faction => (
                <div key={faction.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`faction-${faction.id}`}
                    checked={filters.factions.includes(faction.id)}
                    onCheckedChange={() => toggleFaction(faction.id)}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: faction.color }}
                  />
                  <Label
                    htmlFor={`faction-${faction.id}`}
                    className="text-sm flex-1 cursor-pointer"
                  >
                    {faction.name}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {faction.planets_count}
                  </span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Tiers */}
          <Collapsible open={openSections.tiers} onOpenChange={() => toggleSection('tiers')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
              <span>Tiers</span>
              {openSections.tiers ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {[1, 2, 3, 4, 5].map(tier => (
                <div key={tier} className="flex items-center gap-2">
                  <Checkbox
                    id={`tier-${tier}`}
                    checked={filters.tiers.includes(tier)}
                    onCheckedChange={() => toggleTier(tier)}
                  />
                  <Label htmlFor={`tier-${tier}`} className="text-sm flex-1 cursor-pointer">
                    Tier {tier} {'⭐'.repeat(tier)}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {stats.tierCounts[tier - 1]}
                  </span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Tipos */}
          <Collapsible open={openSections.types} onOpenChange={() => toggleSection('types')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
              <span>Tipos</span>
              {openSections.types ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {PLANET_TYPES.map(type => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.types.includes(type)}
                    onCheckedChange={() => toggleType(type)}
                  />
                  <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Funções */}
          <Collapsible open={openSections.functions} onOpenChange={() => toggleSection('functions')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
              <span>Funções</span>
              {openSections.functions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {PLANET_FUNCTIONS.map(func => (
                <div key={func} className="flex items-center gap-2">
                  <Checkbox
                    id={`func-${func}`}
                    checked={filters.functions.includes(func)}
                    onCheckedChange={() => toggleFunction(func)}
                  />
                  <Label htmlFor={`func-${func}`} className="text-sm cursor-pointer">
                    {func}
                  </Label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Regiões */}
          <Collapsible open={openSections.regions} onOpenChange={() => toggleSection('regions')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
              <span>Regiões</span>
              {openSections.regions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {REGIONS.map(region => (
                <div key={region} className="flex items-center gap-2">
                  <Checkbox
                    id={`region-${region}`}
                    checked={filters.regions.includes(region)}
                    onCheckedChange={() => toggleRegion(region)}
                  />
                  <Label htmlFor={`region-${region}`} className="text-sm cursor-pointer">
                    {region}
                  </Label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Limpar filtros */}
          <Button variant="outline" size="sm" onClick={clearAllFilters} className="w-full">
            Limpar Filtros
          </Button>
        </div>
      </ScrollArea>

      {/* Estatísticas */}
      <div className="p-4 border-t space-y-3">
        <h3 className="font-medium text-sm">Estatísticas</h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">{stats.totalPlanets} planetas</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">População:</span>
            <span className="font-medium">~{formatPopulation(stats.totalPopulation)}</span>
          </div>
        </div>

        {/* Mini gráfico de pizza */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} planetas`, name]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
