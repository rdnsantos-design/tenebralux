export interface VirtueDefinition {
  id: string;
  name: string;
  latin: string;
  color: string;
  icon: string;
  attributes: string[];
}

export const VIRTUES: VirtueDefinition[] = [
  {
    id: 'sabedoria',
    name: 'Sabedoria',
    latin: 'Sophia',
    color: '#3498db',
    icon: 'Sparkles',
    attributes: ['conhecimento', 'raciocinio'],
  },
  {
    id: 'coragem',
    name: 'Coragem',
    latin: 'Dynamis',
    color: '#e74c3c',
    icon: 'Sword',
    attributes: ['corpo', 'reflexos'],
  },
  {
    id: 'perseveranca',
    name: 'Perseverança',
    latin: 'Aequitas',
    color: '#f39c12',
    icon: 'Mountain',
    attributes: ['determinacao', 'coordenacao'],
  },
  {
    id: 'harmonia',
    name: 'Harmonia',
    latin: 'Ágape',
    color: '#9b59b6',
    icon: 'Users',
    attributes: ['carisma', 'intuicao'],
  },
];

export function getVirtueById(id: string): VirtueDefinition | undefined {
  return VIRTUES.find(v => v.id === id);
}

export function getVirtueByAttribute(attributeId: string): VirtueDefinition | undefined {
  return VIRTUES.find(v => v.attributes.includes(attributeId));
}
