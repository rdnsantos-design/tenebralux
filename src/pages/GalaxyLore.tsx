import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, BookOpen, Users, Building2, Map, 
  Clock, Landmark, Sparkles 
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import FactionLoreSection from '@/components/lore/FactionLoreSection';
import OrganizationsSection from '@/components/lore/OrganizationsSection';
import { EditableLoreContent } from '@/components/lore/EditableLoreContent';
import { useGalaxyLore } from '@/hooks/useGalaxyLore';

const GalaxyLore = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('intro');
  const { isLoading, getMainSection, updateSection } = useGalaxyLore();

  const handleSave = (id: string, content: string, title?: string) => {
    updateSection.mutate({ id, content, title });
  };

  const sections = [
    { id: 'intro', label: 'Introdução', icon: BookOpen, sectionType: 'intro' },
    { id: 'historia', label: 'História', icon: Clock, sectionType: 'historia' },
    { id: 'atlas', label: 'Atlas Estelar', icon: Map, sectionType: 'atlas' },
    { id: 'timeline', label: 'Linha do Tempo', icon: Clock, sectionType: 'timeline' },
    { id: 'politica', label: 'Política Galáctica', icon: Landmark, sectionType: 'politica' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">A Galáxia</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/galaxy-map')}
              className="gap-2"
            >
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Mapa 3D</span>
            </Button>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <TabsTrigger key={section.id} value={section.id} className="gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{section.label}</span>
                </TabsTrigger>
              );
            })}
            <TabsTrigger value="faccoes" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Facções</span>
            </TabsTrigger>
            <TabsTrigger value="organizacoes" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Organizações</span>
            </TabsTrigger>
          </TabsList>

          {/* Main sections */}
          {sections.map(section => {
            const sectionData = getMainSection(section.sectionType);
            const Icon = section.icon;
            return (
              <TabsContent key={section.id} value={section.id} className="mt-6">
                <EditableLoreContent
                  sectionId={sectionData?.id}
                  title={sectionData?.title}
                  content={sectionData?.content}
                  icon={<Icon className="w-5 h-5 text-primary" />}
                  isLoading={isLoading}
                  onSave={handleSave}
                  isSaving={updateSection.isPending}
                />
              </TabsContent>
            );
          })}

          {/* Facções */}
          <TabsContent value="faccoes" className="mt-6">
            <FactionLoreSection />
          </TabsContent>

          {/* Organizações */}
          <TabsContent value="organizacoes" className="mt-6">
            <OrganizationsSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GalaxyLore;
