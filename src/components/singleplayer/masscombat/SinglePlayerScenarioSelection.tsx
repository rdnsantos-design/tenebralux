// ========================
// SCENARIO SELECTION
// Seleção de cenário no modo single player
// ========================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Loader2, MapPin, Sun, Bot, CheckCircle2 } from 'lucide-react';

interface ScenarioOption {
  id: string;
  name: string;
  order: number;
}

interface SinglePlayerScenarioSelectionProps {
  terrains: ScenarioOption[];
  seasons: ScenarioOption[];
  playerNickname: string;
  botNickname: string;
  isBotThinking: boolean;
  maxBudget: number;
  onSubmit: (terrainId: string, seasonId: string, bid: number) => void;
}

export function SinglePlayerScenarioSelection({
  terrains,
  seasons,
  playerNickname,
  botNickname,
  isBotThinking,
  maxBudget,
  onSubmit,
}: SinglePlayerScenarioSelectionProps) {
  const [selectedTerrain, setSelectedTerrain] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [logisticsBid, setLogisticsBid] = useState(5);

  const vetCost = Math.ceil(logisticsBid / 2);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Seleção de Cenário</CardTitle>
        <CardDescription>
          Aposte pontos de logística para influenciar o campo de batalha
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="font-medium">{playerNickname}</span>
          </div>
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{botNickname}</span>
            {isBotThinking && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
        </div>

        {/* Orçamento */}
        <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-lg bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground">Logística</p>
            <p className="font-bold text-lg">{maxBudget - logisticsBid}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Aposta</p>
            <p className="font-bold text-lg">{logisticsBid}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Custo VET</p>
            <p className="font-bold text-lg text-primary">{vetCost}</p>
          </div>
        </div>

        {/* Slider de aposta */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Pontos de Logística</label>
          <Slider
            value={[logisticsBid]}
            onValueChange={([value]) => setLogisticsBid(value)}
            min={0}
            max={maxBudget}
            step={1}
            className="py-2"
          />
          <p className="text-xs text-muted-foreground">
            Quem apostar mais escolhe o cenário. Custo VET = Aposta ÷ 2
          </p>
        </div>

        {/* Terrenos */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Terreno Preferido
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {terrains.map(terrain => (
              <button
                key={terrain.id}
                onClick={() => setSelectedTerrain(terrain.id)}
                disabled={isBotThinking}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedTerrain === terrain.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">#{terrain.order}</Badge>
                  {selectedTerrain === terrain.id && (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="font-medium text-sm">{terrain.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Estações */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sun className="w-4 h-4" /> Estação Preferida
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {seasons.map(season => (
              <button
                key={season.id}
                onClick={() => setSelectedSeason(season.id)}
                disabled={isBotThinking}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedSeason === season.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">#{season.order}</Badge>
                  {selectedSeason === season.id && (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="font-medium text-sm">{season.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Botão confirmar */}
        <Button
          onClick={() => {
            if (selectedTerrain && selectedSeason) {
              onSubmit(selectedTerrain, selectedSeason, logisticsBid);
            }
          }}
          disabled={!selectedTerrain || !selectedSeason || isBotThinking}
          className="w-full"
          size="lg"
        >
          {isBotThinking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Bot apostando...
            </>
          ) : (
            'Confirmar Aposta'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
