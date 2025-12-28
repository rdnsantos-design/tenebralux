import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useDistanceProvinces, useTravelSpeeds, useProvinceDistance } from '@/hooks/useTravel';
import { MapPin, Route, Clock, User, Users, ArrowRight, Loader2, AlertCircle, Plus, Minus } from 'lucide-react';

export function TravelCalculator() {
  const [fromProvince, setFromProvince] = useState('');
  const [toProvince, setToProvince] = useState('');
  const [extraDays, setExtraDays] = useState(0);

  const { data: provinces, isLoading: loadingProvinces } = useDistanceProvinces();
  const { data: speeds } = useTravelSpeeds();
  const { data: distanceData, isLoading: loadingDistance, isFetching } = useProvinceDistance(fromProvince, toProvince);

  const individualSpeed = speeds?.find(s => s.travel_type === 'individual');
  const armySpeed = speeds?.find(s => s.travel_type === 'army');

  const calculation = useMemo(() => {
    if (!distanceData || !individualSpeed || !armySpeed) return null;

    const straightLineDistance = Number(distanceData.distance_km);
    // Land distance is 1.4x straight-line distance
    const landDistance = straightLineDistance * 1.4;
    
    const individualDays = landDistance / Number(individualSpeed.speed_km_per_day);
    const armyDays = landDistance / Number(armySpeed.speed_km_per_day);

    return {
      straightLineDistance,
      landDistance,
      individualDays: Math.ceil(individualDays * 10) / 10, // Round to 1 decimal
      armyDays: Math.ceil(armyDays * 10) / 10,
    };
  }, [distanceData, individualSpeed, armySpeed]);

  const swapProvinces = () => {
    const temp = fromProvince;
    setFromProvince(toProvince);
    setToProvince(temp);
  };

  const handleExtraDaysChange = (delta: number) => {
    setExtraDays(prev => Math.max(0, prev + delta));
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
                {/* Distances */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Distância Aérea</span>
                    <div className="text-2xl font-bold mt-1">
                      {calculation.straightLineDistance.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">km</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Em linha reta</p>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <span className="text-sm text-muted-foreground">Distância Terrestre</span>
                    <div className="text-2xl font-bold mt-1 text-primary">
                      {calculation.landDistance.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">km</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">×1.4 (estradas/terreno)</p>
                  </div>
                </div>

                {/* Extra Days Adjustment */}
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <Label className="text-sm font-medium mb-2 block">Dias extras (dificuldade de terreno)</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleExtraDaysChange(-1)}
                      disabled={extraDays <= 0}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      value={extraDays}
                      onChange={(e) => setExtraDays(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleExtraDaysChange(1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">dias adicionais</span>
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
                        {(calculation.individualDays + extraDays).toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(calculation.individualDays + extraDays) === 1 ? 'dia' : 'dias'}
                      </div>
                      {extraDays > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ({calculation.individualDays} + {extraDays} extras)
                        </div>
                      )}
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
                        {(calculation.armyDays + extraDays).toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(calculation.armyDays + extraDays) === 1 ? 'dia' : 'dias'}
                      </div>
                      {extraDays > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ({calculation.armyDays} + {extraDays} extras)
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground text-center">
                      {armySpeed?.speed_km_per_day} km/dia
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center italic">
                  * Adicione dias extras para terrenos difíceis, montanhas, pântanos, etc.
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