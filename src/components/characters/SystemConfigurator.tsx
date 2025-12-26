import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Save } from 'lucide-react';
import { SystemConfig, DEFAULT_ABILITY_COST_RULES, AbilityCostRules } from '@/types/CharacterCard';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface SystemConfiguratorProps {
  config: SystemConfig;
  onUpdateConfig: (key: string, value: Json) => Promise<void>;
}

export function SystemConfigurator({ config, onUpdateConfig }: SystemConfiguratorProps) {
  const [newCulture, setNewCulture] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [attributeCosts, setAttributeCosts] = useState(config.attribute_costs);
  const [passiveBonusCosts, setPassiveBonusCosts] = useState(config.passive_bonus_costs);
  const [passiveAreaCost, setPassiveAreaCost] = useState(config.passive_area_cost);
  const [conditionalDiscounts, setConditionalDiscounts] = useState(config.conditional_discounts);
  const [abilityCostRules, setAbilityCostRules] = useState<AbilityCostRules>(
    config.ability_cost_rules || DEFAULT_ABILITY_COST_RULES
  );

  useEffect(() => {
    setAttributeCosts(config.attribute_costs);
    setPassiveBonusCosts(config.passive_bonus_costs);
    setPassiveAreaCost(config.passive_area_cost);
    setConditionalDiscounts(config.conditional_discounts);
    setAbilityCostRules(config.ability_cost_rules || DEFAULT_ABILITY_COST_RULES);
  }, [config]);

  const handleAddCulture = async () => {
    if (!newCulture.trim()) return;
    if (config.cultures.includes(newCulture.trim())) {
      toast.error('Cultura já existe');
      return;
    }
    const updatedCultures = [...config.cultures, newCulture.trim()];
    await onUpdateConfig('cultures', updatedCultures);
    setNewCulture('');
  };

  const handleRemoveCulture = async (culture: string) => {
    const updatedCultures = config.cultures.filter(c => c !== culture);
    await onUpdateConfig('cultures', updatedCultures);
  };

  const handleAddSpecialty = async () => {
    if (!newSpecialty.trim()) return;
    if (config.specialties.includes(newSpecialty.trim())) {
      toast.error('Especialidade já existe');
      return;
    }
    const updatedSpecialties = [...config.specialties, newSpecialty.trim()];
    await onUpdateConfig('specialties', updatedSpecialties);
    setNewSpecialty('');
  };

  const handleRemoveSpecialty = async (specialty: string) => {
    const updatedSpecialties = config.specialties.filter(s => s !== specialty);
    await onUpdateConfig('specialties', updatedSpecialties);
  };

  const handleSaveAttributeCosts = async () => {
    await onUpdateConfig('attribute_costs', attributeCosts as unknown as Json);
  };

  const handleSavePassiveBonusCosts = async () => {
    await onUpdateConfig('passive_bonus_costs', passiveBonusCosts as unknown as Json);
  };

  const handleSavePassiveAreaCost = async () => {
    await onUpdateConfig('passive_area_cost', passiveAreaCost);
  };

  const handleSaveConditionalDiscounts = async () => {
    await onUpdateConfig('conditional_discounts', conditionalDiscounts as unknown as Json);
  };

  const handleSaveAbilityCostRules = async () => {
    await onUpdateConfig('ability_cost_rules', abilityCostRules as unknown as Json);
  };

  return (
    <div className="space-y-6">
      {/* Attribute Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Custos de Atributos</CardTitle>
          <CardDescription>
            Define quanto de Poder cada ponto de atributo custa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cost_comando">Comando (por ponto)</Label>
              <Input
                id="cost_comando"
                type="number"
                step="0.5"
                value={attributeCosts.comando}
                onChange={e => setAttributeCosts(prev => ({ 
                  ...prev, 
                  comando: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            <div>
              <Label htmlFor="cost_estrategia">Estratégia (por ponto)</Label>
              <Input
                id="cost_estrategia"
                type="number"
                step="0.5"
                value={attributeCosts.estrategia}
                onChange={e => setAttributeCosts(prev => ({ 
                  ...prev, 
                  estrategia: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            <div>
              <Label htmlFor="cost_guarda">Guarda (por ponto)</Label>
              <Input
                id="cost_guarda"
                type="number"
                step="0.5"
                value={attributeCosts.guarda}
                onChange={e => setAttributeCosts(prev => ({ 
                  ...prev, 
                  guarda: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
          </div>
          <Button onClick={handleSaveAttributeCosts} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Salvar Custos
          </Button>
        </CardContent>
      </Card>

      {/* Passive Bonus Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Custos de Bônus Passivo</CardTitle>
          <CardDescription>
            Define o custo em Poder para cada nível de bônus passivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="bonus_1">Bônus +1</Label>
              <Input
                id="bonus_1"
                type="number"
                step="0.5"
                value={passiveBonusCosts['1'] || 0}
                onChange={e => setPassiveBonusCosts(prev => ({ 
                  ...prev, 
                  '1': parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            <div>
              <Label htmlFor="bonus_2">Bônus +2</Label>
              <Input
                id="bonus_2"
                type="number"
                step="0.5"
                value={passiveBonusCosts['2'] || 0}
                onChange={e => setPassiveBonusCosts(prev => ({ 
                  ...prev, 
                  '2': parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            <div>
              <Label htmlFor="bonus_3">Bônus +3</Label>
              <Input
                id="bonus_3"
                type="number"
                step="0.5"
                value={passiveBonusCosts['3'] || 0}
                onChange={e => setPassiveBonusCosts(prev => ({ 
                  ...prev, 
                  '3': parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            <div>
              <Label htmlFor="area_cost">Custo Área</Label>
              <Input
                id="area_cost"
                type="number"
                step="0.5"
                value={passiveAreaCost}
                onChange={e => setPassiveAreaCost(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSavePassiveBonusCosts} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Bônus
            </Button>
            <Button onClick={handleSavePassiveAreaCost} size="sm" variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Salvar Área
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ability Cost Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Regras de Custo de Habilidades</CardTitle>
          <CardDescription>
            Define como o custo de poder das habilidades é calculado automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base modifier cost */}
          <div>
            <Label htmlFor="per_modifier">Custo por ponto de modificador</Label>
            <Input
              id="per_modifier"
              type="number"
              step="0.5"
              className="w-32"
              value={abilityCostRules.per_modifier_point}
              onChange={e => setAbilityCostRules(prev => ({ 
                ...prev, 
                per_modifier_point: parseFloat(e.target.value) || 0 
              }))}
            />
          </div>

          {/* Range costs */}
          <div>
            <Label className="text-base font-medium">Custos por Alcance</Label>
            <div className="grid grid-cols-4 gap-4 mt-2">
              <div>
                <Label htmlFor="range_self" className="text-xs">Próprio</Label>
                <Input
                  id="range_self"
                  type="number"
                  step="0.5"
                  value={abilityCostRules.range_costs.self}
                  onChange={e => setAbilityCostRules(prev => ({ 
                    ...prev, 
                    range_costs: { ...prev.range_costs, self: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="range_unit" className="text-xs">Unidade</Label>
                <Input
                  id="range_unit"
                  type="number"
                  step="0.5"
                  value={abilityCostRules.range_costs.unit}
                  onChange={e => setAbilityCostRules(prev => ({ 
                    ...prev, 
                    range_costs: { ...prev.range_costs, unit: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="range_area" className="text-xs">Área</Label>
                <Input
                  id="range_area"
                  type="number"
                  step="0.5"
                  value={abilityCostRules.range_costs.area}
                  onChange={e => setAbilityCostRules(prev => ({ 
                    ...prev, 
                    range_costs: { ...prev.range_costs, area: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="range_enemy" className="text-xs">Inimigo</Label>
                <Input
                  id="range_enemy"
                  type="number"
                  step="0.5"
                  value={abilityCostRules.range_costs.enemy}
                  onChange={e => setAbilityCostRules(prev => ({ 
                    ...prev, 
                    range_costs: { ...prev.range_costs, enemy: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Type costs */}
          <div>
            <Label className="text-base font-medium">Custos por Tipo de Habilidade</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label htmlFor="type_passiva" className="text-xs">Passiva</Label>
                <Input
                  id="type_passiva"
                  type="number"
                  step="0.5"
                  value={abilityCostRules.type_costs['Passiva']}
                  onChange={e => setAbilityCostRules(prev => ({ 
                    ...prev, 
                    type_costs: { ...prev.type_costs, 'Passiva': parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="type_ativavel" className="text-xs">Ativável</Label>
                <Input
                  id="type_ativavel"
                  type="number"
                  step="0.5"
                  value={abilityCostRules.type_costs['Ativável']}
                  onChange={e => setAbilityCostRules(prev => ({ 
                    ...prev, 
                    type_costs: { ...prev.type_costs, 'Ativável': parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="type_once" className="text-xs">Uma vez por batalha</Label>
                <Input
                  id="type_once"
                  type="number"
                  step="0.5"
                  value={abilityCostRules.type_costs['Uma vez por batalha']}
                  onChange={e => setAbilityCostRules(prev => ({ 
                    ...prev, 
                    type_costs: { ...prev.type_costs, 'Uma vez por batalha': parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Effect costs */}
          <div>
            <Label className="text-base font-medium">Custos por Tipo de Efeito</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="effect_buff" className="text-xs">Buff (si/aliados)</Label>
                <Input
                  id="effect_buff"
                  type="number"
                  step="0.5"
                  value={abilityCostRules.effect_costs.buff_self}
                  onChange={e => setAbilityCostRules(prev => ({ 
                    ...prev, 
                    effect_costs: { ...prev.effect_costs, buff_self: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="effect_debuff" className="text-xs">Debuff (inimigo)</Label>
                <Input
                  id="effect_debuff"
                  type="number"
                  step="0.5"
                  value={abilityCostRules.effect_costs.debuff_enemy}
                  onChange={e => setAbilityCostRules(prev => ({ 
                    ...prev, 
                    effect_costs: { ...prev.effect_costs, debuff_enemy: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveAbilityCostRules} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Salvar Regras de Habilidade
          </Button>
        </CardContent>
      </Card>

      {/* Conditional Discounts */}
      <Card>
        <CardHeader>
          <CardTitle>Descontos Condicionais</CardTitle>
          <CardDescription>
            Define quantos pontos de Poder são reduzidos por tipo de condicional em habilidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cond_none">Sem Condicional</Label>
              <Input
                id="cond_none"
                type="number"
                step="0.5"
                value={conditionalDiscounts.none}
                onChange={e => setConditionalDiscounts(prev => ({ 
                  ...prev, 
                  none: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            <div>
              <Label htmlFor="cond_light">Condicional Leve</Label>
              <Input
                id="cond_light"
                type="number"
                step="0.5"
                value={conditionalDiscounts.light}
                onChange={e => setConditionalDiscounts(prev => ({ 
                  ...prev, 
                  light: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            <div>
              <Label htmlFor="cond_heavy">Condicional Pesada</Label>
              <Input
                id="cond_heavy"
                type="number"
                step="0.5"
                value={conditionalDiscounts.heavy}
                onChange={e => setConditionalDiscounts(prev => ({ 
                  ...prev, 
                  heavy: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
          </div>
          <Button onClick={handleSaveConditionalDiscounts} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Salvar Descontos
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Cultures */}
      <Card>
        <CardHeader>
          <CardTitle>Culturas</CardTitle>
          <CardDescription>
            Gerencie as culturas disponíveis para personagens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {config.cultures.map(culture => (
              <Badge key={culture} variant="secondary" className="gap-1">
                {culture}
                <button
                  onClick={() => handleRemoveCulture(culture)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nova cultura..."
              value={newCulture}
              onChange={e => setNewCulture(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddCulture()}
            />
            <Button onClick={handleAddCulture} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Specialties */}
      <Card>
        <CardHeader>
          <CardTitle>Especialidades</CardTitle>
          <CardDescription>
            Gerencie as especialidades disponíveis para personagens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {config.specialties.map(specialty => (
              <Badge key={specialty} variant="secondary" className="gap-1">
                {specialty}
                <button
                  onClick={() => handleRemoveSpecialty(specialty)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nova especialidade..."
              value={newSpecialty}
              onChange={e => setNewSpecialty(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddSpecialty()}
            />
            <Button onClick={handleAddSpecialty} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
