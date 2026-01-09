/**
 * Painel de Debug para Combate Tático
 * Mostra stats detalhados e cartas de todos os combatentes
 */

import { useState } from 'react';
import { Combatant, CombatCard } from '@/types/tactical-combat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { 
  Bug, 
  ChevronDown, 
  ChevronUp,
  Heart, 
  Shield, 
  Zap, 
  Move, 
  Clock,
  Sword,
  Target,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CombatDebugPanelProps {
  combatants: Combatant[];
  currentTick: number;
  round: number;
  getAllCards?: (combatant: Combatant) => CombatCard[];
}

function StatRow({ label, value, icon, color }: { 
  label: string; 
  value: string | number; 
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 px-2 rounded bg-muted/30">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className={cn("text-xs font-mono font-semibold", color)}>
        {value}
      </span>
    </div>
  );
}

function CombatantDebug({ 
  combatant, 
  cards 
}: { 
  combatant: Combatant; 
  cards: CombatCard[];
}) {
  const [isOpen, setIsOpen] = useState(true);
  const stats = combatant.stats;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "border-l-4",
        combatant.team === 'player' ? 'border-l-primary' : 'border-l-destructive',
        stats.isDown && 'opacity-50'
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-2 px-3 cursor-pointer hover:bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                {combatant.name}
                <Badge 
                  variant={combatant.team === 'player' ? 'default' : 'destructive'} 
                  className="text-xs"
                >
                  {combatant.team === 'player' ? 'Aliado' : 'Inimigo'}
                </Badge>
                {stats.isDown && (
                  <Badge variant="outline" className="text-destructive">FORA</Badge>
                )}
              </CardTitle>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3 px-3 space-y-3">
            {/* Stats Principais */}
            <div>
              <h5 className="text-xs font-semibold mb-1.5 text-muted-foreground">Stats de Combate</h5>
              <div className="grid grid-cols-2 gap-1">
                <StatRow 
                  label="Vitalidade" 
                  value={`${stats.vitality}/${stats.maxVitality}`} 
                  icon={<Heart className="h-3 w-3 text-red-500" />}
                  color={stats.vitality <= stats.maxVitality * 0.3 ? 'text-destructive' : undefined}
                />
                <StatRow 
                  label="Guarda" 
                  value={stats.guard} 
                  icon={<Shield className="h-3 w-3 text-blue-500" />}
                />
                <StatRow 
                  label="Evasão" 
                  value={`${stats.evasion}/${stats.maxEvasion}`} 
                  icon={<Zap className="h-3 w-3 text-yellow-500" />}
                />
                <StatRow 
                  label="Movimento" 
                  value={`${stats.currentMovement}/${stats.movement}m`} 
                  icon={<Move className="h-3 w-3 text-green-500" />}
                />
                <StatRow 
                  label="Tick Atual" 
                  value={stats.currentTick} 
                  icon={<Clock className="h-3 w-3 text-purple-500" />}
                />
                <StatRow 
                  label="Preparo" 
                  value={stats.prep || 0} 
                  icon={<Clock className="h-3 w-3 text-purple-300" />}
                />
                <StatRow 
                  label="Reação" 
                  value={stats.reaction} 
                  icon={<Zap className="h-3 w-3 text-cyan-500" />}
                />
              </div>
            </div>

            {/* Stats Secundários */}
            <div>
              <h5 className="text-xs font-semibold mb-1.5 text-muted-foreground">Status</h5>
              <div className="grid grid-cols-3 gap-1">
                <StatRow label="Fadiga" value={stats.fatigue || 0} color="text-amber-600" />
                <StatRow label="Ferimentos" value={stats.wounds || 0} color="text-red-600" />
                <StatRow label="Lentidão" value={stats.slowness || 0} color="text-orange-600" />
              </div>
            </div>

            {/* Equipamento */}
            <div>
              <h5 className="text-xs font-semibold mb-1.5 text-muted-foreground">Equipamento</h5>
              <div className="space-y-1 text-xs">
                {stats.weapon && (
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/30">
                    <Sword className="h-3 w-3 text-orange-500" />
                    <span className="flex-1">{stats.weapon.name.akashic}</span>
                    <Badge variant="outline" className="text-xs">
                      D{stats.weapon.damage} | Atq +{stats.weapon.attackModifier} | Vel {stats.weapon.speedModifier}
                    </Badge>
                  </div>
                )}
                {stats.armor && stats.armor.guardBonus > 0 && (
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/30">
                    <Shield className="h-3 w-3 text-blue-500" />
                    <span className="flex-1">{stats.armor.name.akashic}</span>
                    <Badge variant="outline" className="text-xs">
                      Guarda +{stats.armor.guardBonus} | DR {stats.armor.damageReduction || 0}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Cartas Disponíveis */}
            <div>
              <h5 className="text-xs font-semibold mb-1.5 text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                Cartas ({cards.length})
              </h5>
              <ScrollArea className="h-[100px]">
                <div className="space-y-1">
                  {cards.map((card) => (
                    <div 
                      key={card.id}
                      className="flex items-center gap-2 px-2 py-1 rounded bg-muted/30 text-xs"
                    >
                      <Badge 
                        variant={card.type === 'basic' ? 'secondary' : 'default'}
                        className="text-[10px] px-1"
                      >
                        {card.type === 'basic' ? 'Bás' : card.type === 'tactical' ? 'Tát' : 'Pos'}
                      </Badge>
                      <span className="flex-1 truncate">{card.name.akashic}</span>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {card.attackModifier !== 0 && (
                          <span className={card.attackModifier > 0 ? 'text-green-600' : 'text-red-600'}>
                            Atq{card.attackModifier > 0 ? '+' : ''}{card.attackModifier}
                          </span>
                        )}
                        {card.speedModifier !== undefined && (
                          <span>Vel{card.speedModifier >= 0 ? '+' : ''}{card.speedModifier}</span>
                        )}
                        {card.defenseBonus && card.defenseBonus > 0 && (
                          <span className="text-blue-600">Def+{card.defenseBonus}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function CombatDebugPanel({ 
  combatants, 
  currentTick, 
  round,
  getAllCards = () => []
}: CombatDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const playerCombatants = combatants.filter(c => c.team === 'player');
  const enemyCombatants = combatants.filter(c => c.team === 'enemy');

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed border-amber-500/50 bg-amber-500/5">
        <CollapsibleTrigger asChild>
          <CardHeader className="py-2 px-3 cursor-pointer hover:bg-amber-500/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                <Bug className="h-4 w-4" />
                Painel de Debug
                <Badge variant="outline" className="text-xs">
                  Tick: {currentTick} | Round: {round}
                </Badge>
              </CardTitle>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="ml-1 text-xs">{isOpen ? 'Fechar' : 'Abrir'}</span>
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-3 px-3">
            <Tabs defaultValue="all">
              <TabsList className="w-full mb-3">
                <TabsTrigger value="all" className="flex-1 text-xs">
                  Todos ({combatants.length})
                </TabsTrigger>
                <TabsTrigger value="player" className="flex-1 text-xs">
                  Aliados ({playerCombatants.length})
                </TabsTrigger>
                <TabsTrigger value="enemy" className="flex-1 text-xs">
                  Inimigos ({enemyCombatants.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {combatants.map((c) => (
                      <CombatantDebug 
                        key={c.id} 
                        combatant={c} 
                        cards={getAllCards(c)} 
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="player" className="mt-0">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {playerCombatants.map((c) => (
                      <CombatantDebug 
                        key={c.id} 
                        combatant={c} 
                        cards={getAllCards(c)} 
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="enemy" className="mt-0">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {enemyCombatants.map((c) => (
                      <CombatantDebug 
                        key={c.id} 
                        combatant={c} 
                        cards={getAllCards(c)} 
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
