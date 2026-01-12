import { describe, it, expect } from 'vitest';
import {
  AKASHIC_FACTIONS,
  TENEBRA_FACTIONS,
  getFactionsByTheme,
  getFactionById,
  getFactionVirtue,
  getFactionAttributeBonuses,
  getFactionFreeSkillPoints,
} from '@/data/character/factions';

describe('Data - Factions', () => {
  describe('AKASHIC_FACTIONS constant', () => {
    it('should have at least 5 factions', () => {
      expect(AKASHIC_FACTIONS.length).toBeGreaterThanOrEqual(5);
    });

    it('should have unique IDs', () => {
      const ids = AKASHIC_FACTIONS.map(f => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid structure', () => {
      AKASHIC_FACTIONS.forEach(faction => {
        expect(faction).toHaveProperty('id');
        expect(faction).toHaveProperty('name');
        expect(faction).toHaveProperty('theme');
        expect(faction).toHaveProperty('color');
        expect(faction).toHaveProperty('icon');
        expect(faction.theme).toBe('akashic');
      });
    });
  });

  describe('TENEBRA_FACTIONS constant', () => {
    it('should have at least 5 factions', () => {
      expect(TENEBRA_FACTIONS.length).toBeGreaterThanOrEqual(5);
    });

    it('should have unique IDs', () => {
      const ids = TENEBRA_FACTIONS.map(f => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid structure', () => {
      TENEBRA_FACTIONS.forEach(faction => {
        expect(faction).toHaveProperty('id');
        expect(faction).toHaveProperty('name');
        expect(faction).toHaveProperty('theme');
        expect(faction).toHaveProperty('color');
        expect(faction).toHaveProperty('icon');
        expect(faction.theme).toBe('tenebralux');
      });
    });
  });

  describe('getFactionsByTheme', () => {
    it('should return akashic factions for akashic theme', () => {
      const result = getFactionsByTheme('akashic');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(f => f.theme === 'akashic')).toBe(true);
    });

    it('should return tenebralux factions for tenebralux theme', () => {
      const result = getFactionsByTheme('tenebralux');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(f => f.theme === 'tenebralux')).toBe(true);
    });
  });

  describe('getFactionById', () => {
    it('should find akashic faction', () => {
      const firstFaction = AKASHIC_FACTIONS[0];
      const result = getFactionById(firstFaction.id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(firstFaction.id);
    });

    it('should find tenebralux faction', () => {
      const firstFaction = TENEBRA_FACTIONS[0];
      const result = getFactionById(firstFaction.id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(firstFaction.id);
    });

    it('should return undefined for invalid ID', () => {
      const result = getFactionById('invalid-faction');
      expect(result).toBeUndefined();
    });
  });

  describe('getFactionVirtue', () => {
    it('should return virtue for faction with virtue', () => {
      const hegemonia = AKASHIC_FACTIONS.find(f => f.id === 'hegemonia');
      if (hegemonia?.virtue) {
        const result = getFactionVirtue('hegemonia');
        expect(result).toBe('coragem');
      }
    });

    it('should return choice for faction with free choice', () => {
      const alianca = AKASHIC_FACTIONS.find(f => f.id === 'alianca');
      if (alianca?.virtue === 'choice') {
        const result = getFactionVirtue('alianca');
        expect(result).toBe('choice');
      }
    });

    it('should return undefined for invalid faction', () => {
      const result = getFactionVirtue('invalid');
      expect(result).toBeUndefined();
    });
  });

  describe('getFactionAttributeBonuses', () => {
    it('should return attribute bonuses for faction with bonuses', () => {
      const concordia = AKASHIC_FACTIONS.find(f => f.id === 'concordia');
      if (concordia?.attributeBonuses) {
        const result = getFactionAttributeBonuses('concordia');
        expect(result).toContain('raciocinio');
        expect(result).toContain('corpo');
      }
    });

    it('should return empty array for faction without bonuses', () => {
      const result = getFactionAttributeBonuses('hegemonia');
      expect(result).toEqual([]);
    });
  });

  describe('getFactionFreeSkillPoints', () => {
    it('should return free skill points for faction with skills', () => {
      const hegemonia = AKASHIC_FACTIONS.find(f => f.id === 'hegemonia');
      if (hegemonia?.freeSkillPoints) {
        const result = getFactionFreeSkillPoints('hegemonia');
        expect(result).toBe(5);
      }
    });

    it('should return default value for faction without free skill points', () => {
      const result = getFactionFreeSkillPoints('invalid-faction');
      expect(result).toBe(4); // default value
    });
  });
});
