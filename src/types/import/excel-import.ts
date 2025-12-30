// ========================
// IMPORTAÇÃO EXCEL
// ========================

export interface ImportedUnit {
  name: string;
  movement: number;
  defense: number;
  morale: number;
  attack: number;
  charge: number;      // Carga
  ranged: number;      // Tiro
  ability: string;     // Habilidade
  experience: string;  // Experiência
  power: number;       // Poder
  maintenance: number; // Manutenção
}

export interface ExcelImport {
  id: string;
  fileName: string;
  importDate: Date;
  unitCount: number;
  units: ImportedUnit[];
}
