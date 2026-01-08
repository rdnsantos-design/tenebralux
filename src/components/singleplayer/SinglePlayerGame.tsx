import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Swords, Heart, Shield, Zap, Trophy, Bot, 
  ArrowLeft, Play, RotateCcw, Loader2
} from 'lucide-react';
import { useSinglePlayerGame } from '@/hooks/useSinglePlayerGame';
import { BotDifficulty } from '@/lib/botEngine';
import { useMassCombatCultures } from '@/hooks/useMassCombatCultures';

const DIFFICULTY_CONFIG: Record<BotDifficulty, { label: string; color: string; description: string }> = {
  easy: { 
    label: 'Fácil', 
    color: 'bg-green-500', 
    description: 'Bot faz decisões aleatórias e passa frequentemente' 
  },
  medium: { 
    label: 'Médio', 
    color: 'bg-yellow-500', 
    description: 'Bot usa estratégias básicas e é mais consistente' 
  },
  hard: { 
    label: 'Difícil', 
    color: 'bg-red-500', 
    description: 'Bot otimiza cada jogada e raramente erra' 
  },
};

interface SinglePlayerGameProps {
  onBack: () => void;
}

export function SinglePlayerGame({ onBack }: SinglePlayerGameProps) {
  const { state, startGame, selectCulture, confirmDeck, playCard, passTurn, resetGame } = useSinglePlayerGame();
  const { data: cultures = [] } = useMassCombatCultures();
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedCommanderId, setSelectedCommanderId] = useState<string | null>(null);
  
  // Tela de seleção de dificuldade
  if (state.phase === 'setup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Button variant="ghost" className="absolute top-4 left-4" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Modo Single Player</h1>
          </div>
          <p className="text-muted-foreground">Escolha a dificuldade do bot</p>
        </div>
        
        <div className="grid gap-4 w-full max-w-md">
          {(Object.keys(DIFFICULTY_CONFIG) as BotDifficulty[]).map((diff) => {
            const config = DIFFICULTY_CONFIG[diff];
            return (
              <Card 
                key={diff}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => startGame(diff)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{config.label}</CardTitle>
                    <Badge className={config.color}>{diff.toUpperCase()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }
  
  // Tela de seleção de cultura
  if (state.phase === 'culture_selection') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Escolha sua Cultura</h1>
          <p className="text-muted-foreground">
            Bot ({state.botName}) escolheu: <Badge variant="outline">{state.botCulture}</Badge>
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
          {cultures.map((culture) => (
            <Card 
              key={culture.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => selectCulture(culture.name)}
            >
              <CardContent className="p-4 text-center">
                <h3 className="font-bold">{culture.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{culture.specialization}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {state.isLoading && (
          <div className="mt-4 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Carregando...</span>
          </div>
        )}
      </div>
    );
  }
  
  // Tela de deckbuilding (simplificada - confirmar deck)
  if (state.phase === 'deckbuilding') {
    return (
      <div className="min-h-screen flex flex-col items-center bg-background p-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Seu Deck</h1>
          <p className="text-muted-foreground">Cultura: {state.playerCulture}</p>
        </div>
        
        <Card className="w-full max-w-2xl mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Cartas ({state.playerHand.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {state.playerHand.map((card, index) => (
                <div key={card.id} className="p-2 border rounded text-xs">
                  <div className="font-medium">{card.name}</div>
                  <div className="text-muted-foreground capitalize">{card.card_type}</div>
                  {card.attack_bonus ? <span className="text-red-500">+{card.attack_bonus} ATQ</span> : null}
                  {card.defense_bonus ? <span className="text-blue-500 ml-1">+{card.defense_bonus} DEF</span> : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="w-full max-w-2xl mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Comandantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {state.playerCommanders.map((cmd) => (
                <div 
                  key={cmd.instance_id} 
                  className={`p-2 border rounded text-xs flex-1 ${cmd.is_general ? 'border-yellow-500 bg-yellow-500/10' : ''}`}
                >
                  <div className="font-medium">
                    {cmd.is_general && <Trophy className="w-3 h-3 inline mr-1 text-yellow-500" />}
                    {cmd.especializacao}
                  </div>
                  <div className="text-muted-foreground">
                    CMD: {cmd.comando_base} | EST: {cmd.estrategia}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Button size="lg" onClick={confirmDeck} disabled={state.isLoading}>
          <Play className="w-4 h-4 mr-2" />
          Iniciar Combate
        </Button>
      </div>
    );
  }
  
  // Tela de combate
  if (state.phase === 'combat') {
    const canPlayCard = selectedCardIndex !== null && selectedCommanderId !== null;
    
    return (
      <div className="min-h-screen flex flex-col bg-background p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <Badge variant="outline">Rodada {state.round}</Badge>
          <Badge>{state.combatPhase.replace('_', ' ').toUpperCase()}</Badge>
          <Badge variant="outline" className={DIFFICULTY_CONFIG[state.botDifficulty].color}>
            {state.botName}
          </Badge>
        </div>
        
        {/* HP Bars */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card className="border-primary/50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="font-bold">Você</span>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-bold">{state.playerHp}</span>
                </div>
              </div>
              <div className="w-full h-2 bg-muted rounded-full mt-2">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${state.playerHp}%` }}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-destructive/50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="font-bold">{state.botName}</span>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-bold">{state.botHp}</span>
                </div>
              </div>
              <div className="w-full h-2 bg-muted rounded-full mt-2">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${state.botHp}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Battle Log */}
        <Card className="mb-4 flex-shrink-0">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Log de Batalha</CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            <ScrollArea className="h-24">
              {state.battleLog.slice(-10).reverse().map((log, i) => (
                <div key={i} className="text-xs text-muted-foreground py-0.5">
                  {log.message}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Comandantes */}
        <Card className="mb-4">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Seus Comandantes</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex gap-2">
              {state.playerCommanders.filter(c => !c.is_general).map((cmd) => {
                const cmdFree = state.playerCmdState.commanders[cmd.instance_id]?.cmd_free ?? cmd.comando_base;
                const isSelected = selectedCommanderId === cmd.instance_id;
                
                return (
                  <div 
                    key={cmd.instance_id}
                    className={`p-2 border rounded text-xs cursor-pointer transition-colors flex-1 ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
                    onClick={() => setSelectedCommanderId(cmd.instance_id)}
                  >
                    <div className="font-medium">{cmd.especializacao}</div>
                    <div className="text-muted-foreground">
                      CMD: {cmdFree}/{cmd.comando_base}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Mão */}
        <Card className="flex-1 min-h-0">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Sua Mão ({state.playerHand.length} cartas)</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <ScrollArea className="h-[200px]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {state.playerHand.map((card, index) => {
                  const isSelected = selectedCardIndex === index;
                  
                  return (
                    <div 
                      key={card.id}
                      className={`p-2 border rounded text-xs cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
                      onClick={() => setSelectedCardIndex(index)}
                    >
                      <div className="font-medium">{card.name}</div>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {card.card_type}
                      </Badge>
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {card.attack_bonus ? (
                          <span className="text-red-500">+{card.attack_bonus} ATQ</span>
                        ) : null}
                        {card.defense_bonus ? (
                          <span className="text-blue-500">+{card.defense_bonus} DEF</span>
                        ) : null}
                        {card.command_required ? (
                          <span className="text-yellow-500">CMD: {card.command_required}</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Ações */}
        <div className="flex gap-2 mt-4">
          <Button 
            className="flex-1" 
            onClick={() => {
              if (selectedCardIndex !== null && selectedCommanderId) {
                playCard(selectedCardIndex, selectedCommanderId);
                setSelectedCardIndex(null);
                setSelectedCommanderId(null);
              }
            }}
            disabled={!canPlayCard || state.isLoading}
          >
            {state.isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Swords className="w-4 h-4 mr-2" />
            )}
            Jogar Carta
          </Button>
          <Button 
            variant="outline" 
            onClick={passTurn}
            disabled={state.isLoading}
          >
            Passar
          </Button>
        </div>
      </div>
    );
  }
  
  // Tela de fim de jogo
  if (state.phase === 'finished') {
    const isWinner = state.winner === 'player';
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isWinner ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Trophy className={`w-8 h-8 ${isWinner ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <CardTitle className="text-2xl mt-4">
              {isWinner ? 'Vitória!' : 'Derrota'}
            </CardTitle>
            <CardDescription>
              {isWinner 
                ? `Você derrotou ${state.botName}!`
                : `${state.botName} venceu a batalha.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Seu HP: </span>
                <span className="font-bold">{state.playerHp}</span>
              </div>
              <div>
                <span className="text-muted-foreground">HP do Bot: </span>
                <span className="font-bold">{state.botHp}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={resetGame}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Jogar Novamente
              </Button>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return null;
}
