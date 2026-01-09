/**
 * SinglePlayerCardDetail - Modal para exibir detalhes completos de uma carta
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Swords, Shield, Zap, Star } from 'lucide-react';
import { SPCard } from '@/lib/singlePlayerCombatEngine';

interface SinglePlayerCardDetailProps {
  card: SPCard | null;
  open: boolean;
  onClose: () => void;
}

export function SinglePlayerCardDetail({ card, open, onClose }: SinglePlayerCardDetailProps) {
  if (!card) return null;
  
  const typeColors: Record<string, string> = {
    ofensiva: 'bg-red-500/20 text-red-500 border-red-500',
    defensiva: 'bg-blue-500/20 text-blue-500 border-blue-500',
    movimentacao: 'bg-yellow-500/20 text-yellow-500 border-yellow-500',
    reacao: 'bg-purple-500/20 text-purple-500 border-purple-500',
  };
  
  const typeLabels: Record<string, string> = {
    ofensiva: 'Ofensiva',
    defensiva: 'Defensiva',
    movimentacao: 'Movimentação',
    reacao: 'Reação',
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{card.name}</span>
            <Badge className={typeColors[card.card_type] || ''}>
              {typeLabels[card.card_type] || card.card_type}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex gap-4 justify-center">
            {card.attack_bonus !== 0 && (
              <div className="flex items-center gap-1 text-red-500">
                <Swords className="w-4 h-4" />
                <span className="font-bold">
                  {card.attack_bonus > 0 ? '+' : ''}{card.attack_bonus} ATQ
                </span>
              </div>
            )}
            {card.defense_bonus !== 0 && (
              <div className="flex items-center gap-1 text-blue-500">
                <Shield className="w-4 h-4" />
                <span className="font-bold">
                  {card.defense_bonus > 0 ? '+' : ''}{card.defense_bonus} DEF
                </span>
              </div>
            )}
            {card.mobility_bonus !== 0 && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Zap className="w-4 h-4" />
                <span className="font-bold">
                  {card.mobility_bonus > 0 ? '+' : ''}{card.mobility_bonus} MOB
                </span>
              </div>
            )}
          </div>
          
          {/* Requirements */}
          <div className="flex gap-4 justify-center text-sm text-muted-foreground">
            {card.command_required > 0 && (
              <span>CMD necessário: {card.command_required}</span>
            )}
            {card.strategy_required > 0 && (
              <span>EST necessária: {card.strategy_required}</span>
            )}
          </div>
          
          {/* Effects */}
          {(card.minor_effect || card.major_effect) && (
            <div className="space-y-2 border-t pt-3">
              {card.minor_effect && (
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">Efeito Menor: </span>
                  <span>{card.minor_effect}</span>
                </div>
              )}
              {card.major_effect && (
                <div className="text-sm">
                  <span className="font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    Efeito Maior:
                  </span>
                  <span>{card.major_effect}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Meta info */}
          <div className="flex gap-2 justify-center text-xs text-muted-foreground border-t pt-3">
            <span>Tipo: {card.unit_type}</span>
            {card.culture && <span>• Cultura: {card.culture}</span>}
            <span>• VET: {card.vet_cost}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
