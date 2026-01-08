import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Swords, BookOpen, Users, BarChart3, ListChecks, AlertTriangle } from 'lucide-react';
import { PrivilegeManager } from '@/components/rpg/PrivilegeManager';
import { FactionManager } from '@/components/rpg/FactionManager';
import { AttributeManager } from '@/components/rpg/AttributeManager';
import { SkillManager } from '@/components/rpg/SkillManager';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export default function RPGRules() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                Regras RPG
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerenciamento de dados do sistema
              </p>
            </div>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="attributes" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="attributes" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Atributos</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              <span className="hidden sm:inline">Perícias</span>
            </TabsTrigger>
            <TabsTrigger value="privileges" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Legados</span>
            </TabsTrigger>
            <TabsTrigger value="factions" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Facções</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Swords className="w-4 h-4" />
              <span className="hidden sm:inline">Equip.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attributes">
            <AttributeManager />
          </TabsContent>

          <TabsContent value="skills">
            <SkillManager />
          </TabsContent>

          <TabsContent value="privileges">
            <PrivilegeManager />
          </TabsContent>

          <TabsContent value="factions">
            <FactionManager />
          </TabsContent>

          <TabsContent value="equipment">
            <div className="text-center py-12 text-muted-foreground">
              <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Gerenciador de Equipamentos em desenvolvimento...</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
