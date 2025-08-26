export interface ExcelImport {
  id: string;
  fileName: string;
  importDate: Date;
  unitCount: number;
  units: Array<{
    name: string;
    attack: number;
    defense: number;
    ranged: number;
    movement: number;
    morale: number;
  }>;
}