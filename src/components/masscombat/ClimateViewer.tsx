import React, { useState } from 'react';
import { useMassCombatClimates, useMassCombatSeasons, useUpdateMassCombatClimate } from '@/hooks/useMassCombatClimates';
import { MassCombatClimate } from '@/types/MassCombatClimate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, Sun, Cloud, CloudSnow, Thermometer, Wind, Droplets, Zap, Flame, Snowflake } from 'lucide-react';
import { toast } from 'sonner';

const formatMod = (mod: number) => {
  if (mod === 0) return '—';
  return mod > 0 ? `+${mod}` : `${mod}`;
};

const getClimateIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('céu') || lowerName.includes('aberto')) return <Sun className="h-4 w-4" />;
  if (lowerName.includes('neve') || lowerName.includes('nevasca') || lowerName.includes('geada')) return <CloudSnow className="h-4 w-4" />;
  if (lowerName.includes('calor') || lowerName.includes('escaldante')) return <Thermometer className="h-4 w-4" />;
  if (lowerName.includes('desértico') || lowerName.includes('desertico')) return <Flame className="h-4 w-4" />;
  if (lowerName.includes('ártico') || lowerName.includes('artico')) return <Snowflake className="h-4 w-4" />;
  if (lowerName.includes('vento')) return <Wind className="h-4 w-4" />;
  if (lowerName.includes('chuva') || lowerName.includes('névoa')) return <Droplets className="h-4 w-4" />;
  if (lowerName.includes('tempestade') && lowerName.includes('elétrica')) return <Zap className="h-4 w-4" />;
  return <Cloud className="h-4 w-4" />;
};

const getModifierColor = (mod: number) => {
  if (mod < -1) return 'text-red-600 font-bold';
  if (mod < 0) return 'text-red-500';
  if (mod > 0) return 'text-green-500';
  return 'text-muted-foreground';
};

type ModifierField = 
  | 'level1_attack_mod' | 'level1_defense_mod' | 'level1_mobility_mod' | 'level1_strategy_mod'
  | 'level2_attack_mod' | 'level2_defense_mod' | 'level2_mobility_mod' | 'level2_strategy_mod'
  | 'level3_attack_mod' | 'level3_defense_mod' | 'level3_mobility_mod' | 'level3_strategy_mod';

interface EditableCellProps {
  value: number;
  climateId: string;
  field: ModifierField;
  disabled?: boolean;
  onUpdate: (id: string, field: ModifierField, value: number) => void;
}

function EditableCell({ value, climateId, field, disabled, onUpdate }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleBlur = () => {
    setIsEditing(false);
    const newValue = parseInt(editValue, 10);
    if (!isNaN(newValue) && newValue !== value) {
      onUpdate(climateId, field, newValue);
    } else {
      setEditValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value.toString());
      setIsEditing(false);
    }
  };

  if (disabled) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (isEditing) {
    return (
      <Input
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-12 h-6 text-center text-xs p-1"
        autoFocus
      />
    );
  }

  return (
    <span 
      className={`cursor-pointer hover:bg-muted/50 px-2 py-1 rounded ${getModifierColor(value)}`}
      onClick={() => setIsEditing(true)}
      title="Clique para editar"
    >
      {formatMod(value)}
    </span>
  );
}

export function ClimateViewer() {
  const { data: climates, isLoading: loadingClimates } = useMassCombatClimates();
  const { data: seasons, isLoading: loadingSeasons } = useMassCombatSeasons();
  const updateClimate = useUpdateMassCombatClimate();

  const handleUpdateModifier = (climateId: string, field: ModifierField, value: number) => {
    updateClimate.mutate(
      { id: climateId, [field]: value },
      {
        onSuccess: () => {
          toast.success('Modificador atualizado');
        },
        onError: () => {
          toast.error('Erro ao atualizar modificador');
        },
      }
    );
  };

  if (loadingClimates || loadingSeasons) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="climates" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="climates">Climas</TabsTrigger>
          <TabsTrigger value="seasons">Estações</TabsTrigger>
        </TabsList>

        <TabsContent value="climates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tabela de Modificadores de Clima</CardTitle>
              <p className="text-sm text-muted-foreground">
                Níveis progressivos: Leve → Moderado → Severo (clique para editar)
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">Clima</TableHead>
                      <TableHead colSpan={4} className="text-center border-l">Nível 1 (Leve)</TableHead>
                      <TableHead colSpan={4} className="text-center border-l">Nível 2 (Moderado)</TableHead>
                      <TableHead colSpan={4} className="text-center border-l">Nível 3 (Severo)</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10"></TableHead>
                      <TableHead className="text-center text-xs border-l">ATK</TableHead>
                      <TableHead className="text-center text-xs">DEF</TableHead>
                      <TableHead className="text-center text-xs">MOB</TableHead>
                      <TableHead className="text-center text-xs">EST</TableHead>
                      <TableHead className="text-center text-xs border-l">ATK</TableHead>
                      <TableHead className="text-center text-xs">DEF</TableHead>
                      <TableHead className="text-center text-xs">MOB</TableHead>
                      <TableHead className="text-center text-xs">EST</TableHead>
                      <TableHead className="text-center text-xs border-l">ATK</TableHead>
                      <TableHead className="text-center text-xs">DEF</TableHead>
                      <TableHead className="text-center text-xs">MOB</TableHead>
                      <TableHead className="text-center text-xs">EST</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {climates?.map((climate) => (
                      <TableRow key={climate.id}>
                        <TableCell className="sticky left-0 bg-background z-10 font-medium">
                          <div className="flex items-center gap-2">
                            {getClimateIcon(climate.name)}
                            <span>{climate.name}</span>
                          </div>
                        </TableCell>
                        {/* Level 1 */}
                        <TableCell className="text-center border-l">
                          <EditableCell
                            value={climate.level1_attack_mod}
                            climateId={climate.id}
                            field="level1_attack_mod"
                            onUpdate={handleUpdateModifier}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <EditableCell
                            value={climate.level1_defense_mod}
                            climateId={climate.id}
                            field="level1_defense_mod"
                            onUpdate={handleUpdateModifier}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <EditableCell
                            value={climate.level1_mobility_mod}
                            climateId={climate.id}
                            field="level1_mobility_mod"
                            onUpdate={handleUpdateModifier}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <EditableCell
                            value={climate.level1_strategy_mod}
                            climateId={climate.id}
                            field="level1_strategy_mod"
                            onUpdate={handleUpdateModifier}
                          />
                        </TableCell>
                        {/* Level 2 */}
                        <TableCell className="text-center border-l">
                          <EditableCell
                            value={climate.level2_attack_mod}
                            climateId={climate.id}
                            field="level2_attack_mod"
                            disabled={!climate.has_all_levels}
                            onUpdate={handleUpdateModifier}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <EditableCell
                            value={climate.level2_defense_mod}
                            climateId={climate.id}
                            field="level2_defense_mod"
                            disabled={!climate.has_all_levels}
                            onUpdate={handleUpdateModifier}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <EditableCell
                            value={climate.level2_mobility_mod}
                            climateId={climate.id}
                            field="level2_mobility_mod"
                            disabled={!climate.has_all_levels}
                            onUpdate={handleUpdateModifier}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <EditableCell
                            value={climate.level2_strategy_mod}
                            climateId={climate.id}
                            field="level2_strategy_mod"
                            disabled={!climate.has_all_levels}
                            onUpdate={handleUpdateModifier}
                          />
                        </TableCell>
                        {/* Level 3 */}
                        <TableCell className="text-center border-l">
                          <EditableCell
                            value={climate.level3_attack_mod}
                            climateId={climate.id}
                            field="level3_attack_mod"
                            disabled={!climate.has_all_levels}
                            onUpdate={handleUpdateModifier}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <EditableCell
                            value={climate.level3_defense_mod}
                            climateId={climate.id}
                            field="level3_defense_mod"
                            disabled={!climate.has_all_levels}
                            onUpdate={handleUpdateModifier}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <EditableCell
                            value={climate.level3_mobility_mod}
                            climateId={climate.id}
                            field="level3_mobility_mod"
                            disabled={!climate.has_all_levels}
                            onUpdate={handleUpdateModifier}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <EditableCell
                            value={climate.level3_strategy_mod}
                            climateId={climate.id}
                            field="level3_strategy_mod"
                            disabled={!climate.has_all_levels}
                            onUpdate={handleUpdateModifier}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Climate details cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {climates?.map((climate) => (
              <Card key={climate.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getClimateIcon(climate.name)}
                    {climate.name}
                  </CardTitle>
                  {climate.description && (
                    <p className="text-xs text-muted-foreground">{climate.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {climate.level1_description && (
                    <div className="text-sm">
                      <Badge variant="outline" className="mr-2">Leve</Badge>
                      {climate.level1_description}
                    </div>
                  )}
                  {climate.has_all_levels && climate.level2_description && (
                    <div className="text-sm">
                      <Badge variant="secondary" className="mr-2">Moderado</Badge>
                      {climate.level2_description}
                    </div>
                  )}
                  {climate.has_all_levels && climate.level3_description && (
                    <div className="text-sm">
                      <Badge variant="destructive" className="mr-2">Severo</Badge>
                      {climate.level3_description}
                    </div>
                  )}
                  {climate.special_effects && (
                    <p className="text-xs text-muted-foreground italic mt-2">
                      {climate.special_effects}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="seasons" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seasons?.map((season) => (
              <Card key={season.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{season.name}</CardTitle>
                  {season.description && (
                    <p className="text-sm text-muted-foreground">{season.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-green-600">Climas Comuns</h4>
                    <div className="flex flex-wrap gap-1">
                      {season.common_climates.map((climate) => (
                        <Badge key={climate} variant="outline" className="text-xs">
                          {climate}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-yellow-600">Climas Raros</h4>
                    <div className="flex flex-wrap gap-1">
                      {season.rare_climates.length > 0 ? (
                        season.rare_climates.map((climate) => (
                          <Badge key={climate} variant="secondary" className="text-xs">
                            {climate}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Nenhum</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-red-600">Climas Bloqueados</h4>
                    <div className="flex flex-wrap gap-1">
                      {season.blocked_climates.length > 0 ? (
                        season.blocked_climates.map((climate) => (
                          <Badge key={climate} variant="destructive" className="text-xs">
                            {climate}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Nenhum</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Climate escalation rules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Regras de Escalonamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Em cada rodada (15 minutos no jogo), role 1d20:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li><Badge variant="destructive" className="mr-2">1-3</Badge>O clima piora (avança 1 nível)</li>
                <li><Badge variant="secondary" className="mr-2">4-17</Badge>Mantém o clima atual</li>
                <li><Badge variant="outline" className="mr-2">18-20</Badge>Clima melhora (regride 1 nível)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                ⚠️ Clima nunca muda mais de um nível por rodada. Personagens com habilidades de previsão ou manipulação do clima podem interferir.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
