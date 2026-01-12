import { describe, it, expect } from 'vitest';
import {
  UnifiedCharacter,
  TacticalProjection,
  DomainProjection,
  generateTacticalProjection,
  generateDomainProjection,
  characterToUnified,
  createTacticalOnlyCharacter,
  unifiedToCommandStats,
  calculateUnifiedPowerCost,
  validateUnifiedCharacter,
} from '@/core/types/unified-character';
import { Character, calculateDerivedStats, calculateRegencyStats } from '@/core/types/character';
import { CharacterAttributes, RegencyStats, DerivedStats } from '@/core/types/base';

describe('Unified Character System', () => {
  // Fixtures
  const mockAttributes: CharacterAttributes = {
    conhecimento: 3,
    raciocinio: 4,
    corpo: 2,
    reflexos: 3,
    determinacao: 3,
    coordenacao: 2,
    carisma: 4,
    intuicao: 3,
  };

  const mockSkills: Record<string, number> = {
    pesquisa: 2,
    militarismo: 3,
    economia: 2,
    diplomacia: 3,
    engenharia: 1,
    resistencia: 2,
    instinto: 1,
    esquiva: 2,
    prontidao: 2,
    atletismo: 1,
    resiliencia: 2,
    logica: 2,
    autocontrole: 3,
  };

  const mockCharacter: Character = {
    id: 'char-1',
    name: 'Sir Aldric',
    theme: 'tenebralux',
    attributes: mockAttributes,
    skills: mockSkills,
    virtues: {
      sabedoria: 1,
      coragem: 2,
      perseveranca: 1,
      harmonia: 0,
    },
    blessings: [],
    equipment: [],
  };

  describe('generateTacticalProjection', () => {
    it('should generate tactical projection from regency stats', () => {
      const regency: RegencyStats = {
        comando: 6,
        estrategia: 7,
        administracao: 6,
        politica: 7,
        tecnologia: 0,
        geomancia: 4,
      };

      const derived: DerivedStats = {
        vitalidade: 6,
        evasao: 7,
        guarda: 8,
        resistencia: 0,
        defesa: 8,
        reacao: 8,
        movimento: 5,
        vontade: 10,
        conviccao: 5,
        influencia: 4,
        tensao: 7,
        fortitude: 3,
      };

      const projection = generateTacticalProjection(regency, derived, 'Anuire');

      expect(projection.comando).toBe(6);
      expect(projection.estrategia).toBe(6); // Capped at 6
      expect(projection.guarda).toBe(2); // floor(8/3) = 2
      expect(projection.tacticalCulture).toBe('Anuire');
      expect(projection.characterTypes).toEqual(['Comandante']);
      expect(projection.specialties).toEqual(['Infantaria']);
      expect(projection.powerCost).toBeGreaterThan(0);
    });

    it('should include optional features in power cost', () => {
      const regency: RegencyStats = {
        comando: 4,
        estrategia: 3,
        administracao: 3,
        politica: 3,
        tecnologia: 2,
        geomancia: 0,
      };

      const derived: DerivedStats = {
        vitalidade: 6,
        evasao: 6,
        guarda: 6,
        resistencia: 0,
        defesa: 6,
        reacao: 6,
        movimento: 5,
        vontade: 8,
        conviccao: 4,
        influencia: 3,
        tensao: 5,
        fortitude: 2,
      };

      const baseProjection = generateTacticalProjection(regency, derived, 'Anuire');

      const enhancedProjection = generateTacticalProjection(regency, derived, 'Anuire', {
        specialties: ['Infantaria', 'Cavalaria'],
        passiveBonus: { type: 'Ataque', value: 2, affectsArea: true },
      });

      expect(enhancedProjection.powerCost).toBeGreaterThan(baseProjection.powerCost);
    });

    it('should clamp values within tactical limits', () => {
      const regency: RegencyStats = {
        comando: 10, // Over max
        estrategia: -2, // Under min
        administracao: 5,
        politica: 5,
        tecnologia: 5,
        geomancia: 0,
      };

      const derived: DerivedStats = {
        vitalidade: 6,
        evasao: 6,
        guarda: 21, // Would give 7, over max
        resistencia: 0,
        defesa: 21,
        reacao: 6,
        movimento: 5,
        vontade: 8,
        conviccao: 4,
        influencia: 3,
        tensao: 5,
        fortitude: 2,
      };

      const projection = generateTacticalProjection(regency, derived, 'Anuire');

      expect(projection.comando).toBe(6); // Capped at 6
      expect(projection.estrategia).toBe(0); // Min is 0
      expect(projection.guarda).toBe(6); // Capped at 6
    });
  });

  describe('generateDomainProjection', () => {
    it('should generate domain projection from regency stats', () => {
      const regency: RegencyStats = {
        comando: 6,
        estrategia: 7,
        administracao: 6,
        politica: 7,
        tecnologia: 4,
        geomancia: 0,
      };

      const projection = generateDomainProjection(regency);

      expect(projection.administracao).toBe(6);
      expect(projection.politica).toBe(7);
      expect(projection.tecnologia).toBe(4);
      expect(projection.geomancia).toBe(0);
      expect(projection.regencyPoints).toBe(0);
    });

    it('should include bloodline options', () => {
      const regency: RegencyStats = {
        comando: 5,
        estrategia: 5,
        administracao: 5,
        politica: 5,
        tecnologia: 0,
        geomancia: 3,
      };

      const projection = generateDomainProjection(regency, {
        bloodlineStrength: 45,
        bloodlineType: 'Anduiras',
        regencyPoints: 25,
      });

      expect(projection.bloodlineStrength).toBe(45);
      expect(projection.bloodlineType).toBe('Anduiras');
      expect(projection.regencyPoints).toBe(25);
    });
  });

  describe('characterToUnified', () => {
    it('should convert full RPG character to unified', () => {
      const unified = characterToUnified(mockCharacter);

      expect(unified.id).toBe('char-1');
      expect(unified.name).toBe('Sir Aldric');
      expect(unified.theme).toBe('tenebralux');
      expect(unified.capabilities.rpg).toBe(true);
      expect(unified.capabilities.tactical).toBe(true);
      expect(unified.capabilities.domain).toBe(true);
      expect(unified.attributes).toEqual(mockAttributes);
      expect(unified.tactical).toBeDefined();
      expect(unified.domain).toBeDefined();
    });

    it('should respect enableTactical option', () => {
      const unified = characterToUnified(mockCharacter, { enableTactical: false });

      expect(unified.capabilities.tactical).toBe(false);
      expect(unified.tactical).toBeUndefined();
    });

    it('should respect enableDomain option', () => {
      const unified = characterToUnified(mockCharacter, { enableDomain: false });

      expect(unified.capabilities.domain).toBe(false);
      expect(unified.domain).toBeUndefined();
    });

    it('should pass tactical options through', () => {
      const unified = characterToUnified(mockCharacter, {
        tacticalOptions: {
          characterTypes: ['Herói', 'Regente'],
          specialties: ['Cavalaria', 'Arqueria'],
        },
      });

      expect(unified.tactical?.characterTypes).toEqual(['Herói', 'Regente']);
      expect(unified.tactical?.specialties).toEqual(['Cavalaria', 'Arqueria']);
    });
  });

  describe('createTacticalOnlyCharacter', () => {
    it('should create tactical-only character without RPG data', () => {
      const tactical: TacticalProjection = {
        comando: 3,
        estrategia: 2,
        guarda: 1,
        characterTypes: ['Comandante'],
        specialties: ['Infantaria'],
        powerCost: 8,
        tacticalCulture: 'Khinasi',
      };

      const char = createTacticalOnlyCharacter('General Khalid', 'tenebralux', tactical);

      expect(char.name).toBe('General Khalid');
      expect(char.isPC).toBe(false);
      expect(char.capabilities.rpg).toBe(false);
      expect(char.capabilities.tactical).toBe(true);
      expect(char.capabilities.domain).toBe(false);
      expect(char.attributes).toBeUndefined();
      expect(char.tactical).toEqual(tactical);
    });
  });

  describe('unifiedToCommandStats', () => {
    it('should extract command stats from tactical projection', () => {
      const unified = characterToUnified(mockCharacter);
      const commandStats = unifiedToCommandStats(unified);

      expect(commandStats).not.toBeNull();
      expect(commandStats?.command).toBe(unified.tactical?.comando);
      expect(commandStats?.strategy).toBe(unified.tactical?.estrategia);
      expect(commandStats?.guard).toBe(unified.tactical?.guarda);
    });

    it('should return null for character without tactical data', () => {
      const unified: UnifiedCharacter = {
        id: 'test',
        name: 'Test',
        theme: 'akashic',
        isPC: true,
        capabilities: {
          rpg: false,
          tactical: false,
          domain: false,
          campaign: false,
        },
      };

      const commandStats = unifiedToCommandStats(unified);
      expect(commandStats).toBeNull();
    });
  });

  describe('calculateUnifiedPowerCost', () => {
    it('should return tactical power cost', () => {
      const unified = characterToUnified(mockCharacter);
      const cost = calculateUnifiedPowerCost(unified);

      expect(cost).toBe(unified.tactical?.powerCost);
      expect(cost).toBeGreaterThan(0);
    });

    it('should respect power cost override', () => {
      const unified = characterToUnified(mockCharacter);
      if (unified.tactical) {
        unified.tactical.powerCostOverride = 15;
      }

      const cost = calculateUnifiedPowerCost(unified);
      expect(cost).toBe(15);
    });

    it('should return 0 for character without tactical data', () => {
      const unified: UnifiedCharacter = {
        id: 'test',
        name: 'Test',
        theme: 'akashic',
        isPC: true,
        capabilities: {
          rpg: false,
          tactical: false,
          domain: false,
          campaign: false,
        },
      };

      const cost = calculateUnifiedPowerCost(unified);
      expect(cost).toBe(0);
    });
  });

  describe('validateUnifiedCharacter', () => {
    it('should validate a complete character', () => {
      const unified = characterToUnified(mockCharacter);
      const validation = validateUnifiedCharacter(unified);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should require name', () => {
      const validation = validateUnifiedCharacter({
        theme: 'akashic',
        isPC: true,
        capabilities: { rpg: false, tactical: false, domain: false, campaign: false },
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should require theme', () => {
      const validation = validateUnifiedCharacter({
        name: 'Test',
        isPC: true,
        capabilities: { rpg: false, tactical: false, domain: false, campaign: false },
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.field === 'theme')).toBe(true);
    });

    it('should validate tactical stats range', () => {
      const validation = validateUnifiedCharacter({
        name: 'Test',
        theme: 'akashic',
        isPC: true,
        capabilities: { rpg: false, tactical: true, domain: false, campaign: false },
        tactical: {
          comando: 0, // Invalid, min is 1
          estrategia: 7, // Invalid, max is 6
          guarda: 3,
          characterTypes: ['Comandante'],
          specialties: ['Infantaria'],
          powerCost: 10,
          tacticalCulture: 'Anuire',
        },
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.field === 'tactical.comando')).toBe(true);
      expect(validation.errors.some(e => e.field === 'tactical.estrategia')).toBe(true);
    });

    it('should warn about missing attributes for RPG mode', () => {
      const validation = validateUnifiedCharacter({
        name: 'Test',
        theme: 'akashic',
        isPC: true,
        capabilities: { rpg: true, tactical: false, domain: false, campaign: false },
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.field === 'attributes')).toBe(true);
    });

    it('should warn about missing skills', () => {
      const validation = validateUnifiedCharacter({
        name: 'Test',
        theme: 'akashic',
        isPC: true,
        capabilities: { rpg: true, tactical: false, domain: false, campaign: false },
        attributes: mockAttributes,
        skills: {},
      });

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(w => w.field === 'skills')).toBe(true);
    });
  });
});
