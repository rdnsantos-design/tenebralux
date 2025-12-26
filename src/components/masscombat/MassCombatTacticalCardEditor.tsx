import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  MassCombatTacticalCard, 
  MassCombatUnitType,
  MASS_COMBAT_UNIT_TYPES, 
  MASS_COMBAT_CULTURES,
  calculateMassCombatVetCost,
  calculateMinCommand,
  calculateMinStrategy,
  validateMassCombatCard
} from '@/types/MassCombatTacticalCard';
import { Swords, Shield, Zap, Crown, Target, Save, X, Sparkles } from 'lucide-react';

interface MassCombatTacticalCardEditorProps {
  card?: MassCombatTacticalCard;
  onSave: (card: Omit<MassCombatTacticalCard, 'id' | 'created_at' | 'updated_at' | 'vet_cost'>) => void;
  onCancel: () => void;
}

export function MassCombatTacticalCardEditor({ card, onSave, onCancel }: MassCombatTacticalCardEditorProps) {
  const [formData, setFormData] = React.useState({
    name: card?.name || '',
    unit_type: card?.unit_type || 'Infantaria' as MassCombatUnitType,
    attack_bonus: card?.attack_bonus || 0,
    defense_bonus: card?.defense_bonus || 0,
    mobility_bonus: card?.mobility_bonus || 0,
    command_required: card?.command_required || 1,
    strategy_required: card?.strategy_required || 1,
    culture: card?.culture || '',
    description: card?.description || '',
  });

  const vetCost = calculateMassCombatVetCost(formData);
  const minCommand = calculateMinCommand(formData);
  const minStrategy = calculateMinStrategy(formData);
  const errors = validateMassCombatCard(formData);

  // Auto-adjust command and strategy when bonuses change
  React.useEffect(() => {
    if (formData.command_required < minCommand) {
      setFormData(prev => ({ ...prev, command_required: minCommand }));
    }
    if (formData.strategy_required < minStrategy) {
      setFormData(prev => ({ ...prev, strategy_required: minStrategy }));
    }
  }, [formData.attack_bonus, formData.defense_bonus, formData.mobility_bonus, minCommand, minStrategy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.length > 0) return;
    
    onSave({
      ...formData,
      culture: formData.culture || undefined,
      description: formData.description || undefined,
    });
  };

  const generateSuggestion = () => {
    // Generate a random card based on unit type
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
      command_required: bonusValue,
      strategy_required: bonusValue,
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
            <Label className="text-base font-semibold">Bônus (0-3 pontos cada)</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-red-500" />
                  <Label>Ataque: {formData.attack_bonus}</Label>
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
                  <Label>Defesa: {formData.defense_bonus}</Label>
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
                  <Label>Mobilidade: {formData.mobility_bonus}</Label>
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

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-500" />
                <Label>Estratégia Requerida: {formData.strategy_required} (mín: {minStrategy})</Label>
              </div>
              <Slider
                value={[formData.strategy_required]}
                onValueChange={([value]) => setFormData(prev => ({ ...prev, strategy_required: Math.max(value, minStrategy) }))}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Culture and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Custo Total</div>
                <div className="text-3xl font-bold text-primary">{vetCost} VET</div>
              </div>
            </div>
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
