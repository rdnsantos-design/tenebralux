import { BaseEntity, ExperienceLevel } from './base';
import { Character } from './character';

// === COMANDANTE (em batalha) ===
export interface Commander extends BaseEntity {
  // Pode ser derivado de um Character
  characterId?: string;
  
  // Cultura
  culture?: string;
  experience?: ExperienceLevel;
  
  // Stats de comando
  strategy: number;
  command: number;
  guard: number;
  
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
  const commandStats = character.commandStats || {
    strategy: 2,
    command: 2,
    guard: 2,
  };
  
  return {
    id: crypto.randomUUID(),
    name: character.name,
    description: character.description,
    theme: character.theme,
    characterId: character.id,
    culture: character.culture,
    strategy: commandStats.strategy,
    command: commandStats.command,
    guard: commandStats.guard,
    armyId,
    position: { q: 0, r: 0 },
    isEmbedded: false,
    hasActedThisTurn: false,
    usedCommandThisTurn: 0,
  };
}
