import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Swords, Crown, Settings2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MassCombatTacticalCardList } from '@/components/masscombat/MassCombatTacticalCardList';
import { MassCombatCommanderTemplateList } from '@/components/masscombat/MassCombatCommanderTemplateList';
import { CardAnalysisTable } from '@/components/masscombat/CardAnalysisTable';

export default function MassCombatCards() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/strategic-game">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Cartas de Combate Estratégico</h1>
              <p className="text-sm text-muted-foreground">
                Cartas e comandantes para resolução de combate em massa
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="cards" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <Swords className="h-4 w-4" />
              Cartas Táticas
            </TabsTrigger>
            <TabsTrigger value="commanders" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Comandantes (VET)
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Análise
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards">
            <MassCombatTacticalCardList />
          </TabsContent>

          <TabsContent value="commanders">
            <MassCombatCommanderTemplateList />
          </TabsContent>

          <TabsContent value="analysis">
            <CardAnalysisTable />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
