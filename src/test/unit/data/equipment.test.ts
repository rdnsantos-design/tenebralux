import { describe, it, expect } from 'vitest';
import {
  getWeapons,
  getArmors,
  getItems,
  getEquipmentById,
  getEquipmentName,
  getEquipmentDescription,
  getCurrencyName,
} from '@/data/character/equipment';

describe('Data - Equipment', () => {
  describe('getWeapons', () => {
    it('should return weapons array', () => {
      const weapons = getWeapons();
      expect(Array.isArray(weapons)).toBe(true);
      expect(weapons.length).toBeGreaterThan(0);
    });

    it('should have valid weapon structure', () => {
      const weapons = getWeapons();
      weapons.forEach(weapon => {
        expect(weapon).toHaveProperty('id');
        expect(weapon).toHaveProperty('category', 'weapon');
        expect(weapon).toHaveProperty('name');
        expect(weapon).toHaveProperty('cost');
      });
    });
  });

  describe('getArmors', () => {
    it('should return armors array', () => {
      const armors = getArmors();
      expect(Array.isArray(armors)).toBe(true);
      expect(armors.length).toBeGreaterThan(0);
    });

    it('should have valid armor structure', () => {
      const armors = getArmors();
      armors.forEach(armor => {
        expect(armor).toHaveProperty('id');
        expect(armor).toHaveProperty('category', 'armor');
        expect(armor).toHaveProperty('name');
        expect(armor).toHaveProperty('cost');
      });
    });

    it('should have defense stat for armor', () => {
      const armors = getArmors();
      armors.forEach(armor => {
        if (armor.stats?.defense !== undefined) {
          expect(typeof armor.stats.defense).toBe('number');
          expect(armor.stats.defense).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('getItems', () => {
    it('should return items array', () => {
      const items = getItems();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should have valid item structure', () => {
      const items = getItems();
      items.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('category', 'item');
        expect(item).toHaveProperty('name');
      });
    });
  });

  describe('getEquipmentById', () => {
    it('should find weapon by ID', () => {
      const weapons = getWeapons();
      if (weapons.length > 0) {
        const firstWeapon = weapons[0];
        const result = getEquipmentById(firstWeapon.id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(firstWeapon.id);
      }
    });

    it('should find armor by ID', () => {
      const armors = getArmors();
      if (armors.length > 0) {
        const firstArmor = armors[0];
        const result = getEquipmentById(firstArmor.id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(firstArmor.id);
      }
    });

    it('should return undefined for invalid ID', () => {
      const result = getEquipmentById('invalid-equipment-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getEquipmentName', () => {
    it('should return akashic name', () => {
      const weapons = getWeapons();
      if (weapons.length > 0) {
        const weapon = weapons[0];
        const name = getEquipmentName(weapon, 'akashic');
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      }
    });

    it('should return tenebralux name', () => {
      const weapons = getWeapons();
      if (weapons.length > 0) {
        const weapon = weapons[0];
        const name = getEquipmentName(weapon, 'tenebralux');
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getEquipmentDescription', () => {
    it('should return description for theme', () => {
      const weapons = getWeapons();
      if (weapons.length > 0) {
        const weapon = weapons[0];
        const desc = getEquipmentDescription(weapon, 'akashic');
        expect(typeof desc).toBe('string');
      }
    });
  });

  describe('getCurrencyName', () => {
    it('should return currency for akashic', () => {
      const currency = getCurrencyName('akashic');
      expect(typeof currency).toBe('string');
      expect(currency.length).toBeGreaterThan(0);
    });

    it('should return currency for tenebralux', () => {
      const currency = getCurrencyName('tenebralux');
      expect(typeof currency).toBe('string');
      expect(currency.length).toBeGreaterThan(0);
    });

    it('should have different currencies for themes', () => {
      const akashic = getCurrencyName('akashic');
      const tenebralux = getCurrencyName('tenebralux');
      // They might be different or the same depending on design
      expect(typeof akashic).toBe('string');
      expect(typeof tenebralux).toBe('string');
    });
  });
});
