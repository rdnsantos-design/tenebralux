import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useDistanceProvinces, useTravelSpeeds, useProvinceDistance } from '@/hooks/useTravel';
import { MapPin, Route, Clock, User, Users, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export function TravelCalculator() {
  const [fromProvince, setFromProvince] = useState('');
  const [toProvince, setToProvince] = useState('');

  const { data: provinces, isLoading: loadingProvinces } = useDistanceProvinces();
  const { data: speeds } = useTravelSpeeds();
  const { data: distanceData, isLoading: loadingDistance, isFetching } = useProvinceDistance(fromProvince, toProvince);

  const individualSpeed = speeds?.find(s => s.travel_type === 'individual');
  const armySpeed = speeds?.find(s => s.travel_type === 'army');

  const calculation = useMemo(() => {
    if (!distanceData || !individualSpeed || !armySpeed) return null;

    // Multiply straight-line distance by 10 to account for terrain/road factors
    const straightLineDistance = Number(distanceData.distance_km);
    const adjustedDistance = straightLineDistance * 10;
    
    const individualDays = adjustedDistance / Number(individualSpeed.speed_km_per_day);
    const armyDays = adjustedDistance / Number(armySpeed.speed_km_per_day);

    return {
      straightLineDistance,
      adjustedDistance,
      individualDays: Math.ceil(individualDays * 10) / 10, // Round to 1 decimal
      armyDays: Math.ceil(armyDays * 10) / 10,
    };
  }, [distanceData, individualSpeed, armySpeed]);

  const swapProvinces = () => {
    const temp = fromProvince;
    setFromProvince(toProvince);
    setToProvince(temp);
  };

  if (loadingProvinces) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!provinces || provinces.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhuma distância cadastrada</p>
            <p className="text-sm mt-1">Importe a matriz de distâncias primeiro</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="w-5 h-5" />
          Calculadora de Viagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Province Selection */}
        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" />
              Origem
            </Label>
            <Select value={fromProvince} onValueChange={setFromProvince}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {provinces.map(p => (
                  <SelectItem key={p} value={p} disabled={p === toProvince}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={swapProvinces}
            disabled={!fromProvince || !toProvince}
            className="mb-0.5"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              Destino
            </Label>
            <Select value={toProvince} onValueChange={setToProvince}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o destino" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {provinces.map(p => (
                  <SelectItem key={p} value={p} disabled={p === fromProvince}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {fromProvince && toProvince && (
          <div className="pt-4 border-t">
            {isFetching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : calculation ? (
              <div className="space-y-4">
                {/* Distance */}
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Distância em linha reta</span>
                  <div className="text-3xl font-bold mt-1">
                    {calculation.straightLineDistance.toFixed(1)} <span className="text-lg font-normal text-muted-foreground">km</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Distância ajustada: <span className="font-medium">{calculation.adjustedDistance.toFixed(1)} km</span> (×10)
                  </div>
                </div>

                {/* Travel Times */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Individual */}
                  <div className="p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">{individualSpeed?.label || 'Indivíduo'}</span>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {calculation.individualDays}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {calculation.individualDays === 1 ? 'dia' : 'dias'}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground text-center">
                      {individualSpeed?.speed_km_per_day} km/dia
                    </div>
                  </div>

                  {/* Army */}
                  <div className="p-4 border rounded-lg bg-amber-500/5 border-amber-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-amber-500" />
                      <span className="font-medium">{armySpeed?.label || 'Exército'}</span>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {calculation.armyDays}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {calculation.armyDays === 1 ? 'dia' : 'dias'}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground text-center">
                      {armySpeed?.speed_km_per_day} km/dia
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center italic">
                  * Tempo base sem modificadores de terreno
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Distância não encontrada entre estas províncias</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
