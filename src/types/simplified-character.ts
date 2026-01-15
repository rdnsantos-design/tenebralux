// Tipos para criação simplificada de NPC/Personagem

export type CharacterLevel = 'amador' | 'recruta' | 'profissional' | 'veterano' | 'elite';

export type SimplifiedWeaponType = 'punhos' | 'pistola' | 'rifle';

export interface SimplifiedWeaponStats {
  type: SimplifiedWeaponType;
  name: string;
  damage: number;
  range: number;
  speedModifier: number;
  movementModifier: number;
  bonusDamageRule?: string; // e.g., "1:4" para punhos
}

export const SIMPLIFIED_WEAPONS: Record<SimplifiedWeaponType, SimplifiedWeaponStats> = {
  punhos: {
    type: 'punhos',
    name: 'Punhos',
    damage: 1,
    range: 1,
    speedModifier: 0,
    movementModifier: 0,
    bonusDamageRule: '1:4' // +1 dano para cada 4 que ultrapassar a defesa
  },
  pistola: {
    type: 'pistola',
    name: 'Pistola',
    damage: 3,
    range: 20,
    speedModifier: 1,
    movementModifier: 0
  },
  rifle: {
    type: 'rifle',
    name: 'Rifle',
    damage: 6,
    range: 60,
    speedModifier: 3,
    movementModifier: -2
  }
};

export const CHARACTER_LEVELS: { value: CharacterLevel; label: string; description: string }[] = [
  { value: 'amador', label: 'Amador', description: 'Sem treinamento formal' },
  { value: 'recruta', label: 'Recruta', description: 'Treinamento básico' },
  { value: 'profissional', label: 'Profissional', description: 'Experiência moderada' },
  { value: 'veterano', label: 'Veterano', description: 'Altamente experiente' },
  { value: 'elite', label: 'Elite', description: 'Os melhores dos melhores' }
];

export interface SimplifiedCharacter {
  id: string;
  name: string;
  isSimplified: true;
  isRegent: boolean;
  level: CharacterLevel;
  theme: 'akashic' | 'tenebralux';
  
  // Atributos de combate
  guarda: number;
  resistencia: number;
  defesa: number; // Calculado: guarda + resistencia
  
  // Ataques (3 valores separados)
  tiro: number;
  luta: number;
  laminas: number;
  
  // Perícias de guerra
  estrategia: number; // Usada pelo general
  comando: number;    // Usada pelo líder de campo
  
  // Outros stats
  evasao: number;
  vitalidade: number;
  movimento: number;
  
  // Arma
  weaponType: SimplifiedWeaponType;
  
  // Stats de domínio (apenas se isRegent)
  domainStats?: {
    regencia: number;
    seguranca: number;
    industria: number;
    comercio: number;
    politica: number;
    inovacao: number;
  };
  
  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Função para calcular defesa
export function calculateDefense(guarda: number, resistencia: number): number {
  return guarda + resistencia;
}

// Valores sugeridos por nível
export const LEVEL_STAT_SUGGESTIONS: Record<CharacterLevel, {
  statRange: { min: number; max: number };
  description: string;
}> = {
  amador: { statRange: { min: 0, max: 1 }, description: 'Stats 0-1' },
  recruta: { statRange: { min: 1, max: 2 }, description: 'Stats 1-2' },
  profissional: { statRange: { min: 2, max: 3 }, description: 'Stats 2-3' },
  veterano: { statRange: { min: 3, max: 4 }, description: 'Stats 3-4' },
  elite: { statRange: { min: 4, max: 5 }, description: 'Stats 4-5' }
};

// Criar personagem simplificado vazio
export function createEmptySimplifiedCharacter(theme: 'akashic' | 'tenebralux' = 'tenebralux'): Omit<SimplifiedCharacter, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: '',
    isSimplified: true,
    isRegent: false,
    level: 'profissional',
    theme,
    guarda: 2,
    resistencia: 2,
    defesa: 4,
    tiro: 2,
    luta: 2,
    laminas: 2,
    estrategia: 2,
    comando: 2,
    evasao: 2,
    vitalidade: 10,
    movimento: 6,
    weaponType: 'pistola'
  };
}
