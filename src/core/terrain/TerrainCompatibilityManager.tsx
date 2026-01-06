/**
 * GERENCIADOR DE COMPATIBILIDADE DE TERRENOS
 * 
 * Define quais terrenos secundários podem ser usados com cada terreno primário.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useUnifiedPrimaryTerrains, 
  useUnifiedSecondaryTerrains,
  useTerrainCompatibility,
  useSetTerrainCompatibility
} from './hooks';
import { toast } from 'sonner';

interface TerrainCompatibilityManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TerrainCompatibilityManager({ open, onOpenChange }: TerrainCompatibilityManagerProps) {
  const { data: primaryTerrains = [] } = useUnifiedPrimaryTerrains();
  const { data: secondaryTerrains = [] } = useUnifiedSecondaryTerrains();
  const { data: compatibility = [] } = useTerrainCompatibility();
  const setCompatibility = useSetTerrainCompatibility();
  
  const [selectedPrimary, setSelectedPrimary] = useState<string>('');
  const [selectedSecondaries, setSelectedSecondaries] = useState<string[]>([]);

  // Load compatibility when primary terrain changes
  useEffect(() => {
    if (selectedPrimary) {
      const compatibleIds = compatibility
        .filter(c => c.primary_terrain_id === selectedPrimary)
        .map(c => c.secondary_terrain_id);
      setSelectedSecondaries(compatibleIds);
    } else {
      setSelectedSecondaries([]);
    }
  }, [selectedPrimary, compatibility]);

  const handleToggleSecondary = (secondaryId: string) => {
    setSelectedSecondaries(prev => 
      prev.includes(secondaryId)
        ? prev.filter(id => id !== secondaryId)
        : [...prev, secondaryId]
    );
  };

  const handleSave = async () => {
    if (!selectedPrimary) {
      toast.error('Selecione um terreno primário');
      return;
    }
    
    try {
      await setCompatibility.mutateAsync({
        primaryTerrainId: selectedPrimary,
        secondaryTerrainIds: selectedSecondaries,
      });
      toast.success('Compatibilidade atualizada!');
    } catch (error) {
      toast.error('Erro ao salvar compatibilidade');
    }
  };

  const nonUniversalSecondaries = secondaryTerrains.filter(s => !s.is_universal);
  const universalSecondaries = secondaryTerrains.filter(s => s.is_universal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Compatibilidade de Terrenos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label>Selecione o Terreno Primário</Label>
            <Select value={selectedPrimary} onValueChange={setSelectedPrimary}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Escolha um terreno primário..." />
              </SelectTrigger>
              <SelectContent>
                {primaryTerrains.map(terrain => (
                  <SelectItem key={terrain.id} value={terrain.id}>
                    {terrain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedPrimary && (
            <>
              {universalSecondaries.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Terrenos Universais (sempre disponíveis)</p>
                  <div className="flex flex-wrap gap-2">
                    {universalSecondaries.map(terrain => (
                      <span key={terrain.id} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                        {terrain.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-base">Terrenos Secundários Compatíveis</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecione quais terrenos secundários podem ser usados com este terreno primário.
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {nonUniversalSecondaries.map(terrain => (
                    <div
                      key={terrain.id}
                      className="flex items-start gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`sec-${terrain.id}`}
                        checked={selectedSecondaries.includes(terrain.id)}
                        onCheckedChange={() => handleToggleSecondary(terrain.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`sec-${terrain.id}`} className="font-medium cursor-pointer">
                          {terrain.name}
                        </Label>
                        {terrain.effect_description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {terrain.effect_description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
                <Button onClick={handleSave} disabled={setCompatibility.isPending}>
                  Salvar Compatibilidade
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
