// ========================
// COMBAT SCREEN
// Tela de combate no modo single player
// ========================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, Sword, Shield, Zap, Bot, User, 
  Heart, CheckCircle2, XCircle, Trophy
} from 'lucide-react';
import type {
  SPPlayerState,
  SPTacticalCard,
  CombatSubPhase,
  SPActionLogEntry,
} from '@/types/singleplayer-mass-combat';

interface SinglePlayerCombatScreenProps {
  player: SPPlayerState;
  bot: SPPlayerState;
  combatRound: number;
  combatSubPhase: CombatSubPhase | undefined;
  currentAttacker: 'player' | 'bot';
  isBotThinking: boolean;
  winner: 'player' | 'bot' | null;
  actionLog: SPActionLogEntry[];
  onPlayCard: (card: SPTacticalCard, commanderId: string) => void;
  onPass: () => void;
  onNewGame: () => void;
}

const PHASE_LABELS: Record<CombatSubPhase, string> = {
  'initiative_maneuver': 'Iniciativa - Manobra',
  'initiative_reaction': 'Iniciativa - Reação',
  'attack_maneuver': 'Ataque - Manobra',
  'attack_reaction': 'Ataque - Reação',
  'defense_maneuver': 'Defesa - Manobra',
  'defense_reaction': 'Defesa - Reação',
  'resolution': 'Resolução',
};

export function SinglePlayerCombatScreen({
  player,
  bot,
  combatRound,
  combatSubPhase,
  currentAttacker,
  isBotThinking,
  winner,
  actionLog,
  onPlayCard,
  onPass,
  onNewGame,
}: SinglePlayerCombatScreenProps) {
  // Tela de vitória/derrota
  if (winner) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="py-12 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
            winner === 'player' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {winner === 'player' ? 'VITÓRIA!' : 'DERROTA!'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {winner === 'player' 
              ? 'Você derrotou o exército inimigo!'
              : 'Seu exército foi derrotado.'}
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Seu HP Final</p>
              <p className="text-2xl font-bold">{player.hp}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">HP do Bot</p>
              <p className="text-2xl font-bold">{bot.hp}</p>
            </div>
          </div>
          <Button onClick={onNewGame} size="lg" className="w-full">
            Nova Partida
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Obter cartas jogáveis para a fase atual
  const getPlayableCards = () => {
    if (!combatSubPhase) return [];
    
    const phaseToType: Record<string, string> = {
      'initiative_maneuver': 'movimentacao',
      'attack_maneuver': 'ofensiva',
      'defense_maneuver': 'defensiva',
      'initiative_reaction': 'reacao',
      'attack_reaction': 'reacao',
      'defense_reaction': 'reacao',
    };
    
    const requiredType = phaseToType[combatSubPhase];
    if (!requiredType) return [];
    
    return player.hand.filter(card => card.card_type === requiredType);
  };

  const playableCards = getPlayableCards();
  const isPlayerTurn = !combatSubPhase?.includes('reaction') || currentAttacker === 'player';
  const canAct = isPlayerTurn && !isBotThinking;

  // Encontrar comandante disponível
  const getAvailableCommander = (card: SPTacticalCard) => {
    return player.commanders.find(cmd => 
      !cmd.is_general && cmd.cmd_free >= (card.command_required || 0)
    ) || player.commanders.find(cmd => 
      cmd.is_general && cmd.cmd_free >= (card.command_required || 0)
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="grid grid-cols-3 gap-4">
        {/* Jogador */}
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5" />
              <span className="font-medium">{player.nickname}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-xl font-bold">{player.hp}</span>
              <Badge variant="outline" className="ml-auto">
                {player.hand.length} cartas
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Fase */}
        <Card className="text-center">
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground">Round {combatRound}</p>
            <p className="font-bold">{combatSubPhase ? PHASE_LABELS[combatSubPhase] : 'Aguardando'}</p>
            <Badge variant={currentAttacker === 'player' ? 'default' : 'secondary'} className="mt-1">
              {currentAttacker === 'player' ? 'Você ataca' : 'Bot ataca'}
            </Badge>
          </CardContent>
        </Card>

        {/* Bot */}
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-5 h-5" />
              <span className="font-medium">{bot.nickname}</span>
              {isBotThinking && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-xl font-bold">{bot.hp}</span>
              <Badge variant="outline" className="ml-auto">
                {bot.hand.length} cartas
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Área de jogo */}
      <div className="grid grid-cols-3 gap-4">
        {/* Cartas jogadas - Jogador */}
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Suas Cartas</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            {player.roundCardsPlayed.length > 0 ? (
              <div className="space-y-1">
                {player.roundCardsPlayed.map((card, i) => (
                  <div key={i} className="p-2 rounded bg-primary/10 text-sm">
                    {card.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma carta jogada
              </p>
            )}
          </CardContent>
        </Card>

        {/* Mão do jogador */}
        <Card className="col-span-1">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Sua Mão</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <ScrollArea className="h-[200px]">
              {player.hand.length > 0 ? (
                <div className="space-y-2">
                  {player.hand.map((card, index) => {
                    const isPlayable = playableCards.some(c => c.id === card.id);
                    const commander = getAvailableCommander(card);
                    const canPlay = isPlayable && commander && canAct;

                    return (
                      <div
                        key={`${card.id}-${index}`}
                        className={`p-2 rounded-lg border transition-all ${
                          isPlayable 
                            ? canPlay 
                              ? 'border-primary bg-primary/5 cursor-pointer hover:bg-primary/10' 
                              : 'border-amber-500/50 opacity-70'
                            : 'opacity-50'
                        }`}
                        onClick={() => {
                          if (canPlay && commander) {
                            onPlayCard(card, commander.instance_id);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{card.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {card.card_type}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          {card.attack_bonus > 0 && (
                            <span className="text-red-500">+{card.attack_bonus} ATK</span>
                          )}
                          {card.defense_bonus > 0 && (
                            <span className="text-blue-500">+{card.defense_bonus} DEF</span>
                          )}
                          <span className="ml-auto">CMD {card.command_required}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Sem cartas na mão
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Cartas jogadas - Bot */}
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Cartas do Bot</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            {bot.roundCardsPlayed.length > 0 ? (
              <div className="space-y-1">
                {bot.roundCardsPlayed.map((card, i) => (
                  <div key={i} className="p-2 rounded bg-destructive/10 text-sm">
                    {card.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma carta jogada
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comandantes e Ações */}
      <div className="grid grid-cols-2 gap-4">
        {/* Comandantes */}
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Seus Comandantes</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-wrap gap-2">
              {player.commanders.map(cmd => (
                <Badge 
                  key={cmd.instance_id}
                  variant={cmd.is_general ? 'default' : 'secondary'}
                  className="flex items-center gap-1"
                >
                  {cmd.is_general && '👑'} #{cmd.numero}
                  <span className="ml-1 font-mono">CMD {cmd.cmd_free}/{cmd.comando_base}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card>
          <CardContent className="py-4">
            <div className="flex gap-2">
              <Button
                onClick={onPass}
                disabled={!canAct}
                variant="outline"
                className="flex-1"
              >
                {isBotThinking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Bot pensando...
                  </>
                ) : (
                  'Passar Fase'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log de ações */}
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm">Log de Batalha</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <ScrollArea className="h-[100px]">
            <div className="space-y-1">
              {actionLog.slice(-10).reverse().map(entry => (
                <div 
                  key={entry.id} 
                  className={`text-xs py-1 px-2 rounded ${
                    entry.actor === 'player' 
                      ? 'bg-primary/10' 
                      : entry.actor === 'bot' 
                        ? 'bg-destructive/10'
                        : 'bg-muted'
                  }`}
                >
                  <span className="font-medium">
                    {entry.actor === 'player' ? '👤' : entry.actor === 'bot' ? '🤖' : '⚙️'}
                  </span>
                  {' '}{entry.action}
                  {entry.details && <span className="text-muted-foreground"> - {entry.details}</span>}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
