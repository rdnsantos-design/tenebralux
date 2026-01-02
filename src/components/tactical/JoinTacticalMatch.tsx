import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Search, Users, Shield } from 'lucide-react';
import { TacticalArmySelector } from './TacticalArmySelector';
import { useTacticalMatch, TacticalMatch } from '@/hooks/useTacticalMatch';
import { usePlayerId } from '@/hooks/usePlayerId';

export function JoinTacticalMatch() {
  const navigate = useNavigate();
  const { playerId, playerName, setPlayerName } = usePlayerId();
  const { findMatchByCode, joinMatch, setArmy, loading } = useTacticalMatch();

  const [joinCode, setJoinCode] = useState('');
  const [name, setName] = useState(playerName);
  const [selectedArmyId, setSelectedArmyId] = useState<string>('');
  const [foundMatch, setFoundMatch] = useState<TacticalMatch | null>(null);
  const [searching, setSearching] = useState(false);

  const handleCodeChange = (value: string) => {
    // Uppercase and limit to 6 chars
    setJoinCode(value.toUpperCase().slice(0, 6));
    setFoundMatch(null);
  };

  const handleSearch = async () => {
    if (joinCode.length !== 6) return;

    setSearching(true);
    const match = await findMatchByCode(joinCode);
    setFoundMatch(match);
    setSearching(false);
  };

  const canJoin = foundMatch && name.trim() && selectedArmyId;

  const handleJoin = async () => {
    if (!canJoin || !foundMatch) return;

    setPlayerName(name.trim());
    
    const match = await joinMatch(joinCode, name.trim(), playerId);
    if (match) {
      if (selectedArmyId) {
        await setArmy(match.id, playerId, selectedArmyId);
      }
      navigate(`/tactical/lobby/${match.id}`);
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

        <h1 className="text-3xl font-bold mb-6">Entrar em Partida</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Coluna Esquerda - Código e Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Código da Partida</CardTitle>
                <CardDescription>
                  Digite o código de 6 caracteres
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="XXXXXX"
                    value={joinCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="font-mono text-2xl text-center tracking-widest uppercase"
                    maxLength={6}
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={joinCode.length !== 6 || searching}
                  >
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview da Partida */}
            {foundMatch && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Partida Encontrada!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criador:</span>
                    <span className="font-medium">{foundMatch.player1_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Limite de Poder:</span>
                    <Badge variant="secondary">
                      {foundMatch.max_power_points} VET
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline">
                      {foundMatch.status === 'waiting' ? 'Aguardando' : foundMatch.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {joinCode.length === 6 && !foundMatch && !searching && (
              <Card className="border-destructive">
                <CardContent className="py-6 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
                  <p className="text-muted-foreground">
                    Partida não encontrada ou não disponível.
                  </p>
                </CardContent>
              </Card>
            )}

            {foundMatch && (
              <Card>
                <CardHeader>
                  <CardTitle>Seu Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Jogador</Label>
                    <Input
                      id="name"
                      placeholder="Digite seu nome..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna Direita - Seleção de Exército */}
          {foundMatch && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Seu Exército</CardTitle>
                  <CardDescription>
                    Escolha o exército para a batalha
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TacticalArmySelector
                    selectedArmyId={selectedArmyId}
                    onSelect={setSelectedArmyId}
                    maxPower={foundMatch.max_power_points}
                  />
                </CardContent>
              </Card>

              <Button
                size="lg"
                className="w-full"
                onClick={handleJoin}
                disabled={!canJoin || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar na Partida
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
