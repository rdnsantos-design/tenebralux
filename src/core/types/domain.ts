import { BaseEntity } from './base';

// === TIPO DE HOLDING ===
export type HoldingType = 
  | 'Law'        // Fortaleza / Base militar
  | 'Temple'     // Templo / Centro espiritual
  | 'Guild'      // Guilda / Corporação
  | 'Source';    // Fonte mágica / Nexo de energia

// === HOLDING ===
export interface Holding extends BaseEntity {
  provinceId: string;
  regentId?: string;
  holdingType: HoldingType;
  level: number; // 0-10
}

// === PROVÍNCIA ===
export interface Province extends BaseEntity {
  realmId?: string;
  
  // Níveis
  development: number;    // Nível de desenvolvimento (0-10)
  magic: number;          // Nível de magia/tecnologia (0-10)
  
  // Terreno
  terrainType?: string;
  
  // Holdings nesta província
  holdings?: Holding[];
  
  // Controle
  lawRegentId?: string;
}

// === REINO/DOMÍNIO ===
export interface Realm extends BaseEntity {
  // Regente (pode ser um Character)
  regentId?: string;
  regentCharacterId?: string;
  
  // Cultura
  culture?: string;
  region?: string;
  
  // Províncias
  provinces?: Province[];
  
  // Exércitos
  armies?: import('./army').Army[];
  
  // Recursos
  treasury: number;           // Ouro/Créditos
  regencyPoints: number;      // Pontos de Regência/Influência
  
  // Status
  vassalOf?: string;          // ID do realm suserano
}
