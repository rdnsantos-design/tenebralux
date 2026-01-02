import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Heart, Sword, Shield, Zap, RotateCcw, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BasicCardsPanelProps {
  roomId: string;
  sessionId: string;
  playerNumber: 1 | 2;
  basicCardsUsed: {
    heal: boolean;
    attack: boolean;
    defense: boolean;
    initiative: boolean;
    countermaneuver: boolean;
  };
  currentBonuses: {
    heal?: boolean;
    attack?: boolean;
    defense?: boolean;
    initiative?: boolean;
    countermaneuver?: boolean;
  };
  combatPhase: string;
  disabled?: boolean;
}

interface BasicCard {
  id: 'heal' | 'attack' | 'defense' | 'initiative' | 'countermaneuver';
  name: string;
  icon: React.ReactNode;
  effect: string;
  color: string;
}

const BASIC_CARDS: BasicCard[] = [
  { 
    id: 'heal', 
    name: 'Cura', 
    icon: <Heart className="w-4 h-4" />, 
    effect: '-5 dano recebido',
    color: 'text-green-500'
  },
  { 
    id: 'attack', 
    name: 'Ataque', 
    icon: <Sword className="w-4 h-4" />, 
    effect: '+1 ATK na rodada',
    color: 'text-red-500'
  },
  { 
    id: 'defense', 
    name: 'Defesa', 
    icon: <Shield className="w-4 h-4" />, 
    effect: '+1 DEF na rodada',
    color: 'text-blue-500'
  },
  { 
    id: 'initiative', 
    name: 'Iniciativa', 
    icon: <Zap className="w-4 h-4" />, 
    effect: '+1 MOB na rodada',
    color: 'text-yellow-500'
  },
  { 
    id: 'countermaneuver', 
    name: 'Contra-Manobra', 
    icon: <RotateCcw className="w-4 h-4" />, 
    effect: 'Reduz MOB do oponente',
    color: 'text-purple-500'
  },
];

export function BasicCardsPanel({ 
  roomId, 
  sessionId, 
  playerNumber,
  basicCardsUsed, 
  currentBonuses,
  combatPhase,
  disabled 
}: BasicCardsPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  
  const canUseCards = combatPhase === 'initiative' || combatPhase === 'main';
  
  const handleUseCard = async (cardType: string) => {
    setLoading(cardType);
    try {
      const { error } = await supabase.rpc('use_basic_card', {
        p_room_id: roomId,
        p_session_id: sessionId,
        p_card_type: cardType
      });
      
      if (error) throw error;
      toast.success(`Carta básica "${cardType}" ativada!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao usar carta');
    } finally {
      setLoading(null);
    }
  };
  
  const usedCount = Object.values(basicCardsUsed || {}).filter(Boolean).length;
  const totalCards = BASIC_CARDS.length;
  
  return (
    <Card>
      <CardHeader className="py-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Cartas Básicas (1x por partida)</span>
          <Badge variant="outline" className="text-xs">
            {totalCards - usedCount}/{totalCards} restantes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="grid grid-cols-5 gap-2">
          {BASIC_CARDS.map((card) => {
            const isUsed = basicCardsUsed?.[card.id];
            const isActiveThisRound = currentBonuses?.[card.id];
            const isLoading = loading === card.id;
            
            return (
              <Button
                key={card.id}
                variant={isActiveThisRound ? 'default' : isUsed ? 'ghost' : 'outline'}
                size="sm"
                className={`h-auto py-2 px-2 flex flex-col items-center gap-1 ${
                  isUsed ? 'opacity-50' : ''
                }`}
                disabled={disabled || isUsed || !canUseCards || isLoading}
                onClick={() => handleUseCard(card.id)}
                title={card.effect}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isUsed ? (
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <span className={card.color}>{card.icon}</span>
                )}
                <span className="text-[10px] font-medium truncate w-full text-center">
                  {card.name}
                </span>
              </Button>
            );
          })}
        </div>
        {!canUseCards && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Cartas básicas só podem ser usadas durante iniciativa ou fase principal
          </p>
        )}
      </CardContent>
    </Card>
  );
}
