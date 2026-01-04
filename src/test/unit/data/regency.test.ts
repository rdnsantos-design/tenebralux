import { describe, it, expect } from 'vitest';
import {
  REGENCY_ATTRIBUTES,
  getRegencyForTheme,
} from '@/data/character/regency';

describe('Data - Regency', () => {
  describe('REGENCY_ATTRIBUTES constant', () => {
    it('should have exactly 6 regency attributes', () => {
      expect(REGENCY_ATTRIBUTES).toHaveLength(6);
    });

    it('should have unique IDs', () => {
      const ids = REGENCY_ATTRIBUTES.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid structure for all attributes', () => {
      REGENCY_ATTRIBUTES.forEach(reg => {
        expect(reg).toHaveProperty('id');
        expect(reg).toHaveProperty('labels');
        expect(reg.labels).toHaveProperty('akashic');
        expect(reg.labels).toHaveProperty('tenebralux');
        expect(reg).toHaveProperty('formula');
        expect(reg).toHaveProperty('formulaComponents');
        expect(reg.formulaComponents).toHaveProperty('attribute');
        expect(reg.formulaComponents).toHaveProperty('skill');
        expect(reg).toHaveProperty('usedIn');
        expect(Array.isArray(reg.usedIn)).toBe(true);
      });
    });

    it('should have expected regency IDs', () => {
      const ids = REGENCY_ATTRIBUTES.map(r => r.id);
      expect(ids).toContain('comando');
      expect(ids).toContain('estrategia');
      expect(ids).toContain('administracao');
      expect(ids).toContain('politica');
      expect(ids).toContain('tecnologia');
      expect(ids).toContain('geomancia');
    });

    it('should have theme-specific attributes correctly marked', () => {
      const tecnologia = REGENCY_ATTRIBUTES.find(r => r.id === 'tecnologia');
      const geomancia = REGENCY_ATTRIBUTES.find(r => r.id === 'geomancia');
      
      expect(tecnologia?.themeSpecific).toBe('akashic');
      expect(geomancia?.themeSpecific).toBe('tenebralux');
    });

    it('should have universal attributes without theme restriction', () => {
      const universal = REGENCY_ATTRIBUTES.filter(r => !r.themeSpecific);
      expect(universal).toHaveLength(4);
      
      const universalIds = universal.map(r => r.id);
      expect(universalIds).toContain('comando');
      expect(universalIds).toContain('estrategia');
      expect(universalIds).toContain('administracao');
      expect(universalIds).toContain('politica');
    });
  });

  describe('getRegencyForTheme', () => {
    it('should return 5 regency attributes for akashic', () => {
      const result = getRegencyForTheme('akashic');
      expect(result).toHaveLength(5);
      
      const ids = result.map(r => r.id);
      expect(ids).toContain('comando');
      expect(ids).toContain('estrategia');
      expect(ids).toContain('administracao');
      expect(ids).toContain('politica');
      expect(ids).toContain('tecnologia');
      expect(ids).not.toContain('geomancia');
    });

    it('should return 5 regency attributes for tenebralux', () => {
      const result = getRegencyForTheme('tenebralux');
      expect(result).toHaveLength(5);
      
      const ids = result.map(r => r.id);
      expect(ids).toContain('comando');
      expect(ids).toContain('estrategia');
      expect(ids).toContain('administracao');
      expect(ids).toContain('politica');
      expect(ids).toContain('geomancia');
      expect(ids).not.toContain('tecnologia');
    });

    it('should include all universal attributes for both themes', () => {
      const akashic = getRegencyForTheme('akashic');
      const tenebralux = getRegencyForTheme('tenebralux');
      
      const universalIds = ['comando', 'estrategia', 'administracao', 'politica'];
      
      universalIds.forEach(id => {
        expect(akashic.some(r => r.id === id)).toBe(true);
        expect(tenebralux.some(r => r.id === id)).toBe(true);
      });
    });
  });

  describe('Usage contexts', () => {
    it('should have batalha/campanha attributes', () => {
      const battleCampaign = REGENCY_ATTRIBUTES.filter(
        r => r.usedIn.includes('batalha') || r.usedIn.includes('campanha')
      );
      expect(battleCampaign.length).toBeGreaterThan(0);
      
      const ids = battleCampaign.map(r => r.id);
      expect(ids).toContain('comando');
      expect(ids).toContain('estrategia');
    });

    it('should have dominio attributes', () => {
      const domain = REGENCY_ATTRIBUTES.filter(r => r.usedIn.includes('dominio'));
      expect(domain.length).toBeGreaterThan(0);
      
      const ids = domain.map(r => r.id);
      expect(ids).toContain('administracao');
      expect(ids).toContain('politica');
    });
  });

  describe('Formula components', () => {
    it('should have valid attribute references', () => {
      const validAttributes = [
        'conhecimento', 'raciocinio', 'corpo', 'reflexos',
        'determinacao', 'coordenacao', 'carisma', 'intuicao'
      ];
      
      REGENCY_ATTRIBUTES.forEach(reg => {
        expect(validAttributes).toContain(reg.formulaComponents.attribute);
      });
    });

    it('should have correct formula for comando', () => {
      const comando = REGENCY_ATTRIBUTES.find(r => r.id === 'comando');
      expect(comando?.formula).toBe('Carisma + Pesquisa');
      expect(comando?.formulaComponents.attribute).toBe('carisma');
      expect(comando?.formulaComponents.skill).toBe('pesquisa');
    });

    it('should have correct formula for estrategia', () => {
      const estrategia = REGENCY_ATTRIBUTES.find(r => r.id === 'estrategia');
      expect(estrategia?.formula).toBe('Raciocínio + Militarismo');
      expect(estrategia?.formulaComponents.attribute).toBe('raciocinio');
      expect(estrategia?.formulaComponents.skill).toBe('militarismo');
    });
  });
});
