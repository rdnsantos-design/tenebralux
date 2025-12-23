import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Crown, Users, Home, FileSpreadsheet, Settings, Shield, Upload, MapPin, Layout, Swords, Images, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Regent, Army } from "@/types/Army";
import { UnitCard } from "@/types/UnitCard";
import { Unit } from "@/types/Unit";
import { UnitTemplate } from "@/types/UnitTemplate";
import { CardTemplate } from "@/types/CardTemplate";
import { RegentEditor } from "@/components/RegentEditor";
import { RegentList } from "@/components/RegentList";
import { ArmyEditor } from "@/components/ArmyEditor";
import { ArmyList } from "@/components/ArmyList";
import { UnitEditor } from "@/components/UnitEditor";
import { UnitList } from "@/components/UnitList";
import { ExcelImportManager } from "@/components/ExcelImportManager";
import { LocationImportManager } from "@/components/LocationImportManager";
import { Country } from "@/types/Location";
import { TemplateCreator } from "@/components/TemplateCreator";
import { useFieldCommanders } from "@/hooks/useFieldCommanders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/ImageUploader";
import { ImageBank } from "@/components/ImageBank";
import { PrintCardGenerator } from "@/components/PrintCardGenerator";
import { ArmyExporter } from "@/components/ArmyExporter";

const ArmyManagement = () => {
  const navigate = useNavigate();
  const { commanders } = useFieldCommanders();
  const [regents, setRegents] = useState<Regent[]>([]);
  const [armies, setArmies] = useState<Army[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [legacyCards, setLegacyCards] = useState<UnitCard[]>([]);
  const [editingRegent, setEditingRegent] = useState<Regent | null>(null);
  const [editingArmy, setEditingArmy] = useState<Army | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [showRegentEditor, setShowRegentEditor] = useState(false);
  const [showArmyEditor, setShowArmyEditor] = useState(false);
  const [showUnitEditor, setShowUnitEditor] = useState(false);
  const [selectedRegentIdForUnits, setSelectedRegentIdForUnits] = useState<string>('');
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showLocationImport, setShowLocationImport] = useState(false);
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [showPrintGenerator, setShowPrintGenerator] = useState(false);
  const [cardTemplates, setCardTemplates] = useState<CardTemplate[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [imageRefreshTrigger, setImageRefreshTrigger] = useState(0);

  // Carregar dados do localStorage
  useEffect(() => {
    const savedRegents = localStorage.getItem('armyRegents');
    if (savedRegents) {
      try {
        setRegents(JSON.parse(savedRegents));
      } catch (error) {
        console.error('Erro ao carregar regentes:', error);
      }
    }

    const savedArmies = localStorage.getItem('armyArmies');
    if (savedArmies) {
      try {
        setArmies(JSON.parse(savedArmies));
      } catch (error) {
        console.error('Erro ao carregar exércitos:', error);
      }
    }

    const savedUnits = localStorage.getItem('armyUnits');
    if (savedUnits) {
      try {
        setUnits(JSON.parse(savedUnits));
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
      }
    }

    // Carregar cards antigos para compatibilidade
    const savedCards = localStorage.getItem('unitCards');
    if (savedCards) {
      try {
        setLegacyCards(JSON.parse(savedCards));
      } catch (error) {
        console.error('Erro ao carregar cards:', error);
      }
    }

    // Carregar templates de card
    const savedTemplates = localStorage.getItem('cardTemplates');
    if (savedTemplates) {
      try {
        setCardTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error('Erro ao carregar templates:', error);
      }
    }

    setInitialLoaded(true);
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    if (!initialLoaded) return;
    localStorage.setItem('armyRegents', JSON.stringify(regents));
  }, [regents, initialLoaded]);

  useEffect(() => {
    if (!initialLoaded) return;
    localStorage.setItem('armyArmies', JSON.stringify(armies));
  }, [armies, initialLoaded]);

  useEffect(() => {
    if (!initialLoaded) return;
    localStorage.setItem('armyUnits', JSON.stringify(units));
  }, [units, initialLoaded]);

  const handleSaveRegent = (regent: Regent) => {
    if (editingRegent) {
      setRegents(regents.map(r => r.id === regent.id ? regent : r));
    } else {
      setRegents([...regents, regent]);
    }
    setEditingRegent(null);
    setShowRegentEditor(false);
  };

  const handleEditRegent = (regent: Regent) => {
    setEditingRegent(regent);
    setShowRegentEditor(true);
  };

  const handleDeleteRegent = (regentId: string) => {
    // Também remover exércitos e unidades deste regente
    setArmies(armies.filter(a => a.regentId !== regentId));
    setUnits(units.filter(u => u.regentId !== regentId));
    setRegents(regents.filter(r => r.id !== regentId));
  };

  // Handlers para unidades
  const handleSaveUnit = (unitData: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    if (editingUnit) {
      setUnits(units.map(u => u.id === editingUnit.id 
        ? { ...u, ...unitData, updatedAt: now } 
        : u
      ));
    } else {
      const newUnit: Unit = {
        ...unitData,
        id: `unit_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setUnits([...units, newUnit]);
    }
    setEditingUnit(null);
    setShowUnitEditor(false);
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setSelectedRegentIdForUnits(unit.regentId);
    setShowUnitEditor(true);
  };

  const handleDeleteUnit = (unitId: string) => {
    setUnits(units.filter(u => u.id !== unitId));
  };

  const handleNewUnit = () => {
    if (!selectedRegentIdForUnits) {
      alert('Selecione um regente primeiro');
      return;
    }
    setEditingUnit(null);
    setShowUnitEditor(true);
  };

  // Filtrar unidades pelo regente selecionado
  const regentUnits = units.filter(u => u.regentId === selectedRegentIdForUnits);
  const regentCommanders = commanders.filter(c => c.regent_id === selectedRegentIdForUnits);

  const handleNewRegent = () => {
    setEditingRegent(null);
    setShowRegentEditor(true);
  };

  const handleSaveArmy = (army: Army) => {
    if (editingArmy) {
      setArmies(armies.map(a => a.id === army.id ? army : a));
    } else {
      setArmies([...armies, army]);
    }
    setEditingArmy(null);
    setShowArmyEditor(false);
  };

  const handleEditArmy = (army: Army) => {
    setEditingArmy(army);
    setShowArmyEditor(true);
  };

  const handleDeleteArmy = (armyId: string) => {
    setArmies(armies.filter(a => a.id !== armyId));
  };

  const handleNewArmy = () => {
    setEditingArmy(null);
    setShowArmyEditor(true);
  };

  const handleExcelImportComplete = (cards: UnitCard[]) => {
    // Salvar as cartas criadas no localStorage
    const existingCards = JSON.parse(localStorage.getItem('unitCards') || '[]');
    const updatedCards = [...existingCards, ...cards];
    localStorage.setItem('unitCards', JSON.stringify(updatedCards));
    
    setShowExcelImport(false);
    alert(`${cards.length} cartas criadas com sucesso a partir da importação Excel!`);
  };

  const handleLocationImportComplete = (countries: Country[]) => {
    console.log('Países importados:', countries);
    setShowLocationImport(false);
    alert(`${countries.length} países importados com sucesso!`);
  };

  const handleTemplateCreated = () => {
    setShowTemplateCreator(false);
    alert('Template criado com sucesso!');
  };

  if (showExcelImport) {
    return (
      <ExcelImportManager
        onCancel={() => setShowExcelImport(false)}
        onCreateCards={handleExcelImportComplete}
      />
    );
  }

  if (showLocationImport) {
    return (
      <LocationImportManager
        onCancel={() => setShowLocationImport(false)}
        onImportComplete={handleLocationImportComplete}
      />
    );
  }

  if (showTemplateCreator) {
    return (
      <TemplateCreator
        onCancel={() => setShowTemplateCreator(false)}
        onTemplateCreated={handleTemplateCreated}
      />
    );
  }

  if (showPrintGenerator) {
    return (
      <PrintCardGenerator
        units={units}
        templates={cardTemplates}
        onClose={() => setShowPrintGenerator(false)}
      />
    );
  }

  if (showRegentEditor) {
    return (
      <RegentEditor
        regent={editingRegent}
        onSave={handleSaveRegent}
        onCancel={() => {
          setEditingRegent(null);
          setShowRegentEditor(false);
        }}
      />
    );
  }

  if (showArmyEditor) {
    return (
      <ArmyEditor
        army={editingArmy}
        regents={regents}
        onSave={handleSaveArmy}
        onCancel={() => {
          setEditingArmy(null);
          setShowArmyEditor(false);
        }}
      />
    );
  }

  if (showUnitEditor) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <UnitEditor
            unit={editingUnit}
            regentId={selectedRegentIdForUnits}
            templates={[]}
            legacyCards={legacyCards}
            onSave={handleSaveUnit}
            onCancel={() => {
              setEditingUnit(null);
              setShowUnitEditor(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
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
            <h1 className="text-4xl font-bold mb-2">Gestão de Exército</h1>
            <p className="text-xl text-muted-foreground">Gerencie regentes, exércitos e importe dados via Excel</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowExcelImport(true)}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Importar Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowTemplateCreator(true)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Templates
            </Button>
            <Button onClick={handleNewRegent} size="lg" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Regente
            </Button>
          </div>
        </div>

        <Tabs defaultValue="regents" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="regents" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Regentes
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Swords className="w-4 h-4" />
              Unidades
            </TabsTrigger>
            <TabsTrigger value="armies" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Exércitos
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Images className="w-4 h-4" />
              Imagens
            </TabsTrigger>
            <TabsTrigger value="print" className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Impressão
            </TabsTrigger>
            <TabsTrigger value="imports" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Importações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="regents" className="mt-6">
            {regents.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <Crown className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-semibold mb-4">Nenhum regente cadastrado</h3>
                  <p className="text-muted-foreground mb-6">
                    Comece cadastrando seu primeiro regente para gerenciar exércitos
                  </p>
                  <Button onClick={handleNewRegent} size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Cadastrar Primeiro Regente
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <RegentList
                regents={regents}
                onEdit={handleEditRegent}
                onDelete={handleDeleteRegent}
              />
            )}
          </TabsContent>

          <TabsContent value="units" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold">Pool de Unidades</h2>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Regente:</Label>
                    <Select value={selectedRegentIdForUnits} onValueChange={setSelectedRegentIdForUnits}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Selecione um regente" />
                      </SelectTrigger>
                      <SelectContent>
                        {regents.map((regent) => (
                          <SelectItem key={regent.id} value={regent.id}>
                            {regent.name} - {regent.domain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={handleNewUnit}
                  disabled={!selectedRegentIdForUnits}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nova Unidade
                </Button>
              </div>

              {!selectedRegentIdForUnits ? (
                <Card className="text-center py-12">
                  <CardContent className="pt-6">
                    <Crown className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-2xl font-semibold mb-4">Selecione um regente</h3>
                    <p className="text-muted-foreground">
                      Escolha um regente acima para ver e gerenciar suas unidades
                    </p>
                  </CardContent>
                </Card>
              ) : regentUnits.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent className="pt-6">
                    <Swords className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-2xl font-semibold mb-4">Nenhuma unidade criada</h3>
                    <p className="text-muted-foreground mb-6">
                      Crie unidades a partir dos templates importados do Excel
                    </p>
                    <Button onClick={handleNewUnit}>
                      <Plus className="w-5 h-5 mr-2" />
                      Criar Primeira Unidade
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <UnitList
                  units={regentUnits}
                  commanders={regentCommanders}
                  onEdit={handleEditUnit}
                  onDelete={handleDeleteUnit}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="armies" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Exércitos</h2>
              <div className="flex items-center gap-2">
                <ArmyExporter 
                  armies={armies}
                  regents={regents}
                  units={units}
                  commanders={commanders}
                />
                <Button 
                  onClick={handleNewArmy}
                  disabled={regents.length === 0}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Exército
                </Button>
              </div>
            </div>

            {regents.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <Crown className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-semibold mb-4">Cadastre regentes primeiro</h3>
                  <p className="text-muted-foreground mb-6">
                    Você precisa cadastrar pelo menos um regente antes de criar exércitos
                  </p>
                  <Button onClick={handleNewRegent} size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Cadastrar Regente
                  </Button>
                </CardContent>
              </Card>
            ) : armies.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-semibold mb-4">Nenhum exército criado ainda</h3>
                  <p className="text-muted-foreground mb-6">
                    Monte seu primeiro exército selecionando unidades dos cards criados
                  </p>
                  <Button onClick={handleNewArmy} size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Criar Primeiro Exército
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ArmyList
                armies={armies}
                regents={regents}
                onEdit={handleEditArmy}
                onDelete={handleDeleteArmy}
              />
            )}
          </TabsContent>

          <TabsContent value="images" className="mt-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Banco de Imagens de Fundo</h2>
              <p className="text-muted-foreground mb-6">
                Faça upload de imagens com dimensões exatas de 750×1050px para usar como fundo dos cards
              </p>
            </div>
            
            <ImageUploader onUploadSuccess={() => setImageRefreshTrigger(prev => prev + 1)} />
            <ImageBank refreshTrigger={imageRefreshTrigger} />
          </TabsContent>

          <TabsContent value="print" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Gerador de Cards para Impressão</h2>
                <p className="text-muted-foreground">
                  Selecione unidades e imagens de fundo para gerar cards prontos para impressão
                </p>
              </div>
              <Button onClick={() => setShowPrintGenerator(true)} size="lg">
                <Printer className="w-5 h-5 mr-2" />
                Abrir Gerador
              </Button>
            </div>

            {units.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <Swords className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-semibold mb-4">Nenhuma unidade criada</h3>
                  <p className="text-muted-foreground mb-6">
                    Crie unidades na aba "Unidades" para poder gerar cards para impressão
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Swords className="w-5 h-5" />
                      Unidades Disponíveis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{units.length}</p>
                    <p className="text-muted-foreground text-sm">unidades para gerar cards</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Images className="w-5 h-5" />
                      Imagens de Fundo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" id="image-count">-</p>
                    <p className="text-muted-foreground text-sm">imagens no banco</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Layout className="w-5 h-5" />
                      Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{cardTemplates.length}</p>
                    <p className="text-muted-foreground text-sm">templates disponíveis</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="imports" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Importações</h2>
                <p className="text-muted-foreground">Gerencie dados importados de planilhas Excel</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowExcelImport(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Unidades
                </Button>
                <Button onClick={() => setShowLocationImport(true)} variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  Importar Localização
                </Button>
                <Button onClick={() => setShowTemplateCreator(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Template
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Importação de Unidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Importe planilhas Excel com dados de unidades militares (ataque, defesa, etc.)
                  </p>
                  <Button onClick={() => setShowExcelImport(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Gerenciar Importações de Unidades
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Importação de Localização
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Importe planilhas Excel com países e províncias para usar na localização das unidades
                  </p>
                  <Button onClick={() => setShowLocationImport(true)} variant="outline">
                    <MapPin className="h-4 w-4 mr-2" />
                    Gerenciar Localização
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Templates de Card
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Crie templates personalizados para o design dos cards de unidade
                  </p>
                  <Button onClick={() => setShowTemplateCreator(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Novo Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArmyManagement;