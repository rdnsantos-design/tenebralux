import { describe, it, expect } from 'vitest';
import {
  VIRTUES,
  FACTION_STARTING_VIRTUES,
  getVirtueById,
  getVirtueByAttribute,
  getStartingVirtue,
} from '@/data/character/virtues';

describe('Data - Virtues', () => {
  describe('VIRTUES constant', () => {
    it('should have exactly 4 virtues', () => {
      expect(VIRTUES).toHaveLength(4);
    });

    it('should have correct virtue IDs', () => {
      const ids = VIRTUES.map(v => v.id);
      expect(ids).toContain('sabedoria');
      expect(ids).toContain('coragem');
      expect(ids).toContain('perseveranca');
      expect(ids).toContain('harmonia');
    });

    it('should have unique IDs', () => {
      const ids = VIRTUES.map(v => v.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid structure for all virtues', () => {
      VIRTUES.forEach(virtue => {
        expect(virtue).toHaveProperty('id');
        expect(virtue).toHaveProperty('name');
        expect(virtue).toHaveProperty('latin');
        expect(virtue).toHaveProperty('color');
        expect(virtue).toHaveProperty('icon');
        expect(virtue).toHaveProperty('attributes');
        expect(virtue).toHaveProperty('description');
        expect(virtue).toHaveProperty('levels');
      });
    });

    it('should have exactly 4 levels per virtue (0-3)', () => {
      VIRTUES.forEach(virtue => {
        expect(virtue.levels).toHaveLength(4);
        virtue.levels.forEach((level, index) => {
          expect(level.level).toBe(index);
        });
      });
    });

    it('should have 2 attributes per virtue', () => {
      VIRTUES.forEach(virtue => {
        expect(virtue.attributes).toHaveLength(2);
      });
    });

    it('should have correct attribute mappings', () => {
      const sabedoria = getVirtueById('sabedoria');
      expect(sabedoria?.attributes).toContain('conhecimento');
      expect(sabedoria?.attributes).toContain('raciocinio');

      const coragem = getVirtueById('coragem');
      expect(coragem?.attributes).toContain('corpo');
      expect(coragem?.attributes).toContain('reflexos');

      const perseveranca = getVirtueById('perseveranca');
      expect(perseveranca?.attributes).toContain('determinacao');
      expect(perseveranca?.attributes).toContain('coordenacao');

      const harmonia = getVirtueById('harmonia');
      expect(harmonia?.attributes).toContain('carisma');
      expect(harmonia?.attributes).toContain('intuicao');
    });

    it('should have latin names', () => {
      expect(getVirtueById('sabedoria')?.latin).toBe('Gnosis');
      expect(getVirtueById('coragem')?.latin).toBe('Virtus');
      expect(getVirtueById('perseveranca')?.latin).toBe('Constantia');
      expect(getVirtueById('harmonia')?.latin).toBe('Ágape');
    });
  });

  describe('FACTION_STARTING_VIRTUES', () => {
    it('should have mappings for akashic factions', () => {
      expect(FACTION_STARTING_VIRTUES.confederacao).toBe('harmonia');
      expect(FACTION_STARTING_VIRTUES.corporacoes).toBe('perseveranca');
      expect(FACTION_STARTING_VIRTUES.tecnocracia).toBe('sabedoria');
      expect(FACTION_STARTING_VIRTUES.fronteira).toBe('coragem');
      expect(FACTION_STARTING_VIRTUES.sindicato).toBe('perseveranca');
    });

    it('should have mappings for tenebralux factions', () => {
      expect(FACTION_STARTING_VIRTUES.anuire).toBe('coragem');
      expect(FACTION_STARTING_VIRTUES.khinasi).toBe('sabedoria');
      expect(FACTION_STARTING_VIRTUES.rjurik).toBe('coragem');
      expect(FACTION_STARTING_VIRTUES.brecht).toBe('perseveranca');
      expect(FACTION_STARTING_VIRTUES.vos).toBe('coragem');
    });

    it('should have choice for none', () => {
      expect(FACTION_STARTING_VIRTUES.none).toBe('choice');
    });
  });

  describe('getVirtueById', () => {
    it('should return virtue for valid ID', () => {
      const result = getVirtueById('sabedoria');
      expect(result).toBeDefined();
      expect(result?.id).toBe('sabedoria');
      expect(result?.name).toBe('Sabedoria');
    });

    it('should return undefined for invalid ID', () => {
      const result = getVirtueById('invalid');
      expect(result).toBeUndefined();
    });

    it('should find all virtues by ID', () => {
      ['sabedoria', 'coragem', 'perseveranca', 'harmonia'].forEach(id => {
        const result = getVirtueById(id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(id);
      });
    });
  });

  describe('getVirtueByAttribute', () => {
    it('should return sabedoria for conhecimento', () => {
      const result = getVirtueByAttribute('conhecimento');
      expect(result?.id).toBe('sabedoria');
    });

    it('should return sabedoria for raciocinio', () => {
      const result = getVirtueByAttribute('raciocinio');
      expect(result?.id).toBe('sabedoria');
    });

    it('should return coragem for corpo', () => {
      const result = getVirtueByAttribute('corpo');
      expect(result?.id).toBe('coragem');
    });

    it('should return coragem for reflexos', () => {
      const result = getVirtueByAttribute('reflexos');
      expect(result?.id).toBe('coragem');
    });

    it('should return perseveranca for determinacao', () => {
      const result = getVirtueByAttribute('determinacao');
      expect(result?.id).toBe('perseveranca');
    });

    it('should return perseveranca for coordenacao', () => {
      const result = getVirtueByAttribute('coordenacao');
      expect(result?.id).toBe('perseveranca');
    });

    it('should return harmonia for carisma', () => {
      const result = getVirtueByAttribute('carisma');
      expect(result?.id).toBe('harmonia');
    });

    it('should return harmonia for intuicao', () => {
      const result = getVirtueByAttribute('intuicao');
      expect(result?.id).toBe('harmonia');
    });

    it('should return undefined for invalid attribute', () => {
      const result = getVirtueByAttribute('invalid');
      expect(result).toBeUndefined();
    });
  });

  describe('getStartingVirtue', () => {
    it('should return virtue for valid faction', () => {
      expect(getStartingVirtue('anuire')).toBe('coragem');
      expect(getStartingVirtue('khinasi')).toBe('sabedoria');
      expect(getStartingVirtue('tecnocracia')).toBe('sabedoria');
    });

    it('should return choice for undefined faction', () => {
      expect(getStartingVirtue(undefined)).toBe('choice');
    });

    it('should return choice for invalid faction', () => {
      expect(getStartingVirtue('invalid')).toBe('choice');
    });

    it('should return choice for none faction', () => {
      expect(getStartingVirtue('none')).toBe('choice');
    });
  });

  describe('Virtue levels structure', () => {
    it('should have level 0 as "Não Desperto"', () => {
      VIRTUES.forEach(virtue => {
        expect(virtue.levels[0].name).toBe('Não Desperto');
        expect(virtue.levels[0].level).toBe(0);
      });
    });

    it('should have benefits array for all levels', () => {
      VIRTUES.forEach(virtue => {
        virtue.levels.forEach(level => {
          expect(level).toHaveProperty('benefits');
          expect(Array.isArray(level.benefits)).toBe(true);
        });
      });
    });

    it('should have empty benefits for level 0', () => {
      VIRTUES.forEach(virtue => {
        expect(virtue.levels[0].benefits).toEqual([]);
      });
    });

    it('should have benefits for levels 1-3', () => {
      VIRTUES.forEach(virtue => {
        virtue.levels.slice(1).forEach(level => {
          expect(level.benefits?.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
