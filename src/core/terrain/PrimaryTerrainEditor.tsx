/**
 * EDITOR UNIFICADO DE TERRENO PRIMÁRIO
 * 
 * Usado tanto em Skirmish (hexágonos) quanto em Warfare (características).
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  PrimaryTerrain, 
  VisibilityLevel, 
  CLIMATE_OPTIONS, 
  VISIBILITY_OPTIONS 
} from './types';
import { useCreatePrimaryTerrain, useUpdatePrimaryTerrain } from './hooks';
import { toast } from 'sonner';

interface PrimaryTerrainEditorProps {
  terrain?: PrimaryTerrain | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrimaryTerrainEditor({ terrain, open, onOpenChange }: PrimaryTerrainEditorProps) {
  const createTerrain = useCreatePrimaryTerrain();
  const updateTerrain = useUpdatePrimaryTerrain();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_climate: 'Céu aberto',
    allowed_climates: [] as string[],
    attack_mod: 0,
    defense_mod: 0,
    mobility_mod: 0,
    visibility: 'normal' as VisibilityLevel,
    image_url: '',
  });

  useEffect(() => {
    if (terrain) {
      setFormData({
        name: terrain.name,
        description: terrain.description || '',
        default_climate: terrain.default_climate,
        allowed_climates: terrain.allowed_climates || [],
        attack_mod: terrain.attack_mod,
        defense_mod: terrain.defense_mod,
        mobility_mod: terrain.mobility_mod,
        visibility: terrain.visibility,
        image_url: terrain.image_url || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        default_climate: 'Céu aberto',
        allowed_climates: [],
        attack_mod: 0,
        defense_mod: 0,
        mobility_mod: 0,
        visibility: 'normal',
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
        default_climate: formData.default_climate,
        allowed_climates: formData.allowed_climates,
        attack_mod: formData.attack_mod,
        defense_mod: formData.defense_mod,
        mobility_mod: formData.mobility_mod,
        visibility: formData.visibility,
        image_url: formData.image_url || null,
      };

      if (terrain) {
        await updateTerrain.mutateAsync({ id: terrain.id, ...data });
        toast.success('Terreno primário atualizado!');
      } else {
        await createTerrain.mutateAsync(data);
        toast.success('Terreno primário criado!');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar terreno');
      console.error(error);
    }
  };

  const toggleClimate = (climate: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_climates: prev.allowed_climates.includes(climate)
        ? prev.allowed_climates.filter(c => c !== climate)
        : [...prev.allowed_climates, climate]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {terrain ? 'Editar Terreno Primário' : 'Novo Terreno Primário'}
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
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="default_climate">Clima Inicial Padrão</Label>
              <Select
                value={formData.default_climate}
                onValueChange={value => setFormData(prev => ({ ...prev, default_climate: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIMATE_OPTIONS.map(climate => (
                    <SelectItem key={climate} value={climate}>{climate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="visibility">Visibilidade</Label>
              <Select
                value={formData.visibility}
                onValueChange={value => setFormData(prev => ({ ...prev, visibility: value as VisibilityLevel }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} ({opt.modifier === -99 ? 'Fora de visão' : opt.modifier >= 0 ? `+${opt.modifier}` : opt.modifier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Label>Climas Permitidos</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CLIMATE_OPTIONS.map(climate => (
                  <div key={climate} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`climate-${climate}`}
                      checked={formData.allowed_climates.includes(climate)}
                      onCheckedChange={() => toggleClimate(climate)}
                    />
                    <Label htmlFor={`climate-${climate}`} className="text-sm font-normal cursor-pointer">
                      {climate}
                    </Label>
                  </div>
                ))}
              </div>
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
