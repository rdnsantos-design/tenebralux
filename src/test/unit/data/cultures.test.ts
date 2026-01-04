import { describe, it, expect } from 'vitest';
import {
  getCulturesByTheme,
  getCultureById,
  getCulturesByFaction,
} from '@/data/character/cultures';

describe('Data - Cultures', () => {
  describe('getCulturesByTheme', () => {
    it('should return akashic cultures', () => {
      const result = getCulturesByTheme('akashic');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(c => c.theme === 'akashic')).toBe(true);
    });

    it('should return tenebralux cultures', () => {
      const result = getCulturesByTheme('tenebralux');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(c => c.theme === 'tenebralux')).toBe(true);
    });

    it('should have different cultures for different themes', () => {
      const akashic = getCulturesByTheme('akashic');
      const tenebralux = getCulturesByTheme('tenebralux');
      
      const akashicIds = new Set(akashic.map(c => c.id));
      const tenebraluxIds = new Set(tenebralux.map(c => c.id));
      
      // Should have no overlap
      const overlap = [...akashicIds].filter(id => tenebraluxIds.has(id));
      expect(overlap.length).toBe(0);
    });
  });

  describe('getCultureById', () => {
    it('should find culture by ID', () => {
      const akashicCultures = getCulturesByTheme('akashic');
      if (akashicCultures.length > 0) {
        const firstCulture = akashicCultures[0];
        const result = getCultureById(firstCulture.id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(firstCulture.id);
      }
    });

    it('should return undefined for invalid ID', () => {
      const result = getCultureById('invalid-culture-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getCulturesByFaction', () => {
    it('should return cultures for a faction', () => {
      // Get a faction that has cultures
      const akashicCultures = getCulturesByTheme('akashic');
      if (akashicCultures.length > 0 && akashicCultures[0].factionIds.length > 0) {
        const factionId = akashicCultures[0].factionIds[0];
        const result = getCulturesByFaction(factionId);
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should return empty array for invalid faction', () => {
      const result = getCulturesByFaction('invalid-faction');
      expect(result).toHaveLength(0);
    });
  });

  describe('Culture structure', () => {
    it('should have valid structure for all cultures', () => {
      const allCultures = [
        ...getCulturesByTheme('akashic'),
        ...getCulturesByTheme('tenebralux'),
      ];
      
      allCultures.forEach(culture => {
        expect(culture).toHaveProperty('id');
        expect(culture).toHaveProperty('name');
        expect(culture).toHaveProperty('theme');
        expect(culture).toHaveProperty('factionIds');
        expect(Array.isArray(culture.factionIds)).toBe(true);
      });
    });
  });
});
