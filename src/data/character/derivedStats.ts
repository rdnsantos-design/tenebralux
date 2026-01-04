export interface DerivedStatDefinition {
  id: string;
  name: string;
  formula: string;
  category: 'physical' | 'social' | 'resources';
}

export const DERIVED_STATS: DerivedStatDefinition[] = [
  // Combate Físico
  { id: 'vitalidade', name: 'Vitalidade', formula: 'Corpo × 2 + Resistência', category: 'physical' },
  { id: 'evasao', name: 'Evasão', formula: 'Reflexos × 2 + Instinto', category: 'physical' },
  { id: 'guarda', name: 'Guarda', formula: 'Reflexos × 2 + Esquiva + Armadura', category: 'physical' },
  { id: 'reacao', name: 'Reação', formula: 'Intuição + Reflexos + Prontidão', category: 'physical' },
  { id: 'movimento', name: 'Movimento', formula: 'Corpo × 2 + Atletismo', category: 'physical' },
  
  // Combate Social
  { id: 'vontade', name: 'Vontade', formula: 'Raciocínio × 2 + Resiliência', category: 'social' },
  { id: 'conviccao', name: 'Convicção', formula: 'Lógica + Determinação', category: 'social' },
  { id: 'influencia', name: 'Influência', formula: 'Carisma', category: 'social' },
  
  // Recursos
  { id: 'tensao', name: 'Tensão Máxima', formula: 'Raciocínio + Determinação', category: 'resources' },
  { id: 'fortitude', name: 'Fortitude', formula: 'Autocontrole', category: 'resources' },
];

export function getDerivedStatsByCategory(category: 'physical' | 'social' | 'resources'): DerivedStatDefinition[] {
  return DERIVED_STATS.filter(s => s.category === category);
}
