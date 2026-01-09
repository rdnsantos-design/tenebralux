import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GalaxyCanvas } from '@/components/galaxy/GalaxyCanvas';
import { GalaxyFiltersPanel } from '@/components/galaxy/GalaxyFilters';
import { PlanetDetails } from '@/components/galaxy/PlanetDetails';
import { PlanetEditor } from '@/components/galaxy/PlanetEditor';
import { useGalaxyPlanets } from '@/hooks/useGalaxyPlanets';
import { Planet, GalaxyFilters } from '@/types/galaxy';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Loader2, Circle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export default function GalaxyMap() {
  const navigate = useNavigate();
  const { planets, factions, isLoading, updatePlanet, importPlanets, filterPlanets, getStats } = useGalaxyPlanets();
  
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [editingPlanet, setEditingPlanet] = useState<Planet | null>(null);
  const [planetScale, setPlanetScale] = useState(1);
  const [filters, setFilters] = useState<GalaxyFilters>({
    factions: [],
    tiers: [],
    types: [],
    functions: [],
    regions: [],
    searchQuery: '',
    showLabels: false,
    showConnections: true
  });

  const filteredPlanets = useMemo(() => filterPlanets(filters), [planets, filters]);
  const stats = useMemo(() => getStats(), [planets]);

  const handleSavePlanet = (planet: Partial<Planet> & { id: number }) => {
    updatePlanet.mutate(planet);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/lore')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">🌌 Mapa Galáctico - Akashic Dreams</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredPlanets.length} de {planets.length} planetas
          </span>
          {planets.length === 0 && (
            <Button size="sm" onClick={() => importPlanets.mutate()} disabled={importPlanets.isPending}>
              <Upload className="w-4 h-4 mr-2" />
              Importar 312 Planetas
            </Button>
          )}
        </div>
      </header>

      {/* Main Content - 3 columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Filters */}
        <aside className="w-64 shrink-0 overflow-hidden">
          <GalaxyFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            factions={factions}
            stats={stats}
          />
        </aside>

        {/* Center - 3D Canvas */}
        <main className="flex-1 relative">
          <GalaxyCanvas
            planets={filteredPlanets}
            factions={factions}
            selectedPlanet={selectedPlanet}
            onSelectPlanet={setSelectedPlanet}
            showLabels={filters.showLabels}
            showConnections={filters.showConnections}
            planetScale={planetScale}
          />
          
          {/* Slider para tamanho dos planetas */}
          <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm border rounded-lg p-3 flex items-center gap-3 min-w-[200px]">
            <Circle className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[planetScale]}
              onValueChange={(value) => setPlanetScale(value[0])}
              min={0.2}
              max={2}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8">{planetScale.toFixed(1)}x</span>
          </div>
        </main>

        {/* Right Panel - Details */}
        <aside className="w-80 shrink-0 overflow-hidden">
          <PlanetDetails
            planet={selectedPlanet}
            factions={factions}
            onEdit={setEditingPlanet}
          />
        </aside>
      </div>

      {/* Planet Editor Modal */}
      <PlanetEditor
        planet={editingPlanet}
        open={!!editingPlanet}
        onClose={() => setEditingPlanet(null)}
        onSave={handleSavePlanet}
        factions={factions}
      />
    </div>
  );
}
