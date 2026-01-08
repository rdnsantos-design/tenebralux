import { describe, it, expect } from 'vitest';
import {
  PRIVILEGES,
  PRIVILEGE_CATEGORIES,
  getPrivilegesByCategory,
  getPrivilegeById,
  getChallengeById,
  getCategoryById,
} from '@/data/character/privileges';

describe('Data - Privileges', () => {
  describe('PRIVILEGE_CATEGORIES constant', () => {
    it('should have exactly 5 categories', () => {
      expect(PRIVILEGE_CATEGORIES).toHaveLength(5);
    });

    it('should have expected category IDs', () => {
      const ids = PRIVILEGE_CATEGORIES.map(c => c.id);
      expect(ids).toContain('recursos');
      expect(ids).toContain('educacao');
      expect(ids).toContain('genetica');
      expect(ids).toContain('conexoes');
      expect(ids).toContain('talento');
    });

    it('should have unique IDs', () => {
      const ids = PRIVILEGE_CATEGORIES.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('each category should have required properties', () => {
      PRIVILEGE_CATEGORIES.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('icon');
        expect(category).toHaveProperty('color');
        expect(typeof category.id).toBe('string');
        expect(typeof category.name).toBe('string');
      });
    });
  });

  describe('PRIVILEGES constant', () => {
    it('should have at least 10 privileges', () => {
      expect(PRIVILEGES.length).toBeGreaterThanOrEqual(10);
    });

    it('should have unique IDs', () => {
      const ids = PRIVILEGES.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('each privilege should have required properties', () => {
      PRIVILEGES.forEach(privilege => {
        expect(privilege).toHaveProperty('id');
        expect(privilege).toHaveProperty('name');
        expect(privilege).toHaveProperty('category');
        expect(privilege).toHaveProperty('description');
        expect(privilege).toHaveProperty('challenges');
        expect(typeof privilege.id).toBe('string');
        expect(typeof privilege.name).toBe('string');
        expect(typeof privilege.category).toBe('string');
        expect(typeof privilege.description).toBe('string');
      });
    });

    it('each privilege should have exactly 2 challenges', () => {
      PRIVILEGES.forEach(privilege => {
        expect(privilege.challenges).toHaveLength(2);
      });
    });

    it('all privilege categories should reference valid categories', () => {
      const validCategories = PRIVILEGE_CATEGORIES.map(c => c.id);
      PRIVILEGES.forEach(privilege => {
        expect(validCategories).toContain(privilege.category);
      });
    });
  });

  describe('getPrivilegesByCategory', () => {
    it('should return privileges for a valid category', () => {
      const recursos = getPrivilegesByCategory('recursos');
      expect(recursos.length).toBeGreaterThan(0);
      recursos.forEach(p => {
        expect(p.category).toBe('recursos');
      });
    });

    it('should return empty array for invalid category', () => {
      const result = getPrivilegesByCategory('invalid_category');
      expect(result).toEqual([]);
    });
  });

  describe('getPrivilegeById', () => {
    it('should return privilege for valid ID', () => {
      const privilege = getPrivilegeById('nascido_elite');
      expect(privilege).toBeDefined();
      expect(privilege?.name).toBe('Nascido na Elite');
    });

    it('should return undefined for invalid ID', () => {
      const result = getPrivilegeById('invalid_id');
      expect(result).toBeUndefined();
    });
  });

  describe('getChallengeById', () => {
    it('should return challenge for valid privilege and challenge ID', () => {
      const challenge = getChallengeById('nascido_elite', 'pressao_perfeicao');
      expect(challenge).toBeDefined();
      expect(challenge?.name).toBe('Pressão da Perfeição');
    });

    it('should return undefined for invalid privilege ID', () => {
      const result = getChallengeById('invalid', 'pressao_perfeicao');
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid challenge ID', () => {
      const result = getChallengeById('nascido_elite', 'invalid');
      expect(result).toBeUndefined();
    });
  });

  describe('getCategoryById', () => {
    it('should return category for valid ID', () => {
      const category = getCategoryById('recursos');
      expect(category).toBeDefined();
      expect(category?.name).toBe('Recursos e Status');
    });

    it('should return undefined for invalid ID', () => {
      const result = getCategoryById('invalid_id');
      expect(result).toBeUndefined();
    });
  });

  describe('Privilege distribution', () => {
    it('should have privileges in all categories', () => {
      PRIVILEGE_CATEGORIES.forEach(category => {
        const privileges = getPrivilegesByCategory(category.id);
        expect(privileges.length).toBeGreaterThan(0);
      });
    });
  });
});
