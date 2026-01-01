import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Cloud, Mountain, Swords, ArrowLeft, Users, Crown, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StrategicArmyList } from "@/components/masscombat/StrategicArmyList";
import { MassCombatCommanderTemplateList } from "@/components/masscombat/MassCombatCommanderTemplateList";
import { MassCombatTerrainList } from "@/components/masscombat/MassCombatTerrainList";
import { ClimateViewer } from "@/components/masscombat/ClimateViewer";
import { MassCombatCultureList } from "@/components/masscombat/MassCombatCultureList";
import { CardAnalysisTable } from "@/components/masscombat/CardAnalysisTable";

const StrategicGame = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("armies");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="armies" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Exércitos</span>
            </TabsTrigger>
            <TabsTrigger value="commanders" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Comandantes</span>
            </TabsTrigger>
            <TabsTrigger value="terrains" className="flex items-center gap-2">
              <Mountain className="w-4 h-4" />
              <span className="hidden sm:inline">Terrenos</span>
            </TabsTrigger>
            <TabsTrigger value="climates" className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              <span className="hidden sm:inline">Climas</span>
            </TabsTrigger>
            <TabsTrigger value="cultures" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Culturas</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <Swords className="w-4 h-4" />
              <span className="hidden sm:inline">Cartas</span>
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

          {/* Aba de Terrenos - Abre diretamente o componente */}
          <TabsContent value="terrains">
            <MassCombatTerrainList />
          </TabsContent>

          {/* Aba de Climas - Abre diretamente o componente */}
          <TabsContent value="climates">
            <ClimateViewer />
          </TabsContent>

          {/* Aba de Culturas - Nova aba */}
          <TabsContent value="cultures">
            <MassCombatCultureList />
          </TabsContent>

          {/* Aba de Cartas - Tabela de análise com edição e criação */}
          <TabsContent value="cards">
            <CardAnalysisTable />
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
