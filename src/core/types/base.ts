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

// === STATS DERIVADOS (CORRIGIDO) ===
export interface DerivedStats {
  // Combate Físico
  vitalidade: number;   // Corpo×2 + Resistência
  evasao: number;       // Reflexos×2 + Instinto
  guarda: number;       // Reflexos×2 + Esquiva + Armadura
  reacao: number;       // Intuição + Reflexos + Prontidão
  movimento: number;    // Corpo×2 + Atletismo
  
  // Combate Social
  vontade: number;      // Raciocínio×2 + Resiliência
  conviccao: number;    // Lógica + Determinação
  influencia: number;   // Carisma
  
  // Recursos
  tensao: number;       // Raciocínio + Determinação
  fortitude: number;    // Autocontrole
}

// === STATS DE REGÊNCIA (NOVO - substitui CommandStats) ===
export interface RegencyStats {
  comando: number;       // Carisma + Pesquisa
  estrategia: number;    // Raciocínio + Militarismo
  administracao: number; // Raciocínio + Economia
  politica: number;      // Raciocínio + Diplomacia
  tecnologia: number;    // Conhecimento + Engenharia (Akashic)
  geomancia: number;     // Conhecimento + Arcanismo (Tenebra)
}

// === STATS DE COMANDO (DEPRECADO - usar RegencyStats) ===
// Mantido para compatibilidade temporária
export interface CommandStats {
  strategy: number;    // Mapeado de estrategia
  command: number;     // Mapeado de comando
  guard: number;       // Calculado: floor(guarda / 3)
}

// === STATS DE DOMÍNIO ===
export interface DomainStats {
  administration: number;  // Mapeado de administracao
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
