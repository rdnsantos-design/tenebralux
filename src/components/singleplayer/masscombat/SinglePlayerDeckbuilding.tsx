// ========================
// DECKBUILDING
// Construção de deck no modo single player
// ========================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, Sword, Shield, Zap, Plus, Minus, Crown, 
  Users, CheckCircle2, MapPin, Sun
} from 'lucide-react';
import type { 
  ArmyAttributes, 
  SPCommander, 
  SPTacticalCard,
  SPPlayerDeck,
} from '@/types/singleplayer-mass-combat';

interface SinglePlayerDeckbuildingProps {
  vetBudget: number;
  chosenScenario: { terrainName: string; seasonName: string } | null;
  attributes: ArmyAttributes;
  commanders: SPCommander[];
  generalId: string | null;
  deck: SPPlayerDeck;
  commanderTemplates: Array<{
    id: string;
    numero: number;
    especializacao: string;
    comando: number;
    estrategia: number;
    guarda: number;
    custo_vet: number;
  }>;
  tacticalCards: SPTacticalCard[];
  isBotThinking: boolean;
  onSetAttributes: (attrs: ArmyAttributes) => void;
  onAddCommander: (template: SinglePlayerDeckbuildingProps['commanderTemplates'][0]) => void;
  onRemoveCommander: (instanceId: string) => void;
  onSetGeneral: (instanceId: string) => void;
  onAddCard: (card: SPTacticalCard, category: keyof SPPlayerDeck) => void;
  onRemoveCard: (cardId: string, category: keyof SPPlayerDeck) => void;
  onConfirm: () => void;
}

export function SinglePlayerDeckbuilding({
  vetBudget,
  chosenScenario,
  attributes,
  commanders,
  generalId,
  deck,
  commanderTemplates,
  tacticalCards,
  isBotThinking,
  onSetAttributes,
  onAddCommander,
  onRemoveCommander,
  onSetGeneral,
  onAddCard,
  onRemoveCard,
  onConfirm,
}: SinglePlayerDeckbuildingProps) {
  const [activeTab, setActiveTab] = useState('attributes');

  // Calcular custos
  const attributesCost = (attributes.attack + attributes.defense + attributes.mobility) * 5;
  const commandersCost = commanders.reduce((sum, c) => sum + c.custo_vet, 0);
  const cardsCost = [...deck.offensive, ...deck.defensive, ...deck.initiative, ...deck.reactions]
    .reduce((sum, c) => sum + (c.vet_cost || 0), 0);
  const totalCost = attributesCost + commandersCost + cardsCost;
  const vetRemaining = vetBudget - totalCost;
  const armyHp = Math.floor(vetBudget * 0.1);

  // Limites de cartas
  const cardLimits = {
    offensive: attributes.attack,
    defensive: attributes.defense,
    initiative: attributes.mobility,
    reactions: attributes.mobility * 2,
  };

  // Filtrar cartas por categoria
  const getCardsForCategory = (category: keyof SPPlayerDeck) => {
    const categoryToType: Record<string, string> = {
      offensive: 'ofensiva',
      defensive: 'defensiva',
      initiative: 'movimentacao',
      reactions: 'reacao',
    };
    return tacticalCards.filter(c => c.card_type === categoryToType[category]);
  };

  const adjustAttribute = (attr: keyof ArmyAttributes, delta: number) => {
    const newValue = Math.max(0, Math.min(10, attributes[attr] + delta));
    const newAttrs = { ...attributes, [attr]: newValue };
    const newCost = (newAttrs.attack + newAttrs.defense + newAttrs.mobility) * 5;
    if (newCost <= vetBudget - commandersCost - cardsCost) {
      onSetAttributes(newAttrs);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header com cenário e VET */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap justify-between items-center gap-4">
            {/* Cenário */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{chosenScenario?.terrainName || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{chosenScenario?.seasonName || 'N/A'}</span>
              </div>
            </div>

            {/* VET */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">VET Restante</p>
                <Badge variant={vetRemaining >= 0 ? 'default' : 'destructive'}>
                  {vetRemaining}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">HP do Exército</p>
                <Badge variant="secondary">{armyHp}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attributes">
            <Zap className="w-4 h-4 mr-2" />
            Atributos
          </TabsTrigger>
          <TabsTrigger value="commanders">
            <Users className="w-4 h-4 mr-2" />
            Comandantes
          </TabsTrigger>
          <TabsTrigger value="cards">
            <Sword className="w-4 h-4 mr-2" />
            Cartas
          </TabsTrigger>
        </TabsList>

        {/* Atributos */}
        <TabsContent value="attributes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atributos do Exército</CardTitle>
              <CardDescription>
                Cada ponto custa 5 VET e define limites de cartas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ataque */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Sword className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium">Ataque</p>
                    <p className="text-xs text-muted-foreground">
                      Limite de cartas ofensivas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => adjustAttribute('attack', -1)}
                    disabled={attributes.attack <= 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-bold text-lg">{attributes.attack}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => adjustAttribute('attack', 1)}
                    disabled={vetRemaining < 5}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Defesa */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Shield className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Defesa</p>
                    <p className="text-xs text-muted-foreground">
                      Limite de cartas defensivas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => adjustAttribute('defense', -1)}
                    disabled={attributes.defense <= 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-bold text-lg">{attributes.defense}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => adjustAttribute('defense', 1)}
                    disabled={vetRemaining < 5}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Mobilidade */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Zap className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Mobilidade</p>
                    <p className="text-xs text-muted-foreground">
                      Limite de cartas de iniciativa e reações (×2)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => adjustAttribute('mobility', -1)}
                    disabled={attributes.mobility <= 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-bold text-lg">{attributes.mobility}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => adjustAttribute('mobility', 1)}
                    disabled={vetRemaining < 5}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="text-center">
                <p className="text-sm text-muted-foreground">Custo Total de Atributos</p>
                <p className="text-2xl font-bold">{attributesCost} VET</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comandantes */}
        <TabsContent value="commanders">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comandantes</CardTitle>
              <CardDescription>
                Adicione comandantes e defina o General
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comandantes adicionados */}
              {commanders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Seu Exército</h4>
                  {commanders.map(cmd => (
                    <div
                      key={cmd.instance_id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        cmd.is_general ? 'border-amber-500 bg-amber-500/10' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {cmd.is_general && <Crown className="w-5 h-5 text-amber-500" />}
                        <div>
                          <p className="font-medium">#{cmd.numero} {cmd.especializacao}</p>
                          <p className="text-xs text-muted-foreground">
                            CMD {cmd.comando_base} | EST {cmd.estrategia} | GUA {cmd.guarda_max}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{cmd.custo_vet} VET</Badge>
                        {!cmd.is_general && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSetGeneral(cmd.instance_id)}
                          >
                            <Crown className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onRemoveCommander(cmd.instance_id)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Templates disponíveis */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Disponíveis</h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {commanderTemplates.map(template => {
                      const alreadyAdded = commanders.some(c => c.template_id === template.id);
                      const canAfford = template.custo_vet <= vetRemaining;

                      return (
                        <div
                          key={template.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            alreadyAdded ? 'opacity-50' : ''
                          }`}
                        >
                          <div>
                            <p className="font-medium">#{template.numero} {template.especializacao}</p>
                            <p className="text-xs text-muted-foreground">
                              CMD {template.comando} | EST {template.estrategia} | GUA {template.guarda}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{template.custo_vet} VET</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onAddCommander(template)}
                              disabled={alreadyAdded || !canAfford}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cartas */}
        <TabsContent value="cards">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cartas Táticas</CardTitle>
              <CardDescription>
                Monte seu deck respeitando os limites de atributos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="offensive">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="offensive">
                    Ofensivas ({deck.offensive.length}/{cardLimits.offensive})
                  </TabsTrigger>
                  <TabsTrigger value="defensive">
                    Defensivas ({deck.defensive.length}/{cardLimits.defensive})
                  </TabsTrigger>
                  <TabsTrigger value="initiative">
                    Iniciativa ({deck.initiative.length}/{cardLimits.initiative})
                  </TabsTrigger>
                  <TabsTrigger value="reactions">
                    Reações ({deck.reactions.length}/{cardLimits.reactions})
                  </TabsTrigger>
                </TabsList>

                {(['offensive', 'defensive', 'initiative', 'reactions'] as const).map(category => (
                  <TabsContent key={category} value={category} className="space-y-4">
                    {/* Cartas no deck */}
                    {deck[category].length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">No Deck</h4>
                        {deck[category].map((card, index) => (
                          <div
                            key={`${card.id}-${index}`}
                            className="flex items-center justify-between p-2 rounded-lg border bg-muted/50"
                          >
                            <div>
                              <p className="font-medium text-sm">{card.name}</p>
                              <p className="text-xs text-muted-foreground">
                                +{card.attack_bonus}ATK +{card.defense_bonus}DEF
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemoveCard(card.id, category)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Cartas disponíveis */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Disponíveis</h4>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {getCardsForCategory(category).map(card => {
                            const atLimit = deck[category].length >= cardLimits[category];
                            const canAfford = (card.vet_cost || 0) <= vetRemaining;

                            return (
                              <div
                                key={card.id}
                                className="flex items-center justify-between p-2 rounded-lg border"
                              >
                                <div>
                                  <p className="font-medium text-sm">{card.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    +{card.attack_bonus}ATK +{card.defense_bonus}DEF | CMD {card.command_required}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{card.vet_cost} VET</Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onAddCard(card, category)}
                                    disabled={atLimit || !canAfford}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão confirmar */}
      <Button
        onClick={onConfirm}
        disabled={commanders.length === 0 || !generalId || isBotThinking}
        className="w-full"
        size="lg"
      >
        {isBotThinking ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Bot construindo deck...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirmar e Preparar para Batalha
          </>
        )}
      </Button>
    </div>
  );
}
