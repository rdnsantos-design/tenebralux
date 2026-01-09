/**
 * Definições de Armas para Combate Tático
 * Baseado nas escalas acordadas:
 * - Desarmado: 1:4
 * - Lâminas: 1:2
 * - Balístico: 1:1
 * - Laser: 1:2
 * - Explosão: 1:1 + área
 */

import { TacticalWeapon, TacticalArmor } from '@/types/tactical-combat';

// ============= ARMAS DESARMADAS =============

export const UNARMED_WEAPONS: TacticalWeapon[] = [
  {
    id: 'fist',
    name: { akashic: 'Punho', tenebralux: 'Punho' },
    category: 'unarmed',
    weight: 'light',
    baseDamage: 2,
    timeModifier: 0,
    range: 0,
    damageScale: 4,
    description: {
      akashic: 'Ataque desarmado com os punhos.',
      tenebralux: 'Ataque desarmado com os punhos.'
    }
  },
  {
    id: 'kick',
    name: { akashic: 'Chute', tenebralux: 'Chute' },
    category: 'unarmed',
    weight: 'medium',
    baseDamage: 3,
    timeModifier: 1,
    range: 0,
    damageScale: 4,
    description: {
      akashic: 'Chute potente, mais lento que um soco.',
      tenebralux: 'Chute potente, mais lento que um soco.'
    }
  }
];

// ============= LÂMINAS =============

export const BLADE_WEAPONS: TacticalWeapon[] = [
  {
    id: 'knife_tactical',
    name: { akashic: 'Faca Tática', tenebralux: 'Adaga' },
    category: 'blade',
    weight: 'light',
    baseDamage: 3,
    timeModifier: 0,
    range: 0,
    damageScale: 2,
    special: ['Oculta', 'Arremesso'],
    description: {
      akashic: 'Lâmina compacta para ataques rápidos.',
      tenebralux: 'Adaga de aço para ataques rápidos.'
    }
  },
  {
    id: 'short_sword',
    name: { akashic: 'Lâmina Curta', tenebralux: 'Espada Curta' },
    category: 'blade',
    weight: 'medium',
    baseDamage: 5,
    timeModifier: 1,
    range: 0,
    damageScale: 2,
    description: {
      akashic: 'Lâmina balanceada para combate próximo.',
      tenebralux: 'Espada curta versátil.'
    }
  },
  {
    id: 'long_sword',
    name: { akashic: 'Lâmina de Combate', tenebralux: 'Espada Longa' },
    category: 'blade',
    weight: 'heavy',
    baseDamage: 7,
    timeModifier: 2,
    range: 0,
    damageScale: 2,
    special: ['Versátil'],
    description: {
      akashic: 'Arma branca padrão das forças armadas.',
      tenebralux: 'Espada longa bem forjada.'
    }
  },
  {
    id: 'great_sword',
    name: { akashic: 'Espadão Tático', tenebralux: 'Montante' },
    category: 'blade',
    weight: 'very_heavy',
    baseDamage: 10,
    timeModifier: 3,
    range: 0,
    damageScale: 2,
    special: ['Duas Mãos', 'Alcance'],
    description: {
      akashic: 'Lâmina massiva que requer duas mãos.',
      tenebralux: 'Espadão devastador de duas mãos.'
    }
  }
];

// ============= ARMAS BALÍSTICAS =============

export const BALLISTIC_WEAPONS: TacticalWeapon[] = [
  {
    id: 'pistol_light',
    name: { akashic: 'Pistola Compacta', tenebralux: 'Besta de Bolso' },
    category: 'ballistic',
    weight: 'light',
    baseDamage: 4,
    timeModifier: 0,
    range: 15,
    damageScale: 1,
    special: ['Saque Rápido'],
    description: {
      akashic: 'Pistola semiautomática leve.',
      tenebralux: 'Pequena besta portátil.'
    }
  },
  {
    id: 'pistol_standard',
    name: { akashic: 'Pistola', tenebralux: 'Besta de Mão' },
    category: 'ballistic',
    weight: 'medium',
    baseDamage: 5,
    timeModifier: 1,
    range: 25,
    damageScale: 1,
    description: {
      akashic: 'Pistola semiautomática padrão.',
      tenebralux: 'Besta de mão confiável.'
    }
  },
  {
    id: 'rifle',
    name: { akashic: 'Rifle', tenebralux: 'Arco Longo' },
    category: 'ballistic',
    weight: 'heavy',
    baseDamage: 7,
    timeModifier: 2,
    range: 100,
    damageScale: 1,
    special: ['Precisão', 'Duas Mãos'],
    description: {
      akashic: 'Rifle de longo alcance.',
      tenebralux: 'Arco longo de caça.'
    }
  },
  {
    id: 'sniper',
    name: { akashic: 'Rifle de Precisão', tenebralux: 'Balista de Elite' },
    category: 'ballistic',
    weight: 'very_heavy',
    baseDamage: 10,
    timeModifier: 3,
    range: 200,
    damageScale: 1,
    special: ['Precisão Extrema', 'Duas Mãos', 'Montagem'],
    description: {
      akashic: 'Rifle sniper de alta precisão.',
      tenebralux: 'Balista de precisão para alvos distantes.'
    }
  },
  {
    id: 'shotgun',
    name: { akashic: 'Escopeta', tenebralux: 'Besta Dispersora' },
    category: 'ballistic',
    weight: 'heavy',
    baseDamage: 9,
    timeModifier: 2,
    range: 10,
    damageScale: 1,
    special: ['Dispersão', 'Duas Mãos'],
    description: {
      akashic: 'Escopeta de curto alcance.',
      tenebralux: 'Besta que dispara múltiplos virotes.'
    }
  }
];

// ============= ARMAS LASER =============

export const LASER_WEAPONS: TacticalWeapon[] = [
  {
    id: 'laser_pistol',
    name: { akashic: 'Pistola Laser', tenebralux: 'Varinha Arcana' },
    category: 'laser',
    weight: 'light',
    baseDamage: 4,
    timeModifier: 0,
    range: 30,
    damageScale: 2,
    special: ['Silenciosa', 'Cauteriza'],
    description: {
      akashic: 'Pistola de energia concentrada.',
      tenebralux: 'Varinha que dispara raios de fogo.'
    }
  },
  {
    id: 'laser_rifle',
    name: { akashic: 'Rifle Laser', tenebralux: 'Cajado de Fogo' },
    category: 'laser',
    weight: 'medium',
    baseDamage: 6,
    timeModifier: 1,
    range: 80,
    damageScale: 2,
    special: ['Precisão', 'Cauteriza'],
    description: {
      akashic: 'Rifle de energia para médio alcance.',
      tenebralux: 'Cajado que canaliza chamas arcanas.'
    }
  },
  {
    id: 'heavy_laser',
    name: { akashic: 'Canhão Laser', tenebralux: 'Cetro de Destruição' },
    category: 'laser',
    weight: 'very_heavy',
    baseDamage: 10,
    timeModifier: 3,
    range: 120,
    damageScale: 2,
    special: ['Perfurante', 'Duas Mãos', 'Recarga'],
    description: {
      akashic: 'Canhão de energia devastador.',
      tenebralux: 'Cetro de poder arcano destrutivo.'
    }
  }
];

// ============= ARMAS EXPLOSIVAS =============

export const EXPLOSIVE_WEAPONS: TacticalWeapon[] = [
  {
    id: 'grenade',
    name: { akashic: 'Granada', tenebralux: 'Orbe Explosiva' },
    category: 'explosion',
    weight: 'light',
    baseDamage: 8,
    timeModifier: 0,
    range: 20,
    damageScale: 1,
    special: ['Área 3m', 'Arremesso', 'Munição Limitada'],
    description: {
      akashic: 'Granada de fragmentação.',
      tenebralux: 'Esfera alquímica explosiva.'
    }
  },
  {
    id: 'rocket_launcher',
    name: { akashic: 'Lança-Foguetes', tenebralux: 'Lança-Bolas de Fogo' },
    category: 'explosion',
    weight: 'very_heavy',
    baseDamage: 15,
    timeModifier: 3,
    range: 50,
    damageScale: 1,
    special: ['Área 5m', 'Duas Mãos', 'Munição Limitada'],
    description: {
      akashic: 'Lançador de projéteis explosivos.',
      tenebralux: 'Tubo encantado que dispara bolas de fogo.'
    }
  }
];

// ============= ARMADURAS =============

export const TACTICAL_ARMORS: TacticalArmor[] = [
  {
    id: 'no_armor',
    name: { akashic: 'Sem Armadura', tenebralux: 'Sem Armadura' },
    absorption: 0,
    evasionPenalty: 0,
    weight: 'light',
    description: {
      akashic: 'Sem proteção corporal.',
      tenebralux: 'Sem proteção corporal.'
    }
  },
  {
    id: 'light_vest',
    name: { akashic: 'Colete Leve', tenebralux: 'Gibão de Couro' },
    absorption: 1,
    evasionPenalty: 0,
    weight: 'light',
    description: {
      akashic: 'Colete de proteção leve.',
      tenebralux: 'Armadura de couro flexível.'
    }
  },
  {
    id: 'tactical_vest',
    name: { akashic: 'Colete Tático', tenebralux: 'Cota de Malha' },
    absorption: 3,
    evasionPenalty: 1,
    weight: 'medium',
    description: {
      akashic: 'Colete balístico padrão.',
      tenebralux: 'Armadura de anéis entrelaçados.'
    }
  },
  {
    id: 'heavy_armor',
    name: { akashic: 'Armadura Pesada', tenebralux: 'Armadura de Placas' },
    absorption: 5,
    evasionPenalty: 3,
    weight: 'heavy',
    description: {
      akashic: 'Armadura de combate completa.',
      tenebralux: 'Armadura de placas de aço.'
    }
  },
  {
    id: 'power_armor',
    name: { akashic: 'Armadura Potencializada', tenebralux: 'Armadura Encantada' },
    absorption: 7,
    evasionPenalty: 2,
    weight: 'very_heavy',
    description: {
      akashic: 'Exoesqueleto blindado motorizado.',
      tenebralux: 'Armadura magicamente reforçada.'
    }
  }
];

// ============= FUNÇÕES AUXILIARES =============

export function getAllWeapons(): TacticalWeapon[] {
  return [
    ...UNARMED_WEAPONS,
    ...BLADE_WEAPONS,
    ...BALLISTIC_WEAPONS,
    ...LASER_WEAPONS,
    ...EXPLOSIVE_WEAPONS
  ];
}

export function getWeaponById(id: string): TacticalWeapon | undefined {
  return getAllWeapons().find(w => w.id === id);
}

export function getArmorById(id: string): TacticalArmor | undefined {
  return TACTICAL_ARMORS.find(a => a.id === id);
}

export function getWeaponsByCategory(category: string): TacticalWeapon[] {
  return getAllWeapons().filter(w => w.category === category);
}
