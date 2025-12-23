import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TravelCalculator } from '@/components/travel/TravelCalculator';
import { TravelSpeedSettings } from '@/components/travel/TravelSpeedSettings';
import { DistanceMatrixImporter } from '@/components/travel/DistanceMatrixImporter';
import { useDistanceCount } from '@/hooks/useTravel';
import { Route, FileSpreadsheet, Settings, Database, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Travel() {
  const [showImporter, setShowImporter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { data: distanceCount } = useDistanceCount();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Route className="w-6 h-6" />
                  Deslocamento
                </h1>
                <p className="text-sm text-muted-foreground">
                  Calcule o tempo de viagem entre províncias
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {distanceCount !== undefined && (
                <div className="text-sm text-muted-foreground flex items-center gap-1 mr-4">
                  <Database className="w-4 h-4" />
                  {distanceCount} distâncias
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Velocidades
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImporter(!showImporter)}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Importar Matriz
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Importer */}
          {showImporter && (
            <DistanceMatrixImporter onClose={() => setShowImporter(false)} />
          )}

          {/* Settings */}
          {showSettings && <TravelSpeedSettings />}

          {/* Calculator */}
          <TravelCalculator />
        </div>
      </main>
    </div>
  );
}
