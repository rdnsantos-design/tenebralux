import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Home, FileSpreadsheet, Map } from 'lucide-react';
import { RealmList } from '@/components/domains/RealmList';
import { ProvinceList } from '@/components/domains/ProvinceList';
import { DomainImporter } from '@/components/domains/DomainImporter';
import { Realm } from '@/types/Domain';

const Domains = () => {
  const navigate = useNavigate();
  const [selectedRealm, setSelectedRealm] = useState<Realm | null>(null);
  const [showImporter, setShowImporter] = useState(false);

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
              Gerencie reinos e províncias do seu mundo
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

        {/* Main Content */}
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
            <ProvinceList selectedRealmId={selectedRealm?.id} />
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
      </div>
    </div>
  );
};

export default Domains;
