import { describe, it, expect } from 'vitest';
import {
  ATTRIBUTES,
  ATTRIBUTE_IDS,
  getAttributesByVirtue,
  getAttributeById,
} from '@/data/character/attributes';

describe('Data - Attributes', () => {
  describe('ATTRIBUTES constant', () => {
    it('should have exactly 8 attributes', () => {
      expect(ATTRIBUTES).toHaveLength(8);
    });

    it('should have all required attribute IDs', () => {
      const expectedIds = [
        'conhecimento',
        'raciocinio',
        'corpo',
        'reflexos',
        'determinacao',
        'coordenacao',
        'carisma',
        'intuicao',
      ];
      
      const actualIds = ATTRIBUTES.map(a => a.id);
      expect(actualIds).toEqual(expectedIds);
    });

    it('should have unique IDs', () => {
      const ids = ATTRIBUTES.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid structure for all attributes', () => {
      ATTRIBUTES.forEach(attr => {
        expect(attr).toHaveProperty('id');
        expect(attr).toHaveProperty('name');
        expect(attr).toHaveProperty('virtueId');
        expect(attr).toHaveProperty('icon');
        expect(attr).toHaveProperty('description');
        expect(attr.description).toHaveProperty('akashic');
        expect(attr.description).toHaveProperty('tenebralux');
      });
    });

    it('should have valid virtue IDs', () => {
      const validVirtues = ['sabedoria', 'coragem', 'perseveranca', 'harmonia'];
      ATTRIBUTES.forEach(attr => {
        expect(validVirtues).toContain(attr.virtueId);
      });
    });

    it('should have exactly 2 attributes per virtue', () => {
      const virtueCounts = ATTRIBUTES.reduce((acc, attr) => {
        acc[attr.virtueId] = (acc[attr.virtueId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      expect(virtueCounts.sabedoria).toBe(2);
      expect(virtueCounts.coragem).toBe(2);
      expect(virtueCounts.perseveranca).toBe(2);
      expect(virtueCounts.harmonia).toBe(2);
    });
  });

  describe('ATTRIBUTE_IDS constant', () => {
    it('should match ATTRIBUTES IDs', () => {
      expect(ATTRIBUTE_IDS).toEqual(ATTRIBUTES.map(a => a.id));
    });

    it('should have 8 IDs', () => {
      expect(ATTRIBUTE_IDS).toHaveLength(8);
    });
  });

  describe('getAttributesByVirtue', () => {
    it('should return 2 attributes for sabedoria', () => {
      const result = getAttributesByVirtue('sabedoria');
      expect(result).toHaveLength(2);
      expect(result.map(a => a.id)).toContain('conhecimento');
      expect(result.map(a => a.id)).toContain('raciocinio');
    });

    it('should return 2 attributes for coragem', () => {
      const result = getAttributesByVirtue('coragem');
      expect(result).toHaveLength(2);
      expect(result.map(a => a.id)).toContain('corpo');
      expect(result.map(a => a.id)).toContain('reflexos');
    });

    it('should return 2 attributes for perseveranca', () => {
      const result = getAttributesByVirtue('perseveranca');
      expect(result).toHaveLength(2);
      expect(result.map(a => a.id)).toContain('determinacao');
      expect(result.map(a => a.id)).toContain('coordenacao');
    });

    it('should return 2 attributes for harmonia', () => {
      const result = getAttributesByVirtue('harmonia');
      expect(result).toHaveLength(2);
      expect(result.map(a => a.id)).toContain('carisma');
      expect(result.map(a => a.id)).toContain('intuicao');
    });

    it('should return empty array for invalid virtue', () => {
      const result = getAttributesByVirtue('invalid');
      expect(result).toHaveLength(0);
    });
  });

  describe('getAttributeById', () => {
    it('should return attribute for valid ID', () => {
      const result = getAttributeById('conhecimento');
      expect(result).toBeDefined();
      expect(result?.id).toBe('conhecimento');
      expect(result?.name).toBe('Conhecimento');
    });

    it('should return undefined for invalid ID', () => {
      const result = getAttributeById('invalid');
      expect(result).toBeUndefined();
    });

    it('should find all attributes by ID', () => {
      ATTRIBUTE_IDS.forEach(id => {
        const result = getAttributeById(id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(id);
      });
    });
  });
});
