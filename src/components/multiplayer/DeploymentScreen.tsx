import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Shield, Sword, Target, CheckCircle2, Clock, LogOut 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScenarioSummary } from './ScenarioSummary';
import type { Room, RoomPlayer, MatchState, PlayerContext } from '@/types/multiplayer';

interface DeploymentScreenProps {
  room: Room;
  players: RoomPlayer[];
  matchState: MatchState;
  playerContext: PlayerContext;
  onLeaveRoom: () => void;
}

type Formation = 'aggressive' | 'balanced' | 'defensive';

const FORMATIONS: { id: Formation; label: string; icon: React.ReactNode; description: string; bonus: string }[] = [
  { 
    id: 'aggressive', 
    label: 'Agressiva', 
    icon: <Sword className="w-6 h-6" />, 
    description: 'Foco em ataque, posição avançada',
    bonus: '+1 ATK, -1 DEF'
  },
  { 
    id: 'balanced', 
    label: 'Balanceada', 
    icon: <Target className="w-6 h-6" />, 
    description: 'Equilíbrio entre ataque e defesa',
    bonus: 'Sem modificadores'
  },
  { 
    id: 'defensive', 
    label: 'Defensiva', 
    icon: <Shield className="w-6 h-6" />, 
    description: 'Foco em defesa, posição recuada',
    bonus: '-1 ATK, +1 DEF'
  },
];

export function DeploymentScreen({ room, players, matchState, playerContext, onLeaveRoom }: DeploymentScreenProps) {
  const [selectedFormation, setSelectedFormation] = useState<Formation>('balanced');
  const [loading, setLoading] = useState(false);
  
  const pNum = playerContext.playerNumber;
  const myConfirmed = pNum === 1 
    ? (matchState as any).player1_deployment_confirmed 
    : (matchState as any).player2_deployment_confirmed;
  const opponentConfirmed = pNum === 1 
    ? (matchState as any).player2_deployment_confirmed 
    : (matchState as any).player1_deployment_confirmed;
  
  const myFormation = pNum === 1 
    ? (matchState as any).player1_deployment_formation 
    : (matchState as any).player2_deployment_formation;
  
  const opponent = players.find(p => p.player_number !== pNum);
  
  const handleConfirm = async () => {
    if (myConfirmed) return; // Idempotência: já confirmado
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('confirm_deployment', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_formation: selectedFormation
      });
      
      if (error) throw error;
      toast.success('Formação confirmada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao confirmar');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Fase de Deployment
              </CardTitle>
              <CardDescription>
                Escolha a formação do seu exército antes do combate
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onLeaveRoom} className="text-destructive">
              <LogOut className="w-4 h-4 mr-1" />
              Sair
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      {/* Scenario Summary */}
      <ScenarioSummary matchState={matchState} playerContext={playerContext} />
      
      {/* Status dos Jogadores */}
      <Card>
        <CardContent className="py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-medium">Você</span>
              {myConfirmed ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {myFormation || 'Confirmado'}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  Escolhendo...
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{opponent?.nickname || 'Oponente'}</span>
              {opponentConfirmed ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Pronto
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  Escolhendo...
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Seleção de Formação */}
      {!myConfirmed ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Escolha sua Formação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {FORMATIONS.map((formation) => (
                <Button
                  key={formation.id}
                  variant={selectedFormation === formation.id ? 'default' : 'outline'}
                  className="h-auto py-4 justify-start"
                  onClick={() => setSelectedFormation(formation.id)}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className={`p-2 rounded-lg ${
                      selectedFormation === formation.id 
                        ? 'bg-primary-foreground/20' 
                        : 'bg-muted'
                    }`}>
                      {formation.icon}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold">{formation.label}</div>
                      <div className="text-sm opacity-80">{formation.description}</div>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {formation.bonus}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
            
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleConfirm}
              disabled={loading || myConfirmed}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Formação
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-muted">
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-bold mb-2">Formação Confirmada: {myFormation}</h3>
            {!opponentConfirmed ? (
              <p className="text-muted-foreground">
                Aguardando {opponent?.nickname || 'oponente'} escolher formação...
              </p>
            ) : (
              <div className="flex items-center justify-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Iniciando combate...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
