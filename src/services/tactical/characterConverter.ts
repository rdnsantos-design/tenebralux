import { CharacterDraft } from '@/types/character-builder';
import {
  TacticalUnit,
  CombatCard,
  TacticalUnitType,
  TacticalCardType,
  ConversionOptions,
  ConversionResult,
  CharacterToUnitMapping,
  CardRarity,
} from '@/types/character-tactical';
import { calculateDerivedStats, calculateRegencyStats } from '@/core/types/character';
import { getSkillLabel } from '@/data/character/skills';
import { v4 as uuidv4 } from 'uuid';
import { ThemeId } from '@/themes/types';

// ═══════════════════════════════════════════════════════════════
// CONSTANTES DE CONVERSÃO
// ═══════════════════════════════════════════════════════════════

const SKILL_TO_CARD_TYPE: Record<string, TacticalCardType> = {
  luta: 'attack',
  tiro: 'attack',
  laminas: 'attack',
  artilharia: 'attack',
  esquiva: 'defense',
  resistencia: 'defense',
  atletismo: 'movement',
  furtividade: 'movement',
  percepcao: 'special',
  intimidacao_det: 'special',
  intimidacao_car: 'special',
  persuasao: 'special',
  medicina: 'support',
  lideranca: 'command',
};

const CARD_RARITY_BY_SKILL_LEVEL: Record<number, CardRarity> = {
  1: 'common',
  2: 'common',
  3: 'uncommon',
  4: 'rare',
  5: 'epic',
};

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES PRINCIPAIS
// ═══════════════════════════════════════════════════════════════

/**
 * Converte um personagem do Character Builder para uma unidade tática
 */
export function convertCharacterToUnit(
  character: CharacterDraft,
  options: ConversionOptions = {}
): ConversionResult {
  const {
    asCommander = false,
    generateCards = true,
    includeEquipment = true,
    teamId = 'player',
  } = options;

  const warnings: string[] = [];
  const theme = (character.theme || 'akashic') as ThemeId;

  // Criar atributos completos com defaults
  const fullAttributes = {
    conhecimento: character.attributes?.conhecimento ?? 1,
    raciocinio: character.attributes?.raciocinio ?? 1,
    corpo: character.attributes?.corpo ?? 1,
    reflexos: character.attributes?.reflexos ?? 1,
    determinacao: character.attributes?.determinacao ?? 1,
    coordenacao: character.attributes?.coordenacao ?? 1,
    carisma: character.attributes?.carisma ?? 1,
    intuicao: character.attributes?.intuicao ?? 1,
  };

  // Calcular stats derivados
  const derived = calculateDerivedStats(
    fullAttributes,
    character.skills || {}
  );

  const regency = calculateRegencyStats(
    fullAttributes,
    character.skills || {},
    theme
  );

  // Mapear stats
  const mapping = mapCharacterStats(derived, regency, character, includeEquipment);

  // Determinar tipo de unidade
  const unitType = determineUnitType(character, asCommander);

  // Criar unidade tática
  const unit: TacticalUnit = {
    id: uuidv4(),
    name: character.name || 'Sem Nome',
    type: unitType,
    teamId,
    
    // Stats de combate
    hp: mapping.hp,
    maxHp: mapping.maxHp,
    defense: mapping.defense,
    evasion: mapping.evasion,
    speed: mapping.speed,
    initiative: mapping.initiative,
    
    // Stats sociais
    morale: mapping.morale,
    maxMorale: mapping.maxMorale,
    stress: mapping.stress,
    
    // Posição (será definida no grid)
    position: { x: 0, y: 0 },
    
    // Flags
    isCommander: asCommander,
    isActive: true,
    hasActed: false,
    
    // Referência ao personagem original
    characterId: (character as CharacterDraft & { id?: string }).id,
    
    // Stats de comando (se comandante)
    ...(asCommander && {
      command: mapping.command,
      strategy: mapping.strategy,
      influence: mapping.influence,
    }),
    
    // Metadados
    faction: character.factionId,
    theme,
  };

  // Gerar Combat Cards
  let cards: CombatCard[] = [];
  if (generateCards) {
    cards = generateCombatCards(character, unit.id, theme);
    
    if (cards.length === 0) {
      warnings.push('Nenhum Combat Card gerado - personagem sem perícias relevantes');
    }
  }

  // Validações e warnings
  if (mapping.hp < 5) {
    warnings.push('HP muito baixo - personagem frágil em combate');
  }
  if (asCommander && mapping.command < 3) {
    warnings.push('Comando baixo - pode ter dificuldade liderando');
  }

  return { unit, cards, warnings };
}

/**
 * Mapeia stats do personagem para stats táticos
 */
function mapCharacterStats(
  derived: ReturnType<typeof calculateDerivedStats>,
  regency: ReturnType<typeof calculateRegencyStats>,
  character: CharacterDraft,
  includeEquipment: boolean
): CharacterToUnitMapping {
  let defense = derived.guarda;
  let evasion = derived.evasao;

  // Bônus de equipamento (se armorId definido, adiciona bônus básico)
  if (includeEquipment && character.armorId) {
    // Bônus simples por ter armadura
    defense += 2;
  }

  return {
    // Combate físico
    hp: derived.vitalidade,
    maxHp: derived.vitalidade,
    defense,
    evasion,
    speed: derived.movimento,
    initiative: derived.reacao,

    // Combate social/stress
    morale: derived.vontade,
    maxMorale: derived.vontade,
    stress: derived.tensao,
    influence: derived.influencia,

    // Regência
    command: regency.comando,
    strategy: regency.estrategia,
    isCommander: regency.comando >= 4 || regency.estrategia >= 4,
  };
}

/**
 * Determina o tipo de unidade baseado no personagem
 */
function determineUnitType(
  character: CharacterDraft,
  asCommander: boolean
): TacticalUnitType {
  if (asCommander) return 'commander';

  const skills = character.skills || {};
  const attrs = character.attributes || {};

  // Análise de skills dominantes
  const combatSkills = (skills.luta || 0) + (skills.resistencia || 0) + (skills.laminas || 0);
  const rangedSkills = (skills.tiro || 0) + (skills.artilharia || 0);
  const mobilitySkills = (skills.atletismo || 0) + (skills.esquiva || 0);
  const supportSkills = (skills.medicina || 0) + (skills.persuasao || 0);

  // Análise de atributos
  const physical = (attrs.corpo || 0) + (attrs.reflexos || 0);
  const mental = (attrs.raciocinio || 0) + (attrs.intuicao || 0);

  // Determinar tipo
  if (supportSkills >= 4 || mental > physical + 2) {
    return 'support';
  }
  if (rangedSkills > combatSkills && rangedSkills >= 3) {
    return 'ranged';
  }
  if (mobilitySkills >= 4 && (attrs.reflexos || 0) >= 4) {
    return 'cavalry';
  }
  
  return 'infantry'; // Default
}

// ═══════════════════════════════════════════════════════════════
// GERAÇÃO DE COMBAT CARDS
// ═══════════════════════════════════════════════════════════════

/**
 * Gera Combat Cards baseados nas perícias do personagem
 */
export function generateCombatCards(
  character: CharacterDraft,
  unitId: string,
  theme: ThemeId
): CombatCard[] {
  const cards: CombatCard[] = [];
  const skills = character.skills || {};

  for (const [skillId, level] of Object.entries(skills)) {
    if (level <= 0) continue;

    const cardType = SKILL_TO_CARD_TYPE[skillId];
    if (!cardType) continue;

    const card = createCardFromSkill(skillId, level, unitId, theme);
    if (card) {
      cards.push(card);
    }
  }

  // Adicionar card básico se não houver nenhum
  if (cards.length === 0) {
    cards.push(createBasicAttackCard(unitId));
  }

  // Adicionar cards de virtude se ativa
  if (character.startingVirtue) {
    const virtueCard = createVirtueCard(character.startingVirtue, unitId, theme);
    if (virtueCard) {
      cards.push(virtueCard);
    }
  }

  return cards;
}

/**
 * Cria um Combat Card baseado em uma perícia
 */
function createCardFromSkill(
  skillId: string,
  level: number,
  unitId: string,
  theme: ThemeId
): CombatCard | null {
  const cardType = SKILL_TO_CARD_TYPE[skillId];
  if (!cardType) return null;
  
  const rarity = CARD_RARITY_BY_SKILL_LEVEL[level] || 'common';

  const baseCard: CombatCard = {
    id: uuidv4(),
    name: getCardName(skillId, level),
    type: cardType,
    rarity,
    unitId,
    cost: getCardCost(cardType, level),
    cooldown: getCardCooldown(rarity),
    currentCooldown: 0,
    description: getCardDescription(skillId, level),
    effects: [],
  };

  // Adicionar efeitos baseados no tipo
  switch (cardType) {
    case 'attack':
      baseCard.effects.push({
        type: 'damage',
        value: 2 + level,
        target: 'enemy',
      });
      if (level >= 4) {
        baseCard.effects.push({
          type: 'status',
          status: skillId === 'luta' || skillId === 'laminas' ? 'staggered' : 'suppressed',
          duration: 1,
          target: 'enemy',
        });
      }
      break;

    case 'defense':
      baseCard.effects.push({
        type: 'buff',
        stat: skillId === 'esquiva' ? 'evasion' : 'defense',
        value: 1 + Math.floor(level / 2),
        duration: 2,
        target: 'self',
      });
      break;

    case 'movement':
      baseCard.effects.push({
        type: 'movement',
        value: 1 + Math.floor(level / 2),
        target: 'self',
      });
      if (skillId === 'furtividade' && level >= 3) {
        baseCard.effects.push({
          type: 'status',
          status: 'hidden',
          duration: 1,
          target: 'self',
        });
      }
      break;

    case 'support':
      baseCard.effects.push({
        type: 'heal',
        value: 2 + level,
        target: 'ally',
      });
      break;

    case 'command':
      baseCard.effects.push({
        type: 'buff',
        stat: 'morale',
        value: level,
        duration: 2,
        target: 'allies',
      });
      break;

    case 'special':
      baseCard.effects.push({
        type: 'special',
        value: level,
        target: 'varies',
        specialEffect: skillId,
      });
      break;
  }

  return baseCard;
}

/**
 * Cria card de ataque básico
 */
function createBasicAttackCard(unitId: string): CombatCard {
  return {
    id: uuidv4(),
    name: 'Ataque Básico',
    type: 'attack',
    rarity: 'common',
    unitId,
    cost: 1,
    cooldown: 0,
    currentCooldown: 0,
    description: 'Um ataque corpo a corpo simples.',
    effects: [
      {
        type: 'damage',
        value: 2,
        target: 'enemy',
      },
    ],
  };
}

/**
 * Cria card baseado na virtude ativa
 */
function createVirtueCard(
  virtueId: string,
  unitId: string,
  theme: ThemeId
): CombatCard | null {
  const virtueCards: Record<string, Partial<CombatCard>> = {
    sabedoria: {
      name: 'Insight Sábio',
      type: 'special',
      description: 'Revela fraquezas do inimigo.',
      effects: [
        { type: 'debuff', stat: 'defense', value: 2, duration: 2, target: 'enemy' },
      ],
    },
    coragem: {
      name: 'Ímpeto Corajoso',
      type: 'attack',
      description: 'Ataque poderoso que ignora medo.',
      effects: [
        { type: 'damage', value: 4, target: 'enemy' },
        { type: 'cleanse', status: 'fear', target: 'self' },
      ],
    },
    perseveranca: {
      name: 'Resistência Inabalável',
      type: 'defense',
      description: 'Recupera HP e reduz dano.',
      effects: [
        { type: 'heal', value: 3, target: 'self' },
        { type: 'buff', stat: 'defense', value: 2, duration: 1, target: 'self' },
      ],
    },
    harmonia: {
      name: 'Aura Harmônica',
      type: 'support',
      description: 'Fortalece aliados próximos.',
      effects: [
        { type: 'buff', stat: 'morale', value: 2, duration: 2, target: 'allies' },
      ],
    },
  };

  const virtueData = virtueCards[virtueId];
  if (!virtueData) return null;

  return {
    id: uuidv4(),
    unitId,
    rarity: 'rare',
    cost: 3,
    cooldown: 3,
    currentCooldown: 0,
    effects: [],
    ...virtueData,
  } as CombatCard;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS DE NOMES E DESCRIÇÕES
// ═══════════════════════════════════════════════════════════════

function getCardName(skillId: string, level: number): string {
  const names: Record<string, Record<number, string>> = {
    luta: {
      1: 'Golpe Direto',
      2: 'Investida',
      3: 'Ataque Fulminante',
      4: 'Fúria de Combate',
      5: 'Execução Perfeita',
    },
    laminas: {
      1: 'Corte Rápido',
      2: 'Lâmina Afiada',
      3: 'Dança das Espadas',
      4: 'Corte Profundo',
      5: 'Golpe Fatal',
    },
    tiro: {
      1: 'Disparo Certeiro',
      2: 'Tiro Preciso',
      3: 'Rajada',
      4: 'Disparo Penetrante',
      5: 'Tiro Mortal',
    },
    artilharia: {
      1: 'Bombardeio Leve',
      2: 'Fogo de Supressão',
      3: 'Barragem',
      4: 'Bombardeio Pesado',
      5: 'Devastação',
    },
    esquiva: {
      1: 'Desvio',
      2: 'Evasão Rápida',
      3: 'Reflexo Defensivo',
      4: 'Dança das Sombras',
      5: 'Intocável',
    },
    resistencia: {
      1: 'Postura Defensiva',
      2: 'Bloqueio',
      3: 'Muralha de Ferro',
      4: 'Determinação',
      5: 'Imorredouro',
    },
    atletismo: {
      1: 'Corrida',
      2: 'Avanço Rápido',
      3: 'Salto Acrobático',
      4: 'Velocidade Sobre-humana',
      5: 'Relâmpago',
    },
    furtividade: {
      1: 'Esgueirar',
      2: 'Nas Sombras',
      3: 'Invisibilidade',
      4: 'Golpe Furtivo',
      5: 'Assassinato Silencioso',
    },
    medicina: {
      1: 'Primeiros Socorros',
      2: 'Tratamento',
      3: 'Cura Avançada',
      4: 'Regeneração',
      5: 'Milagre da Vida',
    },
    percepcao: {
      1: 'Observar',
      2: 'Análise Tática',
      3: 'Visão Aguçada',
      4: 'Previsão',
      5: 'Onisciência',
    },
    intimidacao_det: {
      1: 'Ameaça',
      2: 'Olhar Penetrante',
      3: 'Presença Opressora',
      4: 'Terror',
      5: 'Aura do Medo',
    },
    intimidacao_car: {
      1: 'Provocação',
      2: 'Desafio',
      3: 'Dominância',
      4: 'Subjugação',
      5: 'Submissão Total',
    },
    persuasao: {
      1: 'Negociação',
      2: 'Convencimento',
      3: 'Oratória',
      4: 'Manipulação',
      5: 'Domínio Mental',
    },
    lideranca: {
      1: 'Ordem Simples',
      2: 'Comando Tático',
      3: 'Inspiração',
      4: 'Liderança Suprema',
      5: 'Presença Comandante',
    },
  };

  return names[skillId]?.[level] || `Técnica Nível ${level}`;
}

function getCardDescription(skillId: string, level: number): string {
  const damage = 2 + level;
  const buff = 1 + Math.floor(level / 2);
  
  const descriptions: Record<string, string> = {
    luta: `Causa ${damage} de dano corpo a corpo.`,
    laminas: `Causa ${damage} de dano com arma cortante.`,
    tiro: `Causa ${damage} de dano à distância.`,
    artilharia: `Causa ${damage} de dano em área.`,
    esquiva: `Aumenta Evasão em +${buff} por 2 turnos.`,
    resistencia: `Aumenta Defesa em +${buff} por 2 turnos.`,
    atletismo: `Move +${buff} hexes adicionais.`,
    furtividade: `Move silenciosamente. ${level >= 3 ? 'Fica oculto.' : ''}`,
    medicina: `Cura ${damage} HP de um aliado.`,
    percepcao: `Revela informações táticas do inimigo.`,
    intimidacao_det: `Reduz moral do inimigo.`,
    intimidacao_car: `Reduz moral do inimigo com presença intimidadora.`,
    persuasao: `Aumenta moral dos aliados.`,
    lideranca: `Aumenta moral de aliados próximos em +${level} por 2 turnos.`,
  };

  return descriptions[skillId] || 'Efeito especial.';
}

function getCardCost(type: TacticalCardType, level: number): number {
  const baseCosts: Record<TacticalCardType, number> = {
    attack: 2,
    defense: 1,
    movement: 1,
    support: 2,
    special: 3,
    command: 2,
  };

  return baseCosts[type] + Math.floor(level / 3);
}

function getCardCooldown(rarity: CardRarity): number {
  const cooldowns: Record<CardRarity, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    epic: 3,
  };
  return cooldowns[rarity] || 0;
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES DE UTILIDADE
// ═══════════════════════════════════════════════════════════════

/**
 * Converte múltiplos personagens para um time tático
 */
export function convertTeamToTactical(
  characters: (CharacterDraft & { id?: string })[],
  commanderId?: string,
  teamId: 'player' | 'enemy' = 'player'
): {
  units: TacticalUnit[];
  cards: CombatCard[];
  commander?: TacticalUnit;
  warnings: string[];
} {
  const allUnits: TacticalUnit[] = [];
  const allCards: CombatCard[] = [];
  const allWarnings: string[] = [];
  let commander: TacticalUnit | undefined;

  for (const character of characters) {
    const isCommander = character.id === commanderId;
    const result = convertCharacterToUnit(character, {
      asCommander: isCommander,
      generateCards: true,
      includeEquipment: true,
      teamId,
    });

    allUnits.push(result.unit);
    allCards.push(...result.cards);
    allWarnings.push(...result.warnings.map(w => `${character.name}: ${w}`));

    if (isCommander) {
      commander = result.unit;
    }
  }

  return {
    units: allUnits,
    cards: allCards,
    commander,
    warnings: allWarnings,
  };
}

/**
 * Valida se um personagem pode ser usado em batalha
 */
export function validateCharacterForBattle(
  character: CharacterDraft
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!character.name) {
    errors.push('Personagem precisa ter um nome');
  }

  if (!character.attributes || Object.keys(character.attributes).length < 8) {
    errors.push('Atributos incompletos');
  }

  const fullAttributes = {
    conhecimento: character.attributes?.conhecimento ?? 1,
    raciocinio: character.attributes?.raciocinio ?? 1,
    corpo: character.attributes?.corpo ?? 1,
    reflexos: character.attributes?.reflexos ?? 1,
    determinacao: character.attributes?.determinacao ?? 1,
    coordenacao: character.attributes?.coordenacao ?? 1,
    carisma: character.attributes?.carisma ?? 1,
    intuicao: character.attributes?.intuicao ?? 1,
  };

  const derived = calculateDerivedStats(
    fullAttributes,
    character.skills || {}
  );

  if (derived.vitalidade < 1) {
    errors.push('Vitalidade muito baixa para combate');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
