/**
 * Página de Jogo Tático Single Player
 * Jogo contra o bot no mapa hexagonal
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Bot, Swords, Shield, Crown } from 'lucide-react';
import { BotDifficulty, getBotName } from '@/lib/tacticalHexBotEngine';
import { SinglePlayerTacticalGame } from '@/components/tactical-singleplayer/SinglePlayerTacticalGame';

type PageState = 'setup' | 'playing';

export default function SinglePlayerTacticalPage() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('setup');
  const [playerName, setPlayerName] = useState('Jogador');
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [botName, setBotName] = useState('');

  const handleStartGame = () => {
    const name = getBotName(difficulty);
    setBotName(name);
    setPageState('playing');
  };

  const handleBackToSetup = () => {
    setPageState('setup');
  };

  if (pageState === 'playing') {
    return (
      <SinglePlayerTacticalGame
        playerName={playerName}
        botName={botName}
        difficulty={difficulty}
        onExit={handleBackToSetup}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/tactical')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Batalha Tática - Modo Solo</h1>
        </div>

        {/* Setup Card */}
        <div className="max-w-lg mx-auto">
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Configurar Batalha</CardTitle>
              <CardDescription>
                Enfrente a IA no campo de batalha hexagonal
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Player Name */}
              <div className="space-y-2">
                <Label htmlFor="playerName">Seu Nome</Label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Digite seu nome"
                />
              </div>

              {/* Difficulty Selection */}
              <div className="space-y-3">
                <Label>Dificuldade</Label>
                <RadioGroup
                  value={difficulty}
                  onValueChange={(val) => setDifficulty(val as BotDifficulty)}
                  className="grid gap-3"
                >
                  <Label
                    htmlFor="easy"
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      difficulty === 'easy' 
                        ? 'border-green-500 bg-green-500/10' 
                        : 'border-border hover:border-green-500/50'
                    }`}
                  >
                    <RadioGroupItem value="easy" id="easy" />
                    <Shield className="w-6 h-6 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">Fácil</p>
                      <p className="text-sm text-muted-foreground">
                        Bot com decisões simples e aleatórias
                      </p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="medium"
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      difficulty === 'medium' 
                        ? 'border-yellow-500 bg-yellow-500/10' 
                        : 'border-border hover:border-yellow-500/50'
                    }`}
                  >
                    <RadioGroupItem value="medium" id="medium" />
                    <Swords className="w-6 h-6 text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium">Médio</p>
                      <p className="text-sm text-muted-foreground">
                        Bot tático que considera flanqueamento
                      </p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="hard"
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      difficulty === 'hard' 
                        ? 'border-red-500 bg-red-500/10' 
                        : 'border-border hover:border-red-500/50'
                    }`}
                  >
                    <RadioGroupItem value="hard" id="hard" />
                    <Crown className="w-6 h-6 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium">Difícil</p>
                      <p className="text-sm text-muted-foreground">
                        Bot estratégico que prioriza alvos
                      </p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {/* Start Button */}
              <Button 
                onClick={handleStartGame} 
                className="w-full"
                size="lg"
                disabled={!playerName.trim()}
              >
                <Swords className="w-4 h-4 mr-2" />
                Iniciar Batalha
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
