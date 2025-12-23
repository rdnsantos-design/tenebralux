import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { Home, FileSpreadsheet, Map, Crown, Building } from 'lucide-react';
import { RealmList } from '@/components/domains/RealmList';
import { ProvinceList } from '@/components/domains/ProvinceList';
import { RegentList } from '@/components/domains/RegentList';
import { HoldingList } from '@/components/domains/HoldingList';
import { DomainImporter } from '@/components/domains/DomainImporter';
import { Realm, Province } from '@/types/Domain';

const Domains = () => {
  const navigate = useNavigate();
  const [selectedRealm, setSelectedRealm] = useState<Realm | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [activeTab, setActiveTab] = useState('provinces');

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
          <Button
            onClick={() => setShowImporter(!showImporter)}
            variant={showImporter ? 'secondary' : 'outline'}
            size="lg"
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="w-5 h-5" />
            {showImporter ? 'Fechar Importador' : 'Importar Excel'}
          </Button>
        </div>

        {/* Import Section */}
        {showImporter && (
          <div className="mb-6">
            <DomainImporter onClose={() => setShowImporter(false)} />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="provinces" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Províncias
            </TabsTrigger>
            <TabsTrigger value="regents" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Regentes
            </TabsTrigger>
            <TabsTrigger value="holdings" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Holdings
            </TabsTrigger>
          </TabsList>

          {/* Provinces Tab */}
          <TabsContent value="provinces">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Realm List - Sidebar */}
              <div className="lg:col-span-1">
                <RealmList
                  selectedRealmId={selectedRealm?.id}
                  onSelectRealm={setSelectedRealm}
                />
              </div>

              {/* Province List - Main Content */}
              <div className="lg:col-span-3">
                <ProvinceList 
                  selectedRealmId={selectedRealm?.id}
                  onSelectProvince={setSelectedProvince}
                />
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground">
                {selectedRealm 
                  ? `Visualizando províncias de ${selectedRealm.name}`
                  : 'Selecione um reino para filtrar províncias ou visualize todas'
                }
              </p>
            </div>
          </TabsContent>

          {/* Regents Tab */}
          <TabsContent value="regents">
            <RegentList />
          </TabsContent>

          {/* Holdings Tab */}
          <TabsContent value="holdings">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Province selector */}
              <div className="lg:col-span-1">
                <ProvinceList 
                  selectedRealmId={selectedRealm?.id}
                  onSelectProvince={setSelectedProvince}
                  compact
                />
              </div>

              {/* Holdings List */}
              <div className="lg:col-span-3">
                <HoldingList selectedProvinceId={selectedProvince?.id} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Domains;
