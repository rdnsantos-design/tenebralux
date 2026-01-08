/**
 * Hook para gerenciar exércitos salvos localmente
 */

import { useState, useEffect, useCallback } from 'react';
import { StrategicArmy } from '@/types/combat/strategic-army';
import {
  loadLocalArmies,
  saveLocalArmy,
  deleteLocalArmy,
  getLocalArmy,
} from '@/services/storage/localArmyStorage';
import { toast } from 'sonner';

export function useLocalArmies() {
  const [armies, setArmies] = useState<StrategicArmy[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar exércitos ao montar
  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const loaded = loadLocalArmies();
      setArmies(loaded);
    } catch (error) {
      console.error('[useLocalArmies] Erro ao carregar:', error);
      toast.error('Erro ao carregar exércitos salvos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Salvar exército
  const save = useCallback((army: StrategicArmy): StrategicArmy | null => {
    try {
      const saved = saveLocalArmy(army);
      refresh();
      toast.success(`Exército "${army.name}" salvo!`);
      return saved;
    } catch (error) {
      console.error('[useLocalArmies] Erro ao salvar:', error);
      toast.error('Erro ao salvar exército');
      return null;
    }
  }, [refresh]);

  // Deletar exército
  const remove = useCallback((armyId: string): boolean => {
    try {
      const army = getLocalArmy(armyId);
      const success = deleteLocalArmy(armyId);
      if (success) {
        refresh();
        toast.success(`Exército "${army?.name}" removido!`);
      }
      return success;
    } catch (error) {
      console.error('[useLocalArmies] Erro ao deletar:', error);
      toast.error('Erro ao remover exército');
      return false;
    }
  }, [refresh]);

  // Buscar por ID
  const get = useCallback((armyId: string): StrategicArmy | null => {
    return getLocalArmy(armyId);
  }, []);

  return {
    armies,
    loading,
    refresh,
    save,
    remove,
    get,
  };
}
