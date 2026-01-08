import React, { useMemo } from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { useTheme } from '@/themes/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sword, Shield, Package, Coins, ShoppingCart, 
  Plus, Minus, Trash2, AlertCircle, Check, Weight, Zap
} from 'lucide-react';
import {
  WEAPONS,
  ARMORS,
  ITEMS,
  STARTING_CREDITS,
  EquipmentDefinition,
  getEquipmentName,
  getEquipmentDescription,
  getEquipmentById,
  getCurrencyName
} from '@/data/character/equipment';
import { PRIVILEGES } from '@/data/character/privileges';

export function StepEquipment() {
  const { draft, updateDraft } = useCharacterBuilder();
  const { activeTheme } = useTheme();
  const themeId = activeTheme;

  // Check for Wealth privilege bonus
  const hasWealthPrivilege = useMemo(() => {
    if (!draft.privilegeIds) return false;
    const wealthPrivilege = PRIVILEGES.find(p => p.id === 'nascido_elite');
    return wealthPrivilege && draft.privilegeIds.includes(wealthPrivilege.id);
  }, [draft.privilegeIds]);

  const totalCredits = hasWealthPrivilege ? STARTING_CREDITS + 50 : STARTING_CREDITS;

  // Calculate spent credits
  const selectedItems = useMemo(() => {
    const items: { item: EquipmentDefinition; quantity: number }[] = [];
    
    if (draft.weaponId) {
      const weapon = getEquipmentById(draft.weaponId);
      if (weapon) items.push({ item: weapon, quantity: 1 });
    }
    
    if (draft.armorId) {
      const armor = getEquipmentById(draft.armorId);
      if (armor) items.push({ item: armor, quantity: 1 });
    }
    
    (draft.itemIds || []).forEach(id => {
      const item = getEquipmentById(id);
      if (item) {
        const existing = items.find(i => i.item.id === id);
        if (existing) {
          existing.quantity++;
        } else {
          items.push({ item, quantity: 1 });
        }
      }
    });
    
    return items;
  }, [draft.weaponId, draft.armorId, draft.itemIds]);

  const spentCredits = useMemo(() => {
    return selectedItems.reduce((sum, { item, quantity }) => sum + (item.cost * quantity), 0);
  }, [selectedItems]);

  const remainingCredits = totalCredits - spentCredits;
  const totalWeight = useMemo(() => {
    return selectedItems.reduce((sum, { item, quantity }) => sum + (item.weight * quantity), 0);
  }, [selectedItems]);

  const hasWeapon = !!draft.weaponId;
  const hasArmor = !!draft.armorId;
  const itemCount = selectedItems.reduce((sum, { quantity }) => sum + quantity, 0);

  // Selection handlers
  const selectWeapon = (weaponId: string) => {
    const weapon = getEquipmentById(weaponId);
    if (!weapon) return;
    
    // Check if can afford (considering current weapon cost)
    const currentWeapon = draft.weaponId ? getEquipmentById(draft.weaponId) : null;
    const currentCost = currentWeapon?.cost || 0;
    const newCost = weapon.cost;
    
    if (spentCredits - currentCost + newCost > totalCredits) return;
    
    updateDraft({ weaponId });
  };

  const removeWeapon = () => {
    updateDraft({ weaponId: undefined });
  };

  const selectArmor = (armorId: string) => {
    const armor = getEquipmentById(armorId);
    if (!armor) return;
    
    const currentArmor = draft.armorId ? getEquipmentById(draft.armorId) : null;
    const currentCost = currentArmor?.cost || 0;
    const newCost = armor.cost;
    
    if (spentCredits - currentCost + newCost > totalCredits) return;
    
    updateDraft({ armorId });
  };

  const removeArmor = () => {
    updateDraft({ armorId: undefined });
  };

  const addItem = (itemId: string) => {
    const item = getEquipmentById(itemId);
    if (!item) return;
    
    if (spentCredits + item.cost > totalCredits) return;
    
    const newItemIds = [...(draft.itemIds || []), itemId];
    updateDraft({ itemIds: newItemIds });
  };

  const removeItem = (itemId: string) => {
    const itemIds = draft.itemIds || [];
    const index = itemIds.lastIndexOf(itemId);
    if (index === -1) return;
    
    const newItemIds = [...itemIds];
    newItemIds.splice(index, 1);
    updateDraft({ itemIds: newItemIds });
  };

  const clearAll = () => {
    updateDraft({
      weaponId: undefined,
      armorId: undefined,
      itemIds: []
    });
  };

  const getItemQuantity = (itemId: string): number => {
    return (draft.itemIds || []).filter(id => id === itemId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Equipamento
        </h2>
        <p className="text-muted-foreground">
          Escolha armas, armaduras e itens com seus {getCurrencyName(themeId)} iniciais
        </p>
      </div>

      {/* Credits Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">{getCurrencyName(themeId)}</div>
                <div className="text-sm text-muted-foreground">
                  {spentCredits} gastos de {totalCredits}
                  {hasWealthPrivilege && (
                    <span className="text-green-500 ml-1">(+50 Nascido na Elite)</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${remainingCredits < 0 ? 'text-destructive' : remainingCredits < 20 ? 'text-yellow-500' : 'text-green-500'}`}>
                {remainingCredits}
              </div>
              <div className="text-xs text-muted-foreground">Restantes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Equipment Cart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Equipamento Selecionado
            </div>
            <Badge variant="secondary">{itemCount} itens</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedItems.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhum equipamento selecionado
            </div>
          ) : (
            <div className="space-y-2">
              {selectedItems.map(({ item, quantity }) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    {item.category === 'weapon' && <Sword className="h-4 w-4 text-red-500" />}
                    {item.category === 'armor' && <Shield className="h-4 w-4 text-blue-500" />}
                    {item.category === 'item' && <Package className="h-4 w-4 text-green-500" />}
                    <span className="font-medium">{getEquipmentName(item, themeId)}</span>
                    {quantity > 1 && <Badge variant="outline" className="text-xs">x{quantity}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.cost * quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        if (item.category === 'weapon') removeWeapon();
                        else if (item.category === 'armor') removeArmor();
                        else removeItem(item.id);
                      }}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Weight className="h-4 w-4" />
                    {totalWeight} kg
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equipment Selection Tabs */}
      <Tabs defaultValue="weapons" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weapons" className="flex items-center gap-1">
            <Sword className="h-4 w-4" />
            Armas
            {hasWeapon && <Check className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="armors" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Armaduras
            {hasArmor && <Check className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            Itens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weapons">
          <EquipmentGrid
            items={WEAPONS}
            themeId={themeId}
            selectedId={draft.weaponId}
            onSelect={selectWeapon}
            onRemove={removeWeapon}
            remainingCredits={remainingCredits}
            currentSelectedCost={draft.weaponId ? getEquipmentById(draft.weaponId)?.cost || 0 : 0}
          />
        </TabsContent>

        <TabsContent value="armors">
          <EquipmentGrid
            items={ARMORS}
            themeId={themeId}
            selectedId={draft.armorId}
            onSelect={selectArmor}
            onRemove={removeArmor}
            remainingCredits={remainingCredits}
            currentSelectedCost={draft.armorId ? getEquipmentById(draft.armorId)?.cost || 0 : 0}
          />
        </TabsContent>

        <TabsContent value="items">
          <EquipmentGrid
            items={ITEMS}
            themeId={themeId}
            onAdd={addItem}
            onRemoveItem={removeItem}
            getQuantity={getItemQuantity}
            remainingCredits={remainingCredits}
            isMultiple
          />
        </TabsContent>
      </Tabs>

      {/* Validation Warning */}
      {!hasWeapon && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              Recomendado: selecione pelo menos uma arma
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Equipment Grid Component
interface EquipmentGridProps {
  items: EquipmentDefinition[];
  themeId: 'akashic' | 'tenebralux';
  selectedId?: string;
  onSelect?: (id: string) => void;
  onRemove?: () => void;
  onAdd?: (id: string) => void;
  onRemoveItem?: (id: string) => void;
  getQuantity?: (id: string) => number;
  remainingCredits: number;
  currentSelectedCost?: number;
  isMultiple?: boolean;
}

function EquipmentGrid({
  items,
  themeId,
  selectedId,
  onSelect,
  onRemove,
  onAdd,
  onRemoveItem,
  getQuantity,
  remainingCredits,
  currentSelectedCost = 0,
  isMultiple = false
}: EquipmentGridProps) {
  // Group items by type
  const groupedItems = useMemo(() => {
    const groups: Record<string, EquipmentDefinition[]> = {};
    items.forEach(item => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });
    return groups;
  }, [items]);

  const typeLabels: Record<string, string> = {
    melee: 'Corpo a Corpo',
    ranged: 'À Distância',
    heavy: 'Pesadas',
    light: 'Leves',
    medium: 'Médias',
    utility: 'Utilidade'
  };

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4 p-1">
        {Object.entries(groupedItems).map(([type, typeItems]) => (
          <div key={type}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {typeLabels[type] || type}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {typeItems.map(item => (
                <EquipmentCard
                  key={item.id}
                  item={item}
                  themeId={themeId}
                  isSelected={selectedId === item.id}
                  quantity={getQuantity?.(item.id) || 0}
                  canAfford={item.cost <= remainingCredits + currentSelectedCost}
                  onSelect={onSelect}
                  onRemove={onRemove}
                  onAdd={onAdd}
                  onRemoveItem={onRemoveItem}
                  isMultiple={isMultiple}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Equipment Card Component
interface EquipmentCardProps {
  item: EquipmentDefinition;
  themeId: 'akashic' | 'tenebralux';
  isSelected: boolean;
  quantity: number;
  canAfford: boolean;
  onSelect?: (id: string) => void;
  onRemove?: () => void;
  onAdd?: (id: string) => void;
  onRemoveItem?: (id: string) => void;
  isMultiple: boolean;
}

function EquipmentCard({
  item,
  themeId,
  isSelected,
  quantity,
  canAfford,
  onSelect,
  onRemove,
  onAdd,
  onRemoveItem,
  isMultiple
}: EquipmentCardProps) {
  const name = getEquipmentName(item, themeId);
  const description = getEquipmentDescription(item, themeId);

  return (
    <Card className={`transition-all ${
      isSelected ? 'border-primary ring-2 ring-primary/20' : 
      quantity > 0 ? 'border-green-500/50' : 
      !canAfford ? 'opacity-50' : 'hover:border-primary/50'
    }`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{name}</span>
              {quantity > 0 && isMultiple && (
                <Badge variant="secondary" className="text-xs">x{quantity}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{description}</p>
            
            {item.stats && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.stats.damage && (
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {item.stats.damage}
                  </Badge>
                )}
                {item.stats.defense && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    +{item.stats.defense}
                  </Badge>
                )}
                {item.stats.range && (
                  <Badge variant="outline" className="text-xs">
                    {item.stats.range}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <Coins className="h-3 w-3 text-yellow-500" />
              <span className="font-medium">{item.cost}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Weight className="h-3 w-3" />
              {item.weight}kg
            </div>
            
            {isMultiple ? (
              <div className="flex items-center gap-1 mt-1">
                {quantity > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onRemoveItem?.(item.id)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="default"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onAdd?.(item.id)}
                  disabled={!canAfford && quantity === 0}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant={isSelected ? "destructive" : "default"}
                size="sm"
                className="mt-1"
                onClick={() => isSelected ? onRemove?.() : onSelect?.(item.id)}
                disabled={!canAfford && !isSelected}
              >
                {isSelected ? 'Remover' : 'Selecionar'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
