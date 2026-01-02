import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Loader2, Sword, Shield, Zap, Plus, Minus, Crown, 
  CheckCircle2, Clock, Users, Scroll as ScrollIcon, Search, Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScenarioSummary } from './ScenarioSummary';
import type { Room, RoomPlayer, MatchState, PlayerContext } from '@/types/multiplayer';

interface DeckbuildingPanelProps {
  room: Room;
  players: RoomPlayer[];
  matchState: MatchState;
  playerContext: PlayerContext;
}

interface CommanderTemplate {
  id: string;
  numero: number;
  especializacao: string;
  comando: number;
  estrategia: number;
  guarda: number;
  custo_vet: number;
}

interface TacticalCard {
  id: string;
  name: string;
  unit_type: string;
  vet_cost: number;
  vet_cost_override: number | null;
  attack_bonus: number;
  defense_bonus: number;
  mobility_bonus: number;
  command_required: number;
  strategy_required: number;
  description?: string;
  culture?: string;
  effect_tag?: string;
}

interface ArmyAttributes {
  attack: number;
  defense: number;
  mobility: number;
}

interface PlayerCommander {
  id: string;
  numero: number;
  especializacao: string;
  comando: number;
  estrategia: number;
  guarda: number;
  custo_vet: number;
}

// Cartas básicas - sempre disponíveis, não custam VET
const BASIC_CARDS = [
  { id: 'basic_attack_plus1', name: '+1 Ataque', category: 'offensive', bonus: '+1 ATK', description: 'Carta básica ofensiva' },
  { id: 'basic_defense_plus1', name: '+1 Defesa', category: 'defensive', bonus: '+1 DEF', description: 'Carta básica defensiva' },
  { id: 'basic_initiative_plus1', name: '+1 Iniciativa', category: 'initiative', bonus: '+1 INI', description: 'Carta básica de iniciativa' },
  { id: 'basic_heal_plus1', name: '+1 Cura', category: 'initiative', bonus: '+1 CURA', description: 'Carta básica de cura/movimentação' },
  { id: 'basic_countermaneuver', name: 'Contra-Manobra', category: 'reactions', bonus: 'Reação', description: 'Consome CMD do General durante combate' },
];

// Mapeamento de unit_type para categoria
const UNIT_TYPE_TO_CATEGORY: Record<string, string> = {
  'Infantaria': 'offensive',
  'Cavalaria': 'offensive', 
  'Arqueiro': 'defensive',
  'Cerco': 'offensive',
  'General': 'initiative',
  // Fallback genéricos
  'ofensiva': 'offensive',
  'defensiva': 'defensive',
  'iniciativa': 'initiative',
  'reação': 'reactions',
  'movimentação': 'initiative',
};

export function DeckbuildingPanel({ room, players, matchState, playerContext }: DeckbuildingPanelProps) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data from DB
  const [commanderTemplates, setCommanderTemplates] = useState<CommanderTemplate[]>([]);
  const [tacticalCards, setTacticalCards] = useState<TacticalCard[]>([]);
  const [chosenTerrainName, setChosenTerrainName] = useState<string>('');
  const [chosenSeasonName, setChosenSeasonName] = useState<string>('');
  
  // VET status from server
  const [vetStatus, setVetStatus] = useState({ budget: 100, spent: 0, remaining: 100 });
  
  // Local state for attributes (optimistic UI)
  const [localAttributes, setLocalAttributes] = useState<ArmyAttributes>({ attack: 0, defense: 0, mobility: 0 });
  const [attributesDirty, setAttributesDirty] = useState(false);

  // Parse match state
  const vetAgreed = (matchState as unknown as { vet_agreed?: number }).vet_agreed ?? 100;
  
  const myAttributes = useMemo(() => {
    const attrs = playerContext.playerNumber === 1 
      ? (matchState as unknown as { player1_army_attributes?: ArmyAttributes }).player1_army_attributes
      : (matchState as unknown as { player2_army_attributes?: ArmyAttributes }).player2_army_attributes;
    return attrs ?? { attack: 0, defense: 0, mobility: 0 };
  }, [matchState, playerContext.playerNumber]);

  const myCommanders = useMemo(() => {
    const cmds = playerContext.playerNumber === 1 
      ? (matchState as unknown as { player1_commanders?: PlayerCommander[] }).player1_commanders
      : (matchState as unknown as { player2_commanders?: PlayerCommander[] }).player2_commanders;
    return cmds ?? [];
  }, [matchState, playerContext.playerNumber]);

  const myGeneralId = playerContext.playerNumber === 1 
    ? (matchState as unknown as { player1_general_id?: string }).player1_general_id
    : (matchState as unknown as { player2_general_id?: string }).player2_general_id;

  // Deck agora são só IDs
  const myDeckIds = useMemo(() => {
    const deck = playerContext.playerNumber === 1 
      ? (matchState as unknown as { player1_deck?: { offensive: string[]; defensive: string[]; initiative: string[]; reactions: string[] } }).player1_deck
      : (matchState as unknown as { player2_deck?: { offensive: string[]; defensive: string[]; initiative: string[]; reactions: string[] } }).player2_deck;
    return deck ?? { offensive: [], defensive: [], initiative: [], reactions: [] };
  }, [matchState, playerContext.playerNumber]);

  // Resolver IDs para cartas completas
  const myDeckCards = useMemo(() => {
    const resolve = (ids: string[]) => ids.map(id => tacticalCards.find(c => c.id === id)).filter(Boolean) as TacticalCard[];
    return {
      offensive: resolve(myDeckIds.offensive || []),
      defensive: resolve(myDeckIds.defensive || []),
      initiative: resolve(myDeckIds.initiative || []),
      reactions: resolve(myDeckIds.reactions || []),
    };
  }, [myDeckIds, tacticalCards]);

  const myDeckConfirmed = playerContext.playerNumber === 1 
    ? (matchState as unknown as { player1_deck_confirmed?: boolean }).player1_deck_confirmed
    : (matchState as unknown as { player2_deck_confirmed?: boolean }).player2_deck_confirmed;

  const opponentDeckConfirmed = playerContext.playerNumber === 1 
    ? (matchState as unknown as { player2_deck_confirmed?: boolean }).player2_deck_confirmed
    : (matchState as unknown as { player1_deck_confirmed?: boolean }).player1_deck_confirmed;

  // Calculate costs locally for display (server is source of truth)
  const attributesCost = (localAttributes.attack + localAttributes.defense + localAttributes.mobility) * 5;
  const commandersCost = myCommanders.reduce((sum, c) => sum + c.custo_vet, 0);
  const cardsCost = [...myDeckCards.offensive, ...myDeckCards.defensive, ...myDeckCards.initiative, ...myDeckCards.reactions]
    .reduce((sum, c) => sum + (c.vet_cost_override ?? c.vet_cost ?? 0), 0);
  const armyPV = Math.floor(vetAgreed * 0.10);

  // Card limits based on SERVER attributes (not local!) - RPC validates against server
  const cardLimits = {
    offensive: myAttributes.attack,
    defensive: myAttributes.defense,
    initiative: myAttributes.mobility,
    reactions: myAttributes.mobility * 2
  };
  
  // Check if attributes need to be saved before cards can be added
  const needsSaveBeforeCards = attributesDirty || 
    (localAttributes.attack + localAttributes.defense + localAttributes.mobility > 0 && 
     myAttributes.attack + myAttributes.defense + myAttributes.mobility === 0);

  // Sync local attributes with match state
  useEffect(() => {
    if (!attributesDirty) {
      setLocalAttributes(myAttributes);
    }
  }, [myAttributes, attributesDirty]);

  // Fetch VET status from server
  const fetchVetStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_vet_status', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId
      });
      if (!error && data) {
        setVetStatus(data as { budget: number; spent: number; remaining: number });
      }
    } catch (err) {
      console.error('Erro ao buscar VET status:', err);
    }
  }, [room.id, playerContext.sessionId]);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: cmdData } = await supabase
          .from('mass_combat_commander_templates')
          .select('*')
          .order('numero');
        if (cmdData) setCommanderTemplates(cmdData);

        const { data: cardData } = await supabase
          .from('mass_combat_tactical_cards')
          .select('*')
          .order('name');
        if (cardData) setTacticalCards(cardData);

        const chosenTerrainId = (matchState as unknown as { chosen_terrain_id?: string }).chosen_terrain_id;
        const chosenSeasonId = (matchState as unknown as { chosen_season_id?: string }).chosen_season_id;

        if (chosenTerrainId) {
          const { data: terrainData } = await supabase
            .from('mass_combat_primary_terrains')
            .select('name')
            .eq('id', chosenTerrainId)
            .single();
          if (terrainData) setChosenTerrainName(terrainData.name);
        }

        if (chosenSeasonId) {
          const { data: seasonData } = await supabase
            .from('mass_combat_seasons')
            .select('name')
            .eq('id', chosenSeasonId)
            .single();
          if (seasonData) setChosenSeasonName(seasonData.name);
        }

        await fetchVetStatus();
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchState, fetchVetStatus]);

  // Refetch VET status when match state changes
  useEffect(() => {
    fetchVetStatus();
  }, [matchState, fetchVetStatus]);

  // Save attributes
  const handleSaveAttributes = async () => {
    try {
      const { error } = await supabase.rpc('set_army_attributes', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_attack: localAttributes.attack,
        p_defense: localAttributes.defense,
        p_mobility: localAttributes.mobility
      });

      if (error) throw error;
      setAttributesDirty(false);
      await fetchVetStatus();
      toast.success('Atributos salvos!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar atributos');
    }
  };

  // Add commander
  const handleAddCommander = async (commanderId: string) => {
    try {
      const { error } = await supabase.rpc('add_commander', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_commander_id: commanderId
      });

      if (error) throw error;
      await fetchVetStatus();
      toast.success('Comandante adicionado!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar comandante');
    }
  };

  // Remove commander
  const handleRemoveCommander = async (commanderId: string) => {
    try {
      const { error } = await supabase.rpc('remove_commander', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_commander_id: commanderId
      });

      if (error) throw error;
      await fetchVetStatus();
      toast.success('Comandante removido!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover comandante');
    }
  };

  // Set general
  const handleSetGeneral = async (commanderId: string) => {
    try {
      const { error } = await supabase.rpc('set_general', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_commander_id: commanderId
      });

      if (error) throw error;
      toast.success('General definido!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao definir general');
    }
  };

  // Add card
  const handleAddCard = async (cardId: string, category: 'offensive' | 'defensive' | 'initiative' | 'reactions') => {
    try {
      const { error } = await supabase.rpc('add_card_to_deck', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_card_id: cardId,
        p_category: category
      });

      if (error) throw error;
      await fetchVetStatus();
      toast.success('Carta adicionada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar carta');
    }
  };

  // Remove card
  const handleRemoveCard = async (cardId: string, category: string) => {
    try {
      const { error } = await supabase.rpc('remove_card_from_deck', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId,
        p_card_id: cardId,
        p_category: category
      });

      if (error) throw error;
      await fetchVetStatus();
      toast.success('Carta removida!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover carta');
    }
  };

  // Confirm deckbuilding
  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const { error } = await supabase.rpc('confirm_deckbuilding', {
        p_room_id: room.id,
        p_session_id: playerContext.sessionId
      });

      if (error) throw error;
      toast.success('Deckbuilding confirmado!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao confirmar');
    } finally {
      setConfirming(false);
    }
  };

  const opponent = players.find(p => p.id !== playerContext.playerId);

  // Filter cards by category - improved logic
  const getCardsForCategory = useCallback((category: 'offensive' | 'defensive' | 'initiative' | 'reactions') => {
    return tacticalCards.filter(card => {
      // Filtrar por busca
      if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Mapear unit_type para categoria
      const cardCategory = UNIT_TYPE_TO_CATEGORY[card.unit_type] || 'offensive';
      
      // Para reações, permitir cartas marcadas como reação ou que tenham effect_tag de reação
      if (category === 'reactions') {
        return cardCategory === 'reactions' || card.effect_tag?.toLowerCase().includes('reação');
      }
      
      return cardCategory === category;
    });
  }, [tacticalCards, searchQuery]);

  // Check if card is already in deck
  const isCardInDeck = useCallback((cardId: string) => {
    return [...myDeckIds.offensive, ...myDeckIds.defensive, ...myDeckIds.initiative, ...myDeckIds.reactions]
      .includes(cardId);
  }, [myDeckIds]);

  // Check if commander is already added
  const isCommanderAdded = useCallback((commanderId: string) => {
    return myCommanders.some(c => c.id === commanderId);
  }, [myCommanders]);

  // Get basic cards for category
  const getBasicCardsForCategory = (category: string) => {
    return BASIC_CARDS.filter(c => c.category === category);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      {/* Status Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-medium">Você:</span>
              {myDeckConfirmed ? (
                <><Badge variant="default">Confirmado</Badge><CheckCircle2 className="w-4 h-4 text-green-500" /></>
              ) : (
                <Badge variant="outline">Montando deck...</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{opponent?.nickname ?? 'Oponente'}:</span>
              {opponentDeckConfirmed ? (
                <><Badge variant="secondary">Confirmado</Badge><CheckCircle2 className="w-4 h-4 text-green-500" /></>
              ) : (
                <><Badge variant="outline">Montando...</Badge><Clock className="w-4 h-4 text-muted-foreground animate-pulse" /></>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Summary */}
        <div className="space-y-4">
          <ScenarioSummary 
            matchState={matchState} 
            playerContext={playerContext}
            chosenTerrainName={chosenTerrainName}
            chosenSeasonName={chosenSeasonName}
          />

          {/* VET Summary - Server Source of Truth */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4" />
                Orçamento VET
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Budget (após cenário):</span>
                <span className="font-bold">{vetStatus.budget} VET</span>
              </div>
              <Separator />
              <div className="flex justify-between text-muted-foreground">
                <span>Atributos:</span>
                <span>{attributesCost} VET</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Comandantes ({myCommanders.length}/6):</span>
                <span>{commandersCost} VET</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Cartas:</span>
                <span>{cardsCost} VET</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total Gasto:</span>
                <span>{vetStatus.spent} VET</span>
              </div>
              <div className="flex justify-between text-primary font-bold text-lg">
                <span>Restante:</span>
                <span className={vetStatus.remaining < 0 ? 'text-destructive' : ''}>{vetStatus.remaining} VET</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>PV do Exército:</span>
                <span>{armyPV}</span>
              </div>
            </CardContent>
          </Card>

          {/* Basic Cards Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cartas Básicas (Sempre Disponíveis)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              {BASIC_CARDS.map(card => (
                <div key={card.id} className="flex justify-between">
                  <span>{card.name}</span>
                  <Badge variant="outline" className="text-xs">{card.bonus}</Badge>
                </div>
              ))}
              <p className="text-xs italic mt-2">Não custam VET e não contam em limites.</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="attributes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="attributes">Atributos</TabsTrigger>
              <TabsTrigger value="commanders">Comandantes</TabsTrigger>
              <TabsTrigger value="cards">Cartas</TabsTrigger>
            </TabsList>

            {/* Attributes Tab */}
            <TabsContent value="attributes" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Atributos do Exército</CardTitle>
                  <CardDescription>Cada +1 custa 5 VET. Define limites de cartas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Attack */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sword className="w-5 h-5 text-red-500" />
                        <span className="font-medium">Ataque</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          onClick={() => { 
                            setLocalAttributes(prev => ({ ...prev, attack: Math.max(0, prev.attack - 1) }));
                            setAttributesDirty(true);
                          }}
                          disabled={localAttributes.attack === 0 || myDeckConfirmed}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-lg">{localAttributes.attack}</span>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          onClick={() => { 
                            setLocalAttributes(prev => ({ ...prev, attack: prev.attack + 1 }));
                            setAttributesDirty(true);
                          }}
                          disabled={myDeckConfirmed}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Limite de cartas ofensivas: {localAttributes.attack}</p>
                  </div>

                  {/* Defense */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">Defesa</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          onClick={() => { 
                            setLocalAttributes(prev => ({ ...prev, defense: Math.max(0, prev.defense - 1) }));
                            setAttributesDirty(true);
                          }}
                          disabled={localAttributes.defense === 0 || myDeckConfirmed}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-lg">{localAttributes.defense}</span>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          onClick={() => { 
                            setLocalAttributes(prev => ({ ...prev, defense: prev.defense + 1 }));
                            setAttributesDirty(true);
                          }}
                          disabled={myDeckConfirmed}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Limite de cartas defensivas: {localAttributes.defense}</p>
                  </div>

                  {/* Mobility */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <span className="font-medium">Mobilidade</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          onClick={() => { 
                            setLocalAttributes(prev => ({ ...prev, mobility: Math.max(0, prev.mobility - 1) }));
                            setAttributesDirty(true);
                          }}
                          disabled={localAttributes.mobility === 0 || myDeckConfirmed}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-lg">{localAttributes.mobility}</span>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          onClick={() => { 
                            setLocalAttributes(prev => ({ ...prev, mobility: prev.mobility + 1 }));
                            setAttributesDirty(true);
                          }}
                          disabled={myDeckConfirmed}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Limite de cartas de iniciativa: {localAttributes.mobility} | Reações: {localAttributes.mobility * 2}
                    </p>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-medium">Custo total: {attributesCost} VET</span>
                    {attributesDirty && (
                      <Button onClick={handleSaveAttributes} disabled={myDeckConfirmed}>
                        Salvar Atributos
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Commanders Tab */}
            <TabsContent value="commanders" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Comandantes ({myCommanders.length}/6)
                  </CardTitle>
                  <CardDescription>Escolha seu general entre os comandantes comprados.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* My Commanders */}
                  {myCommanders.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2 text-sm">Seus Comandantes:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {myCommanders.map((cmd) => (
                          <div 
                            key={cmd.id} 
                            className={`p-3 rounded-lg border ${myGeneralId === cmd.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">#{cmd.numero}</Badge>
                                <span className="text-xs">{cmd.especializacao}</span>
                              </div>
                              {myGeneralId === cmd.id && (
                                <Badge className="gap-1"><Crown className="w-3 h-3" />General</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              CMD: {cmd.comando} | EST: {cmd.estrategia} | GUA: {cmd.guarda} | {cmd.custo_vet} VET
                            </div>
                            <div className="flex gap-1">
                              {myGeneralId !== cmd.id && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleSetGeneral(cmd.id)}
                                  disabled={myDeckConfirmed}
                                >
                                  <Crown className="w-3 h-3 mr-1" />General
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRemoveCommander(cmd.id)}
                                disabled={myDeckConfirmed}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />

                  {/* Available Commanders */}
                  <h4 className="font-medium mb-2 text-sm">Templates Disponíveis:</h4>
                  <ScrollArea className="h-64">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-4">
                      {commanderTemplates
                        .filter(t => !isCommanderAdded(t.id))
                        .map((template) => (
                          <div key={template.id} className="p-3 rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">#{template.numero}</Badge>
                                <span className="text-xs">{template.especializacao}</span>
                              </div>
                              <Badge variant="secondary">{template.custo_vet} VET</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              CMD: {template.comando} | EST: {template.estrategia} | GUA: {template.guarda}
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => handleAddCommander(template.id)}
                              disabled={myCommanders.length >= 6 || vetStatus.remaining < template.custo_vet || myDeckConfirmed}
                            >
                              <Plus className="w-3 h-3 mr-1" />Adicionar
                            </Button>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cards Tab */}
            <TabsContent value="cards" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ScrollIcon className="w-5 h-5" />
                    Cartas Táticas
                  </CardTitle>
                  <CardDescription>
                    Limites: Off {myDeckCards.offensive.length}/{cardLimits.offensive} | 
                    Def {myDeckCards.defensive.length}/{cardLimits.defensive} | 
                    Ini {myDeckCards.initiative.length}/{cardLimits.initiative} | 
                    React {myDeckCards.reactions.length}/{cardLimits.reactions}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Warning: Needs to save attributes first */}
                  {needsSaveBeforeCards && (
                    <div className="mb-4 p-3 rounded-lg border border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-sm">
                      <strong>Atenção:</strong> Você precisa salvar os atributos na aba "Atributos" antes de adicionar cartas.
                      Os limites atuais são baseados nos atributos salvos (ATK:{myAttributes.attack}, DEF:{myAttributes.defense}, MOB:{myAttributes.mobility}).
                    </div>
                  )}
                  
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar carta..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Tabs defaultValue="offensive">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="offensive" className="text-xs">
                        Ofensivas ({myDeckCards.offensive.length}/{cardLimits.offensive})
                      </TabsTrigger>
                      <TabsTrigger value="defensive" className="text-xs">
                        Defensivas ({myDeckCards.defensive.length}/{cardLimits.defensive})
                      </TabsTrigger>
                      <TabsTrigger value="initiative" className="text-xs">
                        Iniciativa ({myDeckCards.initiative.length}/{cardLimits.initiative})
                      </TabsTrigger>
                      <TabsTrigger value="reactions" className="text-xs">
                        Reações ({myDeckCards.reactions.length}/{cardLimits.reactions})
                      </TabsTrigger>
                    </TabsList>

                    {(['offensive', 'defensive', 'initiative', 'reactions'] as const).map((category) => (
                      <TabsContent key={category} value={category} className="mt-4">
                        {/* Basic Cards for this category */}
                        {getBasicCardsForCategory(category).length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2 text-sm flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              Sempre Disponíveis:
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {getBasicCardsForCategory(category).map((card) => (
                                <div key={card.id} className="p-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 flex justify-between items-center">
                                  <div>
                                    <span className="font-medium text-sm">{card.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">{card.description}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">Grátis</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* My Cards in Category */}
                        {myDeckCards[category].length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2 text-sm">No Deck:</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {myDeckCards[category].map((card) => (
                                <div key={card.id} className="p-2 rounded-lg border border-primary/50 bg-primary/5 flex justify-between items-center">
                                  <div>
                                    <span className="font-medium text-sm">{card.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {card.attack_bonus > 0 && `+${card.attack_bonus} ATK `}
                                      {card.defense_bonus > 0 && `+${card.defense_bonus} DEF `}
                                      {card.mobility_bonus > 0 && `+${card.mobility_bonus} MOB`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{card.vet_cost_override ?? card.vet_cost} VET</Badge>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      onClick={() => handleRemoveCard(card.id, category)}
                                      disabled={myDeckConfirmed}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Available Cards - Filtered */}
                        <ScrollArea className="h-48">
                          <div className="grid grid-cols-1 gap-2 pr-4">
                            {getCardsForCategory(category)
                              .filter(c => !isCardInDeck(c.id))
                              .map((card) => (
                                <div key={card.id} className="p-2 rounded-lg border border-border flex justify-between items-center">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-sm">{card.name}</span>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {card.unit_type} | CMD {card.command_required}
                                      {card.attack_bonus > 0 && ` | +${card.attack_bonus} ATK`}
                                      {card.defense_bonus > 0 && ` | +${card.defense_bonus} DEF`}
                                      {card.mobility_bonus > 0 && ` | +${card.mobility_bonus} MOB`}
                                      {card.culture && ` | ${card.culture}`}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    <Badge variant="outline">{card.vet_cost_override ?? card.vet_cost} VET</Badge>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleAddCard(card.id, category)}
                                      disabled={
                                        myDeckCards[category].length >= cardLimits[category] || 
                                        vetStatus.remaining < (card.vet_cost_override ?? card.vet_cost) ||
                                        myDeckConfirmed
                                      }
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            {getCardsForCategory(category).filter(c => !isCardInDeck(c.id)).length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhuma carta disponível nesta categoria
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Confirm Button */}
      {!myDeckConfirmed && (
        <Card>
          <CardContent className="py-4">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleConfirm}
              disabled={
                confirming || 
                myCommanders.length < 1 || 
                !myGeneralId ||
                vetStatus.remaining < 0 ||
                attributesDirty
              }
            >
              {confirming ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Confirmando...</>
              ) : (
                'Confirmar Deckbuilding'
              )}
            </Button>
            {attributesDirty && (
              <p className="text-xs text-center text-destructive mt-2">Salve os atributos antes de confirmar</p>
            )}
            {!myGeneralId && myCommanders.length > 0 && (
              <p className="text-xs text-center text-destructive mt-2">Defina um General</p>
            )}
            {myCommanders.length < 1 && (
              <p className="text-xs text-center text-destructive mt-2">Adicione pelo menos 1 comandante</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
