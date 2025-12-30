// ========================
// LOCALIZAÇÕES (Legacy - para importação)
// ========================

export interface Province {
  id: string;
  name: string;
  countryId: string;
}

export interface Country {
  id: string;
  name: string;
  provinces: Province[];
}

export interface LocationImport {
  id: string;
  fileName: string;
  importDate: Date;
  countries: Country[];
}
