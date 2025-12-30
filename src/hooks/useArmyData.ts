/**
 * Hook unificado para dados de exércitos
 * Combina: armies, unit_instances, field_commanders, regents, provinces
 */

import { useMemo } from 'react';
import { useUnitInstances, UnitInstance } from './useUnitInstances';
import { useFieldCommanders } from './useFieldCommanders';
import { useRegents } from './useRegents';
import { useProvinces } from './useDomains';

// Re-exporta tipos úteis
export type { UnitInstance } from './useUnitInstances';

export interface EnrichedUnitInstance extends UnitInstance {
  commander?: {
    id: string;
    nome_comandante: string;
    comando: number;
    estrategia: number;
    guarda: number;
  };
  regent?: {
    id: string;
    name: string;
    domain?: string;
  };
  province?: {
    id: string;
    name: string;
  };
}

export interface ArmySummary {
  totalUnits: number;
  activeUnits: number;
  disbandedUnits: number;
  garrisonedUnits: number;
  totalForce: number;
  totalMaintenanceCost: number;
  unitsByExperience: Record<string, number>;
  unitsByRegent: Record<string, { name: string; count: number }>;
}

export interface Commander {
  id: string;
  nome_comandante: string;
  comando: number;
  estrategia: number;
  guarda: number;
}

export interface UseArmyDataResult {
  // Dados brutos
  units: UnitInstance[];
  commanders: Commander[];
  
  // Dados enriquecidos
  enrichedUnits: EnrichedUnitInstance[];
  
  // Resumos e estatísticas
  summary: ArmySummary;
  
  // Estados de loading/error
  isLoading: boolean;
  isError: boolean;
  
  // Utilitários
  getUnitsByRegent: (regentId: string) => EnrichedUnitInstance[];
  getUnitsByCommander: (commanderId: string) => EnrichedUnitInstance[];
  getUnitsByProvince: (provinceId: string) => EnrichedUnitInstance[];
  getAvailableCommanders: () => Commander[];
}

export const useArmyData = (regentId?: string): UseArmyDataResult => {
  // Busca dados base
  const { data: units = [], isLoading: unitsLoading, isError: unitsError } = useUnitInstances(regentId);
  const { commanders, loading: commandersLoading, error: commandersError } = useFieldCommanders();
  const { data: regents = [] } = useRegents();
  const { data: provinces = [] } = useProvinces();

  // Enriquece unidades com dados relacionados
  const enrichedUnits = useMemo((): EnrichedUnitInstance[] => {
    return units.map(unit => {
      const commander = commanders.find(c => c.id === unit.commander_id);
      const regent = regents.find(r => r.id === unit.regent_id);
      const province = provinces.find(p => p.id === unit.province_id);

      return {
        ...unit,
        commander: commander ? {
          id: commander.id,
          nome_comandante: commander.nome_comandante,
          comando: commander.comando,
          estrategia: commander.estrategia,
          guarda: commander.guarda,
        } : undefined,
        regent: regent ? {
          id: regent.id,
          name: regent.name,
          domain: regent.domain || undefined,
        } : undefined,
        province: province ? {
          id: province.id,
          name: province.name,
        } : undefined,
      };
    });
  }, [units, commanders, regents, provinces]);

  // Calcula resumo
  const summary = useMemo((): ArmySummary => {
    const activeUnits = units.filter(u => !u.is_disbanded);
    const disbandedUnits = units.filter(u => u.is_disbanded);
    const garrisonedUnits = units.filter(u => u.is_garrisoned);

    const unitsByExperience: Record<string, number> = {};
    const unitsByRegent: Record<string, { name: string; count: number }> = {};

    units.forEach(unit => {
      // Por experiência
      unitsByExperience[unit.experience] = (unitsByExperience[unit.experience] || 0) + 1;

      // Por regente
      if (unit.regent_id) {
        const regent = regents.find(r => r.id === unit.regent_id);
        if (regent) {
          if (!unitsByRegent[unit.regent_id]) {
            unitsByRegent[unit.regent_id] = { name: regent.name, count: 0 };
          }
          unitsByRegent[unit.regent_id].count++;
        }
      }
    });

    return {
      totalUnits: units.length,
      activeUnits: activeUnits.length,
      disbandedUnits: disbandedUnits.length,
      garrisonedUnits: garrisonedUnits.length,
      totalForce: activeUnits.reduce((sum, u) => sum + u.total_force, 0),
      totalMaintenanceCost: activeUnits.reduce((sum, u) => sum + u.maintenance_cost, 0),
      unitsByExperience,
      unitsByRegent,
    };
  }, [units, regents]);

  // Funções utilitárias
  const getUnitsByRegent = (regentId: string) => 
    enrichedUnits.filter(u => u.regent_id === regentId);

  const getUnitsByCommander = (commanderId: string) => 
    enrichedUnits.filter(u => u.commander_id === commanderId);

  const getUnitsByProvince = (provinceId: string) => 
    enrichedUnits.filter(u => u.province_id === provinceId);

  const getAvailableCommanders = () => 
    commanders.filter(c => !units.some(u => u.commander_id === c.id));

  return {
    units,
    commanders,
    enrichedUnits,
    summary,
    isLoading: unitsLoading || commandersLoading,
    isError: unitsError || !!commandersError,
    getUnitsByRegent,
    getUnitsByCommander,
    getUnitsByProvince,
    getAvailableCommanders,
  };
};
