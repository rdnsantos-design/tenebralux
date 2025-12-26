import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MassCombatSecondaryTerrain } from '@/types/MassCombatTerrain';
import { useCreateMassCombatSecondaryTerrain, useUpdateMassCombatSecondaryTerrain } from '@/hooks/useMassCombatTerrains';
import { toast } from 'sonner';

interface SecondaryTerrainEditorProps {
  terrain?: MassCombatSecondaryTerrain | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecondaryTerrainEditor({ terrain, open, onOpenChange }: SecondaryTerrainEditorProps) {
  const createTerrain = useCreateMassCombatSecondaryTerrain();
  const updateTerrain = useUpdateMassCombatSecondaryTerrain();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    effect_description: '',
    attack_mod: 0,
    defense_mod: 0,
    mobility_mod: 0,
    strategy_mod: 0,
    special_effects: '',
    is_universal: false,
    image_url: '',
  });

  useEffect(() => {
    if (terrain) {
      setFormData({
        name: terrain.name,
        description: terrain.description || '',
        effect_description: terrain.effect_description || '',
        attack_mod: terrain.attack_mod,
        defense_mod: terrain.defense_mod,
        mobility_mod: terrain.mobility_mod,
        strategy_mod: terrain.strategy_mod,
        special_effects: terrain.special_effects || '',
        is_universal: terrain.is_universal,
        image_url: terrain.image_url || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        effect_description: '',
        attack_mod: 0,
        defense_mod: 0,
        mobility_mod: 0,
        strategy_mod: 0,
        special_effects: '',
        is_universal: false,
        image_url: '',
      });
    }
  }, [terrain, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        name: formData.name,
        description: formData.description || null,
        effect_description: formData.effect_description || null,
        attack_mod: formData.attack_mod,
        defense_mod: formData.defense_mod,
        mobility_mod: formData.mobility_mod,
        strategy_mod: formData.strategy_mod,
        special_effects: formData.special_effects || null,
        is_universal: formData.is_universal,
        image_url: formData.image_url || null,
      };

      if (terrain) {
        await updateTerrain.mutateAsync({ id: terrain.id, ...data });
        toast.success('Terreno secundário atualizado!');
      } else {
        await createTerrain.mutateAsync(data);
        toast.success('Terreno secundário criado!');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar terreno');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {terrain ? 'Editar Terreno Secundário' : 'Novo Terreno Secundário'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="effect_description">Descrição do Efeito</Label>
              <Textarea
                id="effect_description"
                value={formData.effect_description}
                onChange={e => setFormData(prev => ({ ...prev, effect_description: e.target.value }))}
                rows={2}
                placeholder="Ex: +1 na Defesa e +1 na Estratégia."
              />
            </div>
            
            <div className="col-span-2 flex items-center gap-2">
              <Switch
                id="is_universal"
                checked={formData.is_universal}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, is_universal: checked }))}
              />
              <Label htmlFor="is_universal" className="cursor-pointer">
                Universal (pode ser usado em todos os terrenos primários)
              </Label>
            </div>
            
            <div>
              <Label htmlFor="attack_mod">Modificador de Ataque</Label>
              <Input
                id="attack_mod"
                type="number"
                value={formData.attack_mod}
                onChange={e => setFormData(prev => ({ ...prev, attack_mod: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="defense_mod">Modificador de Defesa</Label>
              <Input
                id="defense_mod"
                type="number"
                value={formData.defense_mod}
                onChange={e => setFormData(prev => ({ ...prev, defense_mod: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="mobility_mod">Modificador de Mobilidade</Label>
              <Input
                id="mobility_mod"
                type="number"
                value={formData.mobility_mod}
                onChange={e => setFormData(prev => ({ ...prev, mobility_mod: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="strategy_mod">Modificador de Estratégia</Label>
              <Input
                id="strategy_mod"
                type="number"
                value={formData.strategy_mod}
                onChange={e => setFormData(prev => ({ ...prev, strategy_mod: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="special_effects">Efeitos Especiais</Label>
              <Textarea
                id="special_effects"
                value={formData.special_effects}
                onChange={e => setFormData(prev => ({ ...prev, special_effects: e.target.value }))}
                rows={2}
                placeholder="Ex: +1 Defesa para Infantaria, -1 Ataque para Cavalaria"
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTerrain.isPending || updateTerrain.isPending}>
              {terrain ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
