/**
 * Hook unificado para dados de Mass Combat
 * Combina: primary_terrains, secondary_terrains, seasons, compatibility, tactical_cards
 */

import { useMemo } from 'react';
import { 
  useMassCombatPrimaryTerrains, 
  useMassCombatSecondaryTerrains,
  useMassCombatTerrainCompatibility 
} from './useMassCombatTerrains';
import { useMassCombatSeasons } from './useMassCombatClimates';
import { useMassCombatTacticalCards } from './useMassCombatTacticalCards';
import { 
  MassCombatPrimaryTerrain, 
  MassCombatSecondaryTerrain,
  MassCombatTerrainCompatibility 
} from '@/types/MassCombatTerrain';
import { MassCombatSeason } from '@/types/MassCombatClimate';
import { MassCombatTacticalCard } from '@/types/MassCombatTacticalCard';

export interface EnrichedPrimaryTerrain extends MassCombatPrimaryTerrain {
  compatibleSecondaries: MassCombatSecondaryTerrain[];
}

export interface EnrichedSecondaryTerrain extends MassCombatSecondaryTerrain {
  compatiblePrimaries: MassCombatPrimaryTerrain[];
}

export interface TacticalCardsByType {
  [unitType: string]: MassCombatTacticalCard[];
}

export interface TacticalCardsByCulture {
  [culture: string]: MassCombatTacticalCard[];
}

export interface UseMassCombatDataResult {
  // Dados brutos
  primaryTerrains: MassCombatPrimaryTerrain[];
  secondaryTerrains: MassCombatSecondaryTerrain[];
  terrainCompatibility: MassCombatTerrainCompatibility[];
  seasons: MassCombatSeason[];
  tacticalCards: MassCombatTacticalCard[];
  
  // Dados enriquecidos
  enrichedPrimaryTerrains: EnrichedPrimaryTerrain[];
  enrichedSecondaryTerrains: EnrichedSecondaryTerrain[];
  tacticalCardsByType: TacticalCardsByType;
  tacticalCardsByCulture: TacticalCardsByCulture;
  
  // Estados
  isLoading: boolean;
  isError: boolean;
  
  // Utilitários
  getCompatibleSecondaries: (primaryId: string) => MassCombatSecondaryTerrain[];
  getCompatiblePrimaries: (secondaryId: string) => MassCombatPrimaryTerrain[];
  getSeasonByName: (name: string) => MassCombatSeason | undefined;
  getCardsForUnit: (unitType: string, culture?: string) => MassCombatTacticalCard[];
  calculateTerrainModifiers: (primaryId: string, secondaryIds: string[]) => {
    attack: number;
    defense: number;
    mobility: number;
    strategy: number;
  };
  calculateSeasonModifier: (seasonName: string, conditionLevel: 1 | 2 | 3) => {
    type: string;
    conditionName: string;
    modifier: number;
  } | null;
}

export const useMassCombatData = (): UseMassCombatDataResult => {
  // Busca dados base
  const { data: primaryTerrains = [], isLoading: primaryLoading, isError: primaryError } = useMassCombatPrimaryTerrains();
  const { data: secondaryTerrains = [], isLoading: secondaryLoading, isError: secondaryError } = useMassCombatSecondaryTerrains();
  const { data: terrainCompatibility = [], isLoading: compatLoading, isError: compatError } = useMassCombatTerrainCompatibility();
  const { data: seasons = [], isLoading: seasonsLoading, isError: seasonsError } = useMassCombatSeasons();
  const { cards: tacticalCards = [], loading: cardsLoading, error: cardsError } = useMassCombatTacticalCards();

  // Enriquece terrenos primários
  const enrichedPrimaryTerrains = useMemo((): EnrichedPrimaryTerrain[] => {
    return primaryTerrains.map(primary => {
      const compatibleIds = terrainCompatibility
        .filter(tc => tc.primary_terrain_id === primary.id)
        .map(tc => tc.secondary_terrain_id);
      
      const compatibleSecondaries = secondaryTerrains.filter(s => 
        s.is_universal || compatibleIds.includes(s.id)
      );

      return {
        ...primary,
        compatibleSecondaries,
      };
    });
  }, [primaryTerrains, secondaryTerrains, terrainCompatibility]);

  // Enriquece terrenos secundários
  const enrichedSecondaryTerrains = useMemo((): EnrichedSecondaryTerrain[] => {
    return secondaryTerrains.map(secondary => {
      if (secondary.is_universal) {
        return { ...secondary, compatiblePrimaries: primaryTerrains };
      }

      const compatibleIds = terrainCompatibility
        .filter(tc => tc.secondary_terrain_id === secondary.id)
        .map(tc => tc.primary_terrain_id);
      
      const compatiblePrimaries = primaryTerrains.filter(p => 
        compatibleIds.includes(p.id)
      );

      return { ...secondary, compatiblePrimaries };
    });
  }, [secondaryTerrains, primaryTerrains, terrainCompatibility]);

  // Agrupa cards por tipo de unidade
  const tacticalCardsByType = useMemo((): TacticalCardsByType => {
    const byType: TacticalCardsByType = {};
    tacticalCards.forEach(card => {
      if (!byType[card.unit_type]) {
        byType[card.unit_type] = [];
      }
      byType[card.unit_type].push(card);
    });
    return byType;
  }, [tacticalCards]);

  // Agrupa cards por cultura
  const tacticalCardsByCulture = useMemo((): TacticalCardsByCulture => {
    const byCulture: TacticalCardsByCulture = {};
    tacticalCards.forEach(card => {
      const culture = card.culture || 'Universal';
      if (!byCulture[culture]) {
        byCulture[culture] = [];
      }
      byCulture[culture].push(card);
    });
    return byCulture;
  }, [tacticalCards]);

  // Funções utilitárias
  const getCompatibleSecondaries = (primaryId: string) => {
    const enriched = enrichedPrimaryTerrains.find(p => p.id === primaryId);
    return enriched?.compatibleSecondaries || [];
  };

  const getCompatiblePrimaries = (secondaryId: string) => {
    const enriched = enrichedSecondaryTerrains.find(s => s.id === secondaryId);
    return enriched?.compatiblePrimaries || [];
  };

  const getSeasonByName = (name: string) => 
    seasons.find(s => s.name === name);

  const getCardsForUnit = (unitType: string, culture?: string) => {
    let cards = tacticalCardsByType[unitType] || [];
    if (culture) {
      cards = cards.filter(c => !c.culture || c.culture === culture);
    }
    return cards;
  };

  const calculateTerrainModifiers = (primaryId: string, secondaryIds: string[]) => {
    const primary = primaryTerrains.find(p => p.id === primaryId);
    const secondaries = secondaryTerrains.filter(s => secondaryIds.includes(s.id));

    let attack = primary?.attack_mod || 0;
    let defense = primary?.defense_mod || 0;
    let mobility = primary?.mobility_mod || 0;
    let strategy = 0;

    secondaries.forEach(s => {
      attack += s.attack_mod;
      defense += s.defense_mod;
      mobility += s.mobility_mod;
      strategy += s.strategy_mod;
    });

    return { attack, defense, mobility, strategy };
  };

  const calculateSeasonModifier = (seasonName: string, conditionLevel: 1 | 2 | 3) => {
    const season = getSeasonByName(seasonName);
    if (!season) return null;

    const conditionMap = {
      1: { name: season.condition1_name, mod: season.condition1_modifier },
      2: { name: season.condition2_name, mod: season.condition2_modifier },
      3: { name: season.condition3_name, mod: season.condition3_modifier },
    };

    const condition = conditionMap[conditionLevel];
    return {
      type: season.modifier_type,
      conditionName: condition.name,
      modifier: condition.mod,
    };
  };

  return {
    primaryTerrains,
    secondaryTerrains,
    terrainCompatibility,
    seasons,
    tacticalCards,
    enrichedPrimaryTerrains,
    enrichedSecondaryTerrains,
    tacticalCardsByType,
    tacticalCardsByCulture,
    isLoading: primaryLoading || secondaryLoading || compatLoading || seasonsLoading || cardsLoading,
    isError: primaryError || secondaryError || compatError || seasonsError || !!cardsError,
    getCompatibleSecondaries,
    getCompatiblePrimaries,
    getSeasonByName,
    getCardsForUnit,
    calculateTerrainModifiers,
    calculateSeasonModifier,
  };
};
