import { useState, useEffect } from "react";
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

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    console.log('Carregando dados do localStorage...');
    
    // Limpar backups antigos que podem estar causando problema de quota
    try {
      localStorage.removeItem('cardTemplates_backup');
    } catch (error) {
      console.log('Erro ao limpar backup (normal se não existir)');
    }
    
    const savedTemplates = localStorage.getItem('cardTemplates');
    const savedCards = localStorage.getItem('unitCards');
    
    console.log('Templates salvos:', savedTemplates);
    console.log('Cards salvos:', savedCards);
    
    if (savedTemplates) {
      try {
        const parsedTemplates = JSON.parse(savedTemplates);
        console.log('Templates parseados:', parsedTemplates);
        console.log('Definindo templates no estado:', parsedTemplates);
        setTemplates(parsedTemplates);
      } catch (error) {
        console.error('Erro ao carregar templates:', error);
      }
    } else {
      console.log('Nenhum template encontrado no localStorage');
    }
    
    if (savedCards) {
      try {
        const parsedCards = JSON.parse(savedCards);
        console.log('Cards parseados:', parsedCards);
        setCards(parsedCards);
      } catch (error) {
        console.error('Erro ao carregar cards:', error);
      }
    }
  }, []);

  // Salvar templates no localStorage sempre que mudarem
  useEffect(() => {
    if (templates.length > 0) {
      try {
        console.log('Salvando templates no localStorage:', templates);
        localStorage.setItem('cardTemplates', JSON.stringify(templates));
      } catch (error) {
        console.error('Erro ao salvar no localStorage (possivelmente por tamanho):', error);
        // Se der erro de quota, tentar limpar dados antigos
        try {
          localStorage.removeItem('cardTemplates_backup');
          localStorage.setItem('cardTemplates', JSON.stringify(templates));
        } catch (secondError) {
          console.error('Erro crítico de armazenamento:', secondError);
        }
      }
    }
  }, [templates]);

  // Salvar cards no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem('unitCards', JSON.stringify(cards));
  }, [cards]);

  const handleSaveCard = (card: UnitCard) => {
    if (editingCard) {
      setCards(cards.map(c => c.id === card.id ? card : c));
    } else {
      const nextNumber = cards.length + 1;
      const nextId = `#${nextNumber.toString().padStart(3, '0')}`;
      setCards([...cards, { ...card, id: nextId }]);
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
    console.log('Atualizando template:', template);
    setTemplates(templates.map(t => t.id === template.id ? template : t));
    setEditingTemplate(template);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    if (editingTemplate?.id === templateId) {
      setEditingTemplate(null);
    }
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Mapeando: {editingTemplate.name}</h1>
            <Button onClick={() => setEditingTemplate(null)}>
              Voltar aos Templates
            </Button>
          </div>
          <TemplateMapper 
            template={editingTemplate}
            onTemplateUpdate={handleTemplateUpdate}
            onFinish={() => setEditingTemplate(null)}
          />
        </div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <CardEditor
        card={editingCard}
        templates={templates}
        onSave={handleSaveCard}
        onCancel={() => setShowEditor(false)}
      />
    );
  }

  if (previewCard) {
    return (
      <CardPreview
        card={previewCard}
        template={templates[0]} // Usando o primeiro template disponível
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
            <p className="text-xl text-muted-foreground">Gerencie suas unidades militares e templates</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNewCard} size="lg" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Card
            </Button>
          </div>
        </div>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="mt-6">

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
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Templates de Cards</h2>
              <Button onClick={() => setShowTemplateCreator(true)}>
                <Image className="w-4 h-4 mr-2" />
                Novo Template
              </Button>
            </div>

            {templates.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-semibold mb-4">Nenhum template criado ainda</h3>
                  <p className="text-muted-foreground mb-6">
                    Crie um template fazendo upload da sua imagem do Canva
                  </p>
                  <Button onClick={() => setShowTemplateCreator(true)} size="lg">
                    <Image className="w-5 h-5 mr-2" />
                    Criar Primeiro Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {template.fields.length} campos mapeados • {template.width}x{template.height}px
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="mb-4">
                        <img
                          src={template.templateImage}
                          alt={template.name}
                          className="w-full h-32 object-contain border rounded"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                          className="flex-1"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Mapear
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="flex-1"
                        >
                          Excluir
                        </Button>
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
};

export default Index;
