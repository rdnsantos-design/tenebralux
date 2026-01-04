import { describe, it, expect } from 'vitest';
import {
  DERIVED_STATS,
  getDerivedStatsByCategory,
} from '@/data/character/derivedStats';

describe('Data - Derived Stats', () => {
  describe('DERIVED_STATS constant', () => {
    it('should have exactly 10 derived stats', () => {
      expect(DERIVED_STATS).toHaveLength(10);
    });

    it('should have unique IDs', () => {
      const ids = DERIVED_STATS.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid structure for all stats', () => {
      DERIVED_STATS.forEach(stat => {
        expect(stat).toHaveProperty('id');
        expect(stat).toHaveProperty('name');
        expect(stat).toHaveProperty('formula');
        expect(stat).toHaveProperty('category');
      });
    });

    it('should have valid categories', () => {
      const validCategories = ['physical', 'social', 'resources'];
      DERIVED_STATS.forEach(stat => {
        expect(validCategories).toContain(stat.category);
      });
    });

    it('should have expected physical stats', () => {
      const physicalStats = DERIVED_STATS.filter(s => s.category === 'physical');
      const physicalIds = physicalStats.map(s => s.id);
      
      expect(physicalIds).toContain('vitalidade');
      expect(physicalIds).toContain('evasao');
      expect(physicalIds).toContain('guarda');
      expect(physicalIds).toContain('reacao');
      expect(physicalIds).toContain('movimento');
    });

    it('should have expected social stats', () => {
      const socialStats = DERIVED_STATS.filter(s => s.category === 'social');
      const socialIds = socialStats.map(s => s.id);
      
      expect(socialIds).toContain('vontade');
      expect(socialIds).toContain('conviccao');
      expect(socialIds).toContain('influencia');
    });

    it('should have expected resource stats', () => {
      const resourceStats = DERIVED_STATS.filter(s => s.category === 'resources');
      const resourceIds = resourceStats.map(s => s.id);
      
      expect(resourceIds).toContain('tensao');
      expect(resourceIds).toContain('fortitude');
    });
  });

  describe('getDerivedStatsByCategory', () => {
    it('should return 5 physical stats', () => {
      const result = getDerivedStatsByCategory('physical');
      expect(result).toHaveLength(5);
      expect(result.every(s => s.category === 'physical')).toBe(true);
    });

    it('should return 3 social stats', () => {
      const result = getDerivedStatsByCategory('social');
      expect(result).toHaveLength(3);
      expect(result.every(s => s.category === 'social')).toBe(true);
    });

    it('should return 2 resource stats', () => {
      const result = getDerivedStatsByCategory('resources');
      expect(result).toHaveLength(2);
      expect(result.every(s => s.category === 'resources')).toBe(true);
    });

    it('should return empty array for invalid category', () => {
      const result = getDerivedStatsByCategory('invalid' as any);
      expect(result).toHaveLength(0);
    });
  });

  describe('Formula documentation', () => {
    it('should have readable formulas', () => {
      DERIVED_STATS.forEach(stat => {
        expect(stat.formula.length).toBeGreaterThan(0);
        // Formulas should contain readable text
        expect(stat.formula).toMatch(/[A-Za-zÀ-ú]/);
      });
    });

    it('should have correct formula for vitalidade', () => {
      const stat = DERIVED_STATS.find(s => s.id === 'vitalidade');
      expect(stat?.formula).toBe('Corpo × 2 + Resistência');
    });

    it('should have correct formula for evasao', () => {
      const stat = DERIVED_STATS.find(s => s.id === 'evasao');
      expect(stat?.formula).toBe('Reflexos × 2 + Instinto');
    });

    it('should have correct formula for guarda', () => {
      const stat = DERIVED_STATS.find(s => s.id === 'guarda');
      expect(stat?.formula).toBe('Reflexos × 2 + Esquiva + Armadura');
    });

    it('should have correct formula for reacao', () => {
      const stat = DERIVED_STATS.find(s => s.id === 'reacao');
      expect(stat?.formula).toBe('Intuição + Reflexos + Prontidão');
    });

    it('should have correct formula for movimento', () => {
      const stat = DERIVED_STATS.find(s => s.id === 'movimento');
      expect(stat?.formula).toBe('Corpo × 2 + Atletismo');
    });

    it('should have correct formula for vontade', () => {
      const stat = DERIVED_STATS.find(s => s.id === 'vontade');
      expect(stat?.formula).toBe('Raciocínio × 2 + Resiliência');
    });

    it('should have correct formula for conviccao', () => {
      const stat = DERIVED_STATS.find(s => s.id === 'conviccao');
      expect(stat?.formula).toBe('Lógica + Determinação');
    });

    it('should have correct formula for influencia', () => {
      const stat = DERIVED_STATS.find(s => s.id === 'influencia');
      expect(stat?.formula).toBe('Carisma');
    });

    it('should have correct formula for tensao', () => {
      const stat = DERIVED_STATS.find(s => s.id === 'tensao');
      expect(stat?.formula).toBe('Raciocínio + Determinação');
    });

    it('should have correct formula for fortitude', () => {
      const stat = DERIVED_STATS.find(s => s.id === 'fortitude');
      expect(stat?.formula).toBe('Autocontrole');
    });
  });
});
