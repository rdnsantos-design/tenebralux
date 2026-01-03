import { ThemeId } from '@/themes/types';

// === IDENTIFICAÇÃO ===
export interface BaseEntity {
  id: string;
  name: string;
  description?: string;
  theme: ThemeId;
  created_at?: string;
  updated_at?: string;
}

// === ATRIBUTOS DO PERSONAGEM (RPG) ===
export interface CharacterAttributes {
  conhecimento: number;
  raciocinio: number;
  corpo: number;
  reflexos: number;
  determinacao: number;
  coordenacao: number;
  carisma: number;
  intuicao: number;
}

// === VIRTUDES ===
export interface CharacterVirtues {
  sabedoria: number;   // 0-3
  coragem: number;     // 0-3
  perseveranca: number; // 0-3
  harmonia: number;    // 0-3
}

// === STATS DERIVADOS ===
export interface DerivedStats {
  // Combate Físico
  vitalidade: number;
  evasao: number;
  guarda: number;
  reacao: number;
  movimento: number;
  
  // Combate Social
  vontade: number;
  conviccao: number;
  influencia: number;
  
  // Recursos
  tensaoMaxima: number;
  fortitude: number;
}

// === STATS DE COMANDO (para batalhas) ===
export interface CommandStats {
  strategy: number;    // Estratégia (1-6)
  command: number;     // Comando (1-6)
  guard: number;       // Guarda (1-6)
}

// === STATS DE DOMÍNIO (para 4X) ===
export interface DomainStats {
  administration: number;
  bloodline?: number;
  regencyPoints: number;
}

// === EXPERIÊNCIA ===
export type ExperienceLevel = 
  | 'Amador' 
  | 'Recruta' 
  | 'Profissional' 
  | 'Veterano' 
  | 'Elite' 
  | 'Lendário';

// === CULTURA ===
export interface Culture {
  id: string;
  name: string;
  theme: ThemeId;
  description?: string;
  bonuses?: Record<string, number>;
}
