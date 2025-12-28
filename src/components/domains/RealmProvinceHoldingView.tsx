import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useProvinces, useRealms } from '@/hooks/useDomains';
import { useHoldings } from '@/hooks/useHoldings';
import { Loader2, ChevronDown, ChevronRight, MapPin, Crown, Store, Church, Sparkles, Search } from 'lucide-react';
import { Realm, Province, HoldingType } from '@/types/Domain';

interface RealmProvinceHoldingViewProps {
  selectedRealm: Realm | null;
  onSelectRegent: (regentId: string) => void;
}

const holdingIcons: Record<HoldingType, React.ReactNode> = {
  ordem: <Crown className="w-3 h-3 text-yellow-500" />,
  guilda: <Store className="w-3 h-3 text-green-500" />,
  templo: <Church className="w-3 h-3 text-blue-500" />,
  fonte_magica: <Sparkles className="w-3 h-3 text-purple-500" />,
};

const holdingLabels: Record<HoldingType, string> = {
  ordem: 'Ordem',
  guilda: 'Guilda',
  templo: 'Templo',
  fonte_magica: 'Fonte Mágica',
};

export function RealmProvinceHoldingView({ selectedRealm, onSelectRegent }: RealmProvinceHoldingViewProps) {
  const { data: provinces, isLoading: provincesLoading } = useProvinces(selectedRealm?.id);
  const { data: holdings, isLoading: holdingsLoading } = useHoldings();
  
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleProvince = (provinceId: string) => {
    setExpandedProvinces(prev => {
      const next = new Set(prev);
      if (next.has(provinceId)) {
        next.delete(provinceId);
      } else {
        next.add(provinceId);
      }
      return next;
    });
  };

  // Filter provinces by search
  const filteredProvinces = useMemo(() => {
    if (!provinces) return [];
    if (!searchQuery.trim()) return provinces;
    return provinces.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [provinces, searchQuery]);

  // Get holdings for a specific province
  const getProvinceHoldings = (provinceId: string) => {
    return holdings?.filter(h => h.province_id === provinceId) || [];
  };

  // Calculate total power for a province
  const getProvinceTotalPower = (provinceId: string) => {
    const provinceHoldings = getProvinceHoldings(provinceId);
    return provinceHoldings.reduce((sum, h) => sum + h.level, 0);
  };

  const isLoading = provincesLoading || holdingsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!selectedRealm) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Selecione um reino para ver suas províncias e holdings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Províncias de {selectedRealm.name}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {filteredProvinces.length} províncias
          </span>
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar província..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {filteredProvinces.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {searchQuery ? 'Nenhuma província encontrada' : 'Nenhuma província neste reino'}
          </div>
        ) : (
          filteredProvinces.map((province) => {
            const provinceHoldings = getProvinceHoldings(province.id);
            const totalPower = getProvinceTotalPower(province.id);
            const isExpanded = expandedProvinces.has(province.id);

            return (
              <Collapsible
                key={province.id}
                open={isExpanded}
                onOpenChange={() => toggleProvince(province.id)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{province.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Dev: {province.development} • Mag: {province.magic}
                          {province.cultura && ` • ${province.cultura}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {provinceHoldings.length} holdings
                      </span>
                      {totalPower > 0 && (
                        <span className="font-semibold text-primary">
                          Poder: {totalPower}
                        </span>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-muted pl-4 py-2">
                    {provinceHoldings.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">
                        Nenhum holding nesta província
                      </div>
                    ) : (
                      provinceHoldings.map((holding) => (
                        <div
                          key={holding.id}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => {
                            if (holding.regent_id) {
                              onSelectRegent(holding.regent_id);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {holdingIcons[holding.holding_type]}
                            <span className="text-sm">
                              {holdingLabels[holding.holding_type]}
                            </span>
                            <span className="text-sm font-semibold">
                              ({holding.level})
                            </span>
                          </div>
                          {holding.regent && (
                            <div className="text-sm text-muted-foreground hover:text-primary transition-colors">
                              {holding.regent.code && (
                                <span className="font-mono text-xs mr-1">[{holding.regent.code}]</span>
                              )}
                              {holding.regent.name}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
