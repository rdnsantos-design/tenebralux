import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  convertCharacterToUnit,
  generateCombatCards,
  convertTeamToTactical,
  validateCharacterForBattle,
} from '@/services/tactical/characterConverter';
import { CharacterDraft } from '@/types/character-builder';

// Mock do uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

// ═══════════════════════════════════════════════════════════════
// DADOS DE TESTE
// ═══════════════════════════════════════════════════════════════

// Personagem de teste completo
const mockCharacter: CharacterDraft = {
  name: 'Guerreiro Teste',
  theme: 'akashic',
  factionId: 'hegemonia',
  attributes: {
    conhecimento: 2,
    raciocinio: 3,
    corpo: 4,
    reflexos: 4,
    determinacao: 3,
    coordenacao: 3,
    carisma: 2,
    intuicao: 3,
  },
  skills: {
    luta: 3,
    resistencia: 2,
    esquiva: 2,
    atletismo: 1,
  },
  virtues: {
    coragem: 1,
  },
  startingVirtue: 'coragem',
  privilegeIds: [],
  weaponId: 'sword',
  armorId: 'chainmail',
};

// Personagem mínimo
const minimalCharacter: CharacterDraft = {
  name: 'Mínimo',
  theme: 'akashic',
  factionId: 'alianca',
  attributes: {
    conhecimento: 1, raciocinio: 1, corpo: 1, reflexos: 1,
    determinacao: 1, coordenacao: 1, carisma: 1, intuicao: 1,
  },
  skills: {},
  virtues: {},
};

// Personagem focado em suporte
const supportCharacter: CharacterDraft = {
  name: 'Curandeiro',
  theme: 'akashic',
  factionId: 'hegemonia',
  attributes: {
    conhecimento: 4, raciocinio: 4, corpo: 2, reflexos: 2,
    determinacao: 3, coordenacao: 2, carisma: 3, intuicao: 4,
  },
  skills: {
    medicina: 4,
    persuasao: 3,
    percepcao: 2,
  },
  virtues: {},
};

// Personagem focado em distância
const rangedCharacter: CharacterDraft = {
  name: 'Atirador',
  theme: 'akashic',
  factionId: 'hegemonia',
  attributes: {
    conhecimento: 2,
    raciocinio: 3,
    corpo: 4,
    reflexos: 4,
    determinacao: 3,
    coordenacao: 3,
    carisma: 2,
    intuicao: 3,
  },
  skills: {
    tiro: 4,
    percepcao: 3,
    furtividade: 2,
  },
  virtues: {},
};

// Personagem focado em cavalaria
const cavalryCharacter: CharacterDraft = {
  name: 'Cavaleiro',
  theme: 'akashic',
  factionId: 'hegemonia',
  attributes: {
    conhecimento: 2,
    raciocinio: 3,
    corpo: 4,
    reflexos: 5,
    determinacao: 3,
    coordenacao: 3,
    carisma: 2,
    intuicao: 3,
  },
  skills: {
    atletismo: 3,
    esquiva: 3,
  },
  virtues: {},
};

// ═══════════════════════════════════════════════════════════════
// TESTES
// ═══════════════════════════════════════════════════════════════

describe('characterConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertCharacterToUnit', () => {
    it('deve converter personagem para unidade tática', () => {
      const result = convertCharacterToUnit(mockCharacter);

      expect(result.unit).toBeDefined();
      expect(result.unit.name).toBe('Guerreiro Teste');
      expect(result.unit.teamId).toBe('player');
    });

    it('deve calcular HP baseado em Vitalidade', () => {
      const result = convertCharacterToUnit(mockCharacter);
      
      expect(result.unit.hp).toBeGreaterThan(0);
      expect(result.unit.maxHp).toBe(result.unit.hp);
    });

    it('deve criar como comandante quando solicitado', () => {
      const result = convertCharacterToUnit(mockCharacter, { asCommander: true });

      expect(result.unit.isCommander).toBe(true);
      expect(result.unit.type).toBe('commander');
      expect(result.unit.command).toBeDefined();
      expect(result.unit.strategy).toBeDefined();
    });

    it('deve definir teamId corretamente', () => {
      const playerResult = convertCharacterToUnit(mockCharacter, { teamId: 'player' });
      const enemyResult = convertCharacterToUnit(mockCharacter, { teamId: 'enemy' });

      expect(playerResult.unit.teamId).toBe('player');
      expect(enemyResult.unit.teamId).toBe('enemy');
    });

    it('deve gerar Combat Cards quando solicitado', () => {
      const result = convertCharacterToUnit(mockCharacter, { generateCards: true });

      expect(result.cards.length).toBeGreaterThan(0);
    });

    it('deve não gerar cards quando não solicitado', () => {
      const result = convertCharacterToUnit(mockCharacter, { generateCards: false });

      expect(result.cards).toHaveLength(0);
    });

    it('deve adicionar warnings para HP baixo', () => {
      const weakChar: CharacterDraft = {
        ...minimalCharacter,
        attributes: {
          conhecimento: 1, raciocinio: 1, corpo: 1, reflexos: 1,
          determinacao: 1, coordenacao: 1, carisma: 1, intuicao: 1,
        },
      };

      const result = convertCharacterToUnit(weakChar);

      expect(result.warnings.some(w => w.toLowerCase().includes('hp'))).toBe(true);
    });

    it('deve manter referência ao tema e facção', () => {
      const result = convertCharacterToUnit(mockCharacter);

      expect(result.unit.faction).toBe(mockCharacter.factionId);
      expect(result.unit.theme).toBe(mockCharacter.theme);
    });

    it('deve inicializar unidade com flags corretas', () => {
      const result = convertCharacterToUnit(mockCharacter);

      expect(result.unit.isActive).toBe(true);
      expect(result.unit.hasActed).toBe(false);
      expect(result.unit.position).toEqual({ x: 0, y: 0 });
    });

    it('deve calcular stats sociais corretamente', () => {
      const result = convertCharacterToUnit(mockCharacter);

      expect(result.unit.morale).toBeGreaterThan(0);
      expect(result.unit.maxMorale).toBe(result.unit.morale);
      expect(result.unit.stress).toBeDefined();
    });

    it('deve usar defaults quando atributos ausentes', () => {
      const charWithoutAttrs: CharacterDraft = {
        name: 'Sem Atributos',
        theme: 'akashic',
        factionId: 'teste',
        attributes: undefined as any,
        skills: {},
        virtues: {},
      };

      const result = convertCharacterToUnit(charWithoutAttrs);

      // Não deve quebrar
      expect(result.unit.hp).toBeGreaterThan(0);
    });
  });

  describe('Unit Type Detection', () => {
    it('deve classificar como infantry para combate corpo a corpo', () => {
      const result = convertCharacterToUnit(mockCharacter);
      expect(result.unit.type).toBe('infantry');
    });

    it('deve classificar como ranged para atiradores', () => {
      const result = convertCharacterToUnit(rangedCharacter);
      expect(result.unit.type).toBe('ranged');
    });

    it('deve classificar como support para curandeiros', () => {
      const result = convertCharacterToUnit(supportCharacter);
      expect(result.unit.type).toBe('support');
    });

    it('deve classificar como commander quando asCommander é true', () => {
      const result = convertCharacterToUnit(mockCharacter, { asCommander: true });
      expect(result.unit.type).toBe('commander');
    });

    it('deve classificar como cavalry para personagens ágeis', () => {
      const result = convertCharacterToUnit(cavalryCharacter);
      expect(result.unit.type).toBe('cavalry');
    });

    it('deve defaultar para infantry quando nenhum padrão corresponde', () => {
      const genericChar: CharacterDraft = {
        ...minimalCharacter,
        skills: { percepcao: 1 },
      };
      const result = convertCharacterToUnit(genericChar);
      expect(result.unit.type).toBe('infantry');
    });
  });

  describe('generateCombatCards', () => {
    it('deve gerar cards para cada skill relevante', () => {
      const cards = generateCombatCards(mockCharacter, 'unit-1', 'akashic');

      // mockCharacter tem luta:3, resistencia:2, esquiva:2, atletismo:1
      expect(cards.length).toBeGreaterThanOrEqual(4);
    });

    it('deve gerar card básico se não houver skills', () => {
      const noSkillsChar: CharacterDraft = {
        ...minimalCharacter,
        skills: {},
      };

      const cards = generateCombatCards(noSkillsChar, 'unit-1', 'akashic');

      expect(cards.length).toBeGreaterThanOrEqual(1);
      expect(cards.some(c => c.name.toLowerCase().includes('básico'))).toBe(true);
    });

    it('deve gerar card de virtude se ativa', () => {
      const cards = generateCombatCards(mockCharacter, 'unit-1', 'akashic');

      // mockCharacter tem startingVirtue: 'coragem'
      expect(cards.some(c => 
        c.name.toLowerCase().includes('coraj') || 
        c.rarity === 'rare'
      )).toBe(true);
    });

    it('deve atribuir raridade baseada no nível da skill', () => {
      const highSkillChar: CharacterDraft = {
        ...mockCharacter,
        skills: { luta: 4 }, // Nível 4 = rare
      };

      const cards = generateCombatCards(highSkillChar, 'unit-1', 'akashic');
      const lutaCard = cards.find(c => c.type === 'attack' && c.rarity === 'rare');
      
      expect(lutaCard).toBeDefined();
    });

    it('deve definir custo e cooldown corretos', () => {
      const cards = generateCombatCards(mockCharacter, 'unit-1', 'akashic');

      cards.forEach(card => {
        expect(card.cost).toBeGreaterThanOrEqual(1);
        expect(card.cooldown).toBeGreaterThanOrEqual(0);
        expect(card.currentCooldown).toBe(0);
      });
    });

    it('deve gerar cards de ataque com efeito de dano', () => {
      const cards = generateCombatCards(mockCharacter, 'unit-1', 'akashic');
      const attackCards = cards.filter(c => c.type === 'attack');

      attackCards.forEach(card => {
        expect(card.effects.some(e => e.type === 'damage')).toBe(true);
      });
    });

    it('deve gerar cards de defesa com buff', () => {
      const cards = generateCombatCards(mockCharacter, 'unit-1', 'akashic');
      const defenseCards = cards.filter(c => c.type === 'defense');

      defenseCards.forEach(card => {
        expect(card.effects.some(e => e.type === 'buff')).toBe(true);
      });
    });

    it('deve associar unitId corretamente', () => {
      const cards = generateCombatCards(mockCharacter, 'test-unit-id', 'akashic');

      cards.forEach(card => {
        expect(card.unitId).toBe('test-unit-id');
      });
    });

    it('deve gerar cards de suporte com heal', () => {
      const cards = generateCombatCards(supportCharacter, 'unit-1', 'akashic');
      const supportCards = cards.filter(c => c.type === 'support');

      expect(supportCards.length).toBeGreaterThan(0);
      supportCards.forEach(card => {
        expect(card.effects.some(e => e.type === 'heal')).toBe(true);
      });
    });

    it('deve gerar cards de movimento', () => {
      const cards = generateCombatCards(mockCharacter, 'unit-1', 'akashic');
      const movementCards = cards.filter(c => c.type === 'movement');

      if (movementCards.length > 0) {
        movementCards.forEach(card => {
          expect(card.effects.some(e => e.type === 'movement')).toBe(true);
        });
      }
    });
  });

  describe('convertTeamToTactical', () => {
    const team: (CharacterDraft & { id: string })[] = [
      { ...mockCharacter, id: 'char-1', name: 'Guerreiro' },
      { ...supportCharacter, id: 'char-2', name: 'Curandeiro' },
      { ...rangedCharacter, id: 'char-3', name: 'Atirador' },
    ];

    it('deve converter múltiplos personagens', () => {
      const result = convertTeamToTactical(team);

      expect(result.units).toHaveLength(3);
      expect(result.cards.length).toBeGreaterThan(3);
    });

    it('deve definir comandante corretamente', () => {
      const result = convertTeamToTactical(team, 'char-1');

      expect(result.commander).toBeDefined();
      expect(result.commander?.name).toBe('Guerreiro');
      expect(result.commander?.isCommander).toBe(true);
    });

    it('deve agregar warnings de todos os personagens', () => {
      const weakTeam: (CharacterDraft & { id: string })[] = [
        { ...minimalCharacter, id: 'weak-1', name: 'Fraco 1' },
        { ...minimalCharacter, id: 'weak-2', name: 'Fraco 2' },
      ];

      const result = convertTeamToTactical(weakTeam);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('deve atribuir teamId a todas as unidades', () => {
      const result = convertTeamToTactical(team, undefined, 'enemy');

      result.units.forEach(unit => {
        expect(unit.teamId).toBe('enemy');
      });
    });

    it('deve retornar todas as cards de todos personagens', () => {
      const result = convertTeamToTactical(team);

      expect(result.cards.length).toBeGreaterThan(result.units.length);
    });

    it('deve retornar undefined para commander se não especificado', () => {
      const result = convertTeamToTactical(team);

      expect(result.commander).toBeUndefined();
    });
  });

  describe('validateCharacterForBattle', () => {
    it('deve validar personagem completo como válido', () => {
      const result = validateCharacterForBattle(mockCharacter);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve invalidar personagem sem nome', () => {
      const noNameChar = { ...mockCharacter, name: '' };
      const result = validateCharacterForBattle(noNameChar);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.toLowerCase().includes('nome'))).toBe(true);
    });

    it('deve invalidar personagem com atributos incompletos', () => {
      const incompleteChar: CharacterDraft = {
        ...mockCharacter,
        attributes: { corpo: 3 } as any,
      };
      const result = validateCharacterForBattle(incompleteChar);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.toLowerCase().includes('atributo'))).toBe(true);
    });

    it('deve invalidar personagem sem atributos', () => {
      const noAttrsChar: CharacterDraft = {
        ...mockCharacter,
        attributes: undefined as any,
      };
      const result = validateCharacterForBattle(noAttrsChar);

      expect(result.valid).toBe(false);
    });

    it('deve retornar múltiplos erros quando aplicável', () => {
      const badChar: CharacterDraft = {
        name: '',
        theme: 'akashic',
        factionId: '',
        attributes: {} as any,
        skills: {},
        virtues: {},
      };
      const result = validateCharacterForBattle(badChar);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('deve validar personagem mínimo válido', () => {
      const result = validateCharacterForBattle(minimalCharacter);

      expect(result.valid).toBe(true);
    });
  });
});

describe('Card Effects', () => {
  it('deve ter efeitos de dano corretos para cards de ataque', () => {
    const cards = generateCombatCards(mockCharacter, 'unit-1', 'akashic');
    const attackCard = cards.find(c => c.type === 'attack');

    expect(attackCard).toBeDefined();
    
    const damageEffect = attackCard?.effects.find(e => e.type === 'damage');
    expect(damageEffect).toBeDefined();
    expect(damageEffect?.value).toBeGreaterThan(0);
    expect(damageEffect?.target).toBe('enemy');
  });

  it('deve ter efeitos de buff corretos para cards de defesa', () => {
    const cards = generateCombatCards(mockCharacter, 'unit-1', 'akashic');
    const defenseCard = cards.find(c => c.type === 'defense');

    expect(defenseCard).toBeDefined();
    
    const buffEffect = defenseCard?.effects.find(e => e.type === 'buff');
    expect(buffEffect).toBeDefined();
    expect(buffEffect?.duration).toBeGreaterThan(0);
    expect(buffEffect?.target).toBe('self');
  });

  it('deve ter efeitos de movimento para cards de movimento', () => {
    const cards = generateCombatCards(mockCharacter, 'unit-1', 'akashic');
    const movementCard = cards.find(c => c.type === 'movement');

    if (movementCard) {
      const moveEffect = movementCard.effects.find(e => e.type === 'movement');
      expect(moveEffect).toBeDefined();
      expect(moveEffect?.value).toBeGreaterThan(0);
    }
  });

  it('deve ter efeitos de cura para cards de suporte', () => {
    const cards = generateCombatCards(supportCharacter, 'unit-1', 'akashic');
    const supportCard = cards.find(c => c.type === 'support');

    expect(supportCard).toBeDefined();
    
    const healEffect = supportCard?.effects.find(e => e.type === 'heal');
    expect(healEffect).toBeDefined();
    expect(healEffect?.value).toBeGreaterThan(0);
  });
});

describe('Theme Support', () => {
  it('deve funcionar com tema Akashic', () => {
    const akashicChar = { ...mockCharacter, theme: 'akashic' as const };
    const result = convertCharacterToUnit(akashicChar);

    expect(result.unit.theme).toBe('akashic');
  });

  it('deve funcionar com tema Tenebra', () => {
    const tenbraChar = { ...mockCharacter, theme: 'tenebralux' as const };
    const result = convertCharacterToUnit(tenbraChar);

    expect(result.unit.theme).toBe('tenebralux');
  });

  it('deve gerar cards apropriados para cada tema', () => {
    const akashicCards = generateCombatCards(
      { ...mockCharacter, theme: 'akashic' }, 
      'unit-1', 
      'akashic'
    );
    const tenbraCards = generateCombatCards(
      { ...mockCharacter, theme: 'tenebralux' }, 
      'unit-1', 
      'tenebralux'
    );

    expect(akashicCards.length).toBeGreaterThan(0);
    expect(tenbraCards.length).toBeGreaterThan(0);
  });

  it('deve usar tema default quando não especificado', () => {
    const noThemeChar: CharacterDraft = {
      ...mockCharacter,
      theme: undefined as any,
    };
    const result = convertCharacterToUnit(noThemeChar);

    expect(result.unit.theme).toBe('akashic');
  });
});

describe('Equipment Processing', () => {
  it('deve funcionar com ou sem equipamento', () => {
    const base = convertCharacterToUnit(mockCharacter, { includeEquipment: false });
    const withEquip = convertCharacterToUnit(mockCharacter, { includeEquipment: true });
    
    // Ambos devem funcionar sem erro
    expect(base.unit.defense).toBeGreaterThan(0);
    expect(withEquip.unit.defense).toBeGreaterThan(0);
  });

  it('deve funcionar sem weaponId ou armorId', () => {
    const noEquipChar: CharacterDraft = {
      ...mockCharacter,
      weaponId: undefined,
      armorId: undefined,
    };
    const result = convertCharacterToUnit(noEquipChar, { includeEquipment: true });
    
    expect(result.unit.defense).toBeGreaterThan(0);
  });
});
