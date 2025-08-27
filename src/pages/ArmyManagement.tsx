import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Crown, Users, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Regent } from "@/types/Army";
import { RegentEditor } from "@/components/RegentEditor";
import { RegentList } from "@/components/RegentList";

const ArmyManagement = () => {
  const navigate = useNavigate();
  const [regents, setRegents] = useState<Regent[]>([]);
  const [editingRegent, setEditingRegent] = useState<Regent | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Carregar regentes do localStorage
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
    setInitialLoaded(true);
  }, []);

  // Salvar regentes no localStorage
  useEffect(() => {
    if (!initialLoaded) return;
    localStorage.setItem('armyRegents', JSON.stringify(regents));
  }, [regents, initialLoaded]);

  const handleSaveRegent = (regent: Regent) => {
    if (editingRegent) {
      setRegents(regents.map(r => r.id === regent.id ? regent : r));
    } else {
      setRegents([...regents, regent]);
    }
    setEditingRegent(null);
    setShowEditor(false);
  };

  const handleEditRegent = (regent: Regent) => {
    setEditingRegent(regent);
    setShowEditor(true);
  };

  const handleDeleteRegent = (regentId: string) => {
    setRegents(regents.filter(r => r.id !== regentId));
  };

  const handleNewRegent = () => {
    setEditingRegent(null);
    setShowEditor(true);
  };

  if (showEditor) {
    return (
      <RegentEditor
        regent={editingRegent}
        onSave={handleSaveRegent}
        onCancel={() => {
          setEditingRegent(null);
          setShowEditor(false);
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
            <TabsTrigger value="armies" disabled>Exércitos (Em breve)</TabsTrigger>
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
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-2xl font-semibold mb-4">Gestão de Exércitos</h3>
                <p className="text-muted-foreground">
                  Esta funcionalidade estará disponível na próxima fase
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArmyManagement;