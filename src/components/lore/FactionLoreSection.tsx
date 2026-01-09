import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, Crown, Ghost, Crosshair, Users,
  History, Palette, Building, Globe, Brush, Handshake
} from 'lucide-react';
import { EditableLoreContent } from './EditableLoreContent';
import { useGalaxyLore } from '@/hooks/useGalaxyLore';

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
    id: 'alianca-estelar',
    name: 'Aliança Estelar',
    icon: Users,
    color: 'text-blue-400',
    description: 'A coalizão das nações estelares unidas'
  },
  {
    id: 'hegemonia-humanista',
    name: 'Hegemonia Humanista',
    icon: Crown,
    color: 'text-orange-400',
    description: 'O poder da humanidade acima de tudo'
  },
  {
    id: 'pacto-liberstadt',
    name: 'Pacto de Liberstadt',
    icon: Users,
    color: 'text-cyan-400',
    description: 'A liga das cidades livres e independentes'
  },
  {
    id: 'federacao-solonica',
    name: 'Federação Solônica de Planetas',
    icon: Globe,
    color: 'text-yellow-400',
    description: 'A federação democrática dos mundos do sol'
  },
  {
    id: 'nova-concordia',
    name: 'Nova Concórdia',
    icon: Handshake,
    color: 'text-emerald-400',
    description: 'O pacto de paz e cooperação galáctica'
  },
  {
    id: 'republica-bruniana',
    name: 'República Bruniana',
    icon: Building,
    color: 'text-rose-400',
    description: 'A república das tradições e do comércio'
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
  const { isLoading, getFactionSection, updateSection } = useGalaxyLore();

  const currentFaction = FACTIONS.find(f => f.id === selectedFaction);

  const handleSave = (id: string, content: string, title?: string) => {
    updateSection.mutate({ id, content, title });
  };

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

        {FACTION_TABS.map((tab) => {
          const sectionData = getFactionSection(selectedFaction, tab.id);
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              <EditableLoreContent
                sectionId={sectionData?.id}
                title={sectionData?.title || `${tab.label} - ${currentFaction?.name}`}
                content={sectionData?.content}
                icon={
                  <div className="flex items-center gap-2">
                    <tab.icon className="w-5 h-5 text-primary" />
                    <Badge variant="outline" className="text-xs">
                      {selectedFaction}
                    </Badge>
                  </div>
                }
                isLoading={isLoading}
                onSave={handleSave}
                isSaving={updateSection.isPending}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default FactionLoreSection;
