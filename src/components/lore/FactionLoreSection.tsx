import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, Crown, Ghost, Crosshair, Users,
  History, Palette, Building, Globe, Brush, Handshake
} from 'lucide-react';

interface Faction {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const FACTIONS: Faction[] = [
  {
    id: 'synapsis',
    name: 'Synapsis',
    icon: Brain,
    color: 'text-purple-400',
    description: 'A mente coletiva que transcende a individualidade'
  },
  {
    id: 'galatea',
    name: 'Domínio de Galatea',
    icon: Crown,
    color: 'text-amber-400',
    description: 'O império que governa com mão de ferro'
  },
  {
    id: 'zonas-fantasmas',
    name: 'Zonas Fantasmas',
    icon: Ghost,
    color: 'text-slate-400',
    description: 'Regiões onde a lei não alcança'
  },
  {
    id: 'espaco-disputado',
    name: 'Espaço Disputado',
    icon: Crosshair,
    color: 'text-red-400',
    description: 'Territórios em constante conflito'
  },
  {
    id: 'independentes',
    name: 'Independentes',
    icon: Users,
    color: 'text-green-400',
    description: 'Aqueles que não juram lealdade a ninguém'
  }
];

const FACTION_TABS = [
  { id: 'historia', label: 'História', icon: History },
  { id: 'cultura', label: 'Cultura', icon: Palette },
  { id: 'sociedade', label: 'Sociedade', icon: Building },
  { id: 'planetas', label: 'Planetas', icon: Globe },
  { id: 'estetica', label: 'Estética', icon: Brush },
  { id: 'relacoes', label: 'Relações', icon: Handshake }
];

const FactionLoreSection = () => {
  const [selectedFaction, setSelectedFaction] = useState<string>('synapsis');
  const [selectedSubTab, setSelectedSubTab] = useState<string>('historia');

  const currentFaction = FACTIONS.find(f => f.id === selectedFaction);

  return (
    <div className="space-y-4">
      {/* Faction Selector */}
      <Tabs value={selectedFaction} onValueChange={setSelectedFaction}>
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {FACTIONS.map((faction) => {
            const Icon = faction.icon;
            return (
              <TabsTrigger 
                key={faction.id} 
                value={faction.id}
                className="gap-2 data-[state=active]:bg-primary/20"
              >
                <Icon className={`w-4 h-4 ${faction.color}`} />
                <span className="hidden md:inline">{faction.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Current Faction Header */}
      {currentFaction && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <currentFaction.icon className={`w-8 h-8 ${currentFaction.color}`} />
              <div>
                <CardTitle className="text-2xl">{currentFaction.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{currentFaction.description}</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Faction Content Tabs */}
      <Tabs value={selectedSubTab} onValueChange={setSelectedSubTab}>
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/30 p-1">
          {FACTION_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="gap-2 text-xs sm:text-sm"
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {FACTION_TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <tab.icon className="w-5 h-5 text-primary" />
                  {tab.label} - {currentFaction?.name}
                  <Badge variant="outline" className="ml-auto text-xs">
                    {selectedFaction}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[50vh]">
                  <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p className="text-lg leading-relaxed">
                      [Insira aqui o conteúdo sobre <strong>{tab.label.toLowerCase()}</strong> da 
                      facção <strong>{currentFaction?.name}</strong>.]
                    </p>
                    <p className="text-sm opacity-70 mt-4">
                      Este é um espaço para texto livre. Você pode adicionar parágrafos, 
                      listas, citações e qualquer outro conteúdo relevante para descrever 
                      este aspecto da facção.
                    </p>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default FactionLoreSection;
