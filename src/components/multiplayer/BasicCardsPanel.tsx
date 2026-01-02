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
  allowedPhases: string[]; // Fases em que pode ser usada
}

const BASIC_CARDS: BasicCard[] = [
  { 
    id: 'heal', 
    name: 'Cura', 
    icon: <Heart className="w-4 h-4" />, 
    effect: '-5 dano recebido',
    color: 'text-green-500',
    allowedPhases: ['combat_resolution'] // Cura só após resolução
  },
  { 
    id: 'attack', 
    name: 'Ataque', 
    icon: <Sword className="w-4 h-4" />, 
    effect: '+1 ATK na rodada',
    color: 'text-red-500',
    allowedPhases: ['attack_maneuver', 'attack_reaction'] // Fase de ataque
  },
  { 
    id: 'defense', 
    name: 'Defesa', 
    icon: <Shield className="w-4 h-4" />, 
    effect: '+1 DEF na rodada',
    color: 'text-blue-500',
    allowedPhases: ['defense_maneuver', 'defense_reaction'] // Fase de defesa
  },
  { 
    id: 'initiative', 
    name: 'Iniciativa', 
    icon: <Zap className="w-4 h-4" />, 
    effect: '+1 MOB na rodada',
    color: 'text-yellow-500',
    allowedPhases: ['initiative_maneuver', 'initiative_reaction'] // Fase de iniciativa
  },
  { 
    id: 'countermaneuver', 
    name: 'Contra-Manobra', 
    icon: <RotateCcw className="w-4 h-4" />, 
    effect: 'Cancela manobra do oponente',
    color: 'text-purple-500',
    allowedPhases: ['initiative_reaction', 'attack_reaction', 'defense_reaction'] // Subfases de reação
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
  
  // Função para verificar se uma carta específica pode ser usada na fase atual
  const canUseCard = (card: BasicCard) => {
    return card.allowedPhases.includes(combatPhase);
  };
  
  // Verifica se há alguma carta disponível para uso
  const hasAnyUsableCard = BASIC_CARDS.some(card => 
    canUseCard(card) && !basicCardsUsed?.[card.id]
  );
  
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
            const canUse = canUseCard(card);
            
            return (
              <Button
                key={card.id}
                variant={isActiveThisRound ? 'default' : isUsed ? 'ghost' : 'outline'}
                size="sm"
                className={`h-auto py-2 px-2 flex flex-col items-center gap-1 ${
                  isUsed ? 'opacity-50' : !canUse ? 'opacity-30' : ''
                }`}
                disabled={disabled || isUsed || !canUse || isLoading}
                onClick={() => handleUseCard(card.id)}
                title={`${card.effect} (${card.allowedPhases.map(p => {
                  const labels: Record<string, string> = {
                    'initiative_maneuver': 'Iniciativa',
                    'initiative_reaction': 'Reação Ini.',
                    'attack_maneuver': 'Ataque',
                    'attack_reaction': 'Reação Atq.',
                    'defense_maneuver': 'Defesa',
                    'defense_reaction': 'Reação Def.',
                    'combat_resolution': 'Resolução'
                  };
                  return labels[p] || p;
                }).join(', ')})`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isUsed ? (
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <span className={canUse ? card.color : 'text-muted-foreground'}>{card.icon}</span>
                )}
                <span className="text-[10px] font-medium truncate w-full text-center">
                  {card.name}
                </span>
              </Button>
            );
          })}
        </div>
        {!hasAnyUsableCard && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Nenhuma carta básica disponível nesta fase
          </p>
        )}
      </CardContent>
    </Card>
  );
}
