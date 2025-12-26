import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Save, Plus } from 'lucide-react';
import { 
  TacticalCard, 
  TacticalCardType, 
  TacticalCardSubtype, 
  TacticalCulture, 
  UnitType,
  CARD_TYPES, 
  CARD_SUBTYPES, 
  CULTURES, 
  UNIT_TYPES,
  calculateCardCost 
} from '@/types/TacticalCard';
import { TacticalCardPreview } from './TacticalCardPreview';

interface TacticalCardEditorProps {
  card?: TacticalCard;
  onSave: (card: Omit<TacticalCard, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const defaultCard: Omit<TacticalCard, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  description: '',
  card_type: 'Ataque',
  subtype: 'Neutra',
  affected_unit_types: [],
  attack_bonus: 0,
  defense_bonus: 0,
  ranged_bonus: 0,
  morale_bonus: 0,
  extra_pressure_damage: 0,
  extra_lethal_damage: 0,
  ignores_pressure: false,
  targets_outside_commander_unit: false,
  affects_enemy_unit: false,
  requires_specialization: false,
  required_command: 0,
  bonus_cultures: [],
  penalty_cultures: [],
};

export function TacticalCardEditor({ card, onSave, onCancel }: TacticalCardEditorProps) {
  const [formData, setFormData] = useState<Omit<TacticalCard, 'id' | 'created_at' | 'updated_at'>>(
    card ? {
      name: card.name,
      description: card.description,
      card_type: card.card_type,
      subtype: card.subtype,
      affected_unit_types: card.affected_unit_types,
      attack_bonus: card.attack_bonus,
      defense_bonus: card.defense_bonus,
      ranged_bonus: card.ranged_bonus,
      morale_bonus: card.morale_bonus,
      extra_pressure_damage: card.extra_pressure_damage,
      extra_lethal_damage: card.extra_lethal_damage,
      ignores_pressure: card.ignores_pressure,
      targets_outside_commander_unit: card.targets_outside_commander_unit,
      affects_enemy_unit: card.affects_enemy_unit,
      requires_specialization: card.requires_specialization,
      required_command: card.required_command,
      bonus_cultures: card.bonus_cultures,
      penalty_cultures: card.penalty_cultures,
    } : defaultCard
  );

  const calculatedCost = calculateCardCost(formData);

  const toggleUnitType = (type: UnitType) => {
    setFormData(prev => ({
      ...prev,
      affected_unit_types: prev.affected_unit_types.includes(type)
        ? prev.affected_unit_types.filter(t => t !== type)
        : [...prev.affected_unit_types, type]
    }));
  };

  const toggleBonusCulture = (culture: TacticalCulture) => {
    // Remover da penalidade se estiver lá
    const newPenalty = formData.penalty_cultures.filter(c => c !== culture);
    
    setFormData(prev => ({
      ...prev,
      bonus_cultures: prev.bonus_cultures.includes(culture)
        ? prev.bonus_cultures.filter(c => c !== culture)
        : [...prev.bonus_cultures, culture],
      penalty_cultures: newPenalty
    }));
  };

  const togglePenaltyCulture = (culture: TacticalCulture) => {
    // Remover do bônus se estiver lá
    const newBonus = formData.bonus_cultures.filter(c => c !== culture);
    
    setFormData(prev => ({
      ...prev,
      penalty_cultures: prev.penalty_cultures.includes(culture)
        ? prev.penalty_cultures.filter(c => c !== culture)
        : [...prev.penalty_cultures, culture],
      bonus_cultures: newBonus
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Carta *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome da carta de combate"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição da carta..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Carta</Label>
                  <Select
                    value={formData.card_type}
                    onValueChange={(value: TacticalCardType) => setFormData(prev => ({ ...prev, card_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      {CARD_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subtipo</Label>
                  <Select
                    value={formData.subtype}
                    onValueChange={(value: TacticalCardSubtype) => setFormData(prev => ({ ...prev, subtype: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      {CARD_SUBTYPES.map(subtype => (
                        <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipos de Unidade Afetada</Label>
                <div className="flex flex-wrap gap-2">
                  {UNIT_TYPES.map(type => (
                    <Badge
                      key={type}
                      variant={formData.affected_unit_types.includes(type) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleUnitType(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bônus de Atributos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bônus de Atributos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'attack_bonus', label: 'Bônus de Ataque' },
                  { key: 'defense_bonus', label: 'Bônus de Defesa' },
                  { key: 'ranged_bonus', label: 'Bônus de Tiro' },
                  { key: 'morale_bonus', label: 'Bônus de Moral' },
                  { key: 'extra_pressure_damage', label: 'Dano de Pressão Extra' },
                  { key: 'extra_lethal_damage', label: 'Dano Letal Extra (Hit)' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={(formData as any)[key] === 1}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, [key]: checked ? 1 : 0 }))
                      }
                    />
                    <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Condições */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Condições</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'ignores_pressure', label: 'Ignora Pressão?' },
                  { key: 'targets_outside_commander_unit', label: 'Fora da unidade do comandante?' },
                  { key: 'affects_enemy_unit', label: 'Afeta unidade inimiga?' },
                  { key: 'requires_specialization', label: 'Exige Especialização?' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={(formData as any)[key]}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, [key]: !!checked }))
                      }
                    />
                    <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="required_command">Comando Exigido</Label>
                <Input
                  id="required_command"
                  type="number"
                  min="0"
                  value={formData.required_command}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    required_command: Math.floor(Math.max(0, parseInt(e.target.value) || 0))
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Culturas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Culturas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Culturas com Bônus (custo -1 cada)</Label>
                <div className="flex flex-wrap gap-2">
                  {CULTURES.map(culture => (
                    <Badge
                      key={culture}
                      variant={formData.bonus_cultures.includes(culture) ? 'default' : 'outline'}
                      className={`cursor-pointer ${formData.bonus_cultures.includes(culture) ? 'bg-green-600' : ''}`}
                      onClick={() => toggleBonusCulture(culture)}
                    >
                      {culture}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Culturas com Penalidade (custo +1 cada)</Label>
                <div className="flex flex-wrap gap-2">
                  {CULTURES.map(culture => (
                    <Badge
                      key={culture}
                      variant={formData.penalty_cultures.includes(culture) ? 'default' : 'outline'}
                      className={`cursor-pointer ${formData.penalty_cultures.includes(culture) ? 'bg-red-600' : ''}`}
                      onClick={() => togglePenaltyCulture(culture)}
                    >
                      {culture}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Preview
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  Custo: {calculatedCost}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TacticalCardPreview card={{ ...formData, id: card?.id || 'preview' } as TacticalCard} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" disabled={!formData.name}>
          <Save className="h-4 w-4 mr-2" />
          {card ? 'Atualizar' : 'Criar'} Carta
        </Button>
      </div>
    </form>
  );
}
