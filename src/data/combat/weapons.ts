/**
 * Armas e Armaduras para Combate Tático
 * 
 * Armas: Dano, Mod Ataque, Velocidade, Efeito, Slots
 * Armaduras: Guarda, Redução Dano, Penalidade Vel, Penalidade Mov
 */

import { TacticalWeapon, TacticalArmor } from '@/types/tactical-combat';

// ============= PISTOLAS =============

export const PISTOLS: TacticalWeapon[] = [
  {
    id: 'pistol_ballistic_t1',
    name: { akashic: 'Pistola Balística T1', tenebralux: 'Besta de Mão' },
    type: 'ballistic',
    tier: 1,
    damage: 3,
    attackModifier: 0,
    speedModifier: 1,
    slots: 1,
    range: 20,
    description: {
      akashic: 'Pistola semiautomática básica.',
      tenebralux: 'Pequena besta de mão.'
    }
  },
  {
    id: 'pistol_ballistic_t2',
    name: { akashic: 'Pistola Balística T2', tenebralux: 'Besta Refinada' },
    type: 'ballistic',
    tier: 2,
    damage: 4,
    attackModifier: 0,
    speedModifier: 1,
    slots: 1,
    range: 25,
    description: {
      akashic: 'Pistola militar de alto calibre.',
      tenebralux: 'Besta de fabricação nobre.'
    }
  },
  {
    id: 'pistol_energy_t1',
    name: { akashic: 'Pistola de Energia T1', tenebralux: 'Varinha Arcana' },
    type: 'energy',
    tier: 1,
    damage: 2,
    attackModifier: 1,
    speedModifier: 1,
    effect: 'Ignora 1 de escudo',
    slots: 1,
    range: 25,
    description: {
      akashic: 'Pistola de energia concentrada.',
      tenebralux: 'Varinha que dispara raios arcanos.'
    }
  }
];

// ============= RIFLES =============

export const RIFLES: TacticalWeapon[] = [
  {
    id: 'rifle_ballistic_t1',
    name: { akashic: 'Rifle Balístico T1', tenebralux: 'Arco Longo' },
    type: 'ballistic',
    tier: 1,
    damage: 5,
    attackModifier: 0,
    speedModifier: 2,
    slots: 2,
    range: 80,
    description: {
      akashic: 'Rifle de precisão padrão.',
      tenebralux: 'Arco longo de caça.'
    }
  },
  {
    id: 'rifle_energy_t1',
    name: { akashic: 'Rifle de Energia T1', tenebralux: 'Cajado de Fogo' },
    type: 'energy',
    tier: 1,
    damage: 4,
    attackModifier: 1,
    speedModifier: 2,
    effect: 'Ignora 2 de escudo',
    slots: 2,
    range: 60,
    description: {
      akashic: 'Rifle de energia de médio alcance.',
      tenebralux: 'Cajado encantado com chamas.'
    }
  },
  {
    id: 'rifle_ballistic_t2',
    name: { akashic: 'Rifle Balístico T2', tenebralux: 'Balista de Elite' },
    type: 'ballistic',
    tier: 2,
    damage: 7,
    attackModifier: 1,
    speedModifier: 3,
    slots: 2,
    range: 120,
    description: {
      akashic: 'Rifle de precisão avançado.',
      tenebralux: 'Balista de precisão nobre.'
    }
  }
];

// ============= ARMAS CORPO A CORPO =============

export const MELEE_WEAPONS: TacticalWeapon[] = [
  {
    id: 'fist',
    name: { akashic: 'Desarmado', tenebralux: 'Desarmado' },
    type: 'melee',
    tier: 1,
    damage: 1,
    attackModifier: 0,
    speedModifier: 0,
    slots: 0,
    range: 0,
    description: {
      akashic: 'Ataque com punhos.',
      tenebralux: 'Ataque com punhos.'
    }
  },
  {
    id: 'knife',
    name: { akashic: 'Faca Tática', tenebralux: 'Adaga' },
    type: 'melee',
    tier: 1,
    damage: 2,
    attackModifier: 1,
    speedModifier: 0,
    effect: 'Oculta',
    slots: 1,
    range: 0,
    description: {
      akashic: 'Lâmina compacta e rápida.',
      tenebralux: 'Adaga de aço afiado.'
    }
  },
  {
    id: 'sword_short',
    name: { akashic: 'Lâmina Curta', tenebralux: 'Espada Curta' },
    type: 'melee',
    tier: 1,
    damage: 3,
    attackModifier: 0,
    speedModifier: 1,
    slots: 1,
    range: 0,
    description: {
      akashic: 'Lâmina balanceada para combate próximo.',
      tenebralux: 'Espada curta versátil.'
    }
  },
  {
    id: 'sword_long',
    name: { akashic: 'Lâmina de Combate', tenebralux: 'Espada Longa' },
    type: 'melee',
    tier: 2,
    damage: 4,
    attackModifier: 0,
    speedModifier: 2,
    slots: 1,
    range: 0,
    description: {
      akashic: 'Arma branca padrão das forças armadas.',
      tenebralux: 'Espada longa de aço forjado.'
    }
  },
  {
    id: 'great_sword',
    name: { akashic: 'Espadão', tenebralux: 'Montante' },
    type: 'melee',
    tier: 3,
    damage: 6,
    attackModifier: -1,
    speedModifier: 3,
    effect: 'Duas mãos, Alcance',
    slots: 2,
    range: 0,
    description: {
      akashic: 'Lâmina massiva de duas mãos.',
      tenebralux: 'Espadão devastador.'
    }
  }
];

// ============= ARMADURAS =============

export const TACTICAL_ARMORS: TacticalArmor[] = [
  {
    id: 'no_armor',
    name: { akashic: 'Nenhuma', tenebralux: 'Nenhuma' },
    tier: 1,
    guardBonus: 0,
    damageReduction: 0,
    speedPenalty: 0,
    movementPenalty: 0,
    description: {
      akashic: 'Sem proteção.',
      tenebralux: 'Sem proteção.'
    }
  },
  {
    id: 'light_armor_t1',
    name: { akashic: 'Armadura Leve T1', tenebralux: 'Couro Leve' },
    tier: 1,
    guardBonus: 1,
    damageReduction: 0,
    speedPenalty: 0,
    movementPenalty: 0,
    description: {
      akashic: 'Proteção leve que não restringe movimento.',
      tenebralux: 'Armadura de couro flexível.'
    }
  },
  {
    id: 'medium_armor_t1',
    name: { akashic: 'Armadura Média T1', tenebralux: 'Cota de Malha' },
    tier: 1,
    guardBonus: 2,
    damageReduction: 2,
    speedPenalty: 1,
    movementPenalty: 0,
    description: {
      akashic: 'Colete tático padrão.',
      tenebralux: 'Armadura de anéis entrelaçados.'
    }
  },
  {
    id: 'heavy_armor_t1',
    name: { akashic: 'Armadura Pesada T1', tenebralux: 'Armadura de Placas' },
    tier: 1,
    guardBonus: 3,
    damageReduction: 3,
    speedPenalty: 2,
    movementPenalty: 1,
    description: {
      akashic: 'Armadura de combate completa.',
      tenebralux: 'Armadura de placas de aço.'
    }
  },
  {
    id: 'medium_armor_t2',
    name: { akashic: 'Armadura Média T2', tenebralux: 'Cota de Escamas' },
    tier: 2,
    guardBonus: 3,
    damageReduction: 2,
    speedPenalty: 1,
    movementPenalty: 0,
    description: {
      akashic: 'Colete balístico avançado.',
      tenebralux: 'Armadura de escamas sobrepostas.'
    }
  },
  {
    id: 'heavy_armor_t2',
    name: { akashic: 'Armadura Pesada T2', tenebralux: 'Armadura Completa' },
    tier: 2,
    guardBonus: 4,
    damageReduction: 4,
    speedPenalty: 2,
    movementPenalty: 2,
    description: {
      akashic: 'Exoesqueleto leve blindado.',
      tenebralux: 'Armadura completa de cavaleiro.'
    }
  }
];

// ============= FUNÇÕES AUXILIARES =============

export function getAllWeapons(): TacticalWeapon[] {
  return [...PISTOLS, ...RIFLES, ...MELEE_WEAPONS];
}

export function getWeaponById(id: string): TacticalWeapon | undefined {
  return getAllWeapons().find(w => w.id === id);
}

export function getWeaponsByType(type: string): TacticalWeapon[] {
  return getAllWeapons().filter(w => w.type === type);
}

export function getArmorById(id: string): TacticalArmor | undefined {
  return TACTICAL_ARMORS.find(a => a.id === id);
}

export function getArmorsByTier(tier: number): TacticalArmor[] {
  return TACTICAL_ARMORS.filter(a => a.tier === tier);
}
