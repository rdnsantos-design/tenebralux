/**
 * Posturas de Combate
 * 
 * Posturas são ações especiais que ficam ativas até serem trocadas.
 * Podem ser ativadas junto com uma ação normal.
 * Velocidade = Reação + 0
 */

import { CombatCard } from '@/types/tactical-combat';

export const POSTURE_CARDS: CombatCard[] = [
  {
    id: 'posture_high_guard',
    name: { akashic: 'Guarda Alta', tenebralux: 'Guarda Alta' },
    type: 'posture',
    speedModifier: 0,
    attackModifier: 0,
    movementModifier: 0,
    guardMultiplier: 2,  // Dobra Reflexos no cálculo da Guarda
    description: {
      akashic: 'Postura defensiva que dobra seus Reflexos no cálculo da Guarda.',
      tenebralux: 'Postura defensiva que dobra seus Reflexos no cálculo da Guarda.'
    }
  },
  {
    id: 'posture_aggressive',
    name: { akashic: 'Postura Agressiva', tenebralux: 'Postura Ofensiva' },
    type: 'posture',
    speedModifier: 0,
    attackModifier: 2,
    movementModifier: 0,
    defenseBonus: -2,
    description: {
      akashic: 'Postura agressiva: +2 Ataque, -2 Guarda.',
      tenebralux: 'Postura ofensiva: +2 Ataque, -2 Guarda.'
    }
  },
  {
    id: 'posture_evasive',
    name: { akashic: 'Postura Evasiva', tenebralux: 'Postura Esquiva' },
    type: 'posture',
    speedModifier: 0,
    attackModifier: -1,
    movementModifier: 2,
    defenseBonus: 1,
    description: {
      akashic: 'Postura evasiva: +2 Movimento, +1 Guarda, -1 Ataque.',
      tenebralux: 'Postura esquiva: +2 Movimento, +1 Guarda, -1 Ataque.'
    }
  },
  {
    id: 'posture_cover',
    name: { akashic: 'Usar Cobertura', tenebralux: 'Cobrir-se' },
    type: 'posture',
    speedModifier: 0,
    attackModifier: -1,
    movementModifier: -2,
    defenseBonus: 2,
    description: {
      akashic: 'Maximiza uso de cobertura: +2 Defesa contra ataques ranged, -1 Ataque, -2 Movimento.',
      tenebralux: 'Maximiza uso de cobertura: +2 Defesa contra ataques ranged, -1 Ataque, -2 Movimento.'
    }
  }
];

// ============= AÇÃO DESCANSAR =============

export const REST_CARD: CombatCard = {
  id: 'action_rest',
  name: { akashic: 'Descansar', tenebralux: 'Descansar' },
  type: 'basic',
  speedModifier: 0,  // Velocidade = Reação + 0
  attackModifier: 0,
  movementModifier: -999,  // NÃO pode se mover
  effect: 'Recupera Resiliência pontos de Evasão. Requer cobertura TOTAL e não ser alvo de ação hostil.',
  description: {
    akashic: 'Descansa para recuperar Evasão. Requer cobertura total.',
    tenebralux: 'Descansa para recuperar Evasão. Requer cobertura total.'
  }
};

// ============= AÇÕES ESPECIAIS =============

export const RELOAD_CARD: CombatCard = {
  id: 'action_reload',
  name: { akashic: 'Recarregar', tenebralux: 'Recarregar' },
  type: 'basic',
  speedModifier: 2,  // Velocidade = Reação + 2
  attackModifier: 0,
  movementModifier: -2,
  effect: 'Recarrega a arma equipada.',
  description: {
    akashic: 'Recarrega a arma de fogo.',
    tenebralux: 'Recarrega a besta ou arco.'
  }
};

export const SWAP_WEAPON_CARD: CombatCard = {
  id: 'action_swap_weapon',
  name: { akashic: 'Trocar Arma', tenebralux: 'Sacar Arma' },
  type: 'basic',
  speedModifier: 0,  // Velocidade = Reação + 0
  attackModifier: 0,
  movementModifier: 0,
  effect: 'Troca a arma equipada.',
  description: {
    akashic: 'Saca ou troca a arma primária.',
    tenebralux: 'Saca ou troca a arma primária.'
  }
};

// ============= FUNÇÕES AUXILIARES =============

export function getPostureCards(): CombatCard[] {
  return POSTURE_CARDS;
}

export function getPostureById(id: string): CombatCard | undefined {
  return POSTURE_CARDS.find(p => p.id === id);
}

export function getSpecialActionCards(): CombatCard[] {
  return [REST_CARD, RELOAD_CARD, SWAP_WEAPON_CARD];
}
