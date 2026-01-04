import { describe, it, expect } from 'vitest';
import {
  SKILLS,
  getSkillsByAttribute,
  getSkillLabel,
  getSkillById,
} from '@/data/character/skills';
import { ATTRIBUTE_IDS } from '@/data/character/attributes';

describe('Data - Skills', () => {
  describe('SKILLS constant', () => {
    it('should have exactly 40 skills (5 per attribute × 8)', () => {
      expect(SKILLS).toHaveLength(40);
    });

    it('should have unique IDs', () => {
      const ids = SKILLS.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid structure for all skills', () => {
      SKILLS.forEach(skill => {
        expect(skill).toHaveProperty('id');
        expect(skill).toHaveProperty('attributeId');
        expect(skill).toHaveProperty('labels');
        expect(skill.labels).toHaveProperty('akashic');
        expect(skill.labels).toHaveProperty('tenebralux');
      });
    });

    it('should have valid attribute IDs', () => {
      SKILLS.forEach(skill => {
        expect(ATTRIBUTE_IDS).toContain(skill.attributeId);
      });
    });

    it('should have 5 skills per attribute', () => {
      ATTRIBUTE_IDS.forEach(attrId => {
        const skillsForAttr = SKILLS.filter(s => s.attributeId === attrId);
        expect(skillsForAttr).toHaveLength(5);
      });
    });
  });

  describe('getSkillsByAttribute', () => {
    it('should return 5 skills for conhecimento', () => {
      const result = getSkillsByAttribute('conhecimento');
      expect(result).toHaveLength(5);
      expect(result.every(s => s.attributeId === 'conhecimento')).toBe(true);
    });

    it('should return 5 skills for raciocinio', () => {
      const result = getSkillsByAttribute('raciocinio');
      expect(result).toHaveLength(5);
      expect(result.every(s => s.attributeId === 'raciocinio')).toBe(true);
    });

    it('should return 5 skills for each attribute', () => {
      ATTRIBUTE_IDS.forEach(attrId => {
        const result = getSkillsByAttribute(attrId);
        expect(result).toHaveLength(5);
      });
    });

    it('should return empty array for invalid attribute', () => {
      const result = getSkillsByAttribute('invalid');
      expect(result).toHaveLength(0);
    });
  });

  describe('getSkillLabel', () => {
    it('should return akashic label for akashic theme', () => {
      const result = getSkillLabel('ciencias', 'akashic');
      expect(result).toBe('Ciências');
    });

    it('should return tenebralux label for tenebralux theme', () => {
      const result = getSkillLabel('ciencias', 'tenebralux');
      expect(result).toBe('Ciências');
    });

    it('should return different labels for theme-specific skills', () => {
      // Computação vs Arcanismo
      const akashicLabel = getSkillLabel('computacao', 'akashic');
      const tenebraluxLabel = getSkillLabel('computacao', 'tenebralux');
      expect(akashicLabel).toBe('Computação');
      expect(tenebraluxLabel).toBe('Arcanismo');
    });

    it('should handle pilotagem/condução difference', () => {
      const akashicLabel = getSkillLabel('pilotagem', 'akashic');
      const tenebraluxLabel = getSkillLabel('pilotagem', 'tenebralux');
      expect(akashicLabel).toBe('Pilotagem');
      expect(tenebraluxLabel).toBe('Condução');
    });

    it('should handle tiro/arqueria difference', () => {
      const akashicLabel = getSkillLabel('tiro', 'akashic');
      const tenebraluxLabel = getSkillLabel('tiro', 'tenebralux');
      expect(akashicLabel).toBe('Tiro');
      expect(tenebraluxLabel).toBe('Arqueria');
    });

    it('should return ID for invalid skill', () => {
      const result = getSkillLabel('invalid', 'akashic');
      expect(result).toBe('invalid');
    });
  });

  describe('getSkillById', () => {
    it('should return skill for valid ID', () => {
      const result = getSkillById('ciencias');
      expect(result).toBeDefined();
      expect(result?.id).toBe('ciencias');
    });

    it('should return undefined for invalid ID', () => {
      const result = getSkillById('invalid');
      expect(result).toBeUndefined();
    });

    it('should find all skills by ID', () => {
      SKILLS.forEach(skill => {
        const result = getSkillById(skill.id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(skill.id);
      });
    });
  });

  describe('Theme-specific skill labels', () => {
    const themeSpecificSkills = [
      { id: 'computacao', akashic: 'Computação', tenebralux: 'Arcanismo' },
      { id: 'pilotagem', akashic: 'Pilotagem', tenebralux: 'Condução' },
      { id: 'tiro', akashic: 'Tiro', tenebralux: 'Arqueria' },
      { id: 'artilharia', akashic: 'Artilharia', tenebralux: 'Cerco' },
    ];

    themeSpecificSkills.forEach(({ id, akashic, tenebralux }) => {
      it(`should have correct labels for ${id}`, () => {
        const skill = getSkillById(id);
        expect(skill?.labels.akashic).toBe(akashic);
        expect(skill?.labels.tenebralux).toBe(tenebralux);
      });
    });
  });
});
