import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { Home, FileSpreadsheet, Map, Upload, Crown, Search } from 'lucide-react';
import { RealmList } from '@/components/domains/RealmList';
import { DomainImporter } from '@/components/domains/DomainImporter';
import { HoldingsImporter } from '@/components/domains/HoldingsImporter';
import { HoldingsVerifier } from '@/components/domains/HoldingsVerifier';
import { FullDomainImporter } from '@/components/domains/FullDomainImporter';
import { RegentDomainList } from '@/components/domains/RegentDomainList';
import { RealmProvinceHoldingView } from '@/components/domains/RealmProvinceHoldingView';
import { Realm } from '@/types/Domain';

const Domains = () => {
  const navigate = useNavigate();
  const [selectedRealm, setSelectedRealm] = useState<Realm | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [showHoldingsImporter, setShowHoldingsImporter] = useState(false);
  const [showFullImporter, setShowFullImporter] = useState(false);
  const [showVerifier, setShowVerifier] = useState(false);
  const [activeTab, setActiveTab] = useState('reinos');
  const [selectedRegentId, setSelectedRegentId] = useState<string | null>(null);

  const handleSelectRegent = (regentId: string) => {
    setSelectedRegentId(regentId);
    setActiveTab('dominios');
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
              Gestão de Domínios
            </h1>
            <p className="text-xl text-muted-foreground">
              Gerencie reinos, províncias, regentes e holdings
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => {
                setShowVerifier(!showVerifier);
                setShowFullImporter(false);
                setShowImporter(false);
                setShowHoldingsImporter(false);
              }}
              variant={showVerifier ? 'secondary' : 'outline'}
              size="lg"
              className="flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {showVerifier ? 'Fechar' : 'Verificar Faltantes'}
            </Button>
            <Button
              onClick={() => {
                setShowFullImporter(!showFullImporter);
                setShowImporter(false);
                setShowHoldingsImporter(false);
                setShowVerifier(false);
              }}
              variant={showFullImporter ? 'secondary' : 'default'}
              size="lg"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5" />
              {showFullImporter ? 'Fechar' : 'Importar Completo'}
            </Button>
            <Button
              onClick={() => {
                setShowHoldingsImporter(!showHoldingsImporter);
                setShowFullImporter(false);
                setShowImporter(false);
                setShowVerifier(false);
              }}
              variant={showHoldingsImporter ? 'secondary' : 'outline'}
              size="lg"
              className="flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {showHoldingsImporter ? 'Fechar' : 'Importar Holdings'}
            </Button>
            <Button
              onClick={() => {
                setShowImporter(!showImporter);
                setShowFullImporter(false);
                setShowHoldingsImporter(false);
                setShowVerifier(false);
              }}
              variant={showImporter ? 'secondary' : 'outline'}
              size="lg"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5" />
              {showImporter ? 'Fechar' : 'Importar Províncias'}
            </Button>
          </div>
        </div>

        {/* Verifier Section */}
        {showVerifier && (
          <div className="mb-6">
            <HoldingsVerifier onClose={() => setShowVerifier(false)} />
          </div>
        )}

        {/* Import Sections */}
        {showFullImporter && (
          <div className="mb-6">
            <FullDomainImporter onClose={() => setShowFullImporter(false)} />
          </div>
        )}

        {showHoldingsImporter && (
          <div className="mb-6">
            <HoldingsImporter onClose={() => setShowHoldingsImporter(false)} />
          </div>
        )}

        {showImporter && (
          <div className="mb-6">
            <DomainImporter onClose={() => setShowImporter(false)} />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
            <TabsTrigger value="reinos" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Reinos
            </TabsTrigger>
            <TabsTrigger value="dominios" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Domínios
            </TabsTrigger>
          </TabsList>

          {/* Reinos Tab */}
          <TabsContent value="reinos">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Realm List - Sidebar */}
              <div className="lg:col-span-1">
                <RealmList
                  selectedRealmId={selectedRealm?.id}
                  onSelectRealm={setSelectedRealm}
                />
              </div>

              {/* Province + Holdings List - Main Content */}
              <div className="lg:col-span-3">
                <RealmProvinceHoldingView 
                  selectedRealm={selectedRealm}
                  onSelectRegent={handleSelectRegent}
                />
              </div>
            </div>
          </TabsContent>

          {/* Domínios Tab */}
          <TabsContent value="dominios">
            <RegentDomainList 
              selectedRegentId={selectedRegentId}
              onClearSelection={() => setSelectedRegentId(null)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Domains;
