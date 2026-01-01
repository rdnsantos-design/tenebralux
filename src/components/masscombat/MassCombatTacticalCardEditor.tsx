import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MassCombatTacticalCard, 
  MassCombatUnitType,
  MASS_COMBAT_UNIT_TYPES, 
  MASS_COMBAT_CULTURES,
  calculateMassCombatVetCost,
  calculateMinCommand,
  validateMassCombatCard
} from '@/types/MassCombatTacticalCard';
import { Swords, Shield, Zap, Crown, Save, X, Sparkles, TrendingDown, Star, AlertTriangle } from 'lucide-react';

interface MassCombatTacticalCardEditorProps {
  card?: MassCombatTacticalCard;
  onSave: (card: Omit<MassCombatTacticalCard, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

export function MassCombatTacticalCardEditor({ card, onSave, onCancel }: MassCombatTacticalCardEditorProps) {
  const [formData, setFormData] = React.useState({
    name: card?.name || '',
    unit_type: card?.unit_type || 'Infantaria' as MassCombatUnitType,
    attack_bonus: card?.attack_bonus || 0,
    defense_bonus: card?.defense_bonus || 0,
    mobility_bonus: card?.mobility_bonus || 0,
    attack_penalty: card?.attack_penalty || 0,
    defense_penalty: card?.defense_penalty || 0,
    mobility_penalty: card?.mobility_penalty || 0,
    command_required: card?.command_required || 1,
    strategy_required: card?.strategy_required || 1,
    culture: card?.culture || '',
    description: card?.description || '',
    has_minor_effect: !!card?.minor_effect,
    has_major_effect: !!card?.major_effect,
    has_minor_condition: !!card?.minor_condition,
    has_major_condition: !!card?.major_condition,
    vet_cost_override: card?.vet_cost_override ?? null,
  });

  const [useVetOverride, setUseVetOverride] = React.useState(card?.vet_cost_override !== null && card?.vet_cost_override !== undefined);

  // Convert checkbox state to the format expected by calculateMassCombatVetCost
  const vetCalcData = {
    ...formData,
    minor_effect: formData.has_minor_effect ? 'yes' : '',
    major_effect: formData.has_major_effect ? 'yes' : '',
    minor_condition: formData.has_minor_condition ? 'yes' : '',
    major_condition: formData.has_major_condition ? 'yes' : '',
  };
  const calculatedVetCost = calculateMassCombatVetCost(vetCalcData);
  const finalVetCost = useVetOverride && formData.vet_cost_override !== null ? formData.vet_cost_override : calculatedVetCost;
  const minCommand = calculateMinCommand(formData);
  const errors = validateMassCombatCard(formData);

  // Auto-adjust command when bonuses change
  React.useEffect(() => {
    if (formData.command_required < minCommand) {
      setFormData(prev => ({ ...prev, command_required: minCommand }));
    }
  }, [formData.attack_bonus, formData.defense_bonus, formData.mobility_bonus, minCommand]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.length > 0) return;
    
    onSave({
      name: formData.name,
      unit_type: formData.unit_type,
      attack_bonus: formData.attack_bonus,
      defense_bonus: formData.defense_bonus,
      mobility_bonus: formData.mobility_bonus,
      attack_penalty: formData.attack_penalty,
      defense_penalty: formData.defense_penalty,
      mobility_penalty: formData.mobility_penalty,
      command_required: formData.command_required,
      strategy_required: formData.strategy_required,
      culture: formData.culture || undefined,
      description: formData.description || undefined,
      minor_effect: formData.has_minor_effect ? 'Sim' : undefined,
      major_effect: formData.has_major_effect ? 'Sim' : undefined,
      minor_condition: formData.has_minor_condition ? 'Sim' : undefined,
      major_condition: formData.has_major_condition ? 'Sim' : undefined,
      vet_cost: finalVetCost,
      vet_cost_override: useVetOverride ? formData.vet_cost_override : null,
    });
  };

  const generateSuggestion = () => {
    const bonusTypes = ['attack', 'defense', 'mobility'];
    const randomBonus = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
    const bonusValue = Math.floor(Math.random() * 3) + 1;
    
    const names: Record<string, string[]> = {
      Infantaria: ['Formação de Escudos', 'Avanço Implacável', 'Muralha de Aço', 'Linha Firme'],
      Cavalaria: ['Carga Devastadora', 'Flanqueamento', 'Ataque Relâmpago', 'Perseguição'],
      Arqueiros: ['Chuva de Flechas', 'Tiro de Supressão', 'Fogo Concentrado', 'Emboscada'],
      Cerco: ['Bombardeio', 'Fogo de Cobertura', 'Assédio', 'Destruição de Muralhas'],
      Geral: ['Inspiração', 'Coordenação Tática', 'Ordem de Batalha', 'Manobra Estratégica'],
    };

    const selectedNames = names[formData.unit_type] || names.Geral;
    const randomName = selectedNames[Math.floor(Math.random() * selectedNames.length)];

    setFormData(prev => ({
      ...prev,
      name: randomName,
      attack_bonus: randomBonus === 'attack' ? bonusValue : 0,
      defense_bonus: randomBonus === 'defense' ? bonusValue : 0,
      mobility_bonus: randomBonus === 'mobility' ? bonusValue : 0,
      attack_penalty: 0,
      defense_penalty: 0,
      mobility_penalty: 0,
      command_required: bonusValue,
    }));
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>{card ? 'Editar Carta Tática' : 'Nova Carta Tática'}</span>
          <Button variant="outline" size="sm" onClick={generateSuggestion}>
            <Sparkles className="h-4 w-4 mr-2" />
            Sugerir
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name and Unit Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Carta *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Carga Devastadora"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_type">Tipo de Unidade *</Label>
              <Select
                value={formData.unit_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, unit_type: value as MassCombatUnitType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MASS_COMBAT_UNIT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bonuses */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Swords className="h-4 w-4 text-green-500" />
              Bônus (+1 VET cada)
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-red-500" />
                  <Label>Ataque: +{formData.attack_bonus}</Label>
                </div>
                <Slider
                  value={[formData.attack_bonus]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, attack_bonus: value }))}
                  max={3}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <Label>Defesa: +{formData.defense_bonus}</Label>
                </div>
                <Slider
                  value={[formData.defense_bonus]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, defense_bonus: value }))}
                  max={3}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <Label>Mobilidade: +{formData.mobility_bonus}</Label>
                </div>
                <Slider
                  value={[formData.mobility_bonus]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, mobility_bonus: value }))}
                  max={3}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Penalties */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Penalidades (não afetam VET)
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-red-400" />
                  <Label>Ataque: -{formData.attack_penalty}</Label>
                </div>
                <Slider
                  value={[formData.attack_penalty]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, attack_penalty: value }))}
                  max={3}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <Label>Defesa: -{formData.defense_penalty}</Label>
                </div>
                <Slider
                  value={[formData.defense_penalty]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, defense_penalty: value }))}
                  max={3}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <Label>Mobilidade: -{formData.mobility_penalty}</Label>
                </div>
                <Slider
                  value={[formData.mobility_penalty]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, mobility_penalty: value }))}
                  max={3}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Effects and Conditions */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Efeitos e Condições
            </Label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="minor_effect"
                  checked={formData.has_minor_effect}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_minor_effect: !!checked }))}
                />
                <Label htmlFor="minor_effect" className="text-sm cursor-pointer">
                  Efeito Menor (+2 VET)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="major_effect"
                  checked={formData.has_major_effect}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_major_effect: !!checked }))}
                />
                <Label htmlFor="major_effect" className="text-sm cursor-pointer">
                  Efeito Maior (+4 VET)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="minor_condition"
                  checked={formData.has_minor_condition}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_minor_condition: !!checked }))}
                />
                <Label htmlFor="minor_condition" className="text-sm cursor-pointer flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  Condição Menor (-1 VET)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="major_condition"
                  checked={formData.has_major_condition}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_major_condition: !!checked }))}
                />
                <Label htmlFor="major_condition" className="text-sm cursor-pointer flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  Condição Maior (-2 VET)
                </Label>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-500" />
                <Label>Comando Necessário: {formData.command_required} (mín: {minCommand})</Label>
              </div>
              <Slider
                value={[formData.command_required]}
                onValueChange={([value]) => setFormData(prev => ({ ...prev, command_required: Math.max(value, minCommand) }))}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="culture">Cultura (opcional)</Label>
              <Select
                value={formData.culture}
                onValueChange={(value) => setFormData(prev => ({ ...prev, culture: value === 'none' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {MASS_COMBAT_CULTURES.map(culture => (
                    <SelectItem key={culture} value={culture}>{culture}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* VET Cost */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Custo Calculado</div>
                <div className="text-2xl font-bold text-muted-foreground">{calculatedVetCost} VET</div>
              </div>
              
              <div className="flex items-center gap-3">
                <Label htmlFor="vet-override" className="text-sm">Override Manual</Label>
                <Switch
                  id="vet-override"
                  checked={useVetOverride}
                  onCheckedChange={(checked) => {
                    setUseVetOverride(checked);
                    if (!checked) {
                      setFormData(prev => ({ ...prev, vet_cost_override: null }));
                    } else {
                      setFormData(prev => ({ ...prev, vet_cost_override: calculatedVetCost }));
                    }
                  }}
                />
              </div>

              <div className="text-center">
                <div className="text-sm text-muted-foreground">Custo Final</div>
                <div className="text-3xl font-bold text-primary">{finalVetCost} VET</div>
              </div>
            </div>

            {useVetOverride && (
              <div className="flex items-center gap-4">
                <Label htmlFor="vet_manual">Custo VET Manual:</Label>
                <Input
                  id="vet_manual"
                  type="number"
                  min={0}
                  value={formData.vet_cost_override ?? 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, vet_cost_override: parseInt(e.target.value) || 0 }))}
                  className="w-24"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição narrativa do efeito da carta..."
              rows={3}
            />
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <ul className="list-disc list-inside text-sm text-destructive">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={errors.length > 0}>
              <Save className="h-4 w-4 mr-2" />
              {card ? 'Atualizar' : 'Criar'} Carta
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
