import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, MapPin, Sun, Coins, ArrowRight } from 'lucide-react';
import type { MatchState, PlayerContext } from '@/types/multiplayer';

interface ScenarioSummaryProps {
  matchState: MatchState;
  playerContext: PlayerContext;
  chosenTerrainName?: string;
  chosenSeasonName?: string;
}

export function ScenarioSummary({ 
  matchState, 
  playerContext,
  chosenTerrainName,
  chosenSeasonName
}: ScenarioSummaryProps) {
  const vetAgreed = (matchState as unknown as { vet_agreed?: number }).vet_agreed ?? 100;
  const p1VetRemaining = (matchState as unknown as { player1_vet_remaining?: number }).player1_vet_remaining ?? vetAgreed;
  const p2VetRemaining = (matchState as unknown as { player2_vet_remaining?: number }).player2_vet_remaining ?? vetAgreed;
  
  const myVetRemaining = playerContext.playerNumber === 1 ? p1VetRemaining : p2VetRemaining;
  const vetSpentScenario = vetAgreed - myVetRemaining;
  const armyPV = Math.floor(vetAgreed * 0.10);

  return (
    <Card className="w-full">
      <CardHeader className="text-center pb-4">
        <Trophy className="w-10 h-10 mx-auto text-yellow-500 mb-2" />
        <CardTitle className="text-xl">Resumo do Cenário</CardTitle>
        <CardDescription>A batalha está definida</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Terreno e Estação */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted text-center">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Terreno</p>
            <p className="font-semibold text-sm">{chosenTerrainName ?? 'N/A'}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted text-center">
            <Sun className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-xs text-muted-foreground">Estação</p>
            <p className="font-semibold text-sm">{chosenSeasonName ?? 'N/A'}</p>
          </div>
        </div>

        <Separator />

        {/* VET Info */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">VET acordado:</span>
            <Badge variant="outline">{vetAgreed}</Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">VET gasto no cenário:</span>
            <Badge variant="secondary">-{vetSpentScenario}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">VET para Deckbuilding:</span>
            <Badge className="text-base px-3 py-1">{myVetRemaining}</Badge>
          </div>
        </div>

        <Separator />

        {/* PV do Exército */}
        <div className="p-3 rounded-lg bg-primary/10 text-center">
          <Coins className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-xs text-muted-foreground">Pontos de Vida do Exército</p>
          <p className="font-bold text-2xl text-primary">{armyPV} PV</p>
          <p className="text-xs text-muted-foreground">(10% do VET acordado)</p>
        </div>
      </CardContent>
    </Card>
  );
}
