import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mountain, Cloud } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MassCombatTerrainList } from '@/components/masscombat/MassCombatTerrainList';
import { ClimateViewer } from '@/components/masscombat/ClimateViewer';

export default function MassCombat() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/battlemap">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Combate em Massa</h1>
              <p className="text-sm text-muted-foreground">
                Gerador de terrenos e climas para resolução rápida de batalhas
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="terrains" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
            <TabsTrigger value="terrains" className="flex items-center gap-2">
              <Mountain className="h-4 w-4" />
              Terrenos
            </TabsTrigger>
            <TabsTrigger value="climates" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Climas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terrains">
            <MassCombatTerrainList />
          </TabsContent>

          <TabsContent value="climates">
            <ClimateViewer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
