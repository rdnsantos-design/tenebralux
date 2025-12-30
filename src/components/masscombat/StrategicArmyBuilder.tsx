import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Minus, 
  Swords, 
  Shield, 
  Zap, 
  Heart, 
  Users, 
  MapPin,
  Save,
  Trash2,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { useRegents } from '@/hooks/useRegents';
import { useRealms, useProvinces } from '@/hooks/useDomains';
import { useMassCombatTacticalCards } from '@/hooks/useMassCombatTacticalCards';
import { useMassCombatCommanderTemplates, MassCombatCommanderTemplate } from '@/hooks/useMassCombatCommanderTemplates';
import {
  StrategicArmy,
  StrategicArmyCommander,
  StrategicArmyCard,
  VET_PER_ATTRIBUTE_POINT,
  calculateVetSpent,
  calculateHitPoints,
  calculateDefense,
  createEmptyStrategicArmy,
} from '@/types/combat/strategic-army';

interface StrategicArmyBuilderProps {
  army?: StrategicArmy;
  onSave: (army: StrategicArmy) => void;
  onCancel: () => void;
}

export function StrategicArmyBuilder({ army, onSave, onCancel }: StrategicArmyBuilderProps) {
  const { data: regents } = useRegents();
  const { data: realms } = useRealms();
  const { data: provinces } = useProvinces();
  const { cards: tacticalCards } = useMassCombatTacticalCards();
  const { templates: commanderTemplates } = useMassCombatCommanderTemplates();

  const [formData, setFormData] = useState<Partial<StrategicArmy>>(() => {
    return army || createEmptyStrategicArmy();
  });

  const vetInfo = useMemo(() => calculateVetSpent(formData), [formData]);

  const filteredProvinces = useMemo(() => {
    if (!formData.realmId || !provinces) return [];
    return provinces.filter(p => p.realm_id === formData.realmId);
  }, [formData.realmId, provinces]);

  // Handlers para atributos
  const handleAttributeChange = (attr: 'attackPurchased' | 'defensePurchased' | 'mobilityPurchased', delta: number) => {
    const currentValue = formData[attr] || 0;
    const newValue = Math.max(0, currentValue + delta);
    
    // Verificar se tem VET suficiente
    const newFormData = { ...formData, [attr]: newValue };
    const newVetInfo = calculateVetSpent(newFormData);
    
    if (newVetInfo.remaining < 0) {
      toast.error('VET insuficiente!');
      return;
    }
    
    setFormData(newFormData);
  };

  // Handler para adicionar comandante
  const handleAddCommander = (template: MassCombatCommanderTemplate) => {
    const newVetInfo = calculateVetSpent({
      ...formData,
      commanders: [
        ...(formData.commanders || []),
        {
          templateId: template.id,
          templateNumber: template.numero,
          especializacao: template.especializacao,
          comando: template.comando,
          estrategia: template.estrategia,
          guarda: template.guarda,
          custoVet: template.custo_vet,
        },
      ],
    });
    
    if (newVetInfo.remaining < 0) {
      toast.error('VET insuficiente!');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      commanders: [
        ...(prev.commanders || []),
        {
          templateId: template.id,
          templateNumber: template.numero,
          especializacao: template.especializacao,
          comando: template.comando,
          estrategia: template.estrategia,
          guarda: template.guarda,
          custoVet: template.custo_vet,
        },
      ],
    }));
  };

  // Handler para remover comandante
  const handleRemoveCommander = (index: number) => {
    setFormData(prev => ({
      ...prev,
      commanders: (prev.commanders || []).filter((_, i) => i !== index),
    }));
  };

  // Handler para adicionar carta tática
  const handleAddTacticalCard = (card: { id: string; name: string; vet_cost: number }) => {
    const existing = (formData.tacticalCards || []).find(c => c.cardId === card.id);
    
    const newCards = existing
      ? (formData.tacticalCards || []).map(c =>
          c.cardId === card.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      : [
          ...(formData.tacticalCards || []),
          { cardId: card.id, cardName: card.name, vetCost: card.vet_cost, quantity: 1 },
        ];
    
    const newVetInfo = calculateVetSpent({ ...formData, tacticalCards: newCards });
    
    if (newVetInfo.remaining < 0) {
      toast.error('VET insuficiente!');
      return;
    }
    
    setFormData(prev => ({ ...prev, tacticalCards: newCards }));
  };

  // Handler para remover carta tática
  const handleRemoveTacticalCard = (cardId: string) => {
    setFormData(prev => {
      const existing = (prev.tacticalCards || []).find(c => c.cardId === cardId);
      if (!existing) return prev;
      
      if (existing.quantity > 1) {
        return {
          ...prev,
          tacticalCards: (prev.tacticalCards || []).map(c =>
            c.cardId === cardId ? { ...c, quantity: c.quantity - 1 } : c
          ),
        };
      }
      
      return {
        ...prev,
        tacticalCards: (prev.tacticalCards || []).filter(c => c.cardId !== cardId),
      };
    });
  };

  // Handler para salvar
  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast.error('Nome do exército é obrigatório!');
      return;
    }
    
    if (vetInfo.remaining < 0) {
      toast.error('VET excedido!');
      return;
    }
    
    const selectedRegent = regents?.find(r => r.id === formData.regentId);
    const selectedRealm = realms?.find(r => r.id === formData.realmId);
    const selectedProvince = provinces?.find(p => p.id === formData.provinceId);
    
    const completeArmy: StrategicArmy = {
      id: army?.id || crypto.randomUUID(),
      name: formData.name!,
      regentId: formData.regentId,
      regentName: selectedRegent?.name,
      realmId: formData.realmId,
      realmName: selectedRealm?.name,
      provinceId: formData.provinceId,
      provinceName: selectedProvince?.name,
      totalVet: formData.totalVet || 100,
      attackPurchased: formData.attackPurchased || 0,
      defensePurchased: formData.defensePurchased || 0,
      mobilityPurchased: formData.mobilityPurchased || 0,
      attack: formData.attackPurchased || 0,
      defense: calculateDefense(formData.defensePurchased || 0),
      mobility: formData.mobilityPurchased || 0,
      hitPoints: calculateHitPoints(formData.totalVet || 100),
      commanders: formData.commanders || [],
      tacticalCards: formData.tacticalCards || [],
      vetSpentOnAttributes: vetInfo.attributes,
      vetSpentOnCommanders: vetInfo.commanders,
      vetSpentOnCards: vetInfo.cards,
      vetRemaining: vetInfo.remaining,
      createdAt: army?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    onSave(completeArmy);
  };

  return (
    <div className="space-y-6">
      {/* Header com resumo de VET */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{formData.totalVet || 100}</div>
                <div className="text-xs text-muted-foreground">VET Total</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{vetInfo.total}</div>
                <div className="text-xs text-muted-foreground">VET Gasto</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className={`text-2xl font-bold ${vetInfo.remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {vetInfo.remaining}
                </div>
                <div className="text-xs text-muted-foreground">VET Restante</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="font-bold">{calculateHitPoints(formData.totalVet || 100)} PV</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Informações básicas e atributos */}
        <div className="space-y-6">
          {/* Informações básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Informações do Exército
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Exército *</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Legião do Norte"
                />
              </div>
              
              <div className="space-y-2">
                <Label>VET Total</Label>
                <Input
                  type="number"
                  min={10}
                  step={10}
                  value={formData.totalVet || 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalVet: parseInt(e.target.value) || 100 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Regente</Label>
                <Select
                  value={formData.regentId || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, regentId: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um regente" />
                  </SelectTrigger>
                  <SelectContent>
                    {regents?.map((regent) => (
                      <SelectItem key={regent.id} value={regent.id}>
                        {regent.name} {regent.domain ? `(${regent.domain})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reino</Label>
                  <Select
                    value={formData.realmId || ''}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      realmId: value || undefined,
                      provinceId: undefined 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {realms?.map((realm) => (
                        <SelectItem key={realm.id} value={realm.id}>
                          {realm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Província</Label>
                  <Select
                    value={formData.provinceId || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, provinceId: value || undefined }))}
                    disabled={!formData.realmId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.realmId ? "Selecione" : "Escolha um reino"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProvinces.map((province) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atributos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="w-5 h-5" />
                Atributos
                <Badge variant="outline" className="ml-auto">
                  {VET_PER_ATTRIBUTE_POINT} VET = 1 ponto
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ataque */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Swords className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="font-medium">Ataque</div>
                    <div className="text-xs text-muted-foreground">
                      Valor final: {formData.attackPurchased || 0}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAttributeChange('attackPurchased', -1)}
                    disabled={(formData.attackPurchased || 0) <= 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-bold">{formData.attackPurchased || 0}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAttributeChange('attackPurchased', 1)}
                    disabled={vetInfo.remaining < VET_PER_ATTRIBUTE_POINT}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Defesa */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Defesa</div>
                    <div className="text-xs text-muted-foreground">
                      Valor final: 5 + {formData.defensePurchased || 0} = {calculateDefense(formData.defensePurchased || 0)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAttributeChange('defensePurchased', -1)}
                    disabled={(formData.defensePurchased || 0) <= 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-bold">{formData.defensePurchased || 0}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAttributeChange('defensePurchased', 1)}
                    disabled={vetInfo.remaining < VET_PER_ATTRIBUTE_POINT}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Mobilidade */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <div>
                    <div className="font-medium">Mobilidade</div>
                    <div className="text-xs text-muted-foreground">
                      Valor final: {formData.mobilityPurchased || 0}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAttributeChange('mobilityPurchased', -1)}
                    disabled={(formData.mobilityPurchased || 0) <= 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-bold">{formData.mobilityPurchased || 0}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAttributeChange('mobilityPurchased', 1)}
                    disabled={vetInfo.remaining < VET_PER_ATTRIBUTE_POINT}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground text-right">
                VET gasto em atributos: <span className="font-bold">{vetInfo.attributes}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Comandantes e Cartas */}
        <div className="space-y-6">
          {/* Comandantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Comandantes
                <Badge variant="secondary" className="ml-auto">
                  VET: {vetInfo.commanders}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comandantes adicionados */}
              {(formData.commanders || []).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Adicionados:</Label>
                  {(formData.commanders || []).map((cmd, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{cmd.templateNumber}</Badge>
                        <span className="text-sm">{cmd.especializacao}</span>
                        <span className="text-xs text-muted-foreground">
                          (CMD {cmd.comando} / EST {cmd.estrategia} / GUA {cmd.guarda})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{cmd.custoVet} VET</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveCommander(index)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lista de templates disponíveis */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Disponíveis:</Label>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1">
                    {commanderTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                        onClick={() => handleAddCommander(template)}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{template.numero}</Badge>
                          <span className="text-sm">{template.especializacao}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            CMD {template.comando} / EST {template.estrategia} / GUA {template.guarda}
                          </span>
                          <Badge variant="secondary">{template.custo_vet} VET</Badge>
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* Cartas Táticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="w-5 h-5" />
                Cartas Estratégicas
                <Badge variant="secondary" className="ml-auto">
                  VET: {vetInfo.cards}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cartas adicionadas */}
              {(formData.tacticalCards || []).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Adicionadas:</Label>
                  {(formData.tacticalCards || []).map((card) => (
                    <div key={card.cardId} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">x{card.quantity}</Badge>
                        <span className="text-sm">{card.cardName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{card.vetCost * card.quantity} VET</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveTacticalCard(card.cardId)}
                        >
                          <Minus className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lista de cartas disponíveis */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Disponíveis:</Label>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1">
                    {tacticalCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                        onClick={() => handleAddTacticalCard(card)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{card.name}</span>
                          {card.culture && (
                            <Badge variant="outline" className="text-xs">
                              {card.culture}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{card.vet_cost} VET</Badge>
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={vetInfo.remaining < 0}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Exército
        </Button>
      </div>
    </div>
  );
}
