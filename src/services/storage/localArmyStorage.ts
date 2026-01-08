/**
 * Serviço de persistência local para exércitos
 * Usa localStorage para salvar/carregar exércitos
 * Será migrado para Supabase quando implementar autenticação
 */

import { StrategicArmy } from '@/types/combat/strategic-army';

const STORAGE_KEY = 'tenebralux_local_armies';

export interface LocalArmyStorage {
  armies: StrategicArmy[];
  lastUpdated: string;
}

/**
 * Carrega todos os exércitos do localStorage
 */
export function loadLocalArmies(): StrategicArmy[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const data: LocalArmyStorage = JSON.parse(stored);
    return data.armies || [];
  } catch (error) {
    console.error('[LocalArmyStorage] Erro ao carregar exércitos:', error);
    return [];
  }
}

/**
 * Salva todos os exércitos no localStorage
 */
function saveLocalArmies(armies: StrategicArmy[]): void {
  try {
    const data: LocalArmyStorage = {
      armies,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[LocalArmyStorage] Erro ao salvar exércitos:', error);
    throw new Error('Falha ao salvar exército localmente');
  }
}

/**
 * Adiciona ou atualiza um exército
 */
export function saveLocalArmy(army: StrategicArmy): StrategicArmy {
  const armies = loadLocalArmies();
  const existingIndex = armies.findIndex(a => a.id === army.id);
  
  const armyToSave: StrategicArmy = {
    ...army,
    updatedAt: new Date().toISOString(),
    createdAt: army.createdAt || new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    armies[existingIndex] = armyToSave;
  } else {
    armies.push(armyToSave);
  }
  
  saveLocalArmies(armies);
  return armyToSave;
}

/**
 * Remove um exército
 */
export function deleteLocalArmy(armyId: string): boolean {
  const armies = loadLocalArmies();
  const filteredArmies = armies.filter(a => a.id !== armyId);
  
  if (filteredArmies.length === armies.length) {
    return false; // Não encontrou
  }
  
  saveLocalArmies(filteredArmies);
  return true;
}

/**
 * Busca um exército por ID
 */
export function getLocalArmy(armyId: string): StrategicArmy | null {
  const armies = loadLocalArmies();
  return armies.find(a => a.id === armyId) || null;
}

/**
 * Limpa todos os exércitos locais
 */
export function clearLocalArmies(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Exporta exércitos para JSON (backup)
 */
export function exportLocalArmies(): string {
  const armies = loadLocalArmies();
  return JSON.stringify(armies, null, 2);
}

/**
 * Importa exércitos de JSON
 */
export function importLocalArmies(jsonString: string, merge: boolean = true): number {
  try {
    const importedArmies: StrategicArmy[] = JSON.parse(jsonString);
    
    if (!Array.isArray(importedArmies)) {
      throw new Error('Formato inválido');
    }
    
    if (merge) {
      const existingArmies = loadLocalArmies();
      const existingIds = new Set(existingArmies.map(a => a.id));
      
      const newArmies = importedArmies.filter(a => !existingIds.has(a.id));
      saveLocalArmies([...existingArmies, ...newArmies]);
      return newArmies.length;
    } else {
      saveLocalArmies(importedArmies);
      return importedArmies.length;
    }
  } catch (error) {
    console.error('[LocalArmyStorage] Erro ao importar:', error);
    throw new Error('Falha ao importar exércitos');
  }
}
