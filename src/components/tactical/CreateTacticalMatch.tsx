import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TacticalArmySelector } from './TacticalArmySelector';
import { TacticalTerrainSelector, TerrainSelection } from './TacticalTerrainSelector';
import { useTacticalMatch } from '@/hooks/useTacticalMatch';
import { usePlayerId } from '@/hooks/usePlayerId';

export function CreateTacticalMatch() {
  const navigate = useNavigate();
  const { playerId, playerName, setPlayerName } = usePlayerId();
  const { createMatch, setArmy, loading } = useTacticalMatch();

  const [name, setName] = useState(playerName);
  const [selectedArmyId, setSelectedArmyId] = useState<string>('');
  const [maxPower, setMaxPower] = useState(200);
  const [terrain, setTerrain] = useState<TerrainSelection>({
    primaryId: null,
    secondaryIds: [],
    seasonId: null,
  });

  const canCreate = name.trim() && selectedArmyId;

  const handleCreate = async () => {
    if (!canCreate) return;

    setPlayerName(name.trim());
    
    const match = await createMatch(name.trim(), playerId);
    if (match) {
      // Set the army for the match
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

        <h1 className="text-3xl font-bold mb-6">Criar Partida</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Coluna Esquerda - Configurações Básicas */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seu Perfil</CardTitle>
                <CardDescription>Como você será identificado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

            <Card>
              <CardHeader>
                <CardTitle>Limite de Poder</CardTitle>
                <CardDescription>
                  VET máximo por exército: {maxPower}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Slider
                  value={[maxPower]}
                  onValueChange={([value]) => setMaxPower(value)}
                  min={100}
                  max={500}
                  step={25}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>100</span>
                  <span>300</span>
                  <span>500</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Terreno de Batalha</CardTitle>
                <CardDescription>
                  Configure o campo de batalha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TacticalTerrainSelector
                  value={terrain}
                  onChange={setTerrain}
                />
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Seleção de Exército */}
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
                  maxPower={maxPower}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botão de Criar */}
        <div className="mt-6 flex justify-end">
          <Button
            size="lg"
            onClick={handleCreate}
            disabled={!canCreate || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Partida
          </Button>
        </div>
      </div>
    </div>
  );
}
