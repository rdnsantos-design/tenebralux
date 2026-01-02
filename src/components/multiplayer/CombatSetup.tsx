import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, Shield, Sword, Crown, CheckCircle2, 
  MapPin, Sun, Users, LogOut 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScenarioSummary } from './ScenarioSummary';
import type { Room, RoomPlayer, MatchState, PlayerContext } from '@/types/multiplayer';

interface CombatSetupProps {
  room: Room;
  players: RoomPlayer[];
  matchState: MatchState;
  playerContext: PlayerContext;
  onLeaveRoom: () => void;
}

interface PlayerCommander {
  instance_id?: string;
  id?: string;
  template_id?: string;
  numero: number;
  especializacao: string;
  comando_base?: number;
  comando?: number;
  estrategia: number;
  guarda_max?: number;
  guarda_current?: number;
  guarda?: number;
  custo_vet: number;
}

const getCommanderInstanceId = (cmd: PlayerCommander): string => {
  return cmd.instance_id || cmd.id || '';
};

const getCommanderCMD = (cmd: PlayerCommander): number => {
  return cmd.comando_base ?? cmd.comando ?? 1;
};

export function CombatSetup({ room, players, matchState, playerContext, onLeaveRoom }: CombatSetupProps) {
  const [confirming, setConfirming] = useState(false);
  
  const myCommanders = playerContext.playerNumber === 1 
    ? (matchState as any).player1_commanders ?? []
    : (matchState as any).player2_commanders ?? [];
  
  const myGeneralId = playerContext.playerNumber === 1 
    ? (matchState as any).player1_general_id
    : (matchState as any).player2_general_id;
  
  const myDeploymentConfirmed = playerContext.playerNumber === 1
    ? (matchState as any).player1_deployment_confirmed
    : (matchState as any).player2_deployment_confirmed;
  
  const opponentDeploymentConfirmed = playerContext.playerNumber === 1
    ? (matchState as any).player2_deployment_confirmed
    : (matchState as any).player1_deployment_confirmed;
  
  const myCulture = playerContext.playerNumber === 1
    ? matchState.player1_culture
    : matchState.player2_culture;
  
  const opponent = players.find(p => p.player_number !== playerContext.playerNumber);
  
  const handleConfirmDeployment = async () => {
    setConfirming(true);
    try {
      const { error } = await supabase.rpc('confirm_deployment', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId
      });
      
      if (error) throw error;
      toast.success('Preparação confirmada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao confirmar');
    } finally {
      setConfirming(false);
    }
  };
  
  const myGeneral = myCommanders.find((c: PlayerCommander) => 
    getCommanderInstanceId(c) === myGeneralId
  );
  
  return (
    <div className="w-full max-w-4xl space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="py-3">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={onLeaveRoom} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
            <div className="text-center">
              <h2 className="font-bold">Preparação para Combate</h2>
              <p className="text-xs text-muted-foreground">Sala: {room.code}</p>
            </div>
            <div className="flex items-center gap-2">
              {myDeploymentConfirmed ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Você: Pronto
                </Badge>
              ) : (
                <Badge variant="outline">Você: Preparando</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Scenario Summary */}
      <ScenarioSummary matchState={matchState} />
      
      {/* Army Summary */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Seu Exército
          </CardTitle>
          <CardDescription>
            Cultura: <Badge variant="secondary">{myCulture || 'Não definida'}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* General Highlight */}
          {myGeneral && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-bold flex items-center gap-2">
                    General #{myGeneral.numero}
                    <Badge variant="outline" className="text-xs">{myGeneral.especializacao}</Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Sword className="w-3 h-3" />
                      CMD: {getCommanderCMD(myGeneral)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Guarda: {myGeneral.guarda_current ?? myGeneral.guarda ?? 2}
                    </span>
                  </div>
                </div>
                <Badge className="bg-amber-500">General</Badge>
              </div>
            </div>
          )}
          
          <Separator />
          
          {/* Other Commanders */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Comandantes ({myCommanders.length})</h4>
            <ScrollArea className="h-48">
              <div className="grid grid-cols-2 gap-2">
                {myCommanders.map((cmd: PlayerCommander) => {
                  const isGeneral = getCommanderInstanceId(cmd) === myGeneralId;
                  if (isGeneral) return null;
                  
                  return (
                    <div 
                      key={getCommanderInstanceId(cmd)}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">#{cmd.numero}</span>
                        <Badge variant="outline" className="text-xs">{cmd.especializacao}</Badge>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span>CMD: {getCommanderCMD(cmd)}</span>
                        <span>EST: {cmd.estrategia}</span>
                        <span>GDA: {cmd.guarda_current ?? cmd.guarda ?? 2}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
      
      {/* Opponent Status */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Oponente: <strong>{opponent?.nickname || 'Aguardando...'}</strong>
              </span>
            </div>
            {opponentDeploymentConfirmed ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Pronto
              </Badge>
            ) : (
              <Badge variant="outline">Preparando...</Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Confirm Button */}
      {!myDeploymentConfirmed && (
        <Button 
          className="w-full h-12 text-lg"
          onClick={handleConfirmDeployment}
          disabled={confirming}
        >
          {confirming ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Confirmando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Confirmar Preparação para Combate
            </>
          )}
        </Button>
      )}
      
      {myDeploymentConfirmed && !opponentDeploymentConfirmed && (
        <Card className="bg-muted/50">
          <CardContent className="py-4 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">
              Aguardando oponente confirmar preparação...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
