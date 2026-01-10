// ========================
// DEPLOYMENT
// Escolha de formação no modo single player
// ========================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Swords, Shield, Scale } from 'lucide-react';

interface SinglePlayerDeploymentProps {
  playerHp: number;
  botHp: number;
  chosenScenario: { terrainName: string; seasonName: string } | null;
  isBotThinking: boolean;
  onConfirm: (formation: 'aggressive' | 'balanced' | 'defensive') => void;
}

export function SinglePlayerDeployment({
  playerHp,
  botHp,
  chosenScenario,
  isBotThinking,
  onConfirm,
}: SinglePlayerDeploymentProps) {
  const formations: Array<{
    id: 'aggressive' | 'balanced' | 'defensive';
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      id: 'aggressive',
      name: 'Agressiva',
      description: 'Prioriza ataque. +1 ATK, -1 DEF',
      icon: <Swords className="w-8 h-8" />,
      color: 'bg-red-500',
    },
    {
      id: 'balanced',
      name: 'Balanceada',
      description: 'Equilibra ataque e defesa',
      icon: <Scale className="w-8 h-8" />,
      color: 'bg-amber-500',
    },
    {
      id: 'defensive',
      name: 'Defensiva',
      description: 'Prioriza defesa. +1 DEF, -1 ATK',
      icon: <Shield className="w-8 h-8" />,
      color: 'bg-blue-500',
    },
  ];

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Posicionamento</CardTitle>
        <CardDescription>
          Escolha a formação inicial do seu exército
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Cenário */}
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-1">Campo de Batalha</p>
          <p className="font-bold">
            {chosenScenario?.terrainName} - {chosenScenario?.seasonName}
          </p>
        </div>

        {/* HP */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg border">
            <p className="text-sm text-muted-foreground">Seu HP</p>
            <p className="text-2xl font-bold text-green-500">{playerHp}</p>
          </div>
          <div className="text-center p-3 rounded-lg border">
            <p className="text-sm text-muted-foreground">HP do Bot</p>
            <p className="text-2xl font-bold text-red-500">{botHp}</p>
          </div>
        </div>

        {/* Formações */}
        <div className="grid grid-cols-3 gap-3">
          {formations.map(formation => (
            <Button
              key={formation.id}
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => onConfirm(formation.id)}
              disabled={isBotThinking}
            >
              <div className={`p-3 rounded-full ${formation.color} text-white`}>
                {formation.icon}
              </div>
              <span className="font-semibold">{formation.name}</span>
              <span className="text-xs text-muted-foreground text-center">
                {formation.description}
              </span>
            </Button>
          ))}
        </div>

        {isBotThinking && (
          <div className="text-center p-4">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Bot escolhendo formação...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
