import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Clock, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Room, RoomPlayer, MatchState, PlayerContext } from '@/types/multiplayer';

const CULTURES = [
  { id: 'anuire', name: 'Anuire', description: 'Império feudal inspirado na Europa medieval', color: 'bg-blue-500' },
  { id: 'khinasi', name: 'Khinasi', description: 'Cultura mercantil do deserto', color: 'bg-amber-500' },
  { id: 'vos', name: 'Vos', description: 'Guerreiros das terras frias do leste', color: 'bg-red-500' },
  { id: 'brecht', name: 'Brecht', description: 'Comerciantes e marinheiros do norte', color: 'bg-green-500' },
  { id: 'rjurik', name: 'Rjurik', description: 'Povo livre das florestas do norte', color: 'bg-emerald-600' },
];

interface CultureSelectionProps {
  room: Room;
  players: RoomPlayer[];
  matchState: MatchState;
  playerContext: PlayerContext;
  onLeaveRoom: () => void;
}

export function CultureSelection({ room, players, matchState, playerContext, onLeaveRoom }: CultureSelectionProps) {
  const [selectedCulture, setSelectedCulture] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Verificar se já confirmou
  const myConfirmed = playerContext.playerNumber === 1 
    ? matchState.player1_culture_confirmed 
    : matchState.player2_culture_confirmed;
  
  const myCulture = playerContext.playerNumber === 1 
    ? matchState.player1_culture 
    : matchState.player2_culture;

  const opponentConfirmed = playerContext.playerNumber === 1 
    ? matchState.player2_culture_confirmed 
    : matchState.player1_culture_confirmed;

  const opponentCulture = playerContext.playerNumber === 1 
    ? matchState.player2_culture 
    : matchState.player1_culture;

  // Inicializar seleção se já tiver cultura
  useEffect(() => {
    if (myCulture && !selectedCulture) {
      setSelectedCulture(myCulture);
    }
  }, [myCulture, selectedCulture]);

  const handleConfirm = async () => {
    if (!selectedCulture) {
      toast.error('Selecione uma cultura primeiro');
      return;
    }

    setIsConfirming(true);
    try {
      const { data, error } = await supabase.rpc('confirm_culture', {
        p_room_id: room.id,
        p_player_number: playerContext.playerNumber,
        p_culture_id: selectedCulture
      });

      if (error) throw error;

      toast.success('Cultura confirmada!');
      
      if ((data as { both_confirmed?: boolean })?.both_confirmed) {
        toast.info('Ambos confirmaram! Avançando para Cenário...');
      }
    } catch (err) {
      console.error('Erro ao confirmar cultura:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao confirmar');
    } finally {
      setIsConfirming(false);
    }
  };

  const opponent = players.find(p => p.id !== playerContext.playerId);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center relative">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLeaveRoom}
          className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Sair
        </Button>
        <CardTitle>Seleção de Cultura</CardTitle>
        <CardDescription>
          Escolha a cultura do seu exército
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status dos jogadores */}
        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="font-medium">Você:</span>
            {myConfirmed ? (
              <>
                <Badge variant="default">{CULTURES.find(c => c.id === myCulture)?.name}</Badge>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </>
            ) : (
              <Badge variant="outline">Escolhendo...</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{opponent?.nickname ?? 'Oponente'}:</span>
            {opponentConfirmed ? (
              <>
                <Badge variant="secondary">{CULTURES.find(c => c.id === opponentCulture)?.name}</Badge>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </>
            ) : (
              <>
                <Badge variant="outline">Escolhendo...</Badge>
                <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />
              </>
            )}
          </div>
        </div>

        {/* Grid de culturas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CULTURES.map(culture => {
            const isSelected = selectedCulture === culture.id;
            const isLocked = myConfirmed;

            return (
              <button
                key={culture.id}
                onClick={() => !isLocked && setSelectedCulture(culture.id)}
                disabled={isLocked}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                } ${isLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${culture.color}`} />
                  <span className="font-semibold">{culture.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                </div>
                <p className="text-xs text-muted-foreground">{culture.description}</p>
              </button>
            );
          })}
        </div>

        {/* Botão de confirmar */}
        {!myConfirmed && (
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedCulture || isConfirming}
            className="w-full"
            size="lg"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirmando...
              </>
            ) : (
              'Confirmar Cultura'
            )}
          </Button>
        )}

        {myConfirmed && !opponentConfirmed && (
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Aguardando oponente confirmar...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
