import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, Plus, Settings, Swords, Crown, Map, Hexagon, Route } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Sistema Tenebra Lux</h1>
          <p className="text-xl text-muted-foreground">
            Gerencie seus cards e exércitos para suas campanhas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Criador de Cards */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Plus className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl">Criador de Cards</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Crie e gerencie templates e cards de unidades militares
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Settings className="w-3 h-3" />
                  <span>Templates personalizáveis</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Importação via Excel</span>
                </div>
              </div>
              <Button 
                size="sm" 
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
              <CardTitle className="text-xl">Gestão de Exército</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Cadastre regentes e monte exércitos usando os cards
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>Cadastro de regentes</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Montagem de exércitos</span>
                </div>
              </div>
              <Button 
                size="sm" 
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
              <CardTitle className="text-xl">Cartas Táticas</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Crie cartas táticas com cálculo automático de custo
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Swords className="w-3 h-3" />
                  <span>Cálculo automático de custo</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Sistema cultural de bônus</span>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/tactical-cards')}
              >
                Acessar Cartas Táticas
              </Button>
            </CardContent>
          </Card>

          {/* Comandantes de Campo */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Crown className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl">Comandantes de Campo</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Crie e evolua comandantes para liderar suas tropas
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Crown className="w-3 h-3" />
                  <span>Sistema de evolução com PP</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Especializações táticas</span>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/commanders')}
              >
                Acessar Comandantes
              </Button>
            </CardContent>
          </Card>

          {/* Gestão de Domínios */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Map className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl">Gestão de Domínios</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Gerencie reinos e províncias do seu mundo
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Map className="w-3 h-3" />
                  <span>Reinos e províncias</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Desenvolvimento e magia</span>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/domains')}
              >
                Acessar Domínios
              </Button>
            </CardContent>
          </Card>

          {/* Mapa de Batalha */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Hexagon className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl">Mapa de Batalha</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Gerencie terrenos e imprima tiles hexagonais
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Hexagon className="w-3 h-3" />
                  <span>Tiles hexagonais</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Modificadores culturais</span>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/battle-map')}
              >
                Acessar Mapa de Batalha
              </Button>
            </CardContent>
          </Card>

          {/* Deslocamento */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Route className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl">Deslocamento</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Calcule tempo de viagem entre províncias
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Route className="w-3 h-3" />
                  <span>Matriz de distâncias</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>Indivíduos e exércitos</span>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/travel')}
              >
                Acessar Deslocamento
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Sistema de gerenciamento para campanhas de Tenebra Lux
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;