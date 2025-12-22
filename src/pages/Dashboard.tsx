import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, Plus, Settings, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Sistema Birthright</h1>
          <p className="text-xl text-muted-foreground">
            Gerencie seus cards e exércitos para suas campanhas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Criador de Cards */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Plus className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Criador de Cards</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Crie e gerencie templates e cards de unidades militares para suas campanhas
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Settings className="w-4 h-4" />
                  <span>Templates personalizáveis</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Importação via Excel</span>
                </div>
              </div>
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => navigate('/cards')}
              >
                Acessar Criador
              </Button>
            </CardContent>
          </Card>

          {/* Gestão de Exército */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Gestão de Exército</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Cadastre regentes e monte exércitos usando os cards criados
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Cadastro de regentes</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Montagem de exércitos</span>
                </div>
              </div>
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => navigate('/army')}
              >
                Acessar Gestão
              </Button>
            </CardContent>
          </Card>

          {/* Cartas Táticas */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Swords className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Cartas Táticas</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Crie e balanceie cartas táticas para batalhas com cálculo automático de custo
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Swords className="w-4 h-4" />
                  <span>Cálculo automático de custo</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Sistema cultural de bônus</span>
                </div>
              </div>
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => navigate('/tactical-cards')}
              >
                Acessar Cartas Táticas
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Sistema de gerenciamento para campanhas de Birthright
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;