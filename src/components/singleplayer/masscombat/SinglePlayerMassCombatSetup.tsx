// ========================
// SETUP SCREEN
// Configuração inicial do jogo single player
// ========================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Swords, Bot, Zap, Shield, Target } from 'lucide-react';
import type { BotDifficulty } from '@/lib/botEngine';

interface SinglePlayerMassCombatSetupProps {
  onStart: (config: {
    difficulty: BotDifficulty;
    vetBudget: number;
    playerNickname: string;
  }) => void;
}

export function SinglePlayerMassCombatSetup({ onStart }: SinglePlayerMassCombatSetupProps) {
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [vetBudget, setVetBudget] = useState(100);
  const [playerNickname, setPlayerNickname] = useState('Comandante');

  const difficulties: Array<{
    id: BotDifficulty;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      id: 'easy',
      name: 'Fácil',
      description: 'Bot com decisões aleatórias. Ideal para aprender.',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-green-500',
    },
    {
      id: 'medium',
      name: 'Médio',
      description: 'Bot com estratégias básicas. Desafio equilibrado.',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-amber-500',
    },
    {
      id: 'hard',
      name: 'Difícil',
      description: 'Bot agressivo e estratégico. Para veteranos.',
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Swords className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Combate de Massas</CardTitle>
          <CardDescription>
            Modo Single Player - Enfrente o Bot
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Nome do jogador */}
          <div className="space-y-2">
            <Label htmlFor="nickname">Seu Nome</Label>
            <Input
              id="nickname"
              value={playerNickname}
              onChange={(e) => setPlayerNickname(e.target.value)}
              placeholder="Digite seu nome"
              maxLength={20}
            />
          </div>

          {/* Dificuldade */}
          <div className="space-y-3">
            <Label>Dificuldade</Label>
            <div className="grid grid-cols-3 gap-3">
              {difficulties.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setDifficulty(diff.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    difficulty === diff.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${diff.color} flex items-center justify-center mx-auto mb-2 text-white`}>
                    {diff.icon}
                  </div>
                  <p className="font-semibold text-sm">{diff.name}</p>
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {difficulties.find(d => d.id === difficulty)?.description}
            </p>
          </div>

          {/* Orçamento VET */}
          <div className="space-y-2">
            <Label>Orçamento VET</Label>
            <div className="flex gap-2">
              {[80, 100, 120, 150].map((budget) => (
                <Button
                  key={budget}
                  variant={vetBudget === budget ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVetBudget(budget)}
                  className="flex-1"
                >
                  {budget}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Pontos para construir seu exército
            </p>
          </div>

          {/* Resumo */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Jogador:</span>
              <span className="font-medium">{playerNickname || 'Comandante'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Oponente:</span>
              <span className="font-medium flex items-center gap-1">
                <Bot className="w-4 h-4" />
                Bot ({difficulties.find(d => d.id === difficulty)?.name})
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VET:</span>
              <Badge variant="secondary">{vetBudget}</Badge>
            </div>
          </div>

          {/* Botão iniciar */}
          <Button
            onClick={() => onStart({ difficulty, vetBudget, playerNickname: playerNickname || 'Comandante' })}
            className="w-full"
            size="lg"
          >
            <Swords className="w-5 h-5 mr-2" />
            Iniciar Batalha
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
