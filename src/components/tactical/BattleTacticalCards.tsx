import React, { useMemo } from 'react';
import { BattleUnit, BattleCommander } from '@/types/tactical-game';
import { useTacticalGame } from '@/contexts/TacticalGameContext';
import { useMassCombatTacticalCards } from '@/hooks/useMassCombatTacticalCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Crown, Check, X, Loader2, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BattleTacticalCardsProps {
  unit: BattleUnit;
  commander?: BattleCommander;
}

export function BattleTacticalCards({ unit, commander }: BattleTacticalCardsProps) {
  const { gameState, myPlayerId, isMyTurn, useTacticalCard } = useTacticalGame();
  const { cards, loading } = useMassCombatTacticalCards();
  
  const isMyUnit = unit.owner === myPlayerId;
  const canUseCards = isMyUnit && isMyTurn && !unit.hasActedThisTurn;
  
  // Filtrar cartas disponíveis para esta unidade
  const availableCards = useMemo(() => {
    if (!cards) return [];
    
    return cards.filter(card => {
      // Tipo de unidade deve corresponder (ou ser "Geral")
      const cardType = card.unit_type;
      const typeMatch = 
        !cardType ||
        cardType === unit.unitType || 
        cardType === 'Geral';
      
      // Filtrar por cultura se especificada
      const cultureMatch = 
        !card.culture || 
        card.culture === unit.culture;
      
      return typeMatch && cultureMatch;
    });
  }, [cards, unit.unitType, unit.culture]);
  
  // Verificar se pode usar uma carta específica
  const canUseCard = (card: any): { can: boolean; reason?: string } => {
    if (!canUseCards) {
      return { can: false, reason: 'Não é seu turno ou unidade já agiu' };
    }
    
    if (unit.activeTacticalCard) {
      return { can: false, reason: 'Já há uma carta ativa nesta unidade' };
    }
    
    if (!commander) {
      return { can: false, reason: 'Sem comandante para ativar cartas' };
    }
    
    const commandRequired = card.command_required || card.vet_cost || 1;
    
    if (commandRequired > commander.command) {
      return { can: false, reason: `Requer Comando ${commandRequired} (tem ${commander.command})` };
    }
    
    const commandRemaining = commander.command - (commander.usedCommandThisTurn || 0);
    if (commandRemaining < 1) {
      return { can: false, reason: 'Comandante já usou todo seu Comando este turno' };
    }
    
    return { can: true };
  };
  
  const handleUseCard = async (cardId: string) => {
    const card = cards?.find(c => c.id === cardId);
    if (!card) return;
    
    const status = canUseCard(card);
    if (status.can) {
      await useTacticalCard(unit.id, cardId);
    }
  };
  
  // Encontrar carta ativa
  const activeCard = unit.activeTacticalCard 
    ? cards?.find(c => c.id === unit.activeTacticalCard)
    : null;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }
  
  return (
    <Card className="mt-4 border-primary/20">
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Cartas Táticas
          </CardTitle>
          {commander && (
            <Badge variant="outline" className="text-xs">
              <Crown className="h-3 w-3 mr-1" />
              {commander.command - (commander.usedCommandThisTurn || 0)}/{commander.command}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-2">
        {/* Carta ativa */}
        {activeCard && (
          <div className="p-2 rounded bg-yellow-500/20 border border-yellow-500/30 mb-2">
            <div className="flex items-center gap-1 text-xs font-medium text-yellow-600">
              <Check className="h-3 w-3" />
              Carta Ativa
            </div>
            <p className="text-sm font-semibold mt-1">{activeCard.name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {activeCard.attack_bonus > 0 && (
                <Badge variant="default" className="text-xs bg-green-600">+{activeCard.attack_bonus} ATQ</Badge>
              )}
              {activeCard.defense_bonus > 0 && (
                <Badge variant="default" className="text-xs bg-blue-600">+{activeCard.defense_bonus} DEF</Badge>
              )}
              {activeCard.mobility_bonus > 0 && (
                <Badge variant="default" className="text-xs bg-purple-600">+{activeCard.mobility_bonus} MOV</Badge>
              )}
              {activeCard.attack_penalty > 0 && (
                <Badge variant="destructive" className="text-xs">-{activeCard.attack_penalty} ATQ</Badge>
              )}
              {activeCard.defense_penalty > 0 && (
                <Badge variant="destructive" className="text-xs">-{activeCard.defense_penalty} DEF</Badge>
              )}
              {activeCard.mobility_penalty > 0 && (
                <Badge variant="destructive" className="text-xs">-{activeCard.mobility_penalty} MOV</Badge>
              )}
            </div>
            {activeCard.minor_effect && (
              <p className="text-xs text-muted-foreground mt-1">{activeCard.minor_effect}</p>
            )}
          </div>
        )}
        
        {/* Lista de cartas disponíveis */}
        {isMyUnit && !activeCard && (
          <TooltipProvider>
            <ScrollArea className="h-40">
              {availableCards.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma carta disponível para {unit.unitType}
                  {unit.culture && ` (${unit.culture})`}
                </div>
              ) : (
                <div className="space-y-1">
                  {availableCards.map(card => {
                    const status = canUseCard(card);
                    const commandCost = card.command_required || card.vet_cost || 1;
                    
                    return (
                      <Tooltip key={card.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={status.can ? 'outline' : 'ghost'}
                            size="sm"
                            className={`w-full justify-start h-auto py-2 px-2 ${!status.can ? 'opacity-50' : ''}`}
                            onClick={() => status.can && handleUseCard(card.id)}
                          >
                            <div className="flex flex-col items-start w-full">
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs font-medium">{card.name}</span>
                                <Badge variant="outline" className="text-[10px] ml-1">
                                  <Crown className="h-2 w-2 mr-0.5" />
                                  {commandCost}
                                </Badge>
                              </div>
                              
                              <div className="flex flex-wrap gap-0.5 mt-1">
                                {card.attack_bonus > 0 && (
                                  <span className="text-[10px] text-green-600">+{card.attack_bonus} ATQ</span>
                                )}
                                {card.defense_bonus > 0 && (
                                  <span className="text-[10px] text-blue-600">+{card.defense_bonus} DEF</span>
                                )}
                                {card.mobility_bonus > 0 && (
                                  <span className="text-[10px] text-purple-600">+{card.mobility_bonus} MOV</span>
                                )}
                                {card.attack_penalty > 0 && (
                                  <span className="text-[10px] text-red-600">-{card.attack_penalty} ATQ</span>
                                )}
                              </div>
                              
                              {!status.can && status.reason && (
                                <div className="flex items-center gap-1 mt-1 text-[10px] text-destructive">
                                  <X className="h-2 w-2" />
                                  {status.reason}
                                </div>
                              )}
                            </div>
                          </Button>
                        </TooltipTrigger>
                        
                        <TooltipContent side="left" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold">{card.name}</p>
                            
                            {card.minor_effect && (
                              <p className="text-xs">
                                <span className="text-muted-foreground">Efeito Menor:</span> {card.minor_effect}
                              </p>
                            )}
                            
                            {card.major_effect && (
                              <p className="text-xs">
                                <span className="text-muted-foreground">Efeito Maior:</span> {card.major_effect}
                              </p>
                            )}
                            
                            {card.minor_condition && (
                              <p className="text-xs">
                                <span className="text-muted-foreground">Condição Menor:</span> {card.minor_condition}
                              </p>
                            )}
                            
                            {card.major_condition && (
                              <p className="text-xs">
                                <span className="text-muted-foreground">Condição Maior:</span> {card.major_condition}
                              </p>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                              Tipo: {card.unit_type || 'Todas'} | Cultura: {card.culture || 'Todas'}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TooltipProvider>
        )}
        
        {!isMyUnit && (
          <div className="text-xs text-muted-foreground text-center py-2">
            Selecione uma unidade sua para ver cartas
          </div>
        )}
        
        {!commander && isMyUnit && (
          <div className="text-xs text-orange-500 text-center py-2 flex items-center justify-center gap-1">
            <Info className="h-3 w-3" />
            Seu exército precisa de um comandante para usar cartas
          </div>
        )}
      </CardContent>
    </Card>
  );
}
