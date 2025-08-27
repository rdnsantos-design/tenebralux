import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Crown, Users, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Regent, Army } from "@/types/Army";
import { RegentEditor } from "@/components/RegentEditor";
import { RegentList } from "@/components/RegentList";
import { ArmyEditor } from "@/components/ArmyEditor";
import { ArmyList } from "@/components/ArmyList";

const ArmyManagement = () => {
  const navigate = useNavigate();
  const [regents, setRegents] = useState<Regent[]>([]);
  const [armies, setArmies] = useState<Army[]>([]);
  const [editingRegent, setEditingRegent] = useState<Regent | null>(null);
  const [editingArmy, setEditingArmy] = useState<Army | null>(null);
  const [showRegentEditor, setShowRegentEditor] = useState(false);
  const [showArmyEditor, setShowArmyEditor] = useState(false);
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
            <p className="text-xl text-muted-foreground">Gerencie regentes e seus exércitos</p>
          </div>
          <Button onClick={handleNewRegent} size="lg" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Regente
          </Button>
        </div>

        <Tabs defaultValue="regents" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="regents">Regentes</TabsTrigger>
            <TabsTrigger value="armies">Exércitos</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
};

export default ArmyManagement;