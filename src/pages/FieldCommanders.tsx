import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Users, BookOpen, Loader2 } from 'lucide-react';
import { useFieldCommanders } from '@/hooks/useFieldCommanders';
import { CommanderList } from '@/components/CommanderList';
import { CommanderEditor } from '@/components/CommanderEditor';
import { CommanderEvolution } from '@/components/CommanderEvolution';
import { FieldCommander, EVOLUTION_COSTS } from '@/types/FieldCommander';
import { Regent } from '@/types/Army';

type ViewMode = 'list' | 'create' | 'edit' | 'evolve';

export default function FieldCommanders() {
  const navigate = useNavigate();
  const { commanders, loading, createCommander, updateCommander, deleteCommander, evolveCommander } = useFieldCommanders();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCommander, setSelectedCommander] = useState<FieldCommander | null>(null);
  const [regents, setRegents] = useState<Regent[]>([]);

  // Carregar regentes do localStorage
  useEffect(() => {
    const savedRegents = localStorage.getItem('armyRegents');
    if (savedRegents) {
      try {
        setRegents(JSON.parse(savedRegents));
      } catch (error) {
        console.error('Erro ao carregar regentes:', error);
      }
    }
  }, []);

  const handleNewCommander = () => {
    setSelectedCommander(null);
    setViewMode('create');
  };

  const handleEditCommander = (commander: FieldCommander) => {
    setSelectedCommander(commander);
    setViewMode('edit');
  };

  const handleEvolveCommander = (commander: FieldCommander) => {
    setSelectedCommander(commander);
    setViewMode('evolve');
  };

  const handleSaveCommander = async (data: Omit<FieldCommander, 'id' | 'created_at' | 'updated_at'>) => {
    if (viewMode === 'edit' && selectedCommander) {
      await updateCommander(selectedCommander.id, data);
    } else {
      await createCommander(data);
    }
    setViewMode('list');
    setSelectedCommander(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedCommander(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Comandantes de Campo</h1>
              <p className="text-muted-foreground">Crie e evolua comandantes para suas batalhas</p>
            </div>
          </div>
          {viewMode === 'list' && (
            <Button onClick={handleNewCommander}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Comandante
            </Button>
          )}
        </div>

        {/* Content */}
        {viewMode === 'create' || viewMode === 'edit' ? (
          <CommanderEditor
            commander={selectedCommander}
            regents={regents}
            onSave={handleSaveCommander}
            onCancel={handleCancel}
          />
        ) : viewMode === 'evolve' && selectedCommander ? (
          <CommanderEvolution
            commander={selectedCommander}
            onEvolve={evolveCommander}
            onBack={handleCancel}
          />
        ) : (
          <Tabs defaultValue="comandantes" className="space-y-4">
            <TabsList>
              <TabsTrigger value="comandantes" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Lista de Comandantes
              </TabsTrigger>
              <TabsTrigger value="regras" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Regras
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comandantes">
              {commanders.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nenhum Comandante Criado</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie seu primeiro comandante para liderar suas tropas em batalha.
                    </p>
                    <Button onClick={handleNewCommander}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Comandante
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <CommanderList
                  commanders={commanders}
                  onEdit={handleEditCommander}
                  onEvolve={handleEvolveCommander}
                  onDelete={deleteCommander}
                />
              )}
            </TabsContent>

            <TabsContent value="regras">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Atributos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Atributos do Comandante</CardTitle>
                    <CardDescription>Cada atributo influencia diferentes aspectos da batalha</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-semibold text-red-600">Comando</h4>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• Gera pontos de compra de cartas táticas</li>
                        <li>• Define número de unidades lideradas</li>
                        <li>• Determina área de influência no campo</li>
                      </ul>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-semibold text-blue-600">Estratégia</h4>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• Gera pontos de compra de cartas estratégicas</li>
                        <li>• Permite cartas de nível estratégico</li>
                        <li>• Influencia bonificadores de moral</li>
                      </ul>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-semibold text-green-600">Guarda</h4>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• Pontos de vida do comandante</li>
                        <li>• Resistência a ataques diretos</li>
                        <li>• Sobrevivência em batalha</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Evolução */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sistema de Evolução</CardTitle>
                    <CardDescription>Use Pontos de Prestígio (PP) para evoluir</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border rounded-lg text-center">
                        <p className="text-2xl font-bold">{EVOLUTION_COSTS.comando} PP</p>
                        <p className="text-sm text-muted-foreground">+1 Comando</p>
                      </div>
                      <div className="p-3 border rounded-lg text-center">
                        <p className="text-2xl font-bold">{EVOLUTION_COSTS.estrategia} PP</p>
                        <p className="text-sm text-muted-foreground">+1 Estratégia</p>
                      </div>
                      <div className="p-3 border rounded-lg text-center">
                        <p className="text-2xl font-bold">{EVOLUTION_COSTS.guarda} PP</p>
                        <p className="text-sm text-muted-foreground">+1 Guarda</p>
                      </div>
                      <div className="p-3 border rounded-lg text-center">
                        <p className="text-2xl font-bold">{EVOLUTION_COSTS.nova_especializacao} PP</p>
                        <p className="text-sm text-muted-foreground">Nova Especialização</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pontos de Prestígio são ganhos através de vitórias em batalha, 
                      objetivos cumpridos e ações heroicas.
                    </p>
                  </CardContent>
                </Card>

                {/* Especializações */}
                <Card>
                  <CardHeader>
                    <CardTitle>Especializações</CardTitle>
                    <CardDescription>Reduzem o custo de cartas táticas relacionadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 border rounded text-sm">Infantaria</div>
                      <div className="p-2 border rounded text-sm">Cavalaria</div>
                      <div className="p-2 border rounded text-sm">Arqueiro</div>
                      <div className="p-2 border rounded text-sm">Cerco</div>
                      <div className="p-2 border rounded text-sm">Milícia</div>
                      <div className="p-2 border rounded text-sm">Elite</div>
                      <div className="p-2 border rounded text-sm">Naval</div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Cada especialização reduz em 1 o custo de cartas táticas 
                      que afetam o tipo de unidade correspondente.
                    </p>
                  </CardContent>
                </Card>

                {/* Cálculos Derivados */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cálculos Derivados</CardTitle>
                    <CardDescription>Valores calculados automaticamente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Pontos Compra Tática:</span>
                      <span className="font-mono">= Comando</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pontos Compra Estratégica:</span>
                      <span className="font-mono">= Estratégia</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Unidades Lideradas:</span>
                      <span className="font-mono">= Comando</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Área de Influência:</span>
                      <span className="font-mono">= Comando ÷ 2 + 1 (ímpar)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Desconto em Cartas:</span>
                      <span className="font-mono">= Por especialização</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
