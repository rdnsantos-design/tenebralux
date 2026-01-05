import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Copy, Check, Loader2, Users, Swords, Shield, RefreshCw, Play } from 'lucide-react';
import { TacticalArmySelector } from './TacticalArmySelector';
import { TacticalTerrainSelector, TerrainSelection } from './TacticalTerrainSelector';
import { useTacticalMatch, TacticalMatch } from '@/hooks/useTacticalMatch';
import { usePlayerId } from '@/hooks/usePlayerId';
import { useStrategicArmies } from '@/hooks/useStrategicArmies';
import { useToast } from '@/hooks/use-toast';

export function TacticalLobbyRoom() {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const { playerId } = usePlayerId();
  const { toast } = useToast();
  const { getMatch, setArmy, setReady, startMatch, resetPlayer2, subscribeToMatch } = useTacticalMatch();
  const { armies } = useStrategicArmies();

  const [match, setMatch] = useState<TacticalMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [armySelectorOpen, setArmySelectorOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const isPlayer1 = match?.player1_id === playerId;
  // Only be player2 if we're not player1 (handles same-device testing)
  const isPlayer2 = !isPlayer1 && match?.player2_id === playerId;
  const myReady = isPlayer1 ? match?.player1_ready : match?.player2_ready;
  const myArmyId = isPlayer1 ? match?.player1_army_id : match?.player2_army_id;
  const bothReady = match?.player1_ready && match?.player2_ready;
  const bothHaveArmies = match?.player1_army_id && match?.player2_army_id;
  const canStart = isPlayer1 && bothReady && bothHaveArmies && match?.player2_id;

  useEffect(() => {
    if (!matchId) return;

    const loadMatch = async () => {
      const data = await getMatch(matchId);
      setMatch(data);
      setLoading(false);
    };

    loadMatch();

    const unsubscribe = subscribeToMatch(matchId, (updatedMatch) => {
      setMatch(updatedMatch);
      
      // Navigate to battle if match started
      if (updatedMatch.status === 'playing') {
        navigate(`/tactical/battle/${matchId}`);
      }
    });

    return unsubscribe;
  }, [matchId]);

  const handleCopyCode = async () => {
    if (!match?.join_code) return;
    
    await navigator.clipboard.writeText(match.join_code);
    setCopied(true);
    toast({ title: 'Código copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleArmySelect = async (armyId: string) => {
    if (!matchId) return;
    await setArmy(matchId, playerId, armyId);
    setArmySelectorOpen(false);
  };

  const handleReadyToggle = async () => {
    if (!matchId) return;
    await setReady(matchId, playerId, !myReady);
  };

  const handleStart = async () => {
    if (!matchId || !canStart) return;
    setStarting(true);
    await startMatch(matchId);
    // Navigation handled by subscription
  };

  const handleResetPlayer2 = async () => {
    if (!matchId) return;
    await resetPlayer2(matchId);
  };

  const getArmyName = (armyId: string | null) => {
    if (!armyId) return null;
    return armies.find(a => a.id === armyId)?.name;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-muted-foreground mb-4">Partida não encontrada.</p>
          <Button onClick={() => navigate('/tactical')}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/tactical')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Sair do Lobby
        </Button>

        {/* Código da Partida */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex flex-col items-center">
              <p className="text-muted-foreground mb-2">Código da Partida</p>
              <div className="flex items-center gap-4">
                <span className="font-mono text-5xl font-bold tracking-[0.3em]">
                  {match.join_code}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Compartilhe este código com seu oponente
              </p>
            </div>
          </CardContent>
        </Card>

        {isPlayer1 && match.player2_id && match.player2_id === match.player1_id && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-medium">Jogador 2 entrou com o mesmo ID do Jogador 1</p>
                  <p className="text-sm text-muted-foreground">
                    Isso acontece ao testar no mesmo navegador. Libere a vaga do Jogador 2 e entre pelo modo anônimo/privado.
                  </p>
                </div>
                <Button variant="outline" onClick={handleResetPlayer2}>
                  Liberar Jogador 2
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Layout Principal */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Player 1 */}
          <Card className={isPlayer1 ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Jogador 1
                {isPlayer1 && <Badge>Você</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-medium">{match.player1_name}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Exército:</p>
                {match.player1_army_id ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {getArmyName(match.player1_army_id) || 'Exército selecionado'}
                    </Badge>
                    {isPlayer1 && (
                      <Dialog open={armySelectorOpen} onOpenChange={setArmySelectorOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Trocar Exército</DialogTitle>
                          </DialogHeader>
                          <TacticalArmySelector
                            selectedArmyId={match.player1_army_id || ''}
                            onSelect={handleArmySelect}
                            maxPower={match.max_power_points}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                ) : isPlayer1 ? (
                  <Dialog open={armySelectorOpen} onOpenChange={setArmySelectorOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Selecionar Exército
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Selecionar Exército</DialogTitle>
                      </DialogHeader>
                      <TacticalArmySelector
                        selectedArmyId=""
                        onSelect={handleArmySelect}
                        maxPower={match.max_power_points}
                      />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <p className="text-muted-foreground italic">Selecionando...</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span>Pronto</span>
                {isPlayer1 ? (
                  <Switch
                    checked={match.player1_ready || false}
                    onCheckedChange={handleReadyToggle}
                    disabled={!match.player1_army_id}
                  />
                ) : (
                  <Badge variant={match.player1_ready ? 'default' : 'outline'}>
                    {match.player1_ready ? 'Sim' : 'Não'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-5 w-5" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Limite de Poder:</span>
                <Badge>{match.max_power_points} VET</Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline">
                  {match.status === 'waiting' ? 'Aguardando' : 
                   match.status === 'ready' ? 'Pronto' : match.status}
                </Badge>
              </div>

              {/* Start Button */}
              {canStart && (
                <Button
                  className="w-full mt-4"
                  size="lg"
                  onClick={handleStart}
                  disabled={starting}
                >
                  {starting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Iniciar Batalha
                </Button>
              )}

              {!canStart && bothReady && !isPlayer1 && (
                <p className="text-center text-sm text-muted-foreground">
                  Aguardando o anfitrião iniciar...
                </p>
              )}

              {!bothReady && (
                <p className="text-center text-sm text-muted-foreground">
                  Aguardando jogadores ficarem prontos...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Player 2 */}
          <Card className={isPlayer2 ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Jogador 2
                {isPlayer2 && <Badge>Você</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {match.player2_id ? (
                <>
                  <div>
                    <p className="text-lg font-medium">{match.player2_name}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Exército:</p>
                    {match.player2_army_id ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {getArmyName(match.player2_army_id) || 'Exército selecionado'}
                        </Badge>
                        {isPlayer2 && (
                          <Dialog open={armySelectorOpen} onOpenChange={setArmySelectorOpen}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Trocar Exército</DialogTitle>
                              </DialogHeader>
                              <TacticalArmySelector
                                selectedArmyId={match.player2_army_id || ''}
                                onSelect={handleArmySelect}
                                maxPower={match.max_power_points}
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    ) : isPlayer2 ? (
                      <Dialog open={armySelectorOpen} onOpenChange={setArmySelectorOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Selecionar Exército
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Selecionar Exército</DialogTitle>
                          </DialogHeader>
                          <TacticalArmySelector
                            selectedArmyId=""
                            onSelect={handleArmySelect}
                            maxPower={match.max_power_points}
                          />
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <p className="text-muted-foreground italic">Selecionando...</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span>Pronto</span>
                    {isPlayer2 ? (
                      <Switch
                        checked={match.player2_ready || false}
                        onCheckedChange={handleReadyToggle}
                        disabled={!match.player2_army_id}
                      />
                    ) : (
                      <Badge variant={match.player2_ready ? 'default' : 'outline'}>
                        {match.player2_ready ? 'Sim' : 'Não'}
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Aguardando oponente...
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Compartilhe o código acima
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
