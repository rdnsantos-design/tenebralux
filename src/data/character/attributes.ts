import { ThemeId } from '@/themes/types';

export interface AttributeDefinition {
  id: string;
  name: string;
  virtueId: string;
  icon: string;
  description: {
    akashic: string;
    tenebralux: string;
  };
}

export const ATTRIBUTES: AttributeDefinition[] = [
  {
    id: 'conhecimento',
    name: 'Conhecimento',
    virtueId: 'sabedoria',
    icon: 'BookOpen',
    description: {
      akashic: 'Educação formal, ciências e dados',
      tenebralux: 'Educação formal, história e tradições',
    },
  },
  {
    id: 'raciocinio',
    name: 'Raciocínio',
    virtueId: 'sabedoria',
    icon: 'Brain',
    description: {
      akashic: 'Lógica, análise e processamento',
      tenebralux: 'Lógica, dedução e raciocínio',
    },
  },
  {
    id: 'corpo',
    name: 'Corpo',
    virtueId: 'coragem',
    icon: 'Dumbbell',
    description: {
      akashic: 'Força física, resistência e saúde',
      tenebralux: 'Força física, resistência e saúde',
    },
  },
  {
    id: 'reflexos',
    name: 'Reflexos',
    virtueId: 'coragem',
    icon: 'Zap',
    description: {
      akashic: 'Velocidade de reação, agilidade',
      tenebralux: 'Velocidade de reação, agilidade',
    },
  },
  {
    id: 'determinacao',
    name: 'Determinação',
    virtueId: 'perseveranca',
    icon: 'Target',
    description: {
      akashic: 'Força de vontade, foco mental',
      tenebralux: 'Força de vontade, foco mental',
    },
  },
  {
    id: 'coordenacao',
    name: 'Coordenação',
    virtueId: 'perseveranca',
    icon: 'Crosshair',
    description: {
      akashic: 'Precisão, controle motor fino',
      tenebralux: 'Precisão, controle motor fino',
    },
  },
  {
    id: 'carisma',
    name: 'Carisma',
    virtueId: 'harmonia',
    icon: 'Heart',
    description: {
      akashic: 'Presença, influência social',
      tenebralux: 'Presença, influência social',
    },
  },
  {
    id: 'intuicao',
    name: 'Intuição',
    virtueId: 'harmonia',
    icon: 'Eye',
    description: {
      akashic: 'Percepção, sexto sentido',
      tenebralux: 'Percepção, sexto sentido',
    },
  },
];

export const ATTRIBUTE_IDS = ATTRIBUTES.map(a => a.id);

export function getAttributesByVirtue(virtueId: string): AttributeDefinition[] {
  return ATTRIBUTES.filter(a => a.virtueId === virtueId);
}

export function getAttributeById(id: string): AttributeDefinition | undefined {
  return ATTRIBUTES.find(a => a.id === id);
}
