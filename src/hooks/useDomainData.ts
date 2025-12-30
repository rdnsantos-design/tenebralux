/**
 * Hook unificado para dados de domínios
 * Combina: realms, provinces, holdings, regents
 */

import { useMemo } from 'react';
import { useRealms, useProvinces } from './useDomains';
import { useHoldings } from './useHoldings';
import { useRegents } from './useRegents';
import { Realm, ProvinceWithRealm } from '@/types/Domain';
import { Holding } from '@/types/entities/holding';
import { Regent } from '@/types/entities/regent';

export interface EnrichedProvince extends ProvinceWithRealm {
  holdings: Holding[];
  holdingSummary: {
    totalLevel: number;
    byType: Record<string, number>;
  };
}

export interface EnrichedRealm extends Realm {
  provinces: EnrichedProvince[];
  provinceSummary: {
    totalProvinces: number;
    totalDevelopment: number;
    totalMagic: number;
    averageDevelopment: number;
  };
}

export interface RegentDomainSummary {
  regent: Regent;
  holdings: Holding[];
  totalHoldingLevels: number;
  holdingsByType: Record<string, number>;
}

export interface UseDomainDataResult {
  // Dados brutos
  realms: Realm[];
  provinces: ProvinceWithRealm[];
  holdings: Holding[];
  regents: Regent[];
  
  // Dados enriquecidos
  enrichedRealms: EnrichedRealm[];
  enrichedProvinces: EnrichedProvince[];
  regentDomains: RegentDomainSummary[];
  
  // Estados
  isLoading: boolean;
  isError: boolean;
  
  // Utilitários
  getProvincesByRealm: (realmId: string) => EnrichedProvince[];
  getHoldingsByProvince: (provinceId: string) => Holding[];
  getHoldingsByRegent: (regentId: string) => Holding[];
  getRegentByCode: (code: string) => Regent | undefined;
}

export const useDomainData = (realmId?: string): UseDomainDataResult => {
  // Busca dados base
  const { data: realms = [], isLoading: realmsLoading, isError: realmsError } = useRealms();
  const { data: provinces = [], isLoading: provincesLoading, isError: provincesError } = useProvinces(realmId);
  const { data: holdings = [], isLoading: holdingsLoading, isError: holdingsError } = useHoldings();
  const { data: regents = [], isLoading: regentsLoading, isError: regentsError } = useRegents();

  // Enriquece províncias com holdings
  const enrichedProvinces = useMemo((): EnrichedProvince[] => {
    return provinces.map(province => {
      const provinceHoldings = holdings.filter(h => h.province_id === province.id);
      
      const byType: Record<string, number> = {};
      provinceHoldings.forEach(h => {
        byType[h.holding_type] = (byType[h.holding_type] || 0) + h.level;
      });

      return {
        ...province,
        holdings: provinceHoldings,
        holdingSummary: {
          totalLevel: provinceHoldings.reduce((sum, h) => sum + h.level, 0),
          byType,
        },
      };
    });
  }, [provinces, holdings]);

  // Enriquece reinos com províncias
  const enrichedRealms = useMemo((): EnrichedRealm[] => {
    return realms.map(realm => {
      const realmProvinces = enrichedProvinces.filter(p => p.realm_id === realm.id);
      const totalDevelopment = realmProvinces.reduce((sum, p) => sum + p.development, 0);
      
      return {
        ...realm,
        provinces: realmProvinces,
        provinceSummary: {
          totalProvinces: realmProvinces.length,
          totalDevelopment,
          totalMagic: realmProvinces.reduce((sum, p) => sum + p.magic, 0),
          averageDevelopment: realmProvinces.length > 0 
            ? totalDevelopment / realmProvinces.length 
            : 0,
        },
      };
    });
  }, [realms, enrichedProvinces]);

  // Calcula domínios por regente
  const regentDomains = useMemo((): RegentDomainSummary[] => {
    return regents.map(regent => {
      const regentHoldings = holdings.filter(h => h.regent_id === regent.id);
      
      const holdingsByType: Record<string, number> = {};
      regentHoldings.forEach(h => {
        holdingsByType[h.holding_type] = (holdingsByType[h.holding_type] || 0) + h.level;
      });

      return {
        regent,
        holdings: regentHoldings,
        totalHoldingLevels: regentHoldings.reduce((sum, h) => sum + h.level, 0),
        holdingsByType,
      };
    }).filter(rd => rd.holdings.length > 0);
  }, [regents, holdings]);

  // Funções utilitárias
  const getProvincesByRealm = (realmId: string) => 
    enrichedProvinces.filter(p => p.realm_id === realmId);

  const getHoldingsByProvince = (provinceId: string) => 
    holdings.filter(h => h.province_id === provinceId);

  const getHoldingsByRegent = (regentId: string) => 
    holdings.filter(h => h.regent_id === regentId);

  const getRegentByCode = (code: string) => 
    regents.find(r => r.code === code);

  return {
    realms,
    provinces,
    holdings,
    regents,
    enrichedRealms,
    enrichedProvinces,
    regentDomains,
    isLoading: realmsLoading || provincesLoading || holdingsLoading || regentsLoading,
    isError: realmsError || provincesError || holdingsError || regentsError,
    getProvincesByRealm,
    getHoldingsByProvince,
    getHoldingsByRegent,
    getRegentByCode,
  };
};
