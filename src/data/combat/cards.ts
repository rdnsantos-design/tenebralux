/**
 * Cartas de Combate
 * 
 * Tipos:
 * - Básica: Gratuita, sempre disponível
 * - Tática: Comprada com XP
 * - Especial: Desbloqueada por habilidades/equipamentos
 * 
 * Modificadores:
 * - Velocidade: Tempo adicionado ao tick
 * - Ataque: Bônus/penalidade na rolagem
 * - Movimento: Metros consumidos (negativo = custo)
 * - Efeito: Efeito especial se aplicável
 */

import { CombatCard } from '@/types/tactical-combat';

// ============= CARTAS BÁSICAS (Gratuitas) =============

export const BASIC_CARDS: CombatCard[] = [
  {
    id: 'standard_attack',
    name: { akashic: 'Ataque Padrão', tenebralux: 'Ataque Padrão' },
    type: 'basic',
    speedModifier: 1,
    attackModifier: 0,
    movementModifier: -2,
    description: {
      akashic: 'Ataque balanceado entre velocidade e precisão.',
      tenebralux: 'Ataque balanceado entre velocidade e precisão.'
    }
  },
  {
    id: 'quick_attack',
    name: { akashic: 'Ataque Rápido', tenebralux: 'Golpe Veloz' },
    type: 'basic',
    speedModifier: 0,
    attackModifier: -2,
    movementModifier: -2,
    description: {
      akashic: 'Ataque veloz mas menos preciso.',
      tenebralux: 'Ataque veloz mas menos preciso.'
    }
  },
  {
    id: 'precise_attack',
    name: { akashic: 'Ataque Preciso', tenebralux: 'Golpe Preciso' },
    type: 'basic',
    speedModifier: 4,
    attackModifier: 3,
    movementModifier: -1,
    description: {
      akashic: 'Ataque lento mas muito preciso.',
      tenebralux: 'Ataque lento mas muito preciso.'
    }
  },
  {
    id: 'total_defense',
    name: { akashic: 'Defesa Total', tenebralux: 'Defesa Total' },
    type: 'basic',
    speedModifier: 3,
    attackModifier: 0,
    movementModifier: -1,
    defenseBonus: 3,
    description: {
      akashic: 'Foca em defesa, ganhando +3 Guarda até próxima ação.',
      tenebralux: 'Foca em defesa, ganhando +3 Guarda até próxima ação.'
    }
  }
];

// ============= CARTAS TÁTICAS - LÂMINAS =============

export const BLADE_TACTICAL_CARDS: CombatCard[] = [
  {
    id: 'quick_slash',
    name: { akashic: 'Corte Rápido', tenebralux: 'Corte Rápido' },
    type: 'tactical',
    speedModifier: 1,
    attackModifier: -1,
    movementModifier: -2,
    effect: 'Se acertar, pode atacar novamente com -2',
    requirements: { skillId: 'laminas', skillMin: 1, xpCost: 5 },
    description: {
      akashic: 'Corte veloz que permite ataque seguinte.',
      tenebralux: 'Corte veloz que permite ataque seguinte.'
    }
  },
  {
    id: 'precise_thrust',
    name: { akashic: 'Estocada Precisa', tenebralux: 'Estocada Precisa' },
    type: 'tactical',
    speedModifier: 3,
    attackModifier: 1,
    movementModifier: -4,
    effect: 'Alvo perde -1 Guarda',
    requirements: { skillId: 'laminas', skillMin: 2, xpCost: 10 },
    description: {
      akashic: 'Estocada que encontra brechas na defesa.',
      tenebralux: 'Estocada que encontra brechas na defesa.'
    }
  },
  {
    id: 'powerful_cut',
    name: { akashic: 'Corte Poderoso', tenebralux: 'Golpe Devastador' },
    type: 'tactical',
    speedModifier: 5,
    attackModifier: 2,
    movementModifier: -6,
    effect: 'Alvo testa Atletismo ou cai',
    requirements: { skillId: 'laminas', skillMin: 3, xpCost: 15 },
    description: {
      akashic: 'Golpe devastador que pode derrubar o alvo.',
      tenebralux: 'Golpe devastador que pode derrubar o alvo.'
    }
  }
];

// ============= CARTAS TÁTICAS - TIRO =============

export const RANGED_TACTICAL_CARDS: CombatCard[] = [
  {
    id: 'quick_shot',
    name: { akashic: 'Tiro Rápido', tenebralux: 'Disparo Veloz' },
    type: 'tactical',
    speedModifier: 1,
    attackModifier: -2,
    movementModifier: -2,
    effect: 'Atira primeiro',
    requirements: { skillId: 'tiro', skillMin: 1, xpCost: 5 },
    description: {
      akashic: 'Disparo rápido, sacrificando precisão.',
      tenebralux: 'Disparo rápido, sacrificando precisão.'
    }
  },
  {
    id: 'standard_shot',
    name: { akashic: 'Tiro Padrão', tenebralux: 'Disparo Padrão' },
    type: 'tactical',
    speedModifier: 3,
    attackModifier: 0,
    movementModifier: -4,
    requirements: { skillId: 'tiro', skillMin: 1, xpCost: 5 },
    description: {
      akashic: 'Disparo balanceado entre velocidade e precisão.',
      tenebralux: 'Disparo balanceado entre velocidade e precisão.'
    }
  },
  {
    id: 'precision_shot',
    name: { akashic: 'Tiro de Precisão', tenebralux: 'Disparo Preciso' },
    type: 'tactical',
    speedModifier: 5,
    attackModifier: 2,
    movementModifier: -6,
    effect: 'Alvo não esquiva se distraído',
    requirements: { skillId: 'tiro', skillMin: 2, xpCost: 10 },
    description: {
      akashic: 'Disparo cuidadosamente mirado.',
      tenebralux: 'Disparo cuidadosamente mirado.'
    }
  }
];

// ============= CARTAS TÁTICAS - LUTA =============

export const MELEE_TACTICAL_CARDS: CombatCard[] = [
  {
    id: 'quick_punch',
    name: { akashic: 'Soco Rápido', tenebralux: 'Soco Rápido' },
    type: 'tactical',
    speedModifier: 0,
    attackModifier: -1,
    movementModifier: -1,
    effect: 'Pode atacar novamente com -2',
    requirements: { skillId: 'luta', skillMin: 1, xpCost: 5 },
    description: {
      akashic: 'Sequência rápida de socos.',
      tenebralux: 'Sequência rápida de socos.'
    }
  },
  {
    id: 'grapple',
    name: { akashic: 'Agarrar', tenebralux: 'Imobilizar' },
    type: 'tactical',
    speedModifier: 2,
    attackModifier: 0,
    movementModifier: -3,
    effect: 'Alvo fica agarrado até escapar',
    requirements: { skillId: 'luta', skillMin: 2, xpCost: 10 },
    description: {
      akashic: 'Agarra o oponente, limitando movimento.',
      tenebralux: 'Agarra o oponente, limitando movimento.'
    }
  },
  {
    id: 'takedown',
    name: { akashic: 'Derrubada', tenebralux: 'Rasteira' },
    type: 'tactical',
    speedModifier: 3,
    attackModifier: -1,
    movementModifier: -4,
    effect: 'Alvo cai; precisa gastar ação para levantar',
    requirements: { skillId: 'luta', skillMin: 2, xpCost: 10 },
    description: {
      akashic: 'Derruba o oponente ao chão.',
      tenebralux: 'Derruba o oponente ao chão.'
    }
  }
];

// ============= IMPORTAR POSTURAS E AÇÕES ESPECIAIS =============

import { POSTURE_CARDS, REST_CARD, RELOAD_CARD, SWAP_WEAPON_CARD, getPostureCards, getSpecialActionCards } from './postures';

// ============= FUNÇÕES AUXILIARES =============

export function getAllCards(): CombatCard[] {
  return [
    ...BASIC_CARDS,
    ...BLADE_TACTICAL_CARDS,
    ...RANGED_TACTICAL_CARDS,
    ...MELEE_TACTICAL_CARDS,
    ...POSTURE_CARDS,
    REST_CARD,
    RELOAD_CARD,
    SWAP_WEAPON_CARD
  ];
}

export function getCardById(id: string): CombatCard | undefined {
  return getAllCards().find(c => c.id === id);
}

export function getBasicCards(): CombatCard[] {
  return [...BASIC_CARDS, REST_CARD, RELOAD_CARD, SWAP_WEAPON_CARD];
}

export function getTacticalCards(): CombatCard[] {
  return [
    ...BLADE_TACTICAL_CARDS,
    ...RANGED_TACTICAL_CARDS,
    ...MELEE_TACTICAL_CARDS
  ];
}

export function getCardsBySkill(skillId: string): CombatCard[] {
  return getTacticalCards().filter(c => c.requirements?.skillId === skillId);
}

export function getAvailableCards(
  skills: Record<string, number>,
  purchasedCardIds: string[]
): CombatCard[] {
  // Cartas básicas sempre disponíveis
  const available = [...BASIC_CARDS, REST_CARD, RELOAD_CARD, SWAP_WEAPON_CARD];
  
  // Posturas sempre disponíveis
  available.push(...POSTURE_CARDS);
  
  // Cartas táticas compradas
  for (const cardId of purchasedCardIds) {
    const card = getCardById(cardId);
    if (card && card.type === 'tactical') {
      // Verificar se atende requisitos de skill
      if (card.requirements?.skillId) {
        const skillLevel = skills[card.requirements.skillId] || 0;
        if (skillLevel >= (card.requirements.skillMin || 0)) {
          available.push(card);
        }
      } else {
        available.push(card);
      }
    }
  }
  
  return available;
}

// Re-exportar para conveniência
export { getPostureCards, getSpecialActionCards };
