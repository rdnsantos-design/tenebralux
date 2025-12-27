import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Map, Route, Crown, Hexagon, Layers } from "lucide-react";
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

        {/* Portais de Jogo */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Modos de Jogo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Jogo de Tabuleiro (Tático) */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-5 bg-primary/10 rounded-full w-24 h-24 flex items-center justify-center">
                  <Hexagon className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">🎲 Tabuleiro (Tático)</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Board game com unidades hexagonais, terrenos impressos e combate detalhado
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Unidades e terrenos hexagonais</p>
                  <p>• Cartas táticas de combate</p>
                  <p>• Comandantes de campo</p>
                </div>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate('/tactical-game')}
                >
                  Acessar Jogo Tático
                </Button>
              </CardContent>
            </Card>

            {/* Card Game (Estratégico) */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-5 bg-primary/10 rounded-full w-24 h-24 flex items-center justify-center">
                  <Layers className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">🃏 Card Game (Estratégico)</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Resolução rápida de batalhas em massa com cartas e terrenos abstratos
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Terrenos primários e secundários</p>
                  <p>• Condições climáticas</p>
                  <p>• Cartas estratégicas de combate</p>
                </div>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate('/strategic-game')}
                >
                  Acessar Card Game
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Módulos Compartilhados */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-center">Módulos Compartilhados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {/* Personagens e Regentes */}
            <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Personagens</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-muted-foreground text-sm">
                  Heróis, regentes e personagens com sistema de Poder
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/characters')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>

            {/* Gestão de Exército */}
            <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Exércitos</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-muted-foreground text-sm">
                  Monte exércitos usando os cards criados
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/army')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>

            {/* Gestão de Domínios */}
            <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                  <Map className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Domínios</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-muted-foreground text-sm">
                  Reinos, províncias e holdings
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/domains')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>

            {/* Deslocamento */}
            <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                  <Route className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Deslocamento</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-muted-foreground text-sm">
                  Cálculo de tempo de viagem
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/travel')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
          </div>
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
