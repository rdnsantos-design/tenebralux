import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, Crown, Building, Shield, Store, Church, Sparkles } from 'lucide-react';
import { useRegents } from '@/hooks/useRegents';
import { useHoldings } from '@/hooks/useHoldings';
import { useProvinces } from '@/hooks/useDomains';
import { Regent, HoldingType } from '@/types/Domain';

const holdingIcons: Record<HoldingType, React.ElementType> = {
  ordem: Shield,
  guilda: Store,
  templo: Church,
  fonte_magica: Sparkles,
};

const holdingLabels: Record<HoldingType, string> = {
  ordem: 'Ordem',
  guilda: 'Guilda',
  templo: 'Templo',
  fonte_magica: 'Fonte Mágica',
};

interface RegentWithPower extends Regent {
  totalPower: number;
  holdingsCount: number;
}

interface RegentDomainListProps {
  selectedRegentId?: string | null;
  onClearSelection?: () => void;
}

export const RegentDomainList = ({ selectedRegentId, onClearSelection }: RegentDomainListProps) => {
  const { data: regents, isLoading: isLoadingRegents } = useRegents();
  const { data: holdings, isLoading: isLoadingHoldings } = useHoldings();
  const { data: provinces } = useProvinces();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegent, setSelectedRegent] = useState<Regent | null>(null);

  // Auto-select regent when selectedRegentId changes
  useEffect(() => {
    if (selectedRegentId && regents) {
      const regent = regents.find(r => r.id === selectedRegentId);
      if (regent) {
        setSelectedRegent(regent);
      }
    }
  }, [selectedRegentId, regents]);

  // Calculate power for each regent
  const regentsWithPower = useMemo(() => {
    if (!regents || !holdings) return [];

    return regents.map((regent) => {
      const regentHoldings = holdings.filter((h) => h.regent_id === regent.id);
      const totalPower = regentHoldings.reduce((sum, h) => sum + h.level, 0);
      return {
        ...regent,
        totalPower,
        holdingsCount: regentHoldings.length,
      } as RegentWithPower;
    }).sort((a, b) => b.totalPower - a.totalPower);
  }, [regents, holdings]);

  // Filter regents by search
  const filteredRegents = useMemo(() => {
    if (!searchQuery.trim()) return regentsWithPower;
    const query = searchQuery.toLowerCase();
    return regentsWithPower.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.full_name?.toLowerCase().includes(query) ||
        r.code?.toLowerCase().includes(query)
    );
  }, [regentsWithPower, searchQuery]);

  // Get holdings for selected regent
  const selectedRegentHoldings = useMemo(() => {
    if (!selectedRegent || !holdings) return [];
    return holdings.filter((h) => h.regent_id === selectedRegent.id);
  }, [selectedRegent, holdings]);

  // Get province name
  const getProvinceName = (provinceId: string) => {
    const province = provinces?.find((p) => p.id === provinceId);
    return province?.name || 'Desconhecida';
  };

  if (isLoadingRegents || isLoadingHoldings) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Regents List - Sidebar */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="w-5 h-5" />
              Regentes
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar regente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-2 space-y-1">
                {filteredRegents.map((regent) => (
                  <button
                    key={regent.id}
                    onClick={() => setSelectedRegent(regent)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedRegent?.id === regent.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{regent.name}</p>
                        {regent.code && (
                          <p className={`text-xs ${
                            selectedRegent?.id === regent.id
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}>
                            {regent.code}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={selectedRegent?.id === regent.id ? 'secondary' : 'outline'}
                          className="font-bold"
                        >
                          {regent.totalPower}
                        </Badge>
                        <p className={`text-xs mt-1 ${
                          selectedRegent?.id === regent.id
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}>
                          {regent.holdingsCount} holdings
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredRegents.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum regente encontrado
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Holdings for Selected Regent */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                {selectedRegent ? (
                  <>
                    Holdings de {selectedRegent.name}
                    {selectedRegent.full_name && (
                      <span className="text-muted-foreground font-normal text-sm">
                        ({selectedRegent.full_name})
                      </span>
                    )}
                  </>
                ) : (
                  'Selecione um Regente'
                )}
              </div>
              {selectedRegent && (
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    Poder Total: {regentsWithPower.find(r => r.id === selectedRegent.id)?.totalPower || 0}
                  </Badge>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedRegent ? (
              <div className="text-center py-12 text-muted-foreground">
                <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um regente para ver seus holdings</p>
              </div>
            ) : selectedRegentHoldings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Este regente não possui holdings</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedRegentHoldings.map((holding) => {
                  const Icon = holdingIcons[holding.holding_type];
                  return (
                    <Card key={holding.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">
                                {holdingLabels[holding.holding_type]}
                              </p>
                              <Badge variant="outline" className="font-bold text-lg">
                                {holding.level}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {getProvinceName(holding.province_id)}
                            </p>
                            {holding.notes && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                {holding.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
