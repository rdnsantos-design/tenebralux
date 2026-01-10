// ========================
// CULTURE SELECTION
// Seleção de cultura no modo single player
// ========================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Bot } from 'lucide-react';

interface Culture {
  id: string;
  name: string;
}

interface SinglePlayerCultureSelectionProps {
  cultures: Culture[];
  selectedCulture: string | null;
  playerNickname: string;
  botNickname: string;
  isBotThinking: boolean;
  onSelect: (cultureId: string) => void;
  onConfirm: () => void;
}

const CULTURE_COLORS: Record<string, string> = {
  anuire: 'bg-blue-500',
  khinasi: 'bg-amber-500',
  vos: 'bg-red-500',
  brecht: 'bg-green-500',
  rjurik: 'bg-emerald-600',
};

const CULTURE_DESCRIPTIONS: Record<string, string> = {
  anuire: 'Império feudal inspirado na Europa medieval',
  khinasi: 'Cultura mercantil do deserto',
  vos: 'Guerreiros das terras frias do leste',
  brecht: 'Comerciantes e marinheiros do norte',
  rjurik: 'Povo livre das florestas do norte',
};

export function SinglePlayerCultureSelection({
  cultures,
  selectedCulture,
  playerNickname,
  botNickname,
  isBotThinking,
  onSelect,
  onConfirm,
}: SinglePlayerCultureSelectionProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Escolha sua Cultura</CardTitle>
        <CardDescription>
          A cultura determina as afinidades do seu exército
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="font-medium">{playerNickname}:</span>
            {selectedCulture ? (
              <>
                <Badge>{cultures.find(c => c.id === selectedCulture)?.name}</Badge>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </>
            ) : (
              <Badge variant="outline">Escolhendo...</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{botNickname}:</span>
            {isBotThinking ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Badge variant="outline">Aguardando...</Badge>
            )}
          </div>
        </div>

        {/* Grid de culturas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cultures.map(culture => {
            const isSelected = selectedCulture === culture.id;
            const colorClass = CULTURE_COLORS[culture.id] || 'bg-gray-500';
            const description = CULTURE_DESCRIPTIONS[culture.id] || 'Cultura única';

            return (
              <button
                key={culture.id}
                onClick={() => onSelect(culture.id)}
                disabled={isBotThinking}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                } ${isBotThinking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                  <span className="font-semibold">{culture.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
              </button>
            );
          })}
        </div>

        {/* Botão confirmar */}
        <Button
          onClick={onConfirm}
          disabled={!selectedCulture || isBotThinking}
          className="w-full"
          size="lg"
        >
          {isBotThinking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Bot escolhendo...
            </>
          ) : (
            'Confirmar e Avançar'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
