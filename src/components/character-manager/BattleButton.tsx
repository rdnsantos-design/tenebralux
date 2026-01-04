import React, { useState } from 'react';
import { SavedCharacter } from '@/types/character-storage';
import { useTacticalIntegration } from '@/hooks/useTacticalIntegration';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Swords, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface BattleButtonProps {
  character: SavedCharacter;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function BattleButton({ 
  character, 
  variant = 'outline',
  size = 'default' 
}: BattleButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [asCommander, setAsCommander] = useState(false);
  
  const {
    isConverting,
    errors,
    prepareForBattle,
    validateCharacter,
    goToBattle,
  } = useTacticalIntegration();

  const handleClick = () => {
    // Validar antes de abrir dialog
    const validation = validateCharacter(character.id);
    if (!validation.valid) {
      toast.error(validation.errors.join(', '));
      return;
    }
    setShowDialog(true);
  };

  const handleConfirm = async () => {
    const result = await prepareForBattle(character.id, {
      asCommander,
      generateCards: true,
      includeEquipment: true,
      teamId: 'player',
    });

    if (result) {
      toast.success(`${character.name} preparado para batalha!`);
      
      // Mostrar warnings se houver
      result.warnings.forEach(w => toast.warning(w));
      
      // Ir para batalha
      goToBattle([result.unit], result.cards);
    }
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size}
        onClick={handleClick}
        className="gap-2"
      >
        <Swords className="w-4 h-4" />
        {size !== 'icon' && 'Batalha'}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preparar para Batalha</DialogTitle>
            <DialogDescription>
              Configure como <strong>{character.name}</strong> entrará em combate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Resumo do personagem */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Facção</span>
                <span className="font-medium">{character.factionId || 'Nenhuma'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tema</span>
                <span className="font-medium capitalize">{character.theme}</span>
              </div>
            </div>

            {/* Opções */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="commander"
                  checked={asCommander}
                  onCheckedChange={(checked) => setAsCommander(checked as boolean)}
                />
                <Label htmlFor="commander" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Entrar como Comandante
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Comandantes podem usar habilidades de liderança e dão bônus ao time.
              </p>
            </div>

            {/* Erros */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errors.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isConverting}>
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4 mr-2" />
                  Ir para Batalha
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
