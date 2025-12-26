import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2, ArrowLeft, Swords, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTacticalCards } from '@/hooks/useTacticalCards';
import { TacticalCardEditor } from '@/components/TacticalCardEditor';
import { TacticalCardList } from '@/components/TacticalCardList';
import { TacticalCard } from '@/types/TacticalCard';
import { MassCombatTacticalCardList } from '@/components/masscombat/MassCombatTacticalCardList';

export default function TacticalCards() {
  const { cards, loading, createCard, updateCard, deleteCard } = useTacticalCards();
  const [isEditing, setIsEditing] = useState(false);
  const [editingCard, setEditingCard] = useState<TacticalCard | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('manobra');

  const handleNewCard = () => {
    setEditingCard(undefined);
    setIsEditing(true);
  };

  const handleEditCard = (card: TacticalCard) => {
    setEditingCard(card);
    setIsEditing(true);
  };

  const handleSaveCard = async (cardData: Omit<TacticalCard, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingCard) {
        await updateCard(editingCard.id, cardData);
      } else {
        await createCard(cardData);
      }
      setIsEditing(false);
      setEditingCard(undefined);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingCard(undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Cartas de Combate</h1>
              <p className="text-muted-foreground">
                Sistema de criação de cartas para Tenebra Lux
              </p>
            </div>
          </div>
          {!isEditing && activeTab === 'manobra' && (
            <Button onClick={handleNewCard}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Carta
            </Button>
          )}
        </div>

        {/* Main Tabs: Manobra vs Táticas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="manobra" className="flex items-center gap-2">
              <Swords className="h-4 w-4" />
              Cartas de Manobra
            </TabsTrigger>
            <TabsTrigger value="taticas" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Cartas Táticas
            </TabsTrigger>
          </TabsList>

          {/* Cartas de Manobra (Tabuleiro) */}
          <TabsContent value="manobra">
            {isEditing ? (
              <Card>
                <CardHeader>
                  <CardTitle>{editingCard ? 'Editar Carta' : 'Nova Carta de Manobra'}</CardTitle>
                  <CardDescription>
                    Cartas para o jogo de tabuleiro. O custo é calculado automaticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TacticalCardEditor
                    card={editingCard}
                    onSave={handleSaveCard}
                    onCancel={handleCancel}
                  />
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="list" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="list">Lista de Cartas</TabsTrigger>
                  <TabsTrigger value="info">Regras de Custo</TabsTrigger>
                </TabsList>

                <TabsContent value="list">
                  <TacticalCardList
                    cards={cards}
                    onEdit={handleEditCard}
                    onDelete={deleteCard}
                  />
                </TabsContent>

                <TabsContent value="info">
                  <Card>
                    <CardHeader>
                      <CardTitle>Fórmula de Cálculo de Custo</CardTitle>
                      <CardDescription>
                        O custo base de cada carta é calculado automaticamente.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-green-600 mb-2">Aumentam o Custo (+)</h4>
                          <ul className="space-y-1 text-sm">
                            <li>• +1 por cada bônus em atributo</li>
                            <li>• +1 se causa dano extra de pressão</li>
                            <li>• +2 se causa dano letal extra</li>
                            <li>• +2 se ignora pressão</li>
                            <li>• +1 se afeta unidade fora do comandante</li>
                            <li>• +1 se afeta unidade inimiga</li>
                            <li>• +1 por cada cultura com penalidade</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-600 mb-2">Reduzem o Custo (-)</h4>
                          <ul className="space-y-1 text-sm">
                            <li>• -1 se exigir especialização</li>
                            <li>• -0.5 por ponto de comando exigido</li>
                            <li>• -1 por cada cultura com bônus</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>

          {/* Cartas Táticas (Combate em Massa) */}
          <TabsContent value="taticas">
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Cartas Táticas — Combate em Massa</CardTitle>
                <CardDescription>
                  Cartas para o sistema de resolução rápida. Custo em VET = soma dos bônus.
                  Comando e Estratégia mínimos = maior bônus da carta.
                </CardDescription>
              </CardHeader>
            </Card>
            <MassCombatTacticalCardList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
