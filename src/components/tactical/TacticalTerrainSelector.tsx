import { useMassCombatData } from '@/hooks/useMassCombatData';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Mountain, TreePine, Sun, Swords, Shield, Footprints, Brain } from 'lucide-react';

export interface TerrainSelection {
  primaryId: string | null;
  secondaryIds: string[];
  seasonId: string | null;
}

interface TacticalTerrainSelectorProps {
  value: TerrainSelection;
  onChange: (value: TerrainSelection) => void;
  disabled?: boolean;
}

export function TacticalTerrainSelector({ 
  value, 
  onChange, 
  disabled 
}: TacticalTerrainSelectorProps) {
  const { 
    primaryTerrains, 
    seasons,
    getCompatibleSecondaries,
    calculateTerrainModifiers,
    isLoading 
  } = useMassCombatData();

  const compatibleSecondaries = value.primaryId 
    ? getCompatibleSecondaries(value.primaryId) 
    : [];

  const modifiers = value.primaryId 
    ? calculateTerrainModifiers(value.primaryId, value.secondaryIds)
    : { attack: 0, defense: 0, mobility: 0, strategy: 0 };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const handlePrimaryChange = (primaryId: string) => {
    onChange({
      ...value,
      primaryId,
      secondaryIds: [], // Reset secondaries when primary changes
    });
  };

  const handleSecondaryToggle = (secondaryId: string) => {
    const newSecondaryIds = value.secondaryIds.includes(secondaryId)
      ? value.secondaryIds.filter(id => id !== secondaryId)
      : [...value.secondaryIds, secondaryId];
    
    onChange({
      ...value,
      secondaryIds: newSecondaryIds.slice(0, 3), // Max 3 secondaries
    });
  };

  const handleSeasonChange = (seasonId: string) => {
    onChange({
      ...value,
      seasonId: seasonId === 'none' ? null : seasonId,
    });
  };

  return (
    <div className="space-y-4">
      {/* Terreno Primário */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Mountain className="h-4 w-4" />
          Terreno Primário
        </Label>
        <Select 
          value={value.primaryId || ''} 
          onValueChange={handlePrimaryChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o terreno..." />
          </SelectTrigger>
          <SelectContent>
            {primaryTerrains.map(terrain => (
              <SelectItem key={terrain.id} value={terrain.id}>
                {terrain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Terrenos Secundários */}
      {value.primaryId && compatibleSecondaries.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <TreePine className="h-4 w-4" />
            Terrenos Secundários (máx. 3)
          </Label>
          <div className="flex flex-wrap gap-2">
            {compatibleSecondaries.map(terrain => (
              <Badge
                key={terrain.id}
                variant={value.secondaryIds.includes(terrain.id) ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${
                  disabled ? 'pointer-events-none opacity-50' : 'hover:bg-primary/80'
                }`}
                onClick={() => !disabled && handleSecondaryToggle(terrain.id)}
              >
                {terrain.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Estação */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          Estação (opcional)
        </Label>
        <Select 
          value={value.seasonId || 'none'} 
          onValueChange={handleSeasonChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sem estação específica" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem estação específica</SelectItem>
            {seasons.map(season => (
              <SelectItem key={season.id} value={season.id}>
                {season.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preview de Modificadores */}
      {value.primaryId && (
        <Card className="bg-muted/50">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Modificadores Combinados</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 pt-0">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="flex flex-col items-center">
                <Swords className="h-4 w-4 mb-1 text-destructive" />
                <span className="text-sm font-medium">
                  {modifiers.attack >= 0 ? '+' : ''}{modifiers.attack}
                </span>
                <span className="text-xs text-muted-foreground">Ataque</span>
              </div>
              <div className="flex flex-col items-center">
                <Shield className="h-4 w-4 mb-1 text-primary" />
                <span className="text-sm font-medium">
                  {modifiers.defense >= 0 ? '+' : ''}{modifiers.defense}
                </span>
                <span className="text-xs text-muted-foreground">Defesa</span>
              </div>
              <div className="flex flex-col items-center">
                <Footprints className="h-4 w-4 mb-1 text-amber-500" />
                <span className="text-sm font-medium">
                  {modifiers.mobility >= 0 ? '+' : ''}{modifiers.mobility}
                </span>
                <span className="text-xs text-muted-foreground">Mobilidade</span>
              </div>
              <div className="flex flex-col items-center">
                <Brain className="h-4 w-4 mb-1 text-purple-500" />
                <span className="text-sm font-medium">
                  {modifiers.strategy >= 0 ? '+' : ''}{modifiers.strategy}
                </span>
                <span className="text-xs text-muted-foreground">Estratégia</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
