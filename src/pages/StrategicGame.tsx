import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Cloud, Mountain, Swords, ArrowLeft, Users, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StrategicArmyList } from "@/components/masscombat/StrategicArmyList";
import { MassCombatCommanderTemplateList } from "@/components/masscombat/MassCombatCommanderTemplateList";

const StrategicGame = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("armies");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Layers className="w-10 h-10 text-primary" />
              Card Game (Estratégico)
            </h1>
            <p className="text-xl text-muted-foreground">
              Resolução rápida de batalhas em massa com cartas
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="armies" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Exércitos
            </TabsTrigger>
            <TabsTrigger value="commanders" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Comandantes
            </TabsTrigger>
            <TabsTrigger value="terrains" className="flex items-center gap-2">
              <Mountain className="w-4 h-4" />
              Terrenos
            </TabsTrigger>
            <TabsTrigger value="climates" className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Climas
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <Swords className="w-4 h-4" />
              Cartas
            </TabsTrigger>
          </TabsList>

          {/* Aba de Exércitos */}
          <TabsContent value="armies">
            <StrategicArmyList />
          </TabsContent>

          {/* Aba de Comandantes */}
          <TabsContent value="commanders">
            <MassCombatCommanderTemplateList />
          </TabsContent>

          {/* Aba de Terrenos */}
          <TabsContent value="terrains">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                    <Mountain className="w-10 h-10 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Terrenos de Batalha</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Terrenos primários e secundários para combate em massa
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Mountain className="w-3 h-3" />
                      <span>Modificadores de ataque e defesa</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Layers className="w-3 h-3" />
                      <span>Compatibilidade terreno/clima</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/mass-combat')}
                  >
                    Acessar Terrenos
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba de Climas */}
          <TabsContent value="climates">
            <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                  <Cloud className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-xl">Condições Climáticas</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground text-sm">
                  Climas que afetam o combate em 3 níveis de intensidade
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Cloud className="w-3 h-3" />
                    <span>Penalidades por nível</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Layers className="w-3 h-3" />
                    <span>Compatibilidade sazonal</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/mass-combat')}
                >
                  Acessar Climas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Cartas */}
          <TabsContent value="cards">
            <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                  <Swords className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-xl">Cartas de Combate Estratégico</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground text-sm">
                  Cartas usadas na resolução rápida de combate em massa
                </p>
                <div className="flex justify-center gap-8">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Swords className="w-3 h-3" />
                      <span>Custo em Veterancia</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Layers className="w-3 h-3" />
                      <span>Requisitos de Comando/Estratégia</span>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full max-w-md mx-auto"
                  onClick={() => navigate('/mass-combat-cards')}
                >
                  Acessar Cartas Estratégicas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Sistema de resolução rápida de batalhas com cartas e dados
          </p>
        </div>
      </div>
    </div>
  );
};

export default StrategicGame;
