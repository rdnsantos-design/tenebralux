import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Zap, FileText, Users } from 'lucide-react';

interface CharacterTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectComplete: () => void;
  onSelectSimplified: () => void;
}

export function CharacterTypeModal({
  open,
  onOpenChange,
  onSelectComplete,
  onSelectSimplified
}: CharacterTypeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-6 h-6 text-primary" />
            Criar Personagem
          </DialogTitle>
          <DialogDescription>
            Escolha o tipo de ficha que deseja criar
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Ficha Completa */}
          <Card 
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={() => {
              onSelectComplete();
              onOpenChange(false);
            }}
          >
            <CardContent className="pt-6 text-center space-y-3">
              <div className="mx-auto p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Completo</h3>
              <p className="text-sm text-muted-foreground">
                Ficha completa com todos os atributos, perícias, virtudes e equipamentos
              </p>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>• 8 atributos + 40 perícias</p>
                <p>• Privilégios e virtudes</p>
                <p>• Equipamento detalhado</p>
              </div>
              <Button className="w-full mt-2">
                Criar Completo
              </Button>
            </CardContent>
          </Card>
          
          {/* Ficha Resumida */}
          <Card 
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={() => {
              onSelectSimplified();
              onOpenChange(false);
            }}
          >
            <CardContent className="pt-6 text-center space-y-3">
              <div className="mx-auto p-4 bg-accent/20 rounded-full w-16 h-16 flex items-center justify-center">
                <Zap className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-lg">Resumido</h3>
              <p className="text-sm text-muted-foreground">
                Ficha rápida para NPCs e oponentes com stats essenciais
              </p>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>• Stats de combate diretos</p>
                <p>• Escolha de arma simples</p>
                <p>• Opção de regente</p>
              </div>
              <Button variant="secondary" className="w-full mt-2">
                Criar Resumido
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
