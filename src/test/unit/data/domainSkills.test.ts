import { describe, it, expect } from 'vitest';
import { 
  DOMAIN_SKILL_DEFINITIONS,
  calculateRegencia,
  calculateDomainSkills,
  getDomainSkillById,
  getAllDomainSkills
} from '@/data/character/domainSkills';

describe('DOMAIN_SKILL_DEFINITIONS', () => {
  it('deve conter 5 perícias de domínio', () => {
    expect(DOMAIN_SKILL_DEFINITIONS).toHaveLength(5);
  });

  it('deve ter IDs únicos', () => {
    const ids = DOMAIN_SKILL_DEFINITIONS.map(skill => skill.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('deve conter as perícias esperadas', () => {
    const expectedIds = ['seguranca', 'industria', 'comercio', 'politica', 'inovacao'];
    const ids = DOMAIN_SKILL_DEFINITIONS.map(skill => skill.id);
    
    expectedIds.forEach(expected => {
      expect(ids).toContain(expected);
    });
  });

  it('cada perícia deve ter estrutura válida', () => {
    DOMAIN_SKILL_DEFINITIONS.forEach(skill => {
      expect(skill).toHaveProperty('id');
      expect(skill).toHaveProperty('name');
      expect(skill).toHaveProperty('formula');
      expect(skill).toHaveProperty('requiredSkillId');
      expect(skill).toHaveProperty('icon');
      expect(skill).toHaveProperty('description');
      expect(typeof skill.id).toBe('string');
      expect(typeof skill.name).toBe('string');
    });
  });
});

describe('calculateRegencia', () => {
  it('deve calcular Regência = Intuição + Administração', () => {
    const result = calculateRegencia(3, { administracao: 2 });
    expect(result).toBe(5);
  });

  it('deve retornar apenas Intuição se Administração não existir', () => {
    const result = calculateRegencia(4, {});
    expect(result).toBe(4);
  });

  it('deve funcionar com valores zero', () => {
    const result = calculateRegencia(0, { administracao: 0 });
    expect(result).toBe(0);
  });
});

describe('calculateDomainSkills', () => {
  const mockSkills = {
    administracao: 2,
    militarismo: 3,
    engenharia: 2,
    persuasao: 4,
    empatia: 3,
    pesquisa: 2,
  };

  it('deve calcular Regência corretamente', () => {
    const result = calculateDomainSkills(3, mockSkills);
    // Regência = Intuição (3) + Administração (2) = 5
    expect(result.regencia).toBe(5);
  });

  it('deve calcular Segurança = (Regência + Militarismo) / 2', () => {
    const result = calculateDomainSkills(3, mockSkills);
    // Regência = 5, Militarismo = 3
    // (5 + 3) / 2 = 4
    expect(result.seguranca).toBe(4);
  });

  it('deve calcular Indústria = (Regência + Engenharia) / 2', () => {
    const result = calculateDomainSkills(3, mockSkills);
    // Regência = 5, Engenharia = 2
    // (5 + 2) / 2 = 3.5 → floor = 3
    expect(result.industria).toBe(3);
  });

  it('deve calcular Comércio = (Regência + Persuasão) / 2', () => {
    const result = calculateDomainSkills(3, mockSkills);
    // Regência = 5, Persuasão = 4
    // (5 + 4) / 2 = 4.5 → floor = 4
    expect(result.comercio).toBe(4);
  });

  it('deve calcular Política = (Regência + Empatia) / 2', () => {
    const result = calculateDomainSkills(3, mockSkills);
    // Regência = 5, Empatia = 3
    // (5 + 3) / 2 = 4
    expect(result.politica).toBe(4);
  });

  it('deve calcular Inovação = (Regência + Pesquisa) / 2', () => {
    const result = calculateDomainSkills(3, mockSkills);
    // Regência = 5, Pesquisa = 2
    // (5 + 2) / 2 = 3.5 → floor = 3
    expect(result.inovacao).toBe(3);
  });

  it('deve usar floor para resultados ímpares', () => {
    // Regência = 1 + 0 = 1
    // Segurança = (1 + 2) / 2 = 1.5 → floor = 1
    const result = calculateDomainSkills(1, { militarismo: 2 });
    expect(result.seguranca).toBe(1);
  });

  it('deve retornar 0 para perícias não definidas', () => {
    const result = calculateDomainSkills(2, {});
    expect(result.regencia).toBe(2); // só intuição
    expect(result.seguranca).toBe(1); // (2 + 0) / 2 = 1
  });
});

describe('getDomainSkillById', () => {
  it('deve retornar perícia pelo ID', () => {
    const skill = getDomainSkillById('seguranca');
    expect(skill).toBeDefined();
    expect(skill?.name).toBe('Segurança');
  });

  it('deve retornar undefined para ID inválido', () => {
    const skill = getDomainSkillById('invalid_id');
    expect(skill).toBeUndefined();
  });
});

describe('getAllDomainSkills', () => {
  it('deve retornar todas as perícias', () => {
    const skills = getAllDomainSkills();
    expect(skills).toHaveLength(5);
    expect(skills).toEqual(DOMAIN_SKILL_DEFINITIONS);
  });
});
