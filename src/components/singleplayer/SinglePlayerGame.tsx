/**
 * Componente principal do modo Single Player
 * Gerencia o fluxo: Lista de Exércitos → Builder → Jogo
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Swords, Heart, Shield, Zap, Trophy, Bot, 
  ArrowLeft, Play, RotateCcw, Loader2, Crown
} from 'lucide-react';
import { BotDifficulty } from '@/lib/botEngine';
import { StrategicArmy } from '@/types/combat/strategic-army';
import { useLocalArmies } from '@/hooks/useLocalArmies';
import { SinglePlayerArmyList } from './SinglePlayerArmyList';
import { SinglePlayerArmyBuilder } from './SinglePlayerArmyBuilder';
import { useSinglePlayerGame } from '@/hooks/useSinglePlayerGame';

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

type SinglePlayerView = 
  | 'army_list' 
  | 'army_builder' 
  | 'difficulty_select'
  | 'combat'
  | 'finished';

interface SinglePlayerGameProps {
  onBack: () => void;
}

export function SinglePlayerGame({ onBack }: SinglePlayerGameProps) {
  const [view, setView] = useState<SinglePlayerView>('army_list');
  const [selectedArmy, setSelectedArmy] = useState<StrategicArmy | null>(null);
  const [editingArmy, setEditingArmy] = useState<StrategicArmy | undefined>(undefined);
  const { save: saveArmy } = useLocalArmies();
  
  const { state, startGameWithArmy, playCard, passTurn, resetGame } = useSinglePlayerGame();
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedCommanderId, setSelectedCommanderId] = useState<string | null>(null);

  // Handler: selecionar exército para jogar
  const handleSelectArmy = (army: StrategicArmy) => {
    setSelectedArmy(army);
    setView('difficulty_select');
  };

  // Handler: criar novo exército
  const handleCreateNew = () => {
    setEditingArmy(undefined);
    setView('army_builder');
  };

  // Handler: editar exército
  const handleEditArmy = (army: StrategicArmy) => {
    setEditingArmy(army);
    setView('army_builder');
  };

  // Handler: salvar exército do builder
  const handleSaveArmy = (army: StrategicArmy) => {
    saveArmy(army);
    setView('army_list');
  };

  // Handler: iniciar jogo com dificuldade
  const handleStartGame = async (difficulty: BotDifficulty) => {
    if (!selectedArmy) return;
    await startGameWithArmy(selectedArmy, difficulty);
    setView('combat');
  };

  // Handler: voltar ao menu
  const handleBackToMenu = () => {
    resetGame();
    setSelectedArmy(null);
    setSelectedCardIndex(null);
    setSelectedCommanderId(null);
    setView('army_list');
  };

  // ========== VIEWS ==========

  // Lista de exércitos
  if (view === 'army_list') {
    return (
      <SinglePlayerArmyList
        onSelectArmy={handleSelectArmy}
        onCreateNew={handleCreateNew}
        onEditArmy={handleEditArmy}
        onBack={onBack}
      />
    );
  }

  // Builder de exército
  if (view === 'army_builder') {
    return (
      <SinglePlayerArmyBuilder
        army={editingArmy}
        onSave={handleSaveArmy}
        onCancel={() => setView('army_list')}
      />
    );
  }

  // Seleção de dificuldade
  if (view === 'difficulty_select' && selectedArmy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Button variant="ghost" className="absolute top-4 left-4" onClick={() => setView('army_list')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Escolha a Dificuldade</h1>
          </div>
          <p className="text-muted-foreground">
            Jogando com: <span className="font-medium text-foreground">{selectedArmy.name}</span>
          </p>
          <div className="flex items-center justify-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Swords className="w-4 h-4 text-red-500" />
              {selectedArmy.attack}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-blue-500" />
              {selectedArmy.defense}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              {selectedArmy.mobility}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-pink-500" />
              {selectedArmy.hitPoints} PV
            </span>
          </div>
        </div>
        
        <div className="grid gap-4 w-full max-w-md">
          {(Object.keys(DIFFICULTY_CONFIG) as BotDifficulty[]).map((diff) => {
            const config = DIFFICULTY_CONFIG[diff];
            return (
              <Card 
                key={diff}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleStartGame(diff)}
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

  // Tela de combate
  if (view === 'combat' || state.phase === 'combat') {
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
                <span className="font-bold">{selectedArmy?.name || 'Você'}</span>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-bold">{state.playerHp}</span>
                </div>
              </div>
              <div className="w-full h-2 bg-muted rounded-full mt-2">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(state.playerHp / (selectedArmy?.hitPoints || 100)) * 100}%` }}
                />
              </div>
              {/* Atributos */}
              <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Swords className="w-3 h-3 text-red-500" />
                  {selectedArmy?.attack || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-500" />
                  {selectedArmy?.defense || 5}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  {selectedArmy?.mobility || 0}
                </span>
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
              {/* Cultura do bot */}
              <div className="text-xs text-muted-foreground mt-2">
                {state.botCulture}
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
  if (state.phase === 'finished' || view === 'finished') {
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
              <Button className="flex-1" onClick={() => {
                resetGame();
                if (selectedArmy) {
                  setView('difficulty_select');
                } else {
                  handleBackToMenu();
                }
              }}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Jogar Novamente
              </Button>
              <Button variant="outline" onClick={handleBackToMenu}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback - loading
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}
