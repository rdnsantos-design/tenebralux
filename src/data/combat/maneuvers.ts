/**
 * Manobras de Combate
 * 
 * Cada perícia de combate tem:
 * - Manobra Rápida: +1 tempo, dano normal
 * - Manobra Forte/Precisa: +3/+4 tempo, dano x2 ou bônus no ataque
 * 
 * Fórmula de Velocidade: Reação + Velocidade da Manobra + Velocidade da Arma
 * Fórmula de Ataque: 2d6 + Atributo + Perícia vs Guarda
 */

import { CombatManeuver } from '@/types/tactical-combat';

// ============= MANOBRAS DE LUTA (Reflexos + Luta) =============

export const FIGHT_MANEUVERS: CombatManeuver[] = [
  // Manobras Básicas (automáticas)
  {
    id: 'quick_strike',
    name: { akashic: 'Golpe Rápido', tenebralux: 'Golpe Rápido' },
    skill: 'luta',
    type: 'quick',
    timeModifier: 1,
    attackModifier: 0,
    damageMultiplier: 1,
    description: {
      akashic: 'Um golpe veloz que sacrifica potência por velocidade.',
      tenebralux: 'Um golpe veloz que sacrifica potência por velocidade.'
    },
    isBasic: true
  },
  {
    id: 'brutal_strike',
    name: { akashic: 'Golpe Brutal', tenebralux: 'Golpe Brutal' },
    skill: 'luta',
    type: 'strong',
    timeModifier: 3,
    attackModifier: 0,
    damageMultiplier: 2,
    description: {
      akashic: 'Golpe devastador que concentra toda a força.',
      tenebralux: 'Golpe devastador que concentra toda a força.'
    },
    isBasic: true
  },
  // Manobras Avançadas (requerem XP)
  {
    id: 'grapple',
    name: { akashic: 'Agarrar', tenebralux: 'Agarrar' },
    skill: 'luta',
    type: 'special',
    timeModifier: 2,
    attackModifier: -2,
    damageMultiplier: 0,
    description: {
      akashic: 'Agarra o oponente, impedindo movimento.',
      tenebralux: 'Agarra o oponente, impedindo movimento.'
    },
    requirements: { skillMin: 2, xpCost: 5 },
    isBasic: false
  },
  {
    id: 'combo',
    name: { akashic: 'Combo', tenebralux: 'Sequência' },
    skill: 'luta',
    type: 'special',
    timeModifier: 2,
    attackModifier: -1,
    damageMultiplier: 1.5,
    description: {
      akashic: 'Sequência de golpes rápidos.',
      tenebralux: 'Sequência de golpes rápidos.'
    },
    requirements: { skillMin: 3, xpCost: 10 },
    isBasic: false
  }
];

// ============= MANOBRAS DE LÂMINAS (Coordenação + Lâminas) =============

export const BLADE_MANEUVERS: CombatManeuver[] = [
  // Manobras Básicas (automáticas)
  {
    id: 'quick_slash',
    name: { akashic: 'Corte Rápido', tenebralux: 'Corte Rápido' },
    skill: 'laminas',
    type: 'quick',
    timeModifier: 1,
    attackModifier: 0,
    damageMultiplier: 1,
    description: {
      akashic: 'Corte veloz visando superfície.',
      tenebralux: 'Corte veloz visando superfície.'
    },
    isBasic: true
  },
  {
    id: 'deep_thrust',
    name: { akashic: 'Estocada Profunda', tenebralux: 'Estocada Profunda' },
    skill: 'laminas',
    type: 'strong',
    timeModifier: 3,
    attackModifier: 0,
    damageMultiplier: 2,
    description: {
      akashic: 'Estocada que busca penetração máxima.',
      tenebralux: 'Estocada que busca penetração máxima.'
    },
    isBasic: true
  },
  // Manobras Avançadas
  {
    id: 'parry_riposte',
    name: { akashic: 'Aparar e Contra', tenebralux: 'Aparar e Ripostar' },
    skill: 'laminas',
    type: 'special',
    timeModifier: 2,
    attackModifier: 2,
    damageMultiplier: 1,
    description: {
      akashic: 'Defende e contra-ataca no mesmo movimento.',
      tenebralux: 'Defende e contra-ataca no mesmo movimento.'
    },
    requirements: { skillMin: 2, xpCost: 5 },
    isBasic: false
  },
  {
    id: 'whirlwind',
    name: { akashic: 'Redemoinho', tenebralux: 'Turbilhão' },
    skill: 'laminas',
    type: 'special',
    timeModifier: 4,
    attackModifier: -1,
    damageMultiplier: 1,
    description: {
      akashic: 'Ataque circular que atinge múltiplos alvos.',
      tenebralux: 'Ataque circular que atinge múltiplos alvos.'
    },
    requirements: { skillMin: 4, xpCost: 15 },
    isBasic: false
  }
];

// ============= MANOBRAS DE TIRO (Coordenação + Tiro) =============

export const SHOOT_MANEUVERS: CombatManeuver[] = [
  // Manobras Básicas (automáticas)
  {
    id: 'quick_shot',
    name: { akashic: 'Tiro Rápido', tenebralux: 'Disparo Rápido' },
    skill: 'tiro',
    type: 'quick',
    timeModifier: 1,
    attackModifier: 0,
    damageMultiplier: 1,
    description: {
      akashic: 'Disparo veloz sem mirar.',
      tenebralux: 'Disparo veloz sem mirar.'
    },
    isBasic: true
  },
  {
    id: 'aimed_shot',
    name: { akashic: 'Tiro com Mira', tenebralux: 'Disparo Preciso' },
    skill: 'tiro',
    type: 'aimed',
    timeModifier: 4,
    attackModifier: 0, // O bônus é calculado como Tiro x 2
    damageMultiplier: 1,
    description: {
      akashic: 'Mirar cuidadosamente antes de disparar. Bônus: Tiro × 2 no ataque.',
      tenebralux: 'Mirar cuidadosamente antes de disparar. Bônus: Habilidade × 2 no ataque.'
    },
    isBasic: true
  },
  // Manobras Avançadas
  {
    id: 'suppressive_fire',
    name: { akashic: 'Fogo de Supressão', tenebralux: 'Barragem' },
    skill: 'tiro',
    type: 'special',
    timeModifier: 3,
    attackModifier: -2,
    damageMultiplier: 0.5,
    description: {
      akashic: 'Disparo contínuo para suprimir movimento inimigo.',
      tenebralux: 'Disparos contínuos para suprimir movimento inimigo.'
    },
    requirements: { skillMin: 2, xpCost: 5 },
    isBasic: false
  },
  {
    id: 'headshot',
    name: { akashic: 'Tiro na Cabeça', tenebralux: 'Golpe Fatal' },
    skill: 'tiro',
    type: 'special',
    timeModifier: 5,
    attackModifier: -4,
    damageMultiplier: 3,
    description: {
      akashic: 'Mirar em ponto vital. Alto risco, alta recompensa.',
      tenebralux: 'Mirar em ponto vital. Alto risco, alta recompensa.'
    },
    requirements: { skillMin: 4, xpCost: 15 },
    isBasic: false
  },
  {
    id: 'double_tap',
    name: { akashic: 'Tiro Duplo', tenebralux: 'Disparo Duplo' },
    skill: 'tiro',
    type: 'special',
    timeModifier: 2,
    attackModifier: -1,
    damageMultiplier: 1.5,
    description: {
      akashic: 'Dois disparos rápidos no mesmo alvo.',
      tenebralux: 'Dois disparos rápidos no mesmo alvo.'
    },
    requirements: { skillMin: 3, xpCost: 10 },
    isBasic: false
  }
];

// ============= FUNÇÕES AUXILIARES =============

export function getAllManeuvers(): CombatManeuver[] {
  return [...FIGHT_MANEUVERS, ...BLADE_MANEUVERS, ...SHOOT_MANEUVERS];
}

export function getManeuverById(id: string): CombatManeuver | undefined {
  return getAllManeuvers().find(m => m.id === id);
}

export function getManeuversBySkill(skill: string): CombatManeuver[] {
  return getAllManeuvers().filter(m => m.skill === skill);
}

export function getBasicManeuvers(): CombatManeuver[] {
  return getAllManeuvers().filter(m => m.isBasic);
}

export function getBasicManeuversBySkill(skill: string): CombatManeuver[] {
  return getManeuversBySkill(skill).filter(m => m.isBasic);
}

export function getAdvancedManeuvers(): CombatManeuver[] {
  return getAllManeuvers().filter(m => !m.isBasic);
}

export function getAvailableManeuvers(skillLevels: Record<string, number>, unlockedManeuverIds: string[]): CombatManeuver[] {
  return getAllManeuvers().filter(m => {
    // Manobras básicas sempre disponíveis se tiver a perícia
    if (m.isBasic) {
      return (skillLevels[m.skill] || 0) > 0;
    }
    // Manobras avançadas precisam ser desbloqueadas
    return unlockedManeuverIds.includes(m.id);
  });
}
