import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, BookOpen, Users, Building2, Map, 
  Clock, Landmark, Sparkles 
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import FactionLoreSection from '@/components/lore/FactionLoreSection';

const GalaxyLore = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('intro');

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
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="intro" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Introdução</span>
            </TabsTrigger>
            <TabsTrigger value="historia" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">História</span>
            </TabsTrigger>
            <TabsTrigger value="faccoes" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Facções</span>
            </TabsTrigger>
            <TabsTrigger value="corporacoes" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Corporações</span>
            </TabsTrigger>
            <TabsTrigger value="atlas" className="gap-2">
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Atlas Estelar</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Linha do Tempo</span>
            </TabsTrigger>
            <TabsTrigger value="politica" className="gap-2">
              <Landmark className="w-4 h-4" />
              <span className="hidden sm:inline">Política Galáctica</span>
            </TabsTrigger>
          </TabsList>

          {/* Introdução */}
          <TabsContent value="intro" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Bem-vindo à Galáxia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
                    <p className="text-lg leading-relaxed">
                      [Insira aqui a introdução ao universo. Este é o espaço para apresentar 
                      o cenário, o tom da narrativa e preparar o leitor para explorar os 
                      diversos aspectos da galáxia.]
                    </p>
                    <p>
                      Use as abas acima para navegar entre as diferentes seções do lore:
                    </p>
                    <ul className="space-y-2">
                      <li><strong>História</strong> - A cronologia dos eventos que moldaram a galáxia</li>
                      <li><strong>Facções</strong> - Os principais poderes e grupos que disputam o controle</li>
                      <li><strong>Corporações</strong> - As megacorporações que movem a economia</li>
                      <li><strong>Atlas Estelar</strong> - Mapas e descrições dos sistemas estelares</li>
                      <li><strong>Linha do Tempo</strong> - Eventos importantes em ordem cronológica</li>
                      <li><strong>Política Galáctica</strong> - As relações de poder e diplomacia</li>
                    </ul>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* História */}
          <TabsContent value="historia" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  História da Galáxia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p className="text-lg leading-relaxed">
                      [Insira aqui a história geral da galáxia. Descreva as eras, 
                      os grandes eventos, as guerras, as descobertas e como a civilização 
                      chegou ao estado atual.]
                    </p>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facções */}
          <TabsContent value="faccoes" className="mt-6">
            <FactionLoreSection />
          </TabsContent>

          {/* Corporações */}
          <TabsContent value="corporacoes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Corporações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p className="text-lg leading-relaxed">
                      [Insira aqui informações sobre as megacorporações. Descreva suas 
                      áreas de atuação, influência, rivalidades e papel na economia galáctica.]
                    </p>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Atlas Estelar */}
          <TabsContent value="atlas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-primary" />
                  Atlas Estelar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p className="text-lg leading-relaxed">
                      [Insira aqui o atlas estelar. Descreva os sistemas estelares, 
                      rotas de viagem, regiões importantes e pontos de interesse.]
                    </p>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Linha do Tempo */}
          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Linha do Tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p className="text-lg leading-relaxed">
                      [Insira aqui a linha do tempo. Liste os eventos importantes 
                      em ordem cronológica com suas datas e descrições.]
                    </p>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Política Galáctica */}
          <TabsContent value="politica" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-primary" />
                  Política Galáctica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p className="text-lg leading-relaxed">
                      [Insira aqui informações sobre política galáctica. Descreva 
                      as relações diplomáticas, tratados, conflitos e estruturas de poder.]
                    </p>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GalaxyLore;
