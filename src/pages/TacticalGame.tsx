import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hexagon, Users, Mountain, Swords, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TacticalGame = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Hexagon className="w-10 h-10 text-primary" />
              Jogo de Tabuleiro (Tático)
            </h1>
            <p className="text-xl text-muted-foreground">
              Board game com unidades hexagonais e terrenos impressos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Criador de Unidades Hexagonais */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Hexagon className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl">Unidades Hexagonais</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Crie unidades militares em formato hexagonal para impressão
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Hexagon className="w-3 h-3" />
                  <span>Templates hexagonais personalizáveis</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>Importação via Excel</span>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/cards')}
              >
                Acessar Unidades
              </Button>
            </CardContent>
          </Card>

          {/* Terrenos para Tabuleiro */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Mountain className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl">Terrenos de Tabuleiro</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Tiles hexagonais de terreno para compor o mapa de batalha
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Mountain className="w-3 h-3" />
                  <span>Modificadores por cultura</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Hexagon className="w-3 h-3" />
                  <span>Impressão em folha A4</span>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/battle-map')}
              >
                Acessar Terrenos
              </Button>
            </CardContent>
          </Card>

          {/* Cartas Táticas de Combate */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Swords className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl">Cartas de Combate Tático</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Cartas usadas durante o combate no tabuleiro
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Swords className="w-3 h-3" />
                  <span>Bônus de ataque, defesa e moral</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>Sistema cultural de modificadores</span>
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
                <Users className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl">Comandantes de Campo</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Líderes que comandam unidades no tabuleiro
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>Comando, Estratégia e Guarda</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Swords className="w-3 h-3" />
                  <span>Especializações de unidade</span>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/field-commanders')}
              >
                Acessar Comandantes
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Sistema de batalha em tabuleiro hexagonal com miniaturas e terrenos
          </p>
        </div>
      </div>
    </div>
  );
};

export default TacticalGame;
