import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Printer, Map, Hexagon, X, Swords, Grid3X3 } from 'lucide-react';
import { TerrainList } from '@/components/battlemap/TerrainList';
import { TerrainPrintSheet } from '@/components/battlemap/TerrainPrintSheet';
import { TerrainHexTile } from '@/components/battlemap/TerrainHexTile';
import { TerrainImageGenerator } from '@/components/battlemap/TerrainImageGenerator';
import { TerrainType } from '@/types/Terrain';
import html2canvas from 'html2canvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BattleMap = () => {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedTerrains, setSelectedTerrains] = useState<TerrainType[]>([]);
  const [copies, setCopies] = useState(1);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handleSelectForPrint = (terrain: TerrainType) => {
    setSelectedTerrains(prev => {
      const exists = prev.find(t => t.id === terrain.id);
      if (exists) {
        return prev.filter(t => t.id !== terrain.id);
      }
      return [...prev, terrain];
    });
  };

  const handleRemoveFromPrint = (terrainId: string) => {
    setSelectedTerrains(prev => prev.filter(t => t.id !== terrainId));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportImage = async () => {
    if (!printRef.current) return;
    
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
    });
    
    const link = document.createElement('a');
    link.download = 'terrenos-batalha.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Voltar ao Dashboard
              </Button>
            </div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Map className="w-10 h-10" />
              Mapa de Batalha
            </h1>
            <p className="text-xl text-muted-foreground">
              Gerencie tipos de terreno para combates táticos
            </p>
          </div>
        </div>

        {/* Module Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate('/mass-combat')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                <Swords className="w-6 h-6" />
                Combate em Massa
              </CardTitle>
              <CardDescription>
                Sistema de resolução rápida com terrenos primários e secundários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerencie terrenos primários (cenário fixo) e secundários (condições táticas) para batalhas de grande escala.
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="terrain-generator" className="w-full">
          <TabsList>
            <TabsTrigger value="terrain-generator" className="gap-2">
              <Grid3X3 className="w-4 h-4" />
              Gerador de Terrenos (Tabuleiro)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="terrain-generator" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Terrain List */}
              <div className="lg:col-span-2 space-y-6">
                <TerrainImageGenerator />
                <TerrainList 
                  onSelectForPrint={handleSelectForPrint}
                  selectedTerrains={selectedTerrains}
                />
              </div>

              {/* Print Selection Panel */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Printer className="w-5 h-5" />
                      Seleção para Impressão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedTerrains.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Clique no botão + nos terrenos para adicionar à impressão
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {selectedTerrains.map(terrain => (
                            <div 
                              key={terrain.id}
                              className="flex items-center gap-1 bg-secondary rounded-full px-3 py-1 text-sm"
                            >
                              <Hexagon className="w-3 h-3" />
                              {terrain.name}
                              <button
                                onClick={() => handleRemoveFromPrint(terrain.id)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <Label>Cópias de cada tile</Label>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={copies}
                            onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            className="flex-1" 
                            onClick={() => setShowPrintPreview(true)}
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setSelectedTerrains([])}
                          >
                            Limpar
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {selectedTerrains.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Preview dos Tiles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {selectedTerrains.slice(0, 6).map(terrain => (
                          <TerrainHexTile key={terrain.id} terrain={terrain} size="sm" />
                        ))}
                        {selectedTerrains.length > 6 && (
                          <p className="w-full text-center text-sm text-muted-foreground mt-2">
                            +{selectedTerrains.length - 6} mais...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Print Preview Modal */}
        {showPrintPreview && (
          <div className="fixed inset-0 bg-black/80 z-50 overflow-auto">
            <div className="min-h-screen p-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">Preview de Impressão</h2>
                  <div className="flex gap-2">
                    <Button onClick={handlePrint}>
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimir
                    </Button>
                    <Button variant="secondary" onClick={handleExportImage}>
                      Exportar PNG
                    </Button>
                    <Button variant="ghost" onClick={() => setShowPrintPreview(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                  <TerrainPrintSheet 
                    ref={printRef}
                    terrains={selectedTerrains}
                    copies={copies}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleMap;
