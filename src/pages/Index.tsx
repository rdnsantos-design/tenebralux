import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Download, Eye, Settings, Image } from "lucide-react";
import { CardEditor } from "@/components/CardEditor";
import { CardPreview } from "@/components/CardPreview";
import { TemplateCreator } from "@/components/TemplateCreator";
import { TemplateMapper } from "@/components/TemplateMapper";
import { UnitCard } from "@/types/UnitCard";
import { CardTemplate } from "@/types/CardTemplate";

const Index = () => {
  const [cards, setCards] = useState<UnitCard[]>([]);
  const [editingCard, setEditingCard] = useState<UnitCard | null>(null);
  const [previewCard, setPreviewCard] = useState<UnitCard | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null);

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

  const handleTemplateCreated = (template: CardTemplate) => {
    setTemplates([...templates, template]);
    setEditingTemplate(template);
    setShowTemplateCreator(false);
  };

  const handleTemplateUpdate = (template: CardTemplate) => {
    setTemplates(templates.map(t => t.id === template.id ? template : t));
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  if (showTemplateCreator) {
    return (
      <TemplateCreator
        onTemplateCreated={handleTemplateCreated}
        onCancel={() => setShowTemplateCreator(false)}
      />
    );
  }

  if (editingTemplate) {
    return (
      <TemplateMapper
        template={editingTemplate}
        onTemplateUpdate={handleTemplateUpdate}
        onFinish={() => setEditingTemplate(null)}
      />
    );
  }

  if (showEditor) {
    return (
      <CardEditor
        card={editingCard}
        templates={templates}
        onSave={handleSaveCard}
        onCancel={() => {
          setEditingCard(null);
          setShowEditor(false);
        }}
      />
    );
  }

  if (previewCard) {
    const cardTemplate = templates.find(t => t.id === 'default');
    return (
      <CardPreview
        card={previewCard}
        template={cardTemplate}
        onClose={() => setPreviewCard(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" style={{ width: '100%', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Birthright Forge</h1>
          <Button onClick={handleNewCard}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Card
          </Button>
        </header>

        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-6">
            {cards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Você ainda não criou nenhum card.
                </p>
                <Button onClick={handleNewCard}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Card
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <Card key={card.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{card.name}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewCard(card)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCard(card)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Experiência:</strong> {card.experience}
                        </div>
                        <div>
                          <strong>Força Total:</strong> {card.totalForce}
                        </div>
                        <div>
                          <strong>Custo:</strong> {card.maintenanceCost}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Você ainda não criou nenhum template.
                </p>
                <Button onClick={() => setShowTemplateCreator(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Template
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button onClick={() => setShowTemplateCreator(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Template
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <Card key={template.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{template.name}</span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingTemplate(template)}
                            >
                              <Settings className="w-4 h-4" />
                              Mapear
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div>
                            <strong>Campos mapeados:</strong> {template.fields.length}
                          </div>
                          <div>
                            <strong>Dimensões:</strong> {template.width}x{template.height}px
                          </div>
                        </div>
                        {template.templateImage && (
                          <div className="mt-4">
                            <img
                              src={template.templateImage}
                              alt="Template preview"
                              className="w-full h-32 object-cover rounded border"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;