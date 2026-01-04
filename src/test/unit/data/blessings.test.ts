import { describe, it, expect } from 'vitest';
import {
  BLESSINGS,
  BLESSING_CATEGORIES,
  getBlessingsByCategory,
  getBlessingById,
  getChallengeById,
  getCategoryById,
} from '@/data/character/blessings';

describe('Data - Blessings', () => {
  describe('BLESSING_CATEGORIES constant', () => {
    it('should have exactly 5 categories', () => {
      expect(BLESSING_CATEGORIES).toHaveLength(5);
    });

    it('should have expected category IDs', () => {
      const ids = BLESSING_CATEGORIES.map(c => c.id);
      expect(ids).toContain('combate');
      expect(ids).toContain('social');
      expect(ids).toContain('mistico');
      expect(ids).toContain('legado');
      expect(ids).toContain('especial');
    });

    it('should have unique IDs', () => {
      const ids = BLESSING_CATEGORIES.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid structure', () => {
      BLESSING_CATEGORIES.forEach(cat => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('icon');
        expect(cat).toHaveProperty('color');
      });
    });
  });

  describe('BLESSINGS constant', () => {
    it('should have at least 12 blessings', () => {
      expect(BLESSINGS.length).toBeGreaterThanOrEqual(12);
    });

    it('should have unique IDs', () => {
      const ids = BLESSINGS.map(b => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid structure for all blessings', () => {
      BLESSINGS.forEach(blessing => {
        expect(blessing).toHaveProperty('id');
        expect(blessing).toHaveProperty('name');
        expect(blessing).toHaveProperty('category');
        expect(blessing).toHaveProperty('description');
        expect(blessing).toHaveProperty('challenges');
        expect(Array.isArray(blessing.challenges)).toBe(true);
      });
    });

    it('should have valid category references', () => {
      const categoryIds = BLESSING_CATEGORIES.map(c => c.id);
      BLESSINGS.forEach(blessing => {
        expect(categoryIds).toContain(blessing.category);
      });
    });

    it('should have at least 1 challenge per blessing', () => {
      BLESSINGS.forEach(blessing => {
        expect(blessing.challenges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should have valid challenge structure', () => {
      BLESSINGS.forEach(blessing => {
        blessing.challenges.forEach(challenge => {
          expect(challenge).toHaveProperty('id');
          expect(challenge).toHaveProperty('name');
          expect(challenge).toHaveProperty('description');
        });
      });
    });
  });

  describe('getBlessingsByCategory', () => {
    it('should return blessings for combate category', () => {
      const result = getBlessingsByCategory('combate');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(b => b.category === 'combate')).toBe(true);
    });

    it('should return blessings for social category', () => {
      const result = getBlessingsByCategory('social');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(b => b.category === 'social')).toBe(true);
    });

    it('should return empty array for invalid category', () => {
      const result = getBlessingsByCategory('invalid');
      expect(result).toHaveLength(0);
    });

    it('should return blessings for all categories', () => {
      BLESSING_CATEGORIES.forEach(cat => {
        const result = getBlessingsByCategory(cat.id);
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getBlessingById', () => {
    it('should return blessing for valid ID', () => {
      const firstBlessing = BLESSINGS[0];
      const result = getBlessingById(firstBlessing.id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(firstBlessing.id);
    });

    it('should return undefined for invalid ID', () => {
      const result = getBlessingById('invalid-blessing');
      expect(result).toBeUndefined();
    });

    it('should find all blessings by ID', () => {
      BLESSINGS.forEach(blessing => {
        const result = getBlessingById(blessing.id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(blessing.id);
      });
    });
  });

  describe('getChallengeById', () => {
    it('should return challenge for valid IDs', () => {
      const blessing = BLESSINGS[0];
      const challenge = blessing.challenges[0];
      const result = getChallengeById(blessing.id, challenge.id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(challenge.id);
    });

    it('should return undefined for invalid blessing ID', () => {
      const result = getChallengeById('invalid', 'any');
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid challenge ID', () => {
      const blessing = BLESSINGS[0];
      const result = getChallengeById(blessing.id, 'invalid');
      expect(result).toBeUndefined();
    });
  });

  describe('getCategoryById', () => {
    it('should return category for valid ID', () => {
      const result = getCategoryById('combate');
      expect(result).toBeDefined();
      expect(result?.id).toBe('combate');
    });

    it('should return undefined for invalid ID', () => {
      const result = getCategoryById('invalid');
      expect(result).toBeUndefined();
    });

    it('should find all categories by ID', () => {
      BLESSING_CATEGORIES.forEach(cat => {
        const result = getCategoryById(cat.id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(cat.id);
      });
    });
  });

  describe('Distribution of blessings', () => {
    it('should have blessings distributed across categories', () => {
      const categoryDistribution: Record<string, number> = {};
      
      BLESSINGS.forEach(blessing => {
        categoryDistribution[blessing.category] = 
          (categoryDistribution[blessing.category] || 0) + 1;
      });
      
      BLESSING_CATEGORIES.forEach(cat => {
        expect(categoryDistribution[cat.id]).toBeGreaterThan(0);
      });
    });
  });
});
