import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Shield, 
  Swords, 
  Zap, 
  Heart, 
  Check, 
  X, 
  Loader2,
  Play
} from 'lucide-react';
import { GameSession } from '@/hooks/useGameSession';
import { StrategicArmy, calculateDefense, calculateHitPoints } from '@/types/combat/strategic-army';

interface GameSetupProps {
  session: GameSession;
  playerNumber: 1 | 2;
  armies: StrategicArmy[];
  selectedArmyId: string | null;
  onSelectArmy: (armyId: string) => void;
  onReady: (ready: boolean) => void;
  onStartGame: () => void;
  onLeave: () => void;
}

export function GameSetup({
  session,
  playerNumber,
  armies,
  selectedArmyId,
  onSelectArmy,
  onReady,
  onStartGame,
  onLeave,
}: GameSetupProps) {
  const isReady = playerNumber === 1 ? session.player1_ready : session.player2_ready;
  const opponentReady = playerNumber === 1 ? session.player2_ready : session.player1_ready;
  const opponentNickname = playerNumber === 1 ? session.player2_nickname : session.player1_nickname;
  const myNickname = playerNumber === 1 ? session.player1_nickname : session.player2_nickname;
  
  const bothReady = session.player1_ready && session.player2_ready;
  const bothHaveArmy = session.player1_army_id && session.player2_army_id;

  const selectedArmy = armies.find(a => a.id === selectedArmyId);

  return (
    <div className="space-y-6">
      {/* Header com jogadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sala: {session.room_code}
            </div>
            <Button variant="ghost" size="sm" onClick={onLeave}>
              <X className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Player 1 */}
            <div className={`p-4 rounded-lg border-2 ${playerNumber === 1 ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{session.player1_nickname || 'Aguardando...'}</span>
                {session.player1_ready && <Badge variant="default"><Check className="w-3 h-3 mr-1" />Pronto</Badge>}
              </div>
              {session.player1_army_id && (
                <Badge variant="outline">Exército selecionado</Badge>
              )}
            </div>
            
            {/* Player 2 */}
            <div className={`p-4 rounded-lg border-2 ${playerNumber === 2 ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {session.player2_nickname || (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Aguardando...
                    </span>
                  )}
                </span>
                {session.player2_ready && <Badge variant="default"><Check className="w-3 h-3 mr-1" />Pronto</Badge>}
              </div>
              {session.player2_army_id && (
                <Badge variant="outline">Exército selecionado</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seleção de exército */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de exércitos */}
        <Card>
          <CardHeader>
            <CardTitle>Seus Exércitos</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {armies.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum exército salvo. Crie um primeiro!
                  </p>
                ) : (
                  armies.map((army) => (
                    <div
                      key={army.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedArmyId === army.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => onSelectArmy(army.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{army.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            VET: {army.totalVet} • {army.commanders.length} comandante(s)
                          </p>
                        </div>
                        {selectedArmyId === army.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Preview do exército selecionado */}
        <Card>
          <CardHeader>
            <CardTitle>Exército Selecionado</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedArmy ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold">{selectedArmy.name}</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>PV: {calculateHitPoints(selectedArmy.totalVet)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-red-500" />
                    <span>Ataque: {selectedArmy.attackPurchased}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span>Defesa: {calculateDefense(selectedArmy.defensePurchased)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>Mobilidade: {selectedArmy.mobilityPurchased}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Comandantes ({selectedArmy.commanders.length})</h4>
                  <div className="space-y-1">
                    {selectedArmy.commanders.map((cmd, i) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        {cmd.isGeneral && <Badge variant="secondary" className="text-xs">General</Badge>}
                        <span>Cmd #{cmd.templateNumber} - {cmd.especializacao}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Cartas Táticas ({selectedArmy.tacticalCards.length})</h4>
                  <div className="space-y-1">
                    {selectedArmy.tacticalCards.map((card, i) => (
                      <div key={i} className="text-sm">
                        {card.cardName} (VET: {card.vetCost})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Selecione um exército à esquerda
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-center gap-4">
        {!isReady ? (
          <Button 
            size="lg"
            onClick={() => onReady(true)}
            disabled={!selectedArmyId || !session.player2_nickname}
          >
            <Check className="w-4 h-4 mr-2" />
            Pronto!
          </Button>
        ) : (
          <Button 
            size="lg"
            variant="outline"
            onClick={() => onReady(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        )}

        {playerNumber === 1 && bothReady && bothHaveArmy && (
          <Button 
            size="lg"
            variant="default"
            onClick={onStartGame}
          >
            <Play className="w-4 h-4 mr-2" />
            Iniciar Batalha!
          </Button>
        )}
      </div>

      {bothReady && bothHaveArmy && playerNumber === 2 && (
        <p className="text-center text-muted-foreground">
          Aguardando o anfitrião iniciar a batalha...
        </p>
      )}
    </div>
  );
}
