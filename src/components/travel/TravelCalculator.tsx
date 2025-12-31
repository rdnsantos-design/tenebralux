import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTravelSpeeds } from '@/hooks/useTravel';
import { MapPin, Route, Clock, User, Users, Plus, Trash2, Mountain, TreePine, Waves, Snowflake, Sun, Milestone } from 'lucide-react';

// Terrain types with their travel time modifiers (1.0 = normal, higher = slower)
const TERRAIN_TYPES = [
  { id: 'planicie', name: 'Planície', modifier: 1.0, icon: Sun },
  { id: 'colinas', name: 'Colinas', modifier: 1.2, icon: Mountain },
  { id: 'morros', name: 'Morros', modifier: 1.4, icon: Mountain },
  { id: 'montanhas', name: 'Montanhas', modifier: 2.0, icon: Mountain },
  { id: 'floresta_leve', name: 'Floresta Leve', modifier: 1.3, icon: TreePine },
  { id: 'floresta_densa', name: 'Floresta Densa', modifier: 1.6, icon: TreePine },
  { id: 'alagado', name: 'Alagado', modifier: 1.8, icon: Waves },
  { id: 'tundra', name: 'Tundra', modifier: 1.5, icon: Snowflake },
  { id: 'acidentado', name: 'Acidentado', modifier: 1.5, icon: Mountain },
  { id: 'deserto', name: 'Deserto', modifier: 1.4, icon: Sun },
] as const;

const ROAD_MODIFIER = 0.7; // Roads reduce travel time by 30%
const DEFAULT_DISTANCE_PER_PROVINCE = 50; // km

interface ProvinceSegment {
  id: string;
  name: string;
  terrainId: string;
  hasRoad: boolean;
}

interface TravelSegment {
  from: string;
  to: string;
  provinces: ProvinceSegment[];
}

export function TravelCalculator() {
  const [segments, setSegments] = useState<TravelSegment[]>([
    { from: '', to: '', provinces: [] }
  ]);

  const { data: speeds } = useTravelSpeeds();

  const individualSpeed = speeds?.find(s => s.travel_type === 'individual');
  const armySpeed = speeds?.find(s => s.travel_type === 'army');

  // Add a new destination segment
  const addSegment = () => {
    const lastSegment = segments[segments.length - 1];
    setSegments([
      ...segments,
      { from: lastSegment.to, to: '', provinces: [] }
    ]);
  };

  // Remove a segment
  const removeSegment = (index: number) => {
    if (segments.length <= 1) return;
    const newSegments = segments.filter((_, i) => i !== index);
    // Update the "from" of the next segment if needed
    if (index < newSegments.length && index > 0) {
      newSegments[index].from = newSegments[index - 1].to;
    }
    setSegments(newSegments);
  };

  // Update segment origin/destination
  const updateSegment = (index: number, field: 'from' | 'to', value: string) => {
    const newSegments = [...segments];
    newSegments[index][field] = value;
    
    // If updating "to", update the next segment's "from"
    if (field === 'to' && index < newSegments.length - 1) {
      newSegments[index + 1].from = value;
    }
    
    setSegments(newSegments);
  };

  // Set number of provinces for a segment
  const setProvinceCount = (segmentIndex: number, count: number) => {
    const newSegments = [...segments];
    const currentProvinces = newSegments[segmentIndex].provinces;
    
    if (count > currentProvinces.length) {
      // Add provinces
      for (let i = currentProvinces.length; i < count; i++) {
        currentProvinces.push({
          id: `${segmentIndex}-${i}-${Date.now()}`,
          name: `Província ${i + 1}`,
          terrainId: 'planicie',
          hasRoad: false,
        });
      }
    } else {
      // Remove provinces
      currentProvinces.splice(count);
    }
    
    setSegments(newSegments);
  };

  // Update a province's terrain
  const updateProvinceTerrain = (segmentIndex: number, provinceIndex: number, terrainId: string) => {
    const newSegments = [...segments];
    newSegments[segmentIndex].provinces[provinceIndex].terrainId = terrainId;
    setSegments(newSegments);
  };

  // Update a province's road status
  const updateProvinceRoad = (segmentIndex: number, provinceIndex: number, hasRoad: boolean) => {
    const newSegments = [...segments];
    newSegments[segmentIndex].provinces[provinceIndex].hasRoad = hasRoad;
    setSegments(newSegments);
  };

  // Calculate travel time for a segment
  const calculateSegmentTime = (segment: TravelSegment, speedKmPerDay: number) => {
    if (segment.provinces.length === 0) return 0;

    let totalDays = 0;
    
    segment.provinces.forEach(province => {
      const terrain = TERRAIN_TYPES.find(t => t.id === province.terrainId);
      const terrainMod = terrain?.modifier || 1.0;
      const roadMod = province.hasRoad ? ROAD_MODIFIER : 1.0;
      
      // Distance for this province crossing
      const distance = DEFAULT_DISTANCE_PER_PROVINCE;
      
      // Days = (distance * terrain modifier * road modifier) / speed
      const days = (distance * terrainMod * roadMod) / speedKmPerDay;
      totalDays += days;
    });

    return totalDays;
  };

  // Total calculations
  const totals = useMemo(() => {
    if (!individualSpeed || !armySpeed) return null;

    const totalProvinces = segments.reduce((acc, seg) => acc + seg.provinces.length, 0);
    const totalDistanceBase = totalProvinces * DEFAULT_DISTANCE_PER_PROVINCE;

    const individualDays = segments.reduce(
      (acc, seg) => acc + calculateSegmentTime(seg, Number(individualSpeed.speed_km_per_day)),
      0
    );

    const armyDays = segments.reduce(
      (acc, seg) => acc + calculateSegmentTime(seg, Number(armySpeed.speed_km_per_day)),
      0
    );

    return {
      totalProvinces,
      totalDistanceBase,
      individualDays: Math.ceil(individualDays * 10) / 10,
      armyDays: Math.ceil(armyDays * 10) / 10,
    };
  }, [segments, individualSpeed, armySpeed]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="w-5 h-5" />
          Calculadora de Viagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Segments */}
        {segments.map((segment, segmentIndex) => (
          <div key={segmentIndex} className="p-4 border rounded-lg space-y-4 bg-muted/20">
            {/* Segment Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Milestone className="w-4 h-4" />
                Trecho {segmentIndex + 1}
              </h3>
              {segments.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSegment(segmentIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Origin and Destination */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3 h-3 text-green-500" />
                  Origem
                </Label>
                <Input
                  value={segment.from}
                  onChange={(e) => updateSegment(segmentIndex, 'from', e.target.value)}
                  placeholder="Nome da origem"
                  disabled={segmentIndex > 0}
                  className={segmentIndex > 0 ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3 h-3 text-red-500" />
                  Destino
                </Label>
                <Input
                  value={segment.to}
                  onChange={(e) => updateSegment(segmentIndex, 'to', e.target.value)}
                  placeholder="Nome do destino"
                />
              </div>
            </div>

            {/* Province Count */}
            <div className="space-y-2">
              <Label className="text-xs">Número de províncias a cruzar</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={segment.provinces.length}
                onChange={(e) => setProvinceCount(segmentIndex, Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                className="w-24"
              />
            </div>

            {/* Province Terrains */}
            {segment.provinces.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Terreno de cada província ({DEFAULT_DISTANCE_PER_PROVINCE}km cada)</Label>
                <div className="grid gap-2">
                  {segment.provinces.map((province, provinceIndex) => {
                    const terrain = TERRAIN_TYPES.find(t => t.id === province.terrainId);
                    const TerrainIcon = terrain?.icon || Mountain;
                    
                    return (
                      <div 
                        key={province.id} 
                        className="flex items-center gap-3 p-2 bg-background rounded border"
                      >
                        <span className="text-xs text-muted-foreground w-6">
                          {provinceIndex + 1}.
                        </span>
                        <Select
                          value={province.terrainId}
                          onValueChange={(value) => updateProvinceTerrain(segmentIndex, provinceIndex, value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TERRAIN_TYPES.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                <div className="flex items-center gap-2">
                                  <t.icon className="w-4 h-4" />
                                  <span>{t.name}</span>
                                  <span className="text-xs text-muted-foreground ml-1">
                                    (×{t.modifier})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`road-${province.id}`}
                            checked={province.hasRoad}
                            onCheckedChange={(checked) => 
                              updateProvinceRoad(segmentIndex, provinceIndex, checked === true)
                            }
                          />
                          <Label 
                            htmlFor={`road-${province.id}`} 
                            className="text-xs cursor-pointer"
                          >
                            Estrada
                          </Label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Segment Summary */}
            {segment.provinces.length > 0 && individualSpeed && armySpeed && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  <User className="w-3 h-3 inline mr-1" />
                  Individual: {calculateSegmentTime(segment, Number(individualSpeed.speed_km_per_day)).toFixed(1)} dias
                </div>
                <div className="text-xs text-muted-foreground">
                  <Users className="w-3 h-3 inline mr-1" />
                  Exército: {calculateSegmentTime(segment, Number(armySpeed.speed_km_per_day)).toFixed(1)} dias
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Segment Button */}
        <Button
          variant="outline"
          onClick={addSegment}
          className="w-full"
          disabled={!segments[segments.length - 1].to}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Destino
        </Button>

        {/* Totals */}
        {totals && totals.totalProvinces > 0 && (
          <div className="pt-4 border-t space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Resumo da Viagem
            </h3>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Províncias</div>
                <div className="text-xl font-bold">{totals.totalProvinces}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Distância Base</div>
                <div className="text-xl font-bold">{totals.totalDistanceBase} km</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Trechos</div>
                <div className="text-xl font-bold">{segments.length}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Individual */}
              <div className="p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">{individualSpeed?.label || 'Individual'}</span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {totals.individualDays}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    {totals.individualDays === 1 ? 'dia' : 'dias'}
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
                    {totals.armyDays}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    {totals.armyDays === 1 ? 'dia' : 'dias'}
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  {armySpeed?.speed_km_per_day} km/dia
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded">
              <p className="font-medium mb-2">Modificadores de Terreno:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {TERRAIN_TYPES.map(t => (
                  <span key={t.id}>
                    {t.name}: ×{t.modifier}
                  </span>
                ))}
              </div>
              <p className="mt-2">Estrada: ×{ROAD_MODIFIER} (reduz 30%)</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
