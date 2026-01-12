import { describe, it, expect } from 'vitest';
import {
  VIRTUES,
  getVirtueById,
  getVirtueByAttribute,
  getStartingVirtue,
} from '@/data/character/virtues';
import { getFactionVirtue } from '@/data/character/factions';

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

  describe('getFactionVirtue (from factions.ts)', () => {
    it('should return correct virtues for akashic factions with defined virtues', () => {
      expect(getFactionVirtue('hegemonia')).toBe('coragem');
      expect(getFactionVirtue('pacto')).toBe('perseveranca');
      expect(getFactionVirtue('brunianos')).toBe('sabedoria');
      expect(getFactionVirtue('federacao')).toBe('harmonia');
    });

    it('should return choice for alianca and independentes (free choice)', () => {
      expect(getFactionVirtue('alianca')).toBe('choice');
      expect(getFactionVirtue('independentes')).toBe('choice');
    });

    it('should return undefined for factions without virtue bonus', () => {
      expect(getFactionVirtue('concordia')).toBeUndefined();
    });

    it('should return correct virtues for tenebralux factions', () => {
      expect(getFactionVirtue('anuire')).toBe('coragem');
      expect(getFactionVirtue('khinasi')).toBe('sabedoria');
      expect(getFactionVirtue('rjurik')).toBe('harmonia');
      expect(getFactionVirtue('vos')).toBe('perseveranca');
    });

    it('should return choice for brecht (free choice)', () => {
      expect(getFactionVirtue('brecht')).toBe('choice');
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
    it('should return virtue for faction with defined virtue', () => {
      expect(getStartingVirtue('hegemonia')).toBe('coragem');
      expect(getStartingVirtue('brunianos')).toBe('sabedoria');
      expect(getStartingVirtue('pacto')).toBe('perseveranca');
    });

    it('should return choice for faction with free choice', () => {
      expect(getStartingVirtue('alianca')).toBe('choice');
      expect(getStartingVirtue('brecht')).toBe('choice');
      expect(getStartingVirtue('independentes')).toBe('choice');
    });

    it('should return choice for faction without virtue (attribute bonuses only)', () => {
      expect(getStartingVirtue('concordia')).toBe('choice');
    });

    it('should return choice for undefined faction', () => {
      expect(getStartingVirtue(undefined)).toBe('choice');
    });

    it('should return choice for invalid faction', () => {
      expect(getStartingVirtue('invalid')).toBe('choice');
    });
  });

  describe('Virtue levels structure', () => {
    it('should have level 0 as "Não Desperto"', () => {
      VIRTUES.forEach(virtue => {
        expect(virtue.levels[0].name).toBe('Não Desperto');
        expect(virtue.levels[0].level).toBe(0);
      });
    });

    it('should have powers array with exactly 2 options for all levels', () => {
      VIRTUES.forEach(virtue => {
        virtue.levels.forEach(level => {
          expect(level).toHaveProperty('powers');
          expect(Array.isArray(level.powers)).toBe(true);
          expect(level.powers).toHaveLength(2);
        });
      });
    });

    it('should have valid power structure', () => {
      VIRTUES.forEach(virtue => {
        virtue.levels.forEach(level => {
          level.powers.forEach(power => {
            expect(power).toHaveProperty('id');
            expect(power).toHaveProperty('name');
            expect(power).toHaveProperty('description');
            expect(typeof power.id).toBe('string');
            expect(typeof power.name).toBe('string');
            expect(typeof power.description).toBe('string');
          });
        });
      });
    });

    it('should have meaningful powers for levels 1-3', () => {
      VIRTUES.forEach(virtue => {
        virtue.levels.slice(1).forEach(level => {
          level.powers.forEach(power => {
            expect(power.name).not.toBe('-');
            expect(power.description.length).toBeGreaterThan(20);
          });
        });
      });
    });
  });
});
