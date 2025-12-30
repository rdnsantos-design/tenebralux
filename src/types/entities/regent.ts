// ========================
// REGENTE - Fonte única de verdade
// ========================

export interface Regent {
  id: string;
  code?: string;
  name: string;
  full_name?: string;
  notes?: string;
  // Campos para gestão de exércitos
  character?: string; // jogador que controla
  domain?: string; // domínio do regente
  gold_bars: number; // GB - Gold Bars
  regency_points: number; // RP - Regency Points
  comando: number; // perícia de comando (1-5)
  estrategia: number; // perícia de estratégia (1-5)
  created_at: string;
  updated_at: string;
}
