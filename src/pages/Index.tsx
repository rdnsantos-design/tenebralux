import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Download, Eye } from "lucide-react";
import { CardEditor } from "@/components/CardEditor";
import { CardPreview } from "@/components/CardPreview";
import { UnitCard } from "@/types/UnitCard";

const Index = () => {
  const [cards, setCards] = useState<UnitCard[]>([]);
  const [editingCard, setEditingCard] = useState<UnitCard | null>(null);
  const [previewCard, setPreviewCard] = useState<UnitCard | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleSaveCard = (card: UnitCard) => {
    if (editingCard) {
      setCards(cards.map(c => c.id === card.id ? card : c));
    } else {
      setCards([...cards, { ...card, id: Date.now().toString() }]);
    }
    setEditingCard(null);
    setShowEditor(false);
  };

  const handleEditCard = (card: UnitCard) => {
    setEditingCard(card);
    setShowEditor(true);
  };

  const handleNewCard = () => {
    setEditingCard(null);
    setShowEditor(true);
  };

  if (showEditor) {
    return (
      <CardEditor
        card={editingCard}
        onSave={handleSaveCard}
        onCancel={() => setShowEditor(false)}
      />
    );
  }

  if (previewCard) {
    return (
      <CardPreview
        card={previewCard}
        onClose={() => setPreviewCard(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Sistema de Cards Birthright</h1>
            <p className="text-xl text-muted-foreground">Gerencie suas unidades militares</p>
          </div>
          <Button onClick={handleNewCard} size="lg" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Card
          </Button>
        </div>

        {cards.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-semibold mb-4">Nenhum card criado ainda</h3>
              <p className="text-muted-foreground mb-6">
                Comece criando seu primeiro card de unidade militar
              </p>
              <Button onClick={handleNewCard} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards.map((card) => (
              <Card key={card.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg truncate">{card.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {card.experience} • Força Total: {card.totalForce}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-5 gap-2 text-xs mb-4">
                    <div className="text-center">
                      <div className="font-semibold">AT</div>
                      <div>{card.attack}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">DEF</div>
                      <div>{card.defense}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">TIR</div>
                      <div>{card.ranged}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">MOV</div>
                      <div>{card.movement}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">MOR</div>
                      <div>{card.morale}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewCard(card)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCard(card)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
