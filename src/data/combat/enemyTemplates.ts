/**
 * Templates de Inimigos para IA
 * 
 * Cada template define stats, equipamento e comportamento
 */

import { EnemyTemplate, EnemyBehavior, EnemyTier } from '@/types/tactical-combat';

export const ENEMY_TEMPLATES: EnemyTemplate[] = [
  // ============= MINIONS =============
  {
    id: 'minion_melee',
    name: { akashic: 'Capanga', tenebralux: 'Bandido' },
    tier: 'minion',
    stats: {
      reaction: 6,
      guard: 8,
      evasion: 4,
      vitality: 4,
      movement: 6,
      prep: 8
    },
    weapon: {
      name: 'Faca',
      damage: 2,
      speed: 0,
      range: 1
    },
    behavior: {
      aggression: 'aggressive',
      targetPriority: 'nearest',
      fleeThreshold: 0.25,
      preferredRange: 'melee',
      usesPostures: false,
      usesCover: false
    }
  },
  {
    id: 'minion_ranged',
    name: { akashic: 'Atirador', tenebralux: 'Arqueiro' },
    tier: 'minion',
    stats: {
      reaction: 7,
      guard: 6,
      evasion: 3,
      vitality: 3,
      movement: 5,
      prep: 10
    },
    weapon: {
      name: 'Pistola',
      damage: 3,
      speed: 1,
      range: 15
    },
    behavior: {
      aggression: 'balanced',
      targetPriority: 'weakest',
      fleeThreshold: 0.25,
      preferredRange: 'ranged',
      usesPostures: false,
      usesCover: true
    }
  },

  // ============= STANDARD =============
  {
    id: 'standard_soldier',
    name: { akashic: 'Soldado', tenebralux: 'Guarda' },
    tier: 'standard',
    stats: {
      reaction: 8,
      guard: 11,
      evasion: 6,
      vitality: 8,
      movement: 7,
      prep: 9
    },
    weapon: {
      name: 'Rifle',
      damage: 4,
      speed: 2,
      range: 25
    },
    behavior: {
      aggression: 'balanced',
      targetPriority: 'strongest',
      fleeThreshold: 0.15,
      preferredRange: 'ranged',
      usesPostures: true,
      usesCover: true
    }
  },
  {
    id: 'standard_brawler',
    name: { akashic: 'Brutamontes', tenebralux: 'Mercenário' },
    tier: 'standard',
    stats: {
      reaction: 7,
      guard: 12,
      evasion: 5,
      vitality: 10,
      movement: 6,
      prep: 10
    },
    weapon: {
      name: 'Espada',
      damage: 4,
      speed: 1,
      range: 1
    },
    behavior: {
      aggression: 'aggressive',
      targetPriority: 'nearest',
      fleeThreshold: 0.1,
      preferredRange: 'melee',
      usesPostures: true,
      usesCover: false
    }
  },

  // ============= ELITE =============
  {
    id: 'elite_enforcer',
    name: { akashic: 'Executor', tenebralux: 'Cavaleiro' },
    tier: 'elite',
    stats: {
      reaction: 10,
      guard: 14,
      evasion: 8,
      vitality: 12,
      movement: 6,
      prep: 10
    },
    weapon: {
      name: 'Espada Pesada',
      damage: 6,
      speed: 3,
      range: 1
    },
    behavior: {
      aggression: 'aggressive',
      targetPriority: 'strongest',
      fleeThreshold: 0,
      preferredRange: 'melee',
      usesPostures: true,
      usesCover: false
    }
  },
  {
    id: 'elite_sniper',
    name: { akashic: 'Sniper', tenebralux: 'Atirador de Elite' },
    tier: 'elite',
    stats: {
      reaction: 11,
      guard: 10,
      evasion: 9,
      vitality: 8,
      movement: 5,
      prep: 11
    },
    weapon: {
      name: 'Rifle de Precisão',
      damage: 7,
      speed: 4,
      range: 40
    },
    behavior: {
      aggression: 'passive',
      targetPriority: 'weakest',
      fleeThreshold: 0.3,
      preferredRange: 'ranged',
      usesPostures: true,
      usesCover: true
    }
  },

  // ============= BOSS =============
  {
    id: 'boss_warlord',
    name: { akashic: 'Senhor da Guerra', tenebralux: 'Barão de Guerra' },
    tier: 'boss',
    stats: {
      reaction: 12,
      guard: 16,
      evasion: 10,
      vitality: 20,
      movement: 5,
      prep: 12
    },
    weapon: {
      name: 'Martelo de Guerra',
      damage: 8,
      speed: 4,
      range: 2
    },
    behavior: {
      aggression: 'aggressive',
      targetPriority: 'strongest',
      fleeThreshold: 0,
      preferredRange: 'melee',
      usesPostures: true,
      usesCover: false
    }
  },
  {
    id: 'boss_mastermind',
    name: { akashic: 'Mente Mestra', tenebralux: 'Arquimago' },
    tier: 'boss',
    stats: {
      reaction: 13,
      guard: 12,
      evasion: 12,
      vitality: 15,
      movement: 6,
      prep: 14
    },
    weapon: {
      name: 'Bastão de Energia',
      damage: 5,
      speed: 2,
      range: 20
    },
    behavior: {
      aggression: 'balanced',
      targetPriority: 'strongest',
      fleeThreshold: 0.1,
      preferredRange: 'ranged',
      usesPostures: true,
      usesCover: true
    }
  }
];

// ============= FUNÇÕES AUXILIARES =============

export function getTemplateById(id: string): EnemyTemplate | undefined {
  return ENEMY_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByTier(tier: EnemyTier): EnemyTemplate[] {
  return ENEMY_TEMPLATES.filter(t => t.tier === tier);
}

export function getRandomTemplate(tier?: EnemyTier): EnemyTemplate {
  const templates = tier ? getTemplatesByTier(tier) : ENEMY_TEMPLATES;
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Retorna multiplicador de stats por tier
 */
export function getTierMultiplier(tier: EnemyTier): { hp: number; damage: number; count: number } {
  switch (tier) {
    case 'minion':
      return { hp: 0.5, damage: 0.7, count: 3 };
    case 'standard':
      return { hp: 1, damage: 1, count: 2 };
    case 'elite':
      return { hp: 1.5, damage: 1.3, count: 1 };
    case 'boss':
      return { hp: 2.5, damage: 1.5, count: 1 };
  }
}
