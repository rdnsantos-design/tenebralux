import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, Calculator } from 'lucide-react';
import { 
  CharacterAbility,
  SystemConfig,
  ABILITY_TYPES,
  EFFECT_TYPES,
  CONDITIONAL_TYPES,
  RANGE_TYPES,
  EFFECT_TYPE_LABELS,
  CONDITIONAL_TYPE_LABELS,
  RANGE_TYPE_LABELS,
  calculateAbilityCost,
  calculateAbilityCostBreakdown,
  AbilityType,
  EffectType,
  ConditionalType,
  RangeType
} from '@/types/CharacterCard';
import { toast } from 'sonner';

interface AbilityLibraryProps {
  abilities: CharacterAbility[];
  config: SystemConfig;
  onCreateAbility: (ability: Omit<CharacterAbility, 'id' | 'created_at' | 'updated_at'>) => Promise<unknown>;
  onUpdateAbility: (id: string, ability: Partial<CharacterAbility>) => Promise<unknown>;
  onDeleteAbility: (id: string) => Promise<unknown>;
}

const AFFECTED_ATTRIBUTES = ['Ataque', 'Defesa', 'Mobilidade', 'Comando', 'Estratégia', 'Guarda'];

export function AbilityLibrary({ 
  abilities, 
  config, 
  onCreateAbility, 
  onUpdateAbility, 
  onDeleteAbility 
}: AbilityLibraryProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAbility, setEditingAbility] = useState<CharacterAbility | null>(null);
  const [useManualCost, setUseManualCost] = useState(false);
  const [formData, setFormData] = useState<Partial<CharacterAbility>>({
    name: '',
    description: '',
    ability_type: 'Passiva',
    effect_type: 'buff_self',
    affected_attribute: '',
    attribute_modifier: 0,
    conditional_type: 'none',
    conditional_description: '',
    range_type: 'self',
    base_power_cost: 0,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      ability_type: 'Passiva',
      effect_type: 'buff_self',
      affected_attribute: '',
      attribute_modifier: 0,
      conditional_type: 'none',
      conditional_description: '',
      range_type: 'self',
      base_power_cost: 0,
    });
    setEditingAbility(null);
    setUseManualCost(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (ability: CharacterAbility) => {
    setEditingAbility(ability);
    setFormData({ ...ability });
    setUseManualCost(ability.base_power_cost > 0);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      // If not using manual cost, set base_power_cost to 0 to use auto calculation
      const dataToSave = {
        ...formData,
        base_power_cost: useManualCost ? (formData.base_power_cost || 0) : 0
      };

      if (editingAbility) {
        await onUpdateAbility(editingAbility.id, dataToSave);
      } else {
        await onCreateAbility({
          name: dataToSave.name!,
          description: dataToSave.description,
          ability_type: dataToSave.ability_type as AbilityType,
          effect_type: dataToSave.effect_type as EffectType,
          affected_attribute: dataToSave.affected_attribute,
          attribute_modifier: dataToSave.attribute_modifier || 0,
          conditional_type: dataToSave.conditional_type as ConditionalType,
          conditional_description: dataToSave.conditional_description,
          range_type: dataToSave.range_type as RangeType,
          base_power_cost: dataToSave.base_power_cost || 0,
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      // Error handled by hook
    }
  };

  // Calculate cost breakdown for display
  const costBreakdown = calculateAbilityCostBreakdown(
    useManualCost ? { ...formData, base_power_cost: 0 } : formData, 
    config
  );
  const effectiveCost = useManualCost 
    ? Math.max(0, (formData.base_power_cost || 0) - (config.conditional_discounts[formData.conditional_type || 'none'] || 0))
    : calculateAbilityCost(formData, config);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Biblioteca de Habilidades</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Habilidade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAbility ? 'Editar Habilidade' : 'Nova Habilidade'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ability_name">Nome</Label>
                  <Input
                    id="ability_name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Formação de Lança"
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={formData.ability_type}
                    onValueChange={value => setFormData(prev => ({ 
                      ...prev, 
                      ability_type: value as AbilityType 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ABILITY_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="ability_desc">Descrição</Label>
                <Textarea
                  id="ability_desc"
                  value={formData.description || ''}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o efeito da habilidade..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Efeito</Label>
                  <Select
                    value={formData.effect_type}
                    onValueChange={value => setFormData(prev => ({ 
                      ...prev, 
                      effect_type: value as EffectType 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EFFECT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {EFFECT_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Alcance</Label>
                  <Select
                    value={formData.range_type}
                    onValueChange={value => setFormData(prev => ({ 
                      ...prev, 
                      range_type: value as RangeType 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RANGE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {RANGE_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Atributo Afetado</Label>
                  <Select
                    value={formData.affected_attribute || 'none'}
                    onValueChange={value => setFormData(prev => ({ 
                      ...prev, 
                      affected_attribute: value === 'none' ? undefined : value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {AFFECTED_ATTRIBUTES.map(attr => (
                        <SelectItem key={attr} value={attr}>{attr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Modificador</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={formData.attribute_modifier || 0}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        attribute_modifier: parseInt(e.target.value) || 0 
                      }))}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formData.effect_type === 'buff_self' ? '+' : '-'}
                      {Math.abs(formData.attribute_modifier || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Condicional</Label>
                  <Select
                    value={formData.conditional_type}
                    onValueChange={value => setFormData(prev => ({ 
                      ...prev, 
                      conditional_type: value as ConditionalType 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONAL_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {CONDITIONAL_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.conditional_type !== 'none' && (
                  <div>
                    <Label>Descrição da Condicional</Label>
                    <Input
                      value={formData.conditional_description || ''}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        conditional_description: e.target.value 
                      }))}
                      placeholder="Ex: Apenas em terreno montanhoso"
                    />
                  </div>
                )}
              </div>

              {/* Power Cost Section */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base font-medium">Custo de Poder</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="manual_cost"
                      checked={useManualCost}
                      onCheckedChange={checked => setUseManualCost(!!checked)}
                    />
                    <Label htmlFor="manual_cost" className="text-sm">Sobrescrever manualmente</Label>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">
                      {useManualCost ? 'Custo Manual' : 'Custo Calculado'}
                    </span>
                    <span className="text-2xl font-bold">{effectiveCost} Poder</span>
                  </div>
                  
                  {!useManualCost && costBreakdown.breakdown.length > 0 && (
                    <div className="space-y-1 text-sm border-t pt-2">
                      {costBreakdown.breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-muted-foreground">
                          <span>{item.label}</span>
                          <span className={item.value >= 0 ? 'text-orange-500' : 'text-green-500'}>
                            {item.value >= 0 ? '+' : ''}{item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {useManualCost && (
                    <div className="mt-2">
                      <Input
                        type="number"
                        step="0.5"
                        value={formData.base_power_cost || 0}
                        onChange={e => setFormData(prev => ({ 
                          ...prev, 
                          base_power_cost: parseFloat(e.target.value) || 0 
                        }))}
                        className="w-32"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Desconto condicional: -{config.conditional_discounts[formData.conditional_type || 'none'] || 0}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingAbility ? 'Atualizar' : 'Criar'} Habilidade
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {abilities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma habilidade cadastrada. Crie a primeira!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {abilities.map(ability => (
            <Card key={ability.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{ability.name}</CardTitle>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {ability.ability_type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {calculateAbilityCost(ability, config)} Poder
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => handleOpenEdit(ability)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir habilidade?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteAbility(ability.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ability.description && (
                  <p className="text-sm text-muted-foreground mb-2">{ability.description}</p>
                )}
                <div className="flex flex-wrap gap-1 text-xs">
                  <Badge variant="outline">{EFFECT_TYPE_LABELS[ability.effect_type]}</Badge>
                  <Badge variant="outline">{RANGE_TYPE_LABELS[ability.range_type]}</Badge>
                  {ability.affected_attribute && (
                    <Badge variant="outline">
                      {ability.effect_type === 'buff_self' ? '+' : '-'}
                      {ability.attribute_modifier} {ability.affected_attribute}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
