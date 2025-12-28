import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useRegents } from '@/hooks/useRegents';
import { toast } from 'sonner';
import { Upload, X, Save, ArrowLeft, User, Users, Crown, RefreshCw } from 'lucide-react';
import { 
  CharacterCard, 
  CharacterAbility,
  SystemConfig,
  CHARACTER_TYPES,
  PASSIVE_BONUS_TYPES,
  calculatePowerCost,
  CharacterType,
  Specialty
} from '@/types/CharacterCard';

interface CharacterCardEditorProps {
  character?: CharacterCard;
  abilities: CharacterAbility[];
  config: SystemConfig;
  onSave: (character: Omit<CharacterCard, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

export function CharacterCardEditor({ 
  character, 
  abilities, 
  config, 
  onSave, 
  onCancel 
}: CharacterCardEditorProps) {
  const { data: regents } = useRegents();
  
  const [formData, setFormData] = useState<Partial<CharacterCard>>({
    name: '',
    character_type: [],
    culture: config.cultures[0] || 'Anuire',
    is_pc: false,
    player_name: '',
    regent_id: undefined,
    comando: 1,
    estrategia: 1,
    guarda: 2,
    passive_bonus_type: undefined,
    passive_bonus_value: 0,
    passive_affects_area: false,
    specialties: [],
    ability_id: undefined,
    custom_ability_name: '',
    custom_ability_description: '',
    custom_ability_power_cost: 0,
    total_power_cost: 0,
    power_cost_override: undefined,
    portrait_url: '',
    coat_of_arms_url: '',
    domain: '',
    notes: '',
  });

  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [uploadingCoat, setUploadingCoat] = useState(false);
  const [useCustomAbility, setUseCustomAbility] = useState(false);

  useEffect(() => {
    if (character) {
      setFormData({
        ...character,
      });
      setUseCustomAbility(!!character.custom_ability_name && !character.ability_id);
    }
  }, [character]);

  // Recalculate power cost whenever relevant fields change
  useEffect(() => {
    const calculatedCost = calculatePowerCost(formData, config);
    setFormData(prev => ({
      ...prev,
      total_power_cost: prev.power_cost_override ?? calculatedCost
    }));
  }, [
    formData.comando, 
    formData.estrategia, 
    formData.guarda,
    formData.passive_bonus_value,
    formData.passive_affects_area,
    formData.custom_ability_power_cost,
    formData.power_cost_override,
    formData.specialties,
    config
  ]);

  const handleImageUpload = async (type: 'portrait' | 'coat', file: File) => {
    const setUploading = type === 'portrait' ? setUploadingPortrait : setUploadingCoat;
    const urlField = type === 'portrait' ? 'portrait_url' : 'coat_of_arms_url';
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `character-${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('character-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('character-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, [urlField]: publicUrl }));
      toast.success(`${type === 'portrait' ? 'Retrato' : 'Brasão'} carregado!`);
    } catch (err) {
      toast.error(`Erro ao carregar ${type === 'portrait' ? 'retrato' : 'brasão'}`);
    } finally {
      setUploading(false);
    }
  };

  const toggleCharacterType = (type: CharacterType) => {
    setFormData(prev => {
      const current = prev.character_type || [];
      if (current.includes(type)) {
        return { ...prev, character_type: current.filter(t => t !== type) };
      }
      return { ...prev, character_type: [...current, type] };
    });
  };

  const toggleSpecialty = (specialty: Specialty) => {
    setFormData(prev => {
      const current = prev.specialties || [];
      if (current.includes(specialty)) {
        return { ...prev, specialties: current.filter(s => s !== specialty) };
      }
      return { ...prev, specialties: [...current, specialty] };
    });
  };

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!formData.character_type || formData.character_type.length === 0) {
      toast.error('Selecione pelo menos um tipo de personagem');
      return;
    }

    const calculatedCost = calculatePowerCost(formData, config);
    
    await onSave({
      name: formData.name!,
      character_type: formData.character_type as CharacterType[],
      culture: formData.culture!,
      is_pc: formData.is_pc || false,
      player_name: formData.is_pc ? formData.player_name : undefined,
      regent_id: formData.character_type?.includes('Regente') ? formData.regent_id : undefined,
      comando: formData.comando || 0,
      estrategia: formData.estrategia || 0,
      guarda: formData.guarda || 0,
      passive_bonus_type: formData.passive_bonus_type,
      passive_bonus_value: formData.passive_bonus_value || 0,
      passive_affects_area: formData.passive_affects_area || false,
      specialties: (formData.specialties || []) as Specialty[],
      ability_id: useCustomAbility ? undefined : formData.ability_id,
      custom_ability_name: useCustomAbility ? formData.custom_ability_name : undefined,
      custom_ability_description: useCustomAbility ? formData.custom_ability_description : undefined,
      custom_ability_power_cost: formData.custom_ability_power_cost || 0,
      total_power_cost: formData.power_cost_override ?? calculatedCost,
      power_cost_override: formData.power_cost_override,
      portrait_url: formData.portrait_url,
      coat_of_arms_url: formData.coat_of_arms_url,
      domain: formData.domain,
      notes: formData.notes,
    });
  };

  const calculatedCost = calculatePowerCost(formData, config);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle>{character ? 'Editar Personagem' : 'Novo Personagem'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Identity Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Personagem</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Sir Darion de Valhor"
              />
            </div>

            {/* PC/NPC Selection */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                {formData.is_pc ? (
                  <User className="w-4 h-4 text-primary" />
                ) : (
                  <Users className="w-4 h-4 text-muted-foreground" />
                )}
                <Label htmlFor="is_pc" className="cursor-pointer">
                  {formData.is_pc ? 'Personagem de Jogador (PC)' : 'Non-Player Character (NPC)'}
                </Label>
              </div>
              <Switch
                id="is_pc"
                checked={formData.is_pc || false}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, is_pc: checked }))}
              />
            </div>

            {/* Player Name - only shown when PC */}
            {formData.is_pc && (
              <div>
                <Label htmlFor="player_name">Nome do Jogador</Label>
                <Input
                  id="player_name"
                  value={formData.player_name || ''}
                  onChange={e => setFormData(prev => ({ ...prev, player_name: e.target.value }))}
                  placeholder="Nome do jogador que controla este personagem"
                />
              </div>
            )}

            <div>
              <Label>Tipo de Personagem</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CHARACTER_TYPES.map(type => (
                  <Badge
                    key={type}
                    variant={formData.character_type?.includes(type) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleCharacterType(type)}
                  >
                    {type === 'Regente' && <Crown className="w-3 h-3 mr-1" />}
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Regent Section - only shown when Regente type is selected */}
            {formData.character_type?.includes('Regente') && (
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Crown className="w-4 h-4" />
                  <Label className="font-semibold">Configuração de Regente</Label>
                </div>
                
                <div>
                  <Label htmlFor="regent_replace" className="text-sm flex items-center gap-2 mb-2">
                    <RefreshCw className="w-3 h-3" />
                    Substituir Regente Existente
                  </Label>
                  <Select
                    value={formData.regent_id || 'none'}
                    onValueChange={value => {
                      const regent = regents?.find(r => r.id === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        regent_id: value === 'none' ? undefined : value,
                        domain: regent?.name || prev.domain
                      }));
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione um regente para assumir seu domínio" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border shadow-md z-50">
                      <SelectItem value="none">Nenhum (criar novo domínio)</SelectItem>
                      {regents?.map(regent => (
                        <SelectItem key={regent.id} value={regent.id}>
                          {regent.code && <span className="font-mono text-xs mr-2">[{regent.code}]</span>}
                          {regent.name}
                          {regent.full_name && <span className="text-muted-foreground ml-1">({regent.full_name})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ao selecionar um regente, este personagem assumirá todos os holdings desse domínio.
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="culture">Cultura</Label>
              <Select
                value={formData.culture}
                onValueChange={value => setFormData(prev => ({ ...prev, culture: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  {config.cultures.map(culture => (
                    <SelectItem key={culture} value={culture}>{culture}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="domain">Domínio</Label>
              <Input
                id="domain"
                value={formData.domain || ''}
                onChange={e => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                placeholder="Ex: Baronia de Roesone"
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <div>
              <Label>Retrato</Label>
              <div className="mt-2 flex items-center gap-4">
                {formData.portrait_url ? (
                  <div className="relative">
                    <img 
                      src={formData.portrait_url} 
                      alt="Retrato" 
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setFormData(prev => ({ ...prev, portrait_url: '' }))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleImageUpload('portrait', e.target.files[0])}
                      disabled={uploadingPortrait}
                    />
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label>Brasão</Label>
              <div className="mt-2 flex items-center gap-4">
                {formData.coat_of_arms_url ? (
                  <div className="relative">
                    <img 
                      src={formData.coat_of_arms_url} 
                      alt="Brasão" 
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setFormData(prev => ({ ...prev, coat_of_arms_url: '' }))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleImageUpload('coat', e.target.files[0])}
                      disabled={uploadingCoat}
                    />
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Attributes Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Atributos Básicos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Comando</Label>
                <span className="text-sm text-muted-foreground">
                  Custo: {((formData.comando || 0) * config.attribute_costs.comando).toFixed(1)} Poder
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[formData.comando || 0]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, comando: value }))}
                  min={0}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold">{formData.comando}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Estratégia</Label>
                <span className="text-sm text-muted-foreground">
                  Custo: {((formData.estrategia || 0) * config.attribute_costs.estrategia).toFixed(1)} Poder
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[formData.estrategia || 0]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, estrategia: value }))}
                  min={0}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold">{formData.estrategia}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Guarda (HP)</Label>
                <span className="text-sm text-muted-foreground">
                  Custo: {((formData.guarda || 0) * config.attribute_costs.guarda).toFixed(1)} Poder
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[formData.guarda || 0]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, guarda: value }))}
                  min={0}
                  max={20}
                  step={1}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold">{formData.guarda}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Passive Bonus Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Bônus Passivo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label>Atributo Afetado</Label>
              <Select
                value={formData.passive_bonus_type || 'none'}
                onValueChange={value => setFormData(prev => ({ 
                  ...prev, 
                  passive_bonus_type: value === 'none' ? undefined : value as typeof prev.passive_bonus_type,
                  passive_bonus_value: value === 'none' ? 0 : prev.passive_bonus_value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {PASSIVE_BONUS_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.passive_bonus_type && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Valor do Bônus</Label>
                    <span className="text-sm text-muted-foreground">
                      Custo: {config.passive_bonus_costs[formData.passive_bonus_value?.toString() || '0'] || 0} Poder
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.passive_bonus_value || 0]}
                      onValueChange={([value]) => setFormData(prev => ({ ...prev, passive_bonus_value: value }))}
                      min={1}
                      max={3}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-8 text-center font-bold">+{formData.passive_bonus_value}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="passive_area"
                    checked={formData.passive_affects_area}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, passive_affects_area: !!checked }))}
                  />
                  <Label htmlFor="passive_area" className="text-sm">
                    Afeta área de influência (+{config.passive_area_cost} Poder)
                  </Label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Specialties Section */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Especialidades</h3>
            {(formData.specialties?.length || 0) > 1 && (
              <span className="text-sm text-muted-foreground">
                Custo total: {((formData.specialties?.length || 0) - 1) * (formData.specialties?.length || 0) / 2 * 3} Poder
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {config.specialties.map((specialty, idx) => {
              const currentCount = formData.specialties?.length || 0;
              const isSelected = formData.specialties?.includes(specialty as Specialty);
              const nextCost = isSelected ? null : (currentCount * 3);
              
              return (
                <Badge
                  key={specialty}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleSpecialty(specialty as Specialty)}
                  title={isSelected ? 'Clique para remover' : `Custo: ${nextCost === 0 ? 'Grátis' : `${nextCost} Poder`}`}
                >
                  {specialty}
                  {!isSelected && nextCost !== null && (
                    <span className="ml-1 text-xs opacity-70">
                      ({nextCost === 0 ? 'grátis' : `+${nextCost}`})
                    </span>
                  )}
                </Badge>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            1ª grátis, 2ª custa 3, 3ª custa 6, 4ª custa 9 Poder
          </p>
        </div>

        {/* Special Ability Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Habilidade Especial</h3>
          
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant={!useCustomAbility ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseCustomAbility(false)}
            >
              Selecionar da Biblioteca
            </Button>
            <Button
              variant={useCustomAbility ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseCustomAbility(true)}
            >
              Criar Habilidade Customizada
            </Button>
          </div>

          {!useCustomAbility ? (
            <div>
              <Label>Habilidade</Label>
              <Select
                value={formData.ability_id || 'none'}
                onValueChange={value => setFormData(prev => ({ 
                  ...prev, 
                  ability_id: value === 'none' ? undefined : value,
                  custom_ability_power_cost: value === 'none' ? 0 : 
                    (abilities.find(a => a.id === value)?.base_power_cost || 0)
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {abilities.map(ability => (
                    <SelectItem key={ability.id} value={ability.id}>
                      {ability.name} ({ability.base_power_cost} Poder)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.ability_id && (
                <p className="text-sm text-muted-foreground mt-2">
                  {abilities.find(a => a.id === formData.ability_id)?.description}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom_ability_name">Nome da Habilidade</Label>
                <Input
                  id="custom_ability_name"
                  value={formData.custom_ability_name || ''}
                  onChange={e => setFormData(prev => ({ ...prev, custom_ability_name: e.target.value }))}
                  placeholder="Ex: Formação de Lança"
                />
              </div>
              <div>
                <Label htmlFor="custom_ability_description">Descrição e Efeito</Label>
                <Textarea
                  id="custom_ability_description"
                  value={formData.custom_ability_description || ''}
                  onChange={e => setFormData(prev => ({ ...prev, custom_ability_description: e.target.value }))}
                  placeholder="Descreva o efeito mecânico da habilidade..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Custo em Poder</Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.custom_ability_power_cost} Poder
                  </span>
                </div>
                <Slider
                  value={[formData.custom_ability_power_cost || 0]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, custom_ability_power_cost: value }))}
                  min={0}
                  max={10}
                  step={0.5}
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="border-t pt-6">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Notas adicionais sobre o personagem..."
            rows={3}
          />
        </div>

        {/* Power Cost Summary */}
        <div className="border-t pt-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Custo Total de Poder</h3>
                <p className="text-sm text-muted-foreground">
                  Calculado automaticamente baseado nos atributos
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{calculatedCost.toFixed(1)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Checkbox
                    id="override"
                    checked={formData.power_cost_override !== undefined}
                    onCheckedChange={checked => setFormData(prev => ({
                      ...prev,
                      power_cost_override: checked ? calculatedCost : undefined
                    }))}
                  />
                  <Label htmlFor="override" className="text-sm">Sobrescrever</Label>
                </div>
                {formData.power_cost_override !== undefined && (
                  <Input
                    type="number"
                    className="w-20 mt-2"
                    value={formData.power_cost_override}
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      power_cost_override: parseFloat(e.target.value) || 0 
                    }))}
                    step="0.5"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Personagem
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
