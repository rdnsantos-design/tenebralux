import { describe, it, expect } from 'vitest';
import {
  calculateDerivedStats,
  calculateRegencyStats,
  regencyToCommandStats,
  calculateCharacterPowerCost,
  createDefaultCharacter,
} from '@/core/types/character';
import { CharacterAttributes, DerivedStats, RegencyStats } from '@/core/types/base';

describe('Core Types - Character Calculations', () => {
  // Atributos padrão para testes
  const defaultAttributes: CharacterAttributes = {
    conhecimento: 2,
    raciocinio: 3,
    corpo: 2,
    reflexos: 2,
    determinacao: 2,
    coordenacao: 2,
    carisma: 3,
    intuicao: 2,
  };

  const defaultSkills: Record<string, number> = {
    resistencia: 2,
    instinto: 1,
    esquiva: 2,
    prontidao: 1,
    atletismo: 2,
    resiliencia: 2,
    logica: 1,
    autocontrole: 2,
    pesquisa: 2,
    militarismo: 1,
    economia: 2,
    diplomacia: 1,
    engenharia: 2,
    computacao: 1,
  };

  describe('calculateDerivedStats', () => {
    it('should calculate vitalidade correctly (Corpo×2 + Resistência)', () => {
      const result = calculateDerivedStats(defaultAttributes, defaultSkills);
      // Corpo(2) * 2 + Resistência(2) = 6
      expect(result.vitalidade).toBe(6);
    });

    it('should calculate evasao correctly (Reflexos×2 + Instinto)', () => {
      const result = calculateDerivedStats(defaultAttributes, defaultSkills);
      // Reflexos(2) * 2 + Instinto(1) = 5
      expect(result.evasao).toBe(5);
    });

    it('should calculate guarda correctly (Reflexos×2 + Esquiva + Armadura)', () => {
      const result = calculateDerivedStats(defaultAttributes, defaultSkills, 1);
      // Reflexos(2) * 2 + Esquiva(2) + Armadura(1) = 7
      expect(result.guarda).toBe(7);
    });

    it('should calculate guarda without armor bonus', () => {
      const result = calculateDerivedStats(defaultAttributes, defaultSkills);
      // Reflexos(2) * 2 + Esquiva(2) + Armadura(0) = 6
      expect(result.guarda).toBe(6);
    });

    it('should calculate reacao correctly (Intuição + Reflexos + Prontidão)', () => {
      const result = calculateDerivedStats(defaultAttributes, defaultSkills);
      // Intuição(2) + Reflexos(2) + Prontidão(1) = 5
      expect(result.reacao).toBe(5);
    });

    it('should calculate movimento correctly (Corpo×2 + Atletismo)', () => {
      const result = calculateDerivedStats(defaultAttributes, defaultSkills);
      // Corpo(2) * 2 + Atletismo(2) = 6
      expect(result.movimento).toBe(6);
    });

    it('should calculate vontade correctly (Raciocínio×2 + Resiliência)', () => {
      const result = calculateDerivedStats(defaultAttributes, defaultSkills);
      // Raciocínio(3) * 2 + Resiliência(2) = 8
      expect(result.vontade).toBe(8);
    });

    it('should calculate conviccao correctly (Lógica + Determinação)', () => {
      const result = calculateDerivedStats(defaultAttributes, defaultSkills);
      // Lógica(1) + Determinação(2) = 3
      expect(result.conviccao).toBe(3);
    });

    it('should calculate influencia correctly (Carisma)', () => {
      const result = calculateDerivedStats(defaultAttributes, defaultSkills);
      // Carisma(3) = 3
      expect(result.influencia).toBe(3);
    });

    it('should calculate tensao correctly (Raciocínio + Determinação)', () => {
      const result = calculateDerivedStats(defaultAttributes, defaultSkills);
      // Raciocínio(3) + Determinação(2) = 5
      expect(result.tensao).toBe(5);
    });

    it('should calculate fortitude correctly (Autocontrole)', () => {
      const result = calculateDerivedStats(defaultAttributes, defaultSkills);
      // Autocontrole(2) = 2
      expect(result.fortitude).toBe(2);
    });

    it('should handle missing skills gracefully', () => {
      const result = calculateDerivedStats(defaultAttributes, {});
      // All skills default to 0
      expect(result.vitalidade).toBe(4); // Corpo(2) * 2 + 0
      expect(result.evasao).toBe(4); // Reflexos(2) * 2 + 0
      expect(result.fortitude).toBe(0); // 0
    });

    it('should handle minimum attributes', () => {
      const minAttributes: CharacterAttributes = {
        conhecimento: 1,
        raciocinio: 1,
        corpo: 1,
        reflexos: 1,
        determinacao: 1,
        coordenacao: 1,
        carisma: 1,
        intuicao: 1,
      };
      const result = calculateDerivedStats(minAttributes, {});
      
      expect(result.vitalidade).toBe(2); // 1*2 + 0
      expect(result.evasao).toBe(2); // 1*2 + 0
      expect(result.guarda).toBe(2); // 1*2 + 0 + 0
      expect(result.reacao).toBe(2); // 1 + 1 + 0
      expect(result.movimento).toBe(2); // 1*2 + 0
      expect(result.vontade).toBe(2); // 1*2 + 0
      expect(result.conviccao).toBe(1); // 0 + 1
      expect(result.influencia).toBe(1); // 1
      expect(result.tensao).toBe(2); // 1 + 1
      expect(result.fortitude).toBe(0); // 0
    });

    it('should handle maximum attributes', () => {
      const maxAttributes: CharacterAttributes = {
        conhecimento: 6,
        raciocinio: 6,
        corpo: 6,
        reflexos: 6,
        determinacao: 6,
        coordenacao: 6,
        carisma: 6,
        intuicao: 6,
      };
      const maxSkills: Record<string, number> = {
        resistencia: 6,
        instinto: 6,
        esquiva: 6,
        prontidao: 6,
        atletismo: 6,
        resiliencia: 6,
        logica: 6,
        autocontrole: 6,
      };
      const result = calculateDerivedStats(maxAttributes, maxSkills, 3);
      
      expect(result.vitalidade).toBe(18); // 6*2 + 6
      expect(result.evasao).toBe(18); // 6*2 + 6
      expect(result.guarda).toBe(21); // 6*2 + 6 + 3
      expect(result.reacao).toBe(18); // 6 + 6 + 6
      expect(result.movimento).toBe(18); // 6*2 + 6
    });
  });

  describe('calculateRegencyStats', () => {
    it('should calculate comando correctly (Carisma + Pesquisa)', () => {
      const result = calculateRegencyStats(defaultAttributes, defaultSkills, 'akashic');
      // Carisma(3) + Pesquisa(2) = 5
      expect(result.comando).toBe(5);
    });

    it('should calculate estrategia correctly (Raciocínio + Militarismo)', () => {
      const result = calculateRegencyStats(defaultAttributes, defaultSkills, 'akashic');
      // Raciocínio(3) + Militarismo(1) = 4
      expect(result.estrategia).toBe(4);
    });

    it('should calculate administracao correctly (Raciocínio + Economia)', () => {
      const result = calculateRegencyStats(defaultAttributes, defaultSkills, 'akashic');
      // Raciocínio(3) + Economia(2) = 5
      expect(result.administracao).toBe(5);
    });

    it('should calculate politica correctly (Raciocínio + Diplomacia)', () => {
      const result = calculateRegencyStats(defaultAttributes, defaultSkills, 'akashic');
      // Raciocínio(3) + Diplomacia(1) = 4
      expect(result.politica).toBe(4);
    });

    it('should calculate tecnologia for akashic theme', () => {
      const result = calculateRegencyStats(defaultAttributes, defaultSkills, 'akashic');
      // Conhecimento(2) + Engenharia(2) = 4
      expect(result.tecnologia).toBe(4);
      expect(result.geomancia).toBe(0);
    });

    it('should calculate geomancia for tenebralux theme', () => {
      const result = calculateRegencyStats(defaultAttributes, defaultSkills, 'tenebralux');
      // Conhecimento(2) + Computação/Arcanismo(1) = 3
      expect(result.geomancia).toBe(3);
      expect(result.tecnologia).toBe(0);
    });

    it('should handle missing skills', () => {
      const result = calculateRegencyStats(defaultAttributes, {}, 'akashic');
      expect(result.comando).toBe(3); // Carisma(3) + 0
      expect(result.estrategia).toBe(3); // Raciocínio(3) + 0
    });
  });

  describe('regencyToCommandStats', () => {
    it('should convert regency to command stats correctly', () => {
      const regency: RegencyStats = {
        comando: 5,
        estrategia: 4,
        administracao: 3,
        politica: 2,
        tecnologia: 3,
        geomancia: 0,
      };
      const derived: DerivedStats = {
        vitalidade: 6,
        evasao: 5,
        guarda: 9, // Should result in guard = 3
        reacao: 5,
        movimento: 6,
        vontade: 8,
        conviccao: 3,
        influencia: 3,
        tensao: 5,
        fortitude: 2,
      };
      
      const result = regencyToCommandStats(regency, derived);
      
      expect(result.command).toBe(5);
      expect(result.strategy).toBe(4);
      expect(result.guard).toBe(3); // floor(9/3) = 3
    });

    it('should cap values at 6', () => {
      const regency: RegencyStats = {
        comando: 10,
        estrategia: 8,
        administracao: 5,
        politica: 4,
        tecnologia: 3,
        geomancia: 0,
      };
      const derived: DerivedStats = {
        vitalidade: 18,
        evasao: 18,
        guarda: 21, // Should result in guard = 6 (capped)
        reacao: 18,
        movimento: 18,
        vontade: 18,
        conviccao: 12,
        influencia: 6,
        tensao: 12,
        fortitude: 6,
      };
      
      const result = regencyToCommandStats(regency, derived);
      
      expect(result.command).toBe(6); // Capped
      expect(result.strategy).toBe(6); // Capped
      expect(result.guard).toBe(6); // floor(21/3) = 7, capped at 6
    });
  });

  describe('calculateCharacterPowerCost', () => {
    it('should calculate power cost correctly for akashic', () => {
      const regency: RegencyStats = {
        comando: 3,
        estrategia: 2,
        administracao: 2,
        politica: 1,
        tecnologia: 2,
        geomancia: 0,
      };
      
      const result = calculateCharacterPowerCost(regency, 0);
      // (3+2+2+1+2) * 2 = 20
      expect(result).toBe(20);
    });

    it('should calculate power cost correctly for tenebralux', () => {
      const regency: RegencyStats = {
        comando: 3,
        estrategia: 2,
        administracao: 2,
        politica: 1,
        tecnologia: 0,
        geomancia: 3,
      };
      
      const result = calculateCharacterPowerCost(regency, 0);
      // (3+2+2+1+3) * 2 = 22
      expect(result).toBe(22);
    });

    it('should add escolta cost', () => {
      const regency: RegencyStats = {
        comando: 2,
        estrategia: 2,
        administracao: 2,
        politica: 2,
        tecnologia: 2,
        geomancia: 0,
      };
      
      const result = calculateCharacterPowerCost(regency, 5);
      // (2+2+2+2+2) * 2 + 5 = 25
      expect(result).toBe(25);
    });

    it('should handle zero values', () => {
      const regency: RegencyStats = {
        comando: 0,
        estrategia: 0,
        administracao: 0,
        politica: 0,
        tecnologia: 0,
        geomancia: 0,
      };
      
      const result = calculateCharacterPowerCost(regency);
      expect(result).toBe(0);
    });
  });

  describe('createDefaultCharacter', () => {
    it('should create character with akashic theme', () => {
      const result = createDefaultCharacter('akashic');
      
      expect(result.theme).toBe('akashic');
      expect(result.id).toBeDefined();
      expect(result.name).toBe('');
    });

    it('should create character with tenebralux theme', () => {
      const result = createDefaultCharacter('tenebralux');
      
      expect(result.theme).toBe('tenebralux');
    });

    it('should initialize all attributes to 1', () => {
      const result = createDefaultCharacter('akashic');
      
      expect(result.attributes?.conhecimento).toBe(1);
      expect(result.attributes?.raciocinio).toBe(1);
      expect(result.attributes?.corpo).toBe(1);
      expect(result.attributes?.reflexos).toBe(1);
      expect(result.attributes?.determinacao).toBe(1);
      expect(result.attributes?.coordenacao).toBe(1);
      expect(result.attributes?.carisma).toBe(1);
      expect(result.attributes?.intuicao).toBe(1);
    });

    it('should initialize virtues to 0', () => {
      const result = createDefaultCharacter('akashic');
      
      expect(result.virtues?.sabedoria).toBe(0);
      expect(result.virtues?.coragem).toBe(0);
      expect(result.virtues?.perseveranca).toBe(0);
      expect(result.virtues?.harmonia).toBe(0);
    });

    it('should initialize empty arrays', () => {
      const result = createDefaultCharacter('akashic');
      
      expect(result.skills).toEqual({});
      expect(result.blessings).toEqual([]);
      expect(result.equipment).toEqual([]);
    });

    it('should generate unique IDs', () => {
      const char1 = createDefaultCharacter('akashic');
      const char2 = createDefaultCharacter('akashic');
      
      expect(char1.id).not.toBe(char2.id);
    });
  });
});
