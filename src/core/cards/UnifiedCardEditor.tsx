/**
 * EDITOR UNIFICADO DE CARTAS
 * 
 * Editor dinâmico que adapta campos baseado nos modos de jogo selecionados.
 */

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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UnifiedGameCard, 
  UnifiedCardGameMode,
  UnifiedCardType,
  UNIFIED_CARD_GAME_MODES,
  UNIFIED_SKIRMISH_CARD_TYPES,
  UNIFIED_WARFARE_CARD_TYPES,
  UNIFIED_RPG_CARD_TYPES,
  UNIFIED_DOMINION_CARD_TYPES,
  UNIFIED_CULTURES,
  UNIFIED_SKIRMISH_UNIT_TYPES,
  UNIFIED_CARD_SUBTYPES,
  calculateUnifiedSkirmishVetCost,
  calculateUnifiedWarfareVetCost,
  validateUnifiedGameCard,
} from './types';
import { useCreateUnifiedCard, useUpdateUnifiedCard } from './hooks';
import { toast } from 'sonner';
import { Swords, Shield, Zap, Crown, Save, X, Sparkles, TrendingDown, Star, AlertTriangle } from 'lucide-react';

interface UnifiedCardEditorProps {
  card?: UnifiedGameCard;
  onSave?: (card: UnifiedGameCard) => void;
  onCancel: () => void;
}

export function UnifiedCardEditor({ card, onSave, onCancel }: UnifiedCardEditorProps) {
  const createCard = useCreateUnifiedCard();
  const updateCard = useUpdateUnifiedCard();

  const [formData, setFormData] = React.useState<Partial<UnifiedGameCard>>({
    name: card?.name || '',
    description: card?.description || '',
    gameModes: card?.gameModes || ['warfare'],
    cardType: card?.cardType || 'ofensiva',
    subtype: card?.subtype || 'neutra',
    requirements: card?.requirements || { command: 1, strategy: 0 },
    skirmishBonuses: card?.skirmishBonuses || {},
    skirmishPenalties: card?.skirmishPenalties || {},
    warfareBonuses: card?.warfareBonuses || {},
    warfarePenalties: card?.warfarePenalties || {},
    effects: card?.effects || {},
    vetCost: card?.vetCost || 0,
    vetCostOverride: card?.vetCostOverride,
  });

  const [useVetOverride, setUseVetOverride] = React.useState(card?.vetCostOverride != null);

  // Calculate costs
  const skirmishVetCost = calculateUnifiedSkirmishVetCost(formData);
  const warfareVetCost = calculateUnifiedWarfareVetCost(formData);
  const calculatedVetCost = formData.gameModes?.includes('skirmish') ? skirmishVetCost : warfareVetCost;
  const finalVetCost = useVetOverride && formData.vetCostOverride != null ? formData.vetCostOverride : calculatedVetCost;
  const errors = validateUnifiedGameCard(formData);

  const toggleGameMode = (mode: UnifiedCardGameMode) => {
    setFormData(prev => {
      const modes = prev.gameModes || [];
      const newModes = modes.includes(mode)
        ? modes.filter(m => m !== mode)
        : [...modes, mode];
      return { ...prev, gameModes: newModes.length > 0 ? newModes : [mode] };
    });
  };

  const getCardTypesForModes = (): UnifiedCardType[] => {
    const modes = formData.gameModes || [];
    const types: Set<UnifiedCardType> = new Set();
    
    if (modes.includes('skirmish')) UNIFIED_SKIRMISH_CARD_TYPES.forEach(t => types.add(t));
    if (modes.includes('warfare')) UNIFIED_WARFARE_CARD_TYPES.forEach(t => types.add(t));
    if (modes.includes('rpg')) UNIFIED_RPG_CARD_TYPES.forEach(t => types.add(t));
    if (modes.includes('dominion')) UNIFIED_DOMINION_CARD_TYPES.forEach(t => types.add(t));
    
    return Array.from(types);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    try {
      const cardData = {
        ...formData,
        vetCost: finalVetCost,
        vetCostOverride: useVetOverride ? formData.vetCostOverride : undefined,
      } as Omit<UnifiedGameCard, 'id' | 'created_at' | 'updated_at'>;

      if (card?.id) {
        const result = await updateCard.mutateAsync({ id: card.id, ...cardData });
        toast.success('Carta atualizada!');
        onSave?.(result);
      } else {
        const result = await createCard.mutateAsync(cardData);
        toast.success('Carta criada!');
        onSave?.(result);
      }
      onCancel();
    } catch (error) {
      toast.error('Erro ao salvar carta');
      console.error(error);
    }
  };

  const showSkirmishFields = formData.gameModes?.includes('skirmish');
  const showWarfareFields = formData.gameModes?.includes('warfare');

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>{card ? 'Editar Carta' : 'Nova Carta'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Modes Selection */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Modos de Jogo</Label>
            <div className="flex flex-wrap gap-2">
              {UNIFIED_CARD_GAME_MODES.map(mode => (
                <Badge
                  key={mode.value}
                  variant={formData.gameModes?.includes(mode.value) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleGameMode(mode.value)}
                >
                  {mode.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Name and Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="card_type">Tipo de Carta</Label>
              <Select
                value={formData.cardType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cardType: value as UnifiedCardType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getCardTypesForModes().map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtype">Subtipo</Label>
              <Select
                value={formData.subtype || 'neutra'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subtype: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIFIED_CARD_SUBTYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mode-specific fields */}
          <Tabs defaultValue={showSkirmishFields ? 'skirmish' : 'warfare'} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {showSkirmishFields && <TabsTrigger value="skirmish">Tabuleiro Tático</TabsTrigger>}
              {showWarfareFields && <TabsTrigger value="warfare">Card Game</TabsTrigger>}
            </TabsList>

            {showSkirmishFields && (
              <TabsContent value="skirmish" className="space-y-4">
                {/* Unit Type for Skirmish */}
                <div className="space-y-2">
                  <Label>Tipo de Unidade Afetada</Label>
                  <Select
                    value={formData.requirements?.unitType || 'Geral'}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      requirements: { ...prev.requirements, unitType: value as any }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIFIED_SKIRMISH_UNIT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Skirmish Bonuses */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Swords className="h-4 w-4 text-green-500" />
                    Bônus de Combate
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Swords className="h-4 w-4 text-red-500" />
                        <Label>Ataque: +{formData.skirmishBonuses?.attack || 0}</Label>
                      </div>
                      <Slider
                        value={[formData.skirmishBonuses?.attack || 0]}
                        onValueChange={([value]) => setFormData(prev => ({
                          ...prev,
                          skirmishBonuses: { ...prev.skirmishBonuses, attack: value }
                        }))}
                        max={3}
                        step={1}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        <Label>Defesa: +{formData.skirmishBonuses?.defense || 0}</Label>
                      </div>
                      <Slider
                        value={[formData.skirmishBonuses?.defense || 0]}
                        onValueChange={([value]) => setFormData(prev => ({
                          ...prev,
                          skirmishBonuses: { ...prev.skirmishBonuses, defense: value }
                        }))}
                        max={3}
                        step={1}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <Label>Mobilidade: +{formData.skirmishBonuses?.mobility || 0}</Label>
                      </div>
                      <Slider
                        value={[formData.skirmishBonuses?.mobility || 0]}
                        onValueChange={([value]) => setFormData(prev => ({
                          ...prev,
                          skirmishBonuses: { ...prev.skirmishBonuses, mobility: value }
                        }))}
                        max={3}
                        step={1}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            {showWarfareFields && (
              <TabsContent value="warfare" className="space-y-4">
                {/* Warfare Bonuses */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Swords className="h-4 w-4 text-green-500" />
                    Bônus de Exército
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Swords className="h-4 w-4 text-red-500" />
                        <Label>Ataque: +{formData.warfareBonuses?.attack || 0}</Label>
                      </div>
                      <Slider
                        value={[formData.warfareBonuses?.attack || 0]}
                        onValueChange={([value]) => setFormData(prev => ({
                          ...prev,
                          warfareBonuses: { ...prev.warfareBonuses, attack: value }
                        }))}
                        max={3}
                        step={1}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        <Label>Defesa: +{formData.warfareBonuses?.defense || 0}</Label>
                      </div>
                      <Slider
                        value={[formData.warfareBonuses?.defense || 0]}
                        onValueChange={([value]) => setFormData(prev => ({
                          ...prev,
                          warfareBonuses: { ...prev.warfareBonuses, defense: value }
                        }))}
                        max={3}
                        step={1}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <Label>Mobilidade: +{formData.warfareBonuses?.mobility || 0}</Label>
                      </div>
                      <Slider
                        value={[formData.warfareBonuses?.mobility || 0]}
                        onValueChange={([value]) => setFormData(prev => ({
                          ...prev,
                          warfareBonuses: { ...prev.warfareBonuses, mobility: value }
                        }))}
                        max={3}
                        step={1}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>

          {/* Effects */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Efeitos e Condições
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minor_effect">Efeito Menor (+2 VET)</Label>
                <Input
                  id="minor_effect"
                  value={formData.effects?.minorEffect || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    effects: { ...prev.effects, minorEffect: e.target.value }
                  }))}
                  placeholder="Descreva o efeito menor..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major_effect">Efeito Maior (+4 VET)</Label>
                <Input
                  id="major_effect"
                  value={formData.effects?.majorEffect || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    effects: { ...prev.effects, majorEffect: e.target.value }
                  }))}
                  placeholder="Descreva o efeito maior..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minor_condition">Condição Menor (-1 VET)</Label>
                <Input
                  id="minor_condition"
                  value={formData.effects?.minorCondition || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    effects: { ...prev.effects, minorCondition: e.target.value }
                  }))}
                  placeholder="Descreva a condição menor..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major_condition">Condição Maior (-2 VET)</Label>
                <Input
                  id="major_condition"
                  value={formData.effects?.majorCondition || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    effects: { ...prev.effects, majorCondition: e.target.value }
                  }))}
                  placeholder="Descreva a condição maior..."
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-500" />
                <Label>Comando Necessário: {formData.requirements?.command || 1}</Label>
              </div>
              <Slider
                value={[formData.requirements?.command || 1]}
                onValueChange={([value]) => setFormData(prev => ({
                  ...prev,
                  requirements: { ...prev.requirements, command: value }
                }))}
                min={1}
                max={5}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="culture">Cultura (opcional)</Label>
              <Select
                value={formData.requirements?.culture || 'none'}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  requirements: { ...prev.requirements, culture: value === 'none' ? undefined : value as any }
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {UNIFIED_CULTURES.map(culture => (
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
                      setFormData(prev => ({ ...prev, vetCostOverride: undefined }));
                    } else {
                      setFormData(prev => ({ ...prev, vetCostOverride: calculatedVetCost }));
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
                  value={formData.vetCostOverride ?? 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, vetCostOverride: parseInt(e.target.value) || 0 }))}
                  className="w-24"
                />
              </div>
            )}
          </div>

          {/* Description */}
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
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg">
              <ul className="list-disc list-inside text-sm">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={errors.length > 0 || createCard.isPending || updateCard.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {card ? 'Atualizar' : 'Criar'} Carta
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
