/**
 * Construtor de exército simplificado para single-player
 * Baseado no StrategicArmyBuilder mas focado no fluxo local
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Minus, Swords, Shield, Zap, Heart, 
  Users, Save, ArrowLeft, Crown, Eye, X
} from 'lucide-react';
import { toast } from 'sonner';
import { useMassCombatTacticalCards } from '@/hooks/useMassCombatTacticalCards';
import { useMassCombatCommanderTemplates } from '@/hooks/useMassCombatCommanderTemplates';
import { useMassCombatCultures } from '@/hooks/useMassCombatCultures';
import {
  StrategicArmy,
  StrategicArmyCommander,
  VET_PER_ATTRIBUTE_POINT,
  calculateVetSpent,
  calculateHitPoints,
  calculateDefense,
  createEmptyStrategicArmy,
  hasGeneral,
} from '@/types/combat/strategic-army';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MassCombatTacticalCardPreview } from '@/components/masscombat/MassCombatTacticalCardPreview';
import { MassCombatTacticalCard } from '@/types/MassCombatTacticalCard';

interface SinglePlayerArmyBuilderProps {
  army?: StrategicArmy;
  onSave: (army: StrategicArmy) => void;
  onCancel: () => void;
}

export function SinglePlayerArmyBuilder({ army, onSave, onCancel }: SinglePlayerArmyBuilderProps) {
  const { cards: tacticalCards } = useMassCombatTacticalCards();
  const { templates: commanderTemplates } = useMassCombatCommanderTemplates();
  const { data: cultures = [] } = useMassCombatCultures();

  const [formData, setFormData] = useState<Partial<StrategicArmy>>(() => {
    return army || createEmptyStrategicArmy();
  });
  const [selectedCardForPreview, setSelectedCardForPreview] = useState<MassCombatTacticalCard | null>(null);

  const vetInfo = useMemo(() => calculateVetSpent(formData), [formData]);
  
  const addedCardIds = useMemo(() => 
    new Set((formData.tacticalCards || []).map(c => c.cardId)), 
    [formData.tacticalCards]
  );

  // Filtrar cartas pela cultura selecionada
  const availableCards = useMemo(() => {
    if (!formData.culture) return tacticalCards;
    const selectedCulture = cultures.find(c => c.id === formData.culture);
    if (!selectedCulture) return tacticalCards;
    
    return tacticalCards.filter(card => 
      !card.culture || card.culture === selectedCulture.name
    );
  }, [tacticalCards, formData.culture, cultures]);

  // Handlers para atributos
  const handleAttributeChange = (attr: 'attackPurchased' | 'defensePurchased' | 'mobilityPurchased', delta: number) => {
    const currentValue = formData[attr] || 0;
    const newValue = Math.max(0, currentValue + delta);
    
    const newFormData = { ...formData, [attr]: newValue };
    const newVetInfo = calculateVetSpent(newFormData);
    
    if (newVetInfo.remaining < 0) {
      toast.error('VET insuficiente!');
      return;
    }
    
    setFormData(newFormData);
  };

  // Handler para adicionar comandante
  const handleAddCommander = (template: typeof commanderTemplates[0]) => {
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
          isGeneral: (prev.commanders || []).length === 0,
        },
      ],
    }));
  };

  // Handler para remover comandante
  const handleRemoveCommander = (index: number) => {
    setFormData(prev => {
      const newCommanders = (prev.commanders || []).filter((_, i) => i !== index);
      if (newCommanders.length > 0 && !newCommanders.some(c => c.isGeneral)) {
        newCommanders[0].isGeneral = true;
      }
      return { ...prev, commanders: newCommanders };
    });
  };
  
  // Handler para designar general
  const handleSetGeneral = (index: number) => {
    setFormData(prev => ({
      ...prev,
      commanders: (prev.commanders || []).map((cmd, i) => ({
        ...cmd,
        isGeneral: i === index,
      })),
    }));
  };

  // Handler para adicionar carta
  const handleAddTacticalCard = (card: MassCombatTacticalCard) => {
    if (addedCardIds.has(card.id)) {
      toast.error('Esta carta já foi adicionada!');
      return;
    }
    
    const newCards = [
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

  // Handler para remover carta
  const handleRemoveTacticalCard = (cardId: string) => {
    setFormData(prev => ({
      ...prev,
      tacticalCards: (prev.tacticalCards || []).filter(c => c.cardId !== cardId),
    }));
  };

  // Handler para salvar
  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast.error('Nome do exército é obrigatório!');
      return;
    }
    
    if (!formData.culture) {
      toast.error('Cultura é obrigatória!');
      return;
    }
    
    if ((formData.commanders || []).length === 0) {
      toast.error('Adicione pelo menos um comandante!');
      return;
    }
    
    if (!hasGeneral(formData)) {
      toast.error('Designe um comandante como General!');
      return;
    }
    
    if (vetInfo.remaining < 0) {
      toast.error('VET excedido!');
      return;
    }
    
    const selectedCulture = cultures.find(c => c.id === formData.culture);
    
    const completeArmy: StrategicArmy = {
      id: army?.id || crypto.randomUUID(),
      name: formData.name!,
      culture: formData.culture,
      cultureName: selectedCulture?.name,
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
    <div className="min-h-screen flex flex-col bg-background p-4">
      <Button variant="ghost" className="absolute top-4 left-4 z-10" onClick={onCancel}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="text-center mb-4 pt-8">
        <h1 className="text-2xl font-bold">
          {army ? 'Editar Exército' : 'Criar Exército'}
        </h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 pb-20">
          {/* VET Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">{formData.totalVet || 100}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-destructive">{vetInfo.total}</div>
                    <div className="text-xs text-muted-foreground">Gasto</div>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <div className={`text-xl font-bold ${vetInfo.remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {vetInfo.remaining}
                    </div>
                    <div className="text-xs text-muted-foreground">Restante</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="font-bold">{calculateHitPoints(formData.totalVet || 100)} PV</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info básica */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome *</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Legião do Norte"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">VET Total</Label>
                  <Input
                    type="number"
                    min={30}
                    step={10}
                    value={formData.totalVet || 100}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalVet: parseInt(e.target.value) || 100 }))}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Cultura *</Label>
                <Select
                  value={formData.culture || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, culture: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cultura" />
                  </SelectTrigger>
                  <SelectContent>
                    {cultures.map((culture) => (
                      <SelectItem key={culture.id} value={culture.id}>
                        {culture.name} - {culture.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Atributos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Atributos
                <Badge variant="outline" className="text-xs">{VET_PER_ATTRIBUTE_POINT} VET = 1 pt</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Ataque */}
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Ataque</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => handleAttributeChange('attackPurchased', -1)}
                    disabled={(formData.attackPurchased || 0) <= 0}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center font-bold text-sm">{formData.attackPurchased || 0}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => handleAttributeChange('attackPurchased', 1)}
                    disabled={vetInfo.remaining < VET_PER_ATTRIBUTE_POINT}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Defesa */}
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Defesa (5 + {formData.defensePurchased || 0} = {calculateDefense(formData.defensePurchased || 0)})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => handleAttributeChange('defensePurchased', -1)}
                    disabled={(formData.defensePurchased || 0) <= 0}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center font-bold text-sm">{formData.defensePurchased || 0}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => handleAttributeChange('defensePurchased', 1)}
                    disabled={vetInfo.remaining < VET_PER_ATTRIBUTE_POINT}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Mobilidade */}
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Mobilidade</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => handleAttributeChange('mobilityPurchased', -1)}
                    disabled={(formData.mobilityPurchased || 0) <= 0}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center font-bold text-sm">{formData.mobilityPurchased || 0}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => handleAttributeChange('mobilityPurchased', 1)}
                    disabled={vetInfo.remaining < VET_PER_ATTRIBUTE_POINT}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comandantes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Comandantes ({(formData.commanders || []).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Comandantes adicionados */}
              {(formData.commanders || []).map((cmd, index) => (
                <div 
                  key={index} 
                  className={`p-2 border rounded flex items-center justify-between ${cmd.isGeneral ? 'border-yellow-500 bg-yellow-500/10' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {cmd.isGeneral && <Crown className="w-4 h-4 text-yellow-500" />}
                    <div>
                      <div className="font-medium text-sm">{cmd.especializacao}</div>
                      <div className="text-xs text-muted-foreground">
                        CMD: {cmd.comando} | EST: {cmd.estrategia} | GUA: {cmd.guarda} | {cmd.custoVet} VET
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!cmd.isGeneral && (
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => handleSetGeneral(index)}
                        title="Definir como General"
                      >
                        <Crown className="w-3 h-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                      onClick={() => handleRemoveCommander(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Templates disponíveis */}
              <div className="border-t pt-3">
                <Label className="text-xs text-muted-foreground mb-2 block">Adicionar Comandante</Label>
                <div className="grid grid-cols-2 gap-2">
                  {commanderTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 text-left justify-start"
                      onClick={() => handleAddCommander(template)}
                      disabled={vetInfo.remaining < template.custo_vet}
                    >
                      <div>
                        <div className="font-medium text-xs">{template.especializacao}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {template.custo_vet} VET
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cartas Táticas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Cartas Táticas ({(formData.tacticalCards || []).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Cartas adicionadas */}
              {(formData.tacticalCards || []).length > 0 && (
                <div className="space-y-1">
                  {(formData.tacticalCards || []).map((card) => (
                    <div key={card.cardId} className="p-2 border rounded flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">{card.cardName}</span>
                        <span className="text-xs text-muted-foreground ml-2">{card.vetCost} VET</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => {
                            const fullCard = tacticalCards.find(c => c.id === card.cardId);
                            if (fullCard) setSelectedCardForPreview(fullCard);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => handleRemoveTacticalCard(card.cardId)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cartas disponíveis */}
              <div className="border-t pt-3">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Cartas Disponíveis {formData.culture && `(${cultures.find(c => c.id === formData.culture)?.name || 'Todas'})`}
                </Label>
                <ScrollArea className="h-[200px]">
                  <div className="grid grid-cols-2 gap-1">
                    {availableCards.map((card) => {
                      const isAdded = addedCardIds.has(card.id);
                      return (
                        <Button
                          key={card.id}
                          variant={isAdded ? "secondary" : "outline"}
                          size="sm"
                          className="h-auto py-1 px-2 text-left justify-start"
                          onClick={() => !isAdded && handleAddTacticalCard(card)}
                          disabled={isAdded || vetInfo.remaining < card.vet_cost}
                        >
                          <div className="truncate">
                            <div className="font-medium text-xs truncate">{card.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {card.vet_cost} VET • {card.unit_type}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <Button className="w-full" size="lg" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Exército
        </Button>
      </div>

      {/* Dialog preview carta */}
      <Dialog open={!!selectedCardForPreview} onOpenChange={() => setSelectedCardForPreview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCardForPreview?.name}</DialogTitle>
          </DialogHeader>
          {selectedCardForPreview && (
            <MassCombatTacticalCardPreview card={selectedCardForPreview} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
