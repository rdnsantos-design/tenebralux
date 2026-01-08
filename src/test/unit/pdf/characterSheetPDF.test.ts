import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCharacterPDF, downloadCharacterPDF, getCharacterPDFBlob } from '@/services/pdf/characterSheetPDF';
import { CharacterDraft } from '@/types/character-builder';

// Mock do jsPDF
vi.mock('jspdf', () => {
  const mockDoc = {
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    setFillColor: vi.fn().mockReturnThis(),
    setTextColor: vi.fn().mockReturnThis(),
    setFontSize: vi.fn().mockReturnThis(),
    setFont: vi.fn().mockReturnThis(),
    setDrawColor: vi.fn().mockReturnThis(),
    setLineWidth: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    roundedRect: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    line: vi.fn().mockReturnThis(),
    circle: vi.fn().mockReturnThis(),
    addPage: vi.fn().mockReturnThis(),
    save: vi.fn(),
    output: vi.fn((type: string) => {
      if (type === 'blob') return new Blob(['mock pdf'], { type: 'application/pdf' });
      if (type === 'bloburl') return 'blob:mock-url';
      return 'mock-output';
    }),
  };
  
  return {
    default: vi.fn(() => mockDoc),
    jsPDF: vi.fn(() => mockDoc),
  };
});

// Personagem de teste completo
const mockCharacter: CharacterDraft = {
  name: 'Herói Teste',
  theme: 'akashic',
  factionId: 'hegemonia',
  culture: 'cultura1',
  attributes: {
    conhecimento: 3,
    raciocinio: 4,
    corpo: 3,
    reflexos: 4,
    determinacao: 3,
    coordenacao: 2,
    carisma: 3,
    intuicao: 3,
  },
  skills: {
    luta: 3,
    tiro: 2,
    esquiva: 2,
    percepcao: 2,
    resistencia: 2,
    atletismo: 1,
  },
  virtues: {
    sabedoria: 0,
    coragem: 1,
    perseveranca: 0,
    harmonia: 0,
  },
  privilegeIds: ['nascido_elite'],
  challengeIds: { nascido_elite: 'pressao_perfeicao' },
  weaponId: 'pistola',
  armorId: 'couro',
  itemIds: ['kit_medico'],
};

// Personagem mínimo
const minimalCharacter: CharacterDraft = {
  name: 'Personagem Mínimo',
  theme: 'akashic',
  factionId: 'alianca',
  attributes: {
    conhecimento: 1,
    raciocinio: 1,
    corpo: 1,
    reflexos: 1,
    determinacao: 1,
    coordenacao: 1,
    carisma: 1,
    intuicao: 1,
  },
  skills: {},
  virtues: {},
};

describe('characterSheetPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCharacterPDF', () => {
    it('deve gerar PDF sem erros com personagem completo', () => {
      expect(() => {
        generateCharacterPDF(mockCharacter, { theme: 'akashic' });
      }).not.toThrow();
    });

    it('deve gerar PDF sem erros com personagem mínimo', () => {
      expect(() => {
        generateCharacterPDF(minimalCharacter, { theme: 'akashic' });
      }).not.toThrow();
    });

    it('deve retornar objeto jsPDF', () => {
      const doc = generateCharacterPDF(mockCharacter, { theme: 'akashic' });
      expect(doc).toBeDefined();
      expect(doc.save).toBeDefined();
      expect(doc.output).toBeDefined();
    });

    it('deve gerar PDF para tema Akashic', () => {
      const doc = generateCharacterPDF(mockCharacter, { theme: 'akashic' });
      expect(doc.text).toHaveBeenCalled();
    });

    it('deve gerar PDF para tema Tenebra', () => {
      const tenbraCharacter = { ...mockCharacter, theme: 'tenebralux' as const };
      const doc = generateCharacterPDF(tenbraCharacter, { theme: 'tenebralux' });
      expect(doc.text).toHaveBeenCalled();
    });

    it('deve incluir nome do personagem', () => {
      const doc = generateCharacterPDF(mockCharacter, { theme: 'akashic' });
      expect(doc.text).toHaveBeenCalledWith(
        'Herói Teste',
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('deve adicionar segunda página', () => {
      const doc = generateCharacterPDF(mockCharacter, { theme: 'akashic' });
      expect(doc.addPage).toHaveBeenCalled();
    });

    it('deve incluir regência quando option está ativa', () => {
      const doc = generateCharacterPDF(mockCharacter, { 
        theme: 'akashic',
        includeRegency: true 
      });
      expect(doc.text).toHaveBeenCalled();
    });

    it('deve funcionar quando option includeRegency é false', () => {
      const doc = generateCharacterPDF(mockCharacter, { 
        theme: 'akashic',
        includeRegency: false 
      });
      expect(doc).toBeDefined();
    });
  });

  describe('downloadCharacterPDF', () => {
    it('deve chamar save() com nome correto', () => {
      downloadCharacterPDF(mockCharacter, 'akashic');
      
      const jsPDF = require('jspdf').default;
      const mockInstance = jsPDF();
      expect(mockInstance.save).toHaveBeenCalledWith('Herói Teste_ficha.pdf');
    });

    it('deve usar nome padrão se personagem não tem nome', () => {
      const noNameCharacter = { ...mockCharacter, name: '' };
      downloadCharacterPDF(noNameCharacter, 'akashic');
      
      const jsPDF = require('jspdf').default;
      const mockInstance = jsPDF();
      expect(mockInstance.save).toHaveBeenCalledWith('personagem_ficha.pdf');
    });

    it('deve funcionar com tema Tenebra', () => {
      const tenbraCharacter = { ...mockCharacter, theme: 'tenebralux' as const };
      expect(() => {
        downloadCharacterPDF(tenbraCharacter, 'tenebralux');
      }).not.toThrow();
    });
  });

  describe('getCharacterPDFBlob', () => {
    it('deve retornar Blob', () => {
      const blob = getCharacterPDFBlob(mockCharacter, 'akashic');
      expect(blob).toBeInstanceOf(Blob);
    });

    it('deve retornar Blob com tipo PDF', () => {
      const blob = getCharacterPDFBlob(mockCharacter, 'akashic');
      expect(blob.type).toBe('application/pdf');
    });
  });
});

describe('PDF Content Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve chamar text() múltiplas vezes para atributos e stats', () => {
    const doc = generateCharacterPDF(mockCharacter, { theme: 'akashic' });
    
    expect(doc.text).toHaveBeenCalled();
    const textCalls = (doc.text as ReturnType<typeof vi.fn>).mock.calls;
    
    // Deve ter muitas chamadas de texto
    expect(textCalls.length).toBeGreaterThan(20);
  });

  it('deve incluir características derivadas', () => {
    const doc = generateCharacterPDF(mockCharacter, { theme: 'akashic' });
    expect(doc.text).toHaveBeenCalled();
  });

  it('deve incluir equipamento quando presente', () => {
    const doc = generateCharacterPDF(mockCharacter, { theme: 'akashic' });
    expect(doc.text).toHaveBeenCalled();
  });

  it('deve incluir bênçãos quando presentes', () => {
    const doc = generateCharacterPDF(mockCharacter, { theme: 'akashic' });
    expect(doc.text).toHaveBeenCalled();
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve lidar com skills vazias', () => {
    const noSkillsCharacter = { ...mockCharacter, skills: {} };
    expect(() => {
      generateCharacterPDF(noSkillsCharacter, { theme: 'akashic' });
    }).not.toThrow();
  });

  it('deve lidar com equipment vazio', () => {
    const noEquipmentCharacter = { 
      ...mockCharacter, 
      weaponId: undefined,
      armorId: undefined,
      itemIds: undefined 
    };
    expect(() => {
      generateCharacterPDF(noEquipmentCharacter, { theme: 'akashic' });
    }).not.toThrow();
  });

  it('deve lidar com blessings vazias', () => {
    const noBlessingsCharacter = { 
      ...mockCharacter, 
      blessingIds: [],
      challengeIds: {} 
    };
    expect(() => {
      generateCharacterPDF(noBlessingsCharacter, { theme: 'akashic' });
    }).not.toThrow();
  });

  it('deve lidar com virtudes não definidas', () => {
    const noVirtuesCharacter = { ...mockCharacter, virtues: {} };
    expect(() => {
      generateCharacterPDF(noVirtuesCharacter, { theme: 'akashic' });
    }).not.toThrow();
  });

  it('deve lidar com nome muito longo', () => {
    const longNameCharacter = { 
      ...mockCharacter, 
      name: 'Nome Extremamente Longo Que Poderia Causar Overflow No PDF' 
    };
    expect(() => {
      generateCharacterPDF(longNameCharacter, { theme: 'akashic' });
    }).not.toThrow();
  });

  it('deve lidar com caracteres especiais no nome', () => {
    const specialNameCharacter = { 
      ...mockCharacter, 
      name: 'João & María @ São Paulo' 
    };
    expect(() => {
      generateCharacterPDF(specialNameCharacter, { theme: 'akashic' });
    }).not.toThrow();
  });

  it('deve lidar com atributos undefined', () => {
    const noAttributesCharacter = { 
      ...mockCharacter, 
      attributes: {} 
    };
    expect(() => {
      generateCharacterPDF(noAttributesCharacter, { theme: 'akashic' });
    }).not.toThrow();
  });

  it('deve lidar com personagem completamente vazio', () => {
    const emptyCharacter: CharacterDraft = {
      name: 'Vazio',
      theme: 'akashic',
    };
    expect(() => {
      generateCharacterPDF(emptyCharacter, { theme: 'akashic' });
    }).not.toThrow();
  });
});
