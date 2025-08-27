import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Crown, Users, Home, FileSpreadsheet, Settings, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Regent, Army } from "@/types/Army";
import { UnitCard } from "@/types/UnitCard";
import { RegentEditor } from "@/components/RegentEditor";
import { RegentList } from "@/components/RegentList";
import { ArmyEditor } from "@/components/ArmyEditor";
import { ArmyList } from "@/components/ArmyList";
import { ExcelImportManager } from "@/components/ExcelImportManager";
import { TemplateCreator } from "@/components/TemplateCreator";

const ArmyManagement = () => {
  const navigate = useNavigate();
  const [regents, setRegents] = useState<Regent[]>([]);
  const [armies, setArmies] = useState<Army[]>([]);
  const [editingRegent, setEditingRegent] = useState<Regent | null>(null);
  const [editingArmy, setEditingArmy] = useState<Army | null>(null);
  const [showRegentEditor, setShowRegentEditor] = useState(false);
  const [showArmyEditor, setShowArmyEditor] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Carregar dados do localStorage
  useEffect(() => {
    const savedRegents = localStorage.getItem('armyRegents');
    if (savedRegents) {
      try {
        const loadedRegents = JSON.parse(savedRegents);
        setRegents(loadedRegents);
      } catch (error) {
        console.error('Erro ao carregar regentes:', error);
      }
    }

    const savedArmies = localStorage.getItem('armyArmies');
    if (savedArmies) {
      try {
        const loadedArmies = JSON.parse(savedArmies);
        setArmies(loadedArmies);
      } catch (error) {
        console.error('Erro ao carregar exércitos:', error);
      }
    }

    setInitialLoaded(true);
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    if (!initialLoaded) return;
    localStorage.setItem('armyRegents', JSON.stringify(regents));
  }, [regents, initialLoaded]);

  useEffect(() => {
    if (!initialLoaded) return;
    localStorage.setItem('armyArmies', JSON.stringify(armies));
  }, [armies, initialLoaded]);

  const handleSaveRegent = (regent: Regent) => {
    if (editingRegent) {
      setRegents(regents.map(r => r.id === regent.id ? regent : r));
    } else {
      setRegents([...regents, regent]);
    }
    setEditingRegent(null);
    setShowRegentEditor(false);
  };

  const handleEditRegent = (regent: Regent) => {
    setEditingRegent(regent);
    setShowRegentEditor(true);
  };

  const handleDeleteRegent = (regentId: string) => {
    // Também remover exércitos deste regente
    setArmies(armies.filter(a => a.regentId !== regentId));
    setRegents(regents.filter(r => r.id !== regentId));
  };

  const handleNewRegent = () => {
    setEditingRegent(null);
    setShowRegentEditor(true);
  };

  const handleSaveArmy = (army: Army) => {
    if (editingArmy) {
      setArmies(armies.map(a => a.id === army.id ? army : a));
    } else {
      setArmies([...armies, army]);
    }
    setEditingArmy(null);
    setShowArmyEditor(false);
  };

  const handleEditArmy = (army: Army) => {
    setEditingArmy(army);
    setShowArmyEditor(true);
  };

  const handleDeleteArmy = (armyId: string) => {
    setArmies(armies.filter(a => a.id !== armyId));
  };

  const handleNewArmy = () => {
    setEditingArmy(null);
    setShowArmyEditor(true);
  };

  const handleExcelImportComplete = (cards: UnitCard[]) => {
    // Salvar as cartas criadas no localStorage
    const existingCards = JSON.parse(localStorage.getItem('unitCards') || '[]');
    const updatedCards = [...existingCards, ...cards];
    localStorage.setItem('unitCards', JSON.stringify(updatedCards));
    
    setShowExcelImport(false);
    alert(`${cards.length} cartas criadas com sucesso a partir da importação Excel!`);
  };

  const handleTemplateCreated = () => {
    setShowTemplateCreator(false);
    alert('Template criado com sucesso!');
  };

  if (showExcelImport) {
    return (
      <ExcelImportManager
        onCancel={() => setShowExcelImport(false)}
        onCreateCards={handleExcelImportComplete}
      />
    );
  }

  if (showTemplateCreator) {
    return (
      <TemplateCreator
        onCancel={() => setShowTemplateCreator(false)}
        onTemplateCreated={handleTemplateCreated}
      />
    );
  }

  if (showRegentEditor) {
    return (
      <RegentEditor
        regent={editingRegent}
        onSave={handleSaveRegent}
        onCancel={() => {
          setEditingRegent(null);
          setShowRegentEditor(false);
        }}
      />
    );
  }

  if (showArmyEditor) {
    return (
      <ArmyEditor
        army={editingArmy}
        regents={regents}
        onSave={handleSaveArmy}
        onCancel={() => {
          setEditingArmy(null);
          setShowArmyEditor(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Voltar ao Dashboard
              </Button>
            </div>
            <h1 className="text-4xl font-bold mb-2">Gestão de Exército</h1>
            <p className="text-xl text-muted-foreground">Gerencie regentes, exércitos e importe dados via Excel</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowExcelImport(true)}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Importar Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowTemplateCreator(true)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Templates
            </Button>
            <Button onClick={handleNewRegent} size="lg" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Regente
            </Button>
          </div>
        </div>

        <Tabs defaultValue="regents" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="regents" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Regentes
            </TabsTrigger>
            <TabsTrigger value="armies" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Exércitos
            </TabsTrigger>
            <TabsTrigger value="imports" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Importações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="regents" className="mt-6">
            {regents.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <Crown className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-semibold mb-4">Nenhum regente cadastrado</h3>
                  <p className="text-muted-foreground mb-6">
                    Comece cadastrando seu primeiro regente para gerenciar exércitos
                  </p>
                  <Button onClick={handleNewRegent} size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Cadastrar Primeiro Regente
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <RegentList
                regents={regents}
                onEdit={handleEditRegent}
                onDelete={handleDeleteRegent}
              />
            )}
          </TabsContent>

          <TabsContent value="armies" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Exércitos</h2>
              <Button 
                onClick={handleNewArmy}
                disabled={regents.length === 0}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Exército
              </Button>
            </div>

            {regents.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <Crown className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-semibold mb-4">Cadastre regentes primeiro</h3>
                  <p className="text-muted-foreground mb-6">
                    Você precisa cadastrar pelo menos um regente antes de criar exércitos
                  </p>
                  <Button onClick={handleNewRegent} size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Cadastrar Regente
                  </Button>
                </CardContent>
              </Card>
            ) : armies.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-semibold mb-4">Nenhum exército criado ainda</h3>
                  <p className="text-muted-foreground mb-6">
                    Monte seu primeiro exército selecionando unidades dos cards criados
                  </p>
                  <Button onClick={handleNewArmy} size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Criar Primeiro Exército
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ArmyList
                armies={armies}
                regents={regents}
                onEdit={handleEditArmy}
                onDelete={handleDeleteArmy}
              />
            )}
          </TabsContent>

          <TabsContent value="imports" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Importações e Templates</h2>
                <p className="text-muted-foreground">
                  Importe dados do Excel e gerencie templates de cartas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowExcelImport(true)}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Importar Excel</h3>
                      <p className="text-sm text-muted-foreground">
                        Importe múltiplas unidades de planilhas Excel
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowTemplateCreator(true)}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Settings className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Gerenciar Templates</h3>
                      <p className="text-sm text-muted-foreground">
                        Crie e edite templates para cartas de unidades
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Como Usar a Fase 3</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      1. Importação Excel
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Prepare uma planilha Excel com colunas: Nome, Ataque, Defesa, Tiro, Movimento, Moral. 
                      Use a ferramenta de importação para criar múltiplas cartas de unidades automaticamente.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Settings className="w-4 h-4 text-blue-600" />
                      2. Templates de Cartas
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Crie templates personalizados para suas cartas de unidades. 
                      Defina onde cada informação aparece no layout da carta.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArmyManagement;