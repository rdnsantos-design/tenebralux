import { ThemeId } from '@/themes/types';

export interface VirtueLevel {
  level: number;
  name: string;
  description: string;
  benefits?: string[];
}

export interface VirtueDefinition {
  id: string;
  name: string;
  latin: string;
  color: string;
  icon: string;
  attributes: string[];
  description: string;
  levels: VirtueLevel[];
}

export const VIRTUES: VirtueDefinition[] = [
  {
    id: 'sabedoria',
    name: 'Sabedoria',
    latin: 'Gnosis',
    color: '#3498db',
    icon: 'Sparkles',
    attributes: ['conhecimento', 'raciocinio'],
    description: 'A busca pela verdade e compreensão do universo.',
    levels: [
      { 
        level: 0, 
        name: 'Não Desperto', 
        description: 'Ainda não trilhou o caminho da sabedoria.',
        benefits: []
      },
      { 
        level: 1, 
        name: 'A Busca pelo Conhecimento', 
        description: 'Iniciou a jornada em direção à verdade.',
        benefits: ['+1 dado em testes de Conhecimento ou Raciocínio 1x/sessão']
      },
      { 
        level: 2, 
        name: 'O Despertar da Lucidez', 
        description: 'Compreende as conexões ocultas entre as coisas.',
        benefits: ['Pode gastar Tensão para re-rolar teste mental', '+1 Pesquisa permanente']
      },
      { 
        level: 3, 
        name: 'A Integração da Verdade', 
        description: 'Alcançou compreensão profunda da realidade.',
        benefits: ['Imune a ilusões e enganos', 'Pode meditar para recuperar Tensão']
      },
    ]
  },
  {
    id: 'coragem',
    name: 'Coragem',
    latin: 'Virtus',
    color: '#e74c3c',
    icon: 'Sword',
    attributes: ['corpo', 'reflexos'],
    description: 'A força para enfrentar o medo e proteger os outros.',
    levels: [
      { 
        level: 0, 
        name: 'Não Desperto', 
        description: 'Ainda não enfrentou seus medos.',
        benefits: []
      },
      { 
        level: 1, 
        name: 'O Primeiro Passo', 
        description: 'Deu o primeiro passo contra o medo.',
        benefits: ['+1 dado em testes de Corpo ou Reflexos quando protegendo aliados']
      },
      { 
        level: 2, 
        name: 'A Coragem de Sustentar', 
        description: 'Mantém-se firme mesmo em situações desesperadoras.',
        benefits: ['Ignora penalidades de ferimentos leves', '+1 Bravura permanente']
      },
      { 
        level: 3, 
        name: 'O Enfrentamento da Sombra', 
        description: 'Transcendeu o medo e inspira outros.',
        benefits: ['Imune a efeitos de medo', 'Aliados próximos ganham +1 em Bravura']
      },
    ]
  },
  {
    id: 'perseveranca',
    name: 'Perseverança',
    latin: 'Constantia',
    color: '#f39c12',
    icon: 'Mountain',
    attributes: ['determinacao', 'coordenacao'],
    description: 'A resiliência para superar qualquer obstáculo.',
    levels: [
      { 
        level: 0, 
        name: 'Não Desperto', 
        description: 'Ainda não testou seus limites.',
        benefits: []
      },
      { 
        level: 1, 
        name: 'O Despertar da Responsabilidade', 
        description: 'Assumiu o peso de suas escolhas.',
        benefits: ['+1 dado em testes de resistência ou sobrevivência']
      },
      { 
        level: 2, 
        name: 'O Julgamento das Paixões', 
        description: 'Dominou suas emoções e impulsos.',
        benefits: ['+2 Tensão Máxima', '+1 Autocontrole permanente']
      },
      { 
        level: 3, 
        name: 'A Forja da Resiliência', 
        description: 'Tornou-se inabalável em corpo e espírito.',
        benefits: ['Reduz todo dano recebido em 1', 'Recupera 1 Vitalidade por cena']
      },
    ]
  },
  {
    id: 'harmonia',
    name: 'Harmonia',
    latin: 'Ágape',
    color: '#9b59b6',
    icon: 'Users',
    attributes: ['carisma', 'intuicao'],
    description: 'A conexão com os outros e o equilíbrio interior.',
    levels: [
      { 
        level: 0, 
        name: 'Não Desperto', 
        description: 'Ainda não encontrou seu lugar no todo.',
        benefits: []
      },
      { 
        level: 1, 
        name: 'A Compreensão das Interdependências', 
        description: 'Percebe como tudo está conectado.',
        benefits: ['+1 dado em testes sociais com NPCs neutros']
      },
      { 
        level: 2, 
        name: 'O Fluxo da Harmonia', 
        description: 'Move-se em sintonia com o universo.',
        benefits: ['Pode sentir intenções hostis', '+1 Empatia permanente']
      },
      { 
        level: 3, 
        name: 'Singularidade e Iluminação', 
        description: 'Alcançou união com o cosmos.',
        benefits: ['Pode curar 1 Vontade de aliado por cena', 'Imune a manipulação']
      },
    ]
  },
];

// Mapeamento de facção/cultura para virtude inicial
export const FACTION_STARTING_VIRTUES: Record<string, string | 'choice'> = {
  // Akashic - Facções
  'confederacao': 'harmonia',
  'corporacoes': 'perseveranca',
  'tecnocracia': 'sabedoria',
  'fronteira': 'coragem',
  'sindicato': 'perseveranca',
  // Tenebra - Facções
  'anuire': 'coragem',
  'khinasi': 'sabedoria',
  'rjurik': 'coragem',
  'brecht': 'perseveranca',
  'vos': 'coragem',
  // Se nenhuma facção, escolha livre
  'none': 'choice',
};

export function getVirtueById(id: string): VirtueDefinition | undefined {
  return VIRTUES.find(v => v.id === id);
}

export function getVirtueByAttribute(attributeId: string): VirtueDefinition | undefined {
  return VIRTUES.find(v => v.attributes.includes(attributeId));
}

export function getStartingVirtue(factionId?: string): string | 'choice' {
  if (!factionId) return 'choice';
  return FACTION_STARTING_VIRTUES[factionId] || 'choice';
}
