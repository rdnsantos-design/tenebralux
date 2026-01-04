import { ThemeId } from '@/themes/types';

export interface EquipmentStats {
  damage?: string;
  range?: string;
  defense?: number;
  special?: string;
}

export interface EquipmentDefinition {
  id: string;
  name: {
    akashic: string;
    tenebralux: string;
  };
  category: 'weapon' | 'armor' | 'item';
  type: 'melee' | 'ranged' | 'heavy' | 'light' | 'medium' | 'utility';
  cost: number;
  weight: number;
  description: {
    akashic: string;
    tenebralux: string;
  };
  stats?: EquipmentStats;
}

export const STARTING_CREDITS = 100;

export const WEAPONS: EquipmentDefinition[] = [
  // Melee
  {
    id: 'knife',
    name: { akashic: 'Faca Tática', tenebralux: 'Adaga' },
    category: 'weapon',
    type: 'melee',
    cost: 5,
    weight: 1,
    description: {
      akashic: 'Lâmina compacta para combate próximo e utilidades.',
      tenebralux: 'Uma adaga de aço afiada, ideal para golpes rápidos.'
    },
    stats: { damage: '1d4+FOR', range: 'Corpo a corpo', special: 'Leve, Oculta' }
  },
  {
    id: 'sword',
    name: { akashic: 'Lâmina de Combate', tenebralux: 'Espada Longa' },
    category: 'weapon',
    type: 'melee',
    cost: 15,
    weight: 3,
    description: {
      akashic: 'Arma branca padrão das forças armadas.',
      tenebralux: 'Uma espada bem balanceada de aço forjado.'
    },
    stats: { damage: '1d8+FOR', range: 'Corpo a corpo', special: 'Versátil' }
  },
  {
    id: 'axe',
    name: { akashic: 'Machado de Impacto', tenebralux: 'Machado de Guerra' },
    category: 'weapon',
    type: 'melee',
    cost: 20,
    weight: 4,
    description: {
      akashic: 'Ferramenta pesada convertida para combate.',
      tenebralux: 'Machado de lâmina dupla, devastador em combate.'
    },
    stats: { damage: '1d10+FOR', range: 'Corpo a corpo', special: 'Brutal' }
  },
  {
    id: 'spear',
    name: { akashic: 'Lança Tática', tenebralux: 'Lança' },
    category: 'weapon',
    type: 'melee',
    cost: 10,
    weight: 3,
    description: {
      akashic: 'Arma de alcance para formações defensivas.',
      tenebralux: 'Lança de madeira reforçada com ponta de ferro.'
    },
    stats: { damage: '1d6+FOR', range: 'Alcance', special: 'Alcance, Arremesso' }
  },
  // Ranged
  {
    id: 'pistol',
    name: { akashic: 'Pistola', tenebralux: 'Besta de Mão' },
    category: 'weapon',
    type: 'ranged',
    cost: 25,
    weight: 2,
    description: {
      akashic: 'Arma de fogo semiautomática compacta.',
      tenebralux: 'Pequena besta que pode ser usada com uma mão.'
    },
    stats: { damage: '1d6+DES', range: '20m', special: 'Leve, Recarga rápida' }
  },
  {
    id: 'rifle',
    name: { akashic: 'Rifle de Precisão', tenebralux: 'Arco Longo' },
    category: 'weapon',
    type: 'ranged',
    cost: 40,
    weight: 4,
    description: {
      akashic: 'Arma de longo alcance com mira telescópica.',
      tenebralux: 'Arco de madeira curvada para disparos à distância.'
    },
    stats: { damage: '1d10+DES', range: '100m', special: 'Precisão, Duas mãos' }
  },
  {
    id: 'shotgun',
    name: { akashic: 'Escopeta', tenebralux: 'Besta Pesada' },
    category: 'weapon',
    type: 'ranged',
    cost: 35,
    weight: 4,
    description: {
      akashic: 'Arma de dispersão para combate em curto alcance.',
      tenebralux: 'Besta reforçada que dispara virotes pesados.'
    },
    stats: { damage: '2d6', range: '10m', special: 'Dispersão, Recarga' }
  },
  // Heavy
  {
    id: 'machinegun',
    name: { akashic: 'Metralhadora', tenebralux: 'Balista Portátil' },
    category: 'weapon',
    type: 'heavy',
    cost: 60,
    weight: 8,
    description: {
      akashic: 'Arma automática de supressão.',
      tenebralux: 'Balista compacta montada em suporte portátil.'
    },
    stats: { damage: '2d8', range: '50m', special: 'Automático, Pesado, Montagem' }
  },
  {
    id: 'launcher',
    name: { akashic: 'Lançador de Granadas', tenebralux: 'Catapulta de Mão' },
    category: 'weapon',
    type: 'heavy',
    cost: 75,
    weight: 6,
    description: {
      akashic: 'Lança projéteis explosivos em área.',
      tenebralux: 'Dispositivo mecânico que arremessa esferas explosivas.'
    },
    stats: { damage: '3d6', range: '30m', special: 'Área, Munição limitada' }
  }
];

export const ARMORS: EquipmentDefinition[] = [
  // Light
  {
    id: 'clothes',
    name: { akashic: 'Roupa Reforçada', tenebralux: 'Couro Leve' },
    category: 'armor',
    type: 'light',
    cost: 10,
    weight: 2,
    description: {
      akashic: 'Vestimenta com proteção balística leve.',
      tenebralux: 'Armadura de couro macio que não restringe movimentos.'
    },
    stats: { defense: 1, special: 'Não impede furtividade' }
  },
  {
    id: 'shield',
    name: { akashic: 'Escudo Tático', tenebralux: 'Escudo de Madeira' },
    category: 'armor',
    type: 'light',
    cost: 15,
    weight: 3,
    description: {
      akashic: 'Escudo balístico portátil.',
      tenebralux: 'Escudo redondo reforçado com metal.'
    },
    stats: { defense: 2, special: 'Requer uma mão' }
  },
  // Medium
  {
    id: 'vest',
    name: { akashic: 'Colete Balístico', tenebralux: 'Cota de Malha' },
    category: 'armor',
    type: 'medium',
    cost: 30,
    weight: 5,
    description: {
      akashic: 'Proteção corporal padrão contra projéteis.',
      tenebralux: 'Armadura de anéis de metal entrelaçados.'
    },
    stats: { defense: 3, special: 'Desvantagem em Furtividade' }
  },
  // Heavy
  {
    id: 'combat_armor',
    name: { akashic: 'Armadura de Combate', tenebralux: 'Armadura de Placas' },
    category: 'armor',
    type: 'heavy',
    cost: 50,
    weight: 10,
    description: {
      akashic: 'Traje blindado completo para operações de alto risco.',
      tenebralux: 'Armadura completa de placas de aço sobrepostas.'
    },
    stats: { defense: 5, special: 'FOR mínima 12, Desvantagem em Furtividade' }
  }
];

export const ITEMS: EquipmentDefinition[] = [
  {
    id: 'medkit',
    name: { akashic: 'Kit Médico', tenebralux: 'Bolsa de Cura' },
    category: 'item',
    type: 'utility',
    cost: 20,
    weight: 2,
    description: {
      akashic: 'Suprimentos médicos de emergência.',
      tenebralux: 'Ervas, bandagens e unguentos curativos.'
    },
    stats: { special: 'Restaura 1d6+SAB de Vitalidade' }
  },
  {
    id: 'communicator',
    name: { akashic: 'Comunicador', tenebralux: 'Pedra Mensageira' },
    category: 'item',
    type: 'utility',
    cost: 15,
    weight: 1,
    description: {
      akashic: 'Dispositivo de comunicação de curto alcance.',
      tenebralux: 'Pedra encantada que transmite mensagens curtas.'
    },
    stats: { special: 'Alcance 5km' }
  },
  {
    id: 'rope',
    name: { akashic: 'Corda Sintética', tenebralux: 'Corda de Cânhamo' },
    category: 'item',
    type: 'utility',
    cost: 5,
    weight: 2,
    description: {
      akashic: 'Corda resistente de 15 metros.',
      tenebralux: 'Corda trançada resistente de 15 metros.'
    },
    stats: { special: 'Suporta 300kg' }
  },
  {
    id: 'lantern',
    name: { akashic: 'Lanterna Tática', tenebralux: 'Lanterna a Óleo' },
    category: 'item',
    type: 'utility',
    cost: 10,
    weight: 1,
    description: {
      akashic: 'Fonte de luz LED de alta potência.',
      tenebralux: 'Lanterna que queima óleo por 6 horas.'
    },
    stats: { special: 'Ilumina 20m' }
  },
  {
    id: 'backpack',
    name: { akashic: 'Mochila Tática', tenebralux: 'Mochila de Viagem' },
    category: 'item',
    type: 'utility',
    cost: 8,
    weight: 1,
    description: {
      akashic: 'Mochila modular com múltiplos compartimentos.',
      tenebralux: 'Mochila de couro com alças reforçadas.'
    },
    stats: { special: '+20 de capacidade de carga' }
  },
  {
    id: 'rations',
    name: { akashic: 'Ração de Combate', tenebralux: 'Rações de Viagem' },
    category: 'item',
    type: 'utility',
    cost: 5,
    weight: 2,
    description: {
      akashic: 'Alimentos desidratados para 3 dias.',
      tenebralux: 'Pão seco, carne curada e frutas secas para 3 dias.'
    },
    stats: { special: 'Sustento por 3 dias' }
  },
  {
    id: 'binoculars',
    name: { akashic: 'Binóculos', tenebralux: 'Luneta' },
    category: 'item',
    type: 'utility',
    cost: 12,
    weight: 1,
    description: {
      akashic: 'Dispositivo óptico de ampliação 10x.',
      tenebralux: 'Tubo de latão com lentes de cristal polido.'
    },
    stats: { special: 'Visão 10x à distância' }
  },
  {
    id: 'tools',
    name: { akashic: 'Kit de Ferramentas', tenebralux: 'Ferramentas de Artesão' },
    category: 'item',
    type: 'utility',
    cost: 18,
    weight: 3,
    description: {
      akashic: 'Conjunto de ferramentas multiuso.',
      tenebralux: 'Martelo, pregos, serrote e outras ferramentas básicas.'
    },
    stats: { special: '+2 em testes de reparo' }
  }
];

// Utility functions
export function getEquipmentName(item: EquipmentDefinition, theme: ThemeId): string {
  return item.name[theme] || item.name.tenebralux;
}

export function getEquipmentDescription(item: EquipmentDefinition, theme: ThemeId): string {
  return item.description[theme] || item.description.tenebralux;
}

export function getEquipmentById(id: string): EquipmentDefinition | undefined {
  return [...WEAPONS, ...ARMORS, ...ITEMS].find(item => item.id === id);
}

export function getWeapons(): EquipmentDefinition[] {
  return WEAPONS;
}

export function getArmors(): EquipmentDefinition[] {
  return ARMORS;
}

export function getItems(): EquipmentDefinition[] {
  return ITEMS;
}

export function getCurrencyName(theme: ThemeId): string {
  return theme === 'akashic' ? 'Créditos' : 'Moedas de Ouro';
}
