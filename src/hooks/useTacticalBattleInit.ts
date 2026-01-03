import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { initializeTacticalGame, convertStrategicArmyToArmyData } from '@/lib/gameInitializer';
import { TacticalGameState } from '@/types/tactical-game';
import { StrategicArmy, StrategicArmyCommander, StrategicArmyCard, calculateVetSpent, calculateDefense, calculateHitPoints } from '@/types/combat/strategic-army';

interface UseTacticalBattleInitResult {
  initializeBattle: (matchId: string) => Promise<TacticalGameState | null>;
  loading: boolean;
  error: string | null;
}

export function useTacticalBattleInit(): UseTacticalBattleInitResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const initializeBattle = useCallback(async (matchId: string): Promise<TacticalGameState | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Buscar dados da partida
      const { data: match, error: matchError } = await supabase
        .from('tactical_matches')
        .select('*')
        .eq('id', matchId)
        .single();
      
      if (matchError || !match) {
        throw new Error('Partida não encontrada');
      }
      
      // 2. Buscar exército do Player 1
      const player1Army = await fetchStrategicArmy(match.player1_army_id);
      if (!player1Army) {
        throw new Error('Exército do Player 1 não encontrado');
      }
      
      // 3. Buscar exército do Player 2
      const player2Army = await fetchStrategicArmy(match.player2_army_id);
      if (!player2Army) {
        throw new Error('Exército do Player 2 não encontrado');
      }
      
      // 4. Buscar configuração de terreno (opcional)
      let terrainConfig = undefined;
      
      if (match.primary_terrain_id) {
        const { data: primaryTerrain } = await supabase
          .from('mass_combat_primary_terrains')
          .select('*')
          .eq('id', match.primary_terrain_id)
          .single();
        
        let secondaryTerrains: any[] = [];
        if (match.secondary_terrain_ids?.length > 0) {
          const { data: secondaries } = await supabase
            .from('mass_combat_secondary_terrains')
            .select('*')
            .in('id', match.secondary_terrain_ids);
          secondaryTerrains = secondaries || [];
        }
        
        let season = undefined;
        if (match.season_id) {
          const { data: seasonData } = await supabase
            .from('mass_combat_seasons')
            .select('*')
            .eq('id', match.season_id)
            .single();
          season = seasonData || undefined;
        }
        
        terrainConfig = {
          primaryTerrain: primaryTerrain || undefined,
          secondaryTerrains,
          season,
        };
      }
      
      // 5. Converter exércitos para formato de batalha
      const p1ArmyData = convertStrategicArmyToArmyData(player1Army);
      const p2ArmyData = convertStrategicArmyToArmyData(player2Army);
      
      // 6. Inicializar estado do jogo
      const gameState = initializeTacticalGame(
        match,
        p1ArmyData,
        p2ArmyData,
        terrainConfig
      );
      
      return gameState;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao inicializar batalha';
      setError(message);
      console.error('Error initializing battle:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { initializeBattle, loading, error };
}

async function fetchStrategicArmy(armyId: string | null | undefined): Promise<StrategicArmy | null> {
  if (!armyId) return null;
  
  try {
    // Buscar exército estratégico
    const { data: armyRow, error: armyError } = await supabase
      .from('strategic_armies')
      .select(`
        *,
        culture:mass_combat_cultures(id, name)
      `)
      .eq('id', armyId)
      .single();
    
    if (armyError || !armyRow) {
      console.error('Error fetching army:', armyError);
      return null;
    }
    
    // Transformar dados do banco para StrategicArmy
    const commanders: StrategicArmyCommander[] = Array.isArray(armyRow.commanders) 
      ? (armyRow.commanders as unknown as StrategicArmyCommander[]) 
      : [];
    const tacticalCards: StrategicArmyCard[] = Array.isArray(armyRow.tactical_cards) 
      ? (armyRow.tactical_cards as unknown as StrategicArmyCard[]) 
      : [];
    
    const vetInfo = calculateVetSpent({
      totalVet: armyRow.total_vet,
      attackPurchased: armyRow.attack,
      defensePurchased: armyRow.defense,
      mobilityPurchased: armyRow.mobility,
      commanders,
      tacticalCards,
    });
    
    const army: StrategicArmy = {
      id: armyRow.id,
      name: armyRow.name,
      culture: armyRow.culture_id || '',
      cultureName: (armyRow.culture as any)?.name || undefined,
      regentId: armyRow.regent_id || undefined,
      realmId: armyRow.realm_id || undefined,
      provinceId: armyRow.province_id || undefined,
      totalVet: armyRow.total_vet,
      attackPurchased: armyRow.attack,
      defensePurchased: armyRow.defense,
      mobilityPurchased: armyRow.mobility,
      attack: armyRow.attack,
      defense: calculateDefense(armyRow.defense),
      mobility: armyRow.mobility,
      hitPoints: calculateHitPoints(armyRow.total_vet),
      commanders,
      tacticalCards,
      vetSpentOnAttributes: vetInfo.attributes,
      vetSpentOnCommanders: vetInfo.commanders,
      vetSpentOnCards: vetInfo.cards,
      vetRemaining: vetInfo.remaining,
      createdAt: armyRow.created_at,
      updatedAt: armyRow.updated_at,
    };
    
    return army;
    
  } catch (err) {
    console.error('Error in fetchStrategicArmy:', err);
    return null;
  }
}
