import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Clock, Play, Trophy, X, Eye, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePlayerId } from '@/hooks/usePlayerId';
import { TacticalMatch } from '@/hooks/useTacticalMatch';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function MyTacticalMatches() {
  const navigate = useNavigate();
  const { playerId } = usePlayerId();
  const [matches, setMatches] = useState<TacticalMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, [playerId]);

  const loadMatches = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('tactical_matches')
      .select('*')
      .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMatches(data as TacticalMatch[]);
    }
    setLoading(false);
  };

  const deleteMatch = async (matchId: string) => {
    setDeletingId(matchId);
    
    // Delete related data first
    await supabase.from('tactical_game_states').delete().eq('match_id', matchId);
    await supabase.from('tactical_game_actions').delete().eq('match_id', matchId);
    
    // Delete the match
    const { error } = await supabase
      .from('tactical_matches')
      .delete()
      .eq('id', matchId);

    if (error) {
      toast.error('Erro ao excluir partida');
    } else {
      toast.success('Partida excluída');
      setMatches(prev => prev.filter(m => m.id !== matchId));
    }
    setDeletingId(null);
  };

  const filteredMatches = matches.filter(match => {
    if (activeTab === 'all') return true;
    if (activeTab === 'waiting') return match.status === 'waiting';
    if (activeTab === 'playing') return match.status === 'playing';
    if (activeTab === 'finished') return match.status === 'finished' || match.status === 'abandoned';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Aguardando</Badge>;
      case 'playing':
        return <Badge variant="default"><Play className="h-3 w-3 mr-1" /> Em andamento</Badge>;
      case 'finished':
        return <Badge variant="secondary"><Trophy className="h-3 w-3 mr-1" /> Finalizada</Badge>;
      case 'abandoned':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" /> Abandonada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOpponentName = (match: TacticalMatch) => {
    if (match.player1_id === playerId) {
      return match.player2_name || 'Aguardando...';
    }
    return match.player1_name;
  };

  const handleMatchClick = (match: TacticalMatch) => {
    if (match.status === 'waiting' || match.status === 'ready') {
      navigate(`/tactical/lobby/${match.id}`);
    } else if (match.status === 'playing') {
      navigate(`/tactical/battle/${match.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/tactical')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-6">Minhas Partidas</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="waiting">Aguardando</TabsTrigger>
            <TabsTrigger value="playing">Em Andamento</TabsTrigger>
            <TabsTrigger value="finished">Finalizadas</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredMatches.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Nenhuma partida encontrada.
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/tactical/create')}
                    className="mt-2"
                  >
                    Criar uma nova partida
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredMatches.map(match => (
                  <Card 
                    key={match.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleMatchClick(match)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-lg font-bold">
                              {match.join_code}
                            </span>
                            {getStatusBadge(match.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            vs {getOpponentName(match)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(match.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {match.max_power_points} VET
                          </Badge>
                          {match.status === 'playing' && (
                            <Button size="sm">
                              <Play className="h-4 w-4 mr-1" />
                              Continuar
                            </Button>
                          )}
                          {(match.status === 'waiting' || match.status === 'ready') && (
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Lobby
                            </Button>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => e.stopPropagation()}
                                disabled={deletingId === match.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir partida?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. A partida será permanentemente excluída.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMatch(match.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
