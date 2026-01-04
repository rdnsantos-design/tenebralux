import { BaseEntity, ExperienceLevel, RegencyStats, CommandStats } from './base';
import { Character, calculateRegencyStats, regencyToCommandStats, calculateDerivedStats } from './character';

// === COMANDANTE (em batalha) ===
export interface Commander extends BaseEntity {
  // Pode ser derivado de um Character
  characterId?: string;
  
  // Cultura
  culture?: string;
  experience?: ExperienceLevel;
  
  // Stats de comando (do sistema antigo, para compatibilidade)
  strategy: number;
  command: number;
  guard: number;
  
  // Stats de regência completos (novo)
  regencyStats?: RegencyStats;
  
  // Escolta (opcional, para módulo simplificado)
  escolta?: number;
  
  // Custo em pontos de poder
  powerCost?: number;
  
  // Especialização
  specialization?: string;
  
  // Estado em batalha
  armyId?: string;
  position?: { q: number; r: number };
  isEmbedded: boolean;
  embeddedUnitId?: string;
  hasActedThisTurn: boolean;
  usedCommandThisTurn: number;
}

// === CRIAR COMANDANTE A PARTIR DE PERSONAGEM ===
export function createCommanderFromCharacter(
  character: Character,
  armyId?: string
): Commander {
  // Calcular stats se não existirem
  const derivedStats = character.derivedStats || 
    calculateDerivedStats(character.attributes, character.skills);
  
  const regencyStats = character.regencyStats || 
    calculateRegencyStats(character.attributes, character.skills, character.theme);
  
  const commandStats = regencyToCommandStats(regencyStats, derivedStats);
  
  return {
    id: crypto.randomUUID(),
    name: character.name,
    description: character.description,
    theme: character.theme,
    characterId: character.id,
    culture: character.culture,
    
    // Stats do sistema antigo (compatibilidade)
    strategy: commandStats.strategy,
    command: commandStats.command,
    guard: commandStats.guard,
    
    // Stats completos
    regencyStats,
    
    // Batalha
    armyId,
    position: { q: 0, r: 0 },
    isEmbedded: false,
    hasActedThisTurn: false,
    usedCommandThisTurn: 0,
  };
}

// === CRIAR COMANDANTE SIMPLIFICADO (sem Character) ===
export function createSimplifiedCommander(
  name: string,
  theme: 'akashic' | 'tenebralux',
  regencyStats: Partial<RegencyStats>,
  escolta: number = 0
): Commander {
  const fullRegency: RegencyStats = {
    comando: regencyStats.comando || 0,
    estrategia: regencyStats.estrategia || 0,
    administracao: regencyStats.administracao || 0,
    politica: regencyStats.politica || 0,
    tecnologia: regencyStats.tecnologia || 0,
    geomancia: regencyStats.geomancia || 0,
  };
  
  return {
    id: crypto.randomUUID(),
    name,
    theme,
    regencyStats: fullRegency,
    escolta,
    powerCost: (
      fullRegency.comando +
      fullRegency.estrategia +
      fullRegency.administracao +
      fullRegency.politica +
      Math.max(fullRegency.tecnologia, fullRegency.geomancia)
    ) * 2 + escolta,
    
    // Compatibilidade
    strategy: Math.min(6, fullRegency.estrategia),
    command: Math.min(6, fullRegency.comando),
    guard: 2, // Default
    
    // Estado inicial
    position: { q: 0, r: 0 },
    isEmbedded: false,
    hasActedThisTurn: false,
    usedCommandThisTurn: 0,
  };
}
