import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Swords, 
  Shield, 
  Zap, 
  Heart, 
  Check, 
  X, 
  Trash2,
  ChevronRight,
  Flag,
  Eye
} from 'lucide-react';
import { GameSession, PlayedCard, RoundResult } from '@/hooks/useGameSession';
import { StrategicArmy, calculateDefense, calculateHitPoints } from '@/types/combat/strategic-army';
import { MassCombatTacticalCard } from '@/types/MassCombatTacticalCard';
import { MassCombatTacticalCardPreview } from '@/components/masscombat/MassCombatTacticalCardPreview';

interface GameBoardProps {
  session: GameSession;
  playerNumber: 1 | 2;
  myArmy: StrategicArmy | null;
  opponentArmy: StrategicArmy | null;
  playedCards: PlayedCard[];
  roundResults: RoundResult[];
  allCards: MassCombatTacticalCard[];
  onPlayCard: (cardId: string, phase: 'attack' | 'defense' | 'initiative') => void;
  onRemoveCard: (cardId: string) => void;
  onReady: (ready: boolean) => void;
  onAdvancePhase: () => void;
  onSubmitResults: (results: { player1_result: any; player2_result: any; notes?: string }) => void;
  onEndGame: () => void;
}

const PHASE_NAMES: Record<string, string> = {
  attack: 'Fase de Ataque',
  defense: 'Fase de Defesa',
  initiative: 'Fase de Iniciativa',
  resolution: 'Resolução',
};

export function GameBoard({
  session,
  playerNumber,
  myArmy,
  opponentArmy,
  playedCards,
  roundResults,
  allCards,
  onPlayCard,
  onRemoveCard,
  onReady,
  onAdvancePhase,
  onSubmitResults,
  onEndGame,
}: GameBoardProps) {
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [player1Damage, setPlayer1Damage] = useState('');
  const [player2Damage, setPlayer2Damage] = useState('');
  const [roundNotes, setRoundNotes] = useState('');
  const [selectedCardPreview, setSelectedCardPreview] = useState<MassCombatTacticalCard | null>(null);

  const isReady = playerNumber === 1 ? session.player1_ready : session.player2_ready;
  const opponentReady = playerNumber === 1 ? session.player2_ready : session.player1_ready;
  const bothReady = session.player1_ready && session.player2_ready;

  const myNickname = playerNumber === 1 ? session.player1_nickname : session.player2_nickname;
  const opponentNickname = playerNumber === 1 ? session.player2_nickname : session.player1_nickname;

  // Cartas jogadas nesta rodada/fase
  const myPlayedThisPhase = useMemo(() => 
    playedCards.filter(c => 
      c.round === session.current_round && 
      c.phase === session.current_phase &&
      c.player_number === playerNumber
    ),
    [playedCards, session.current_round, session.current_phase, playerNumber]
  );

  const opponentPlayedThisPhase = useMemo(() => 
    playedCards.filter(c => 
      c.round === session.current_round && 
      c.phase === session.current_phase &&
      c.player_number !== playerNumber
    ),
    [playedCards, session.current_round, session.current_phase, playerNumber]
  );

  // Cartas disponíveis do meu exército
  const availableCards = useMemo(() => {
    if (!myArmy) return [];
    
    const playedCardIds = new Set(myPlayedThisPhase.map(c => c.card_id));
    
    return myArmy.tacticalCards
      .filter(tc => !playedCardIds.has(tc.cardId))
      .map(tc => {
        const fullCard = allCards.find(c => c.id === tc.cardId);
        return fullCard;
      })
      .filter(Boolean) as MassCombatTacticalCard[];
  }, [myArmy, myPlayedThisPhase, allCards]);

  // Função para obter carta completa
  const getCardById = (cardId: string) => allCards.find(c => c.id === cardId);

  // Submeter resultados
  const handleSubmitResults = () => {
    onSubmitResults({
      player1_result: { damage: parseInt(player1Damage) || 0 },
      player2_result: { damage: parseInt(player2Damage) || 0 },
      notes: roundNotes || undefined,
    });
    setShowResultsDialog(false);
    setPlayer1Damage('');
    setPlayer2Damage('');
    setRoundNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header com rodada e fase */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Rodada {session.current_round}
              </Badge>
              <Badge variant="default" className="text-lg px-4 py-2">
                {PHASE_NAMES[session.current_phase]}
              </Badge>
            </div>
            <Button variant="destructive" size="sm" onClick={onEndGame}>
              <Flag className="w-4 h-4 mr-2" />
              Encerrar Jogo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Área de jogo dividida */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meu lado */}
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="text-primary">{myNickname} (Você)</span>
              {isReady && <Badge><Check className="w-3 h-3 mr-1" />Pronto</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myArmy && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  PV: {calculateHitPoints(myArmy.totalVet)}
                </div>
                <div className="flex items-center gap-1">
                  <Swords className="w-3 h-3 text-red-500" />
                  Atq: {myArmy.attackPurchased}
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-500" />
                  Def: {calculateDefense(myArmy.defensePurchased)}
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  Mob: {myArmy.mobilityPurchased}
                </div>
              </div>
            )}

            <Separator />

            {/* Cartas jogadas por mim */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Cartas Jogadas ({myPlayedThisPhase.length}/5)
              </h4>
              <div className="space-y-2">
                {myPlayedThisPhase.map((pc) => {
                  const card = getCardById(pc.card_id);
                  return card ? (
                    <div key={pc.id} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                      <span 
                        className="cursor-pointer hover:underline"
                        onClick={() => setSelectedCardPreview(card)}
                      >
                        {card.name}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => onRemoveCard(pc.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Centro - Ações e cartas disponíveis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Suas Cartas Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {availableCards.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma carta disponível
                  </p>
                ) : (
                  availableCards.map((card) => (
                    <div 
                      key={card.id} 
                      className="flex items-center justify-between bg-muted/50 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <span 
                          className="font-medium cursor-pointer hover:underline"
                          onClick={() => setSelectedCardPreview(card)}
                        >
                          {card.name}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {card.unit_type} • VET: {card.vet_cost}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setSelectedCardPreview(card)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => onPlayCard(card.id, session.current_phase as any)}
                          disabled={session.current_phase === 'resolution' || myPlayedThisPhase.length >= 5}
                        >
                          Jogar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            {/* Botões de ação */}
            <div className="space-y-2">
              {session.current_phase !== 'resolution' && (
                !isReady ? (
                  <Button className="w-full" onClick={() => onReady(true)}>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Fase
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" onClick={() => onReady(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                )
              )}

              {bothReady && playerNumber === 1 && session.current_phase !== 'resolution' && (
                <Button className="w-full" variant="secondary" onClick={onAdvancePhase}>
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Próxima Fase
                </Button>
              )}

              {session.current_phase === 'resolution' && playerNumber === 1 && (
                <Button className="w-full" onClick={() => setShowResultsDialog(true)}>
                  Registrar Resultados
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lado do oponente */}
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="text-destructive">{opponentNickname}</span>
              {opponentReady && <Badge variant="secondary"><Check className="w-3 h-3 mr-1" />Pronto</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {opponentArmy && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  PV: {calculateHitPoints(opponentArmy.totalVet)}
                </div>
                <div className="flex items-center gap-1">
                  <Swords className="w-3 h-3 text-red-500" />
                  Atq: {opponentArmy.attackPurchased}
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-500" />
                  Def: {calculateDefense(opponentArmy.defensePurchased)}
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  Mob: {opponentArmy.mobilityPurchased}
                </div>
              </div>
            )}

            <Separator />

            {/* Cartas jogadas pelo oponente (visíveis após ambos confirmarem) */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Cartas Jogadas ({opponentPlayedThisPhase.length})
              </h4>
              <div className="space-y-2">
                {bothReady ? (
                  opponentPlayedThisPhase.map((pc) => {
                    const card = getCardById(pc.card_id);
                    return card ? (
                      <div 
                        key={pc.id} 
                        className="bg-destructive/10 p-2 rounded text-sm cursor-pointer hover:bg-destructive/20"
                        onClick={() => setSelectedCardPreview(card)}
                      >
                        {card.name}
                      </div>
                    ) : null;
                  })
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Aguardando ambos confirmarem...
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de rodadas */}
      {roundResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Rodadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roundResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between bg-muted/50 p-3 rounded">
                  <span>Rodada {result.round}</span>
                  <div className="flex gap-4">
                    <span>P1: {result.player1_result?.damage || 0} dano</span>
                    <span>P2: {result.player2_result?.damage || 0} dano</span>
                  </div>
                  {result.notes && <span className="text-muted-foreground text-sm">{result.notes}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de resultados */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Resultados da Rodada {session.current_round}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dano {session.player1_nickname}</label>
                <Input 
                  type="number" 
                  value={player1Damage} 
                  onChange={(e) => setPlayer1Damage(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dano {session.player2_nickname}</label>
                <Input 
                  type="number" 
                  value={player2Damage} 
                  onChange={(e) => setPlayer2Damage(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea 
                value={roundNotes} 
                onChange={(e) => setRoundNotes(e.target.value)}
                placeholder="Observações sobre a rodada..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultsDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitResults}>
              Salvar e Próxima Rodada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de preview de carta */}
      <Dialog open={!!selectedCardPreview} onOpenChange={() => setSelectedCardPreview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Carta</DialogTitle>
          </DialogHeader>
          {selectedCardPreview && (
            <MassCombatTacticalCardPreview card={selectedCardPreview} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
