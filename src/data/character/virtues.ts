import { ThemeId } from '@/themes/types';

export interface VirtuePower {
  id: string;
  name: string;
  description: string;
}

export interface VirtueLevel {
  level: number;
  name: string;
  description: string;
  powers: [VirtuePower, VirtuePower]; // Sempre 2 opções de poder por nível
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
        powers: [
          { id: 'none_a', name: '-', description: 'Nenhum poder disponível neste nível.' },
          { id: 'none_b', name: '-', description: 'Nenhum poder disponível neste nível.' }
        ]
      },
      { 
        level: 1, 
        name: 'A Busca pelo Conhecimento', 
        description: 'Iniciou a jornada em direção à verdade.',
        powers: [
          { 
            id: 'memoria_eidetica', 
            name: 'Memória Eidética', 
            description: 'Um número de vezes por sessão igual à sua sabedoria, o jogador pode pedir para o mestre lembrá-lo de qualquer informação com detalhes. Além disso, pode somar seu nível de sabedoria nas rolagens de perícias de conhecimento.' 
          },
          { 
            id: 'genio_tatico', 
            name: 'Gênio Tático', 
            description: 'Se o personagem passar um minuto analisando qualquer situação que envolva raciocínio, pode fazer uma rolagem com vantagem. Além disso, em situações de combate, pode somar seu nível de sabedoria na iniciativa.' 
          }
        ]
      },
      { 
        level: 2, 
        name: 'O Despertar da Lucidez', 
        description: 'Compreende as conexões ocultas entre as coisas.',
        powers: [
          { 
            id: 'conhecimento_coletivo', 
            name: 'Conhecimento Coletivo', 
            description: 'O personagem pode acessar a "Anima Mundi", a Alma do Mundo, e buscar conhecimento mesmo que nunca tenha estudado. Um número de vezes por sessão igual à sua sabedoria, pode fazer um teste de conhecimento isolado, com dificuldade normal, de perícias ligadas a conhecimento, mesmo que não as tenha.' 
          },
          { 
            id: 'pensamento_analitico', 
            name: 'Pensamento Analítico', 
            description: 'Todas as habilidades passivas que usam o atributo raciocínio agora podem somar também a sabedoria (se já for somada, agora poderá somá-la dobrada). Além disso, uma vez por sessão pode adicionar sua sabedoria x2 em qualquer teste que envolva raciocínio que tenha falhado.' 
          }
        ]
      },
      { 
        level: 3, 
        name: 'A Integração da Verdade', 
        description: 'Alcançou compreensão profunda da realidade.',
        powers: [
          { 
            id: 'levantando_veu', 
            name: 'Levantando o Véu', 
            description: 'Você toma consciência das ilusões que constroem o pensamento da sociedade. Se meditar 5 minutos sobre qualquer questão, o mestre é obrigado a dar uma resposta curta e sincera. Um número de vezes por sessão igual à sua sabedoria, você pode conferir vantagem a um roll a qualquer aliado que lhe respeite e reconheça essa virtude em você.' 
          },
          { 
            id: 'clarividencia_aplicada', 
            name: 'Clarividência Aplicada', 
            description: 'Compreendendo os padrões da realidade, você consegue prever resultados de ações em curto prazo. Faça uma rolagem de Sabedoria: em resultado 8+, o mestre precisa responder sinceramente o resultado de uma ação futura. Além disso, depois do primeiro round de combate, você soma sua sabedoria na guarda e na evasão.' 
          }
        ]
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
        powers: [
          { id: 'none_a', name: '-', description: 'Nenhum poder disponível neste nível.' },
          { id: 'none_b', name: '-', description: 'Nenhum poder disponível neste nível.' }
        ]
      },
      { 
        level: 1, 
        name: 'O Primeiro Passo', 
        description: 'Deu o primeiro passo contra o medo.',
        powers: [
          { 
            id: 'hipoalgia', 
            name: 'Hipoalgia', 
            description: 'Você diminui sua coragem das penalidades sofridas por causa de dano. Além disso, você soma sua coragem na dificuldade de qualquer tentativa de lhe manipular ou enganar.' 
          },
          { 
            id: 'virtus_maximus', 
            name: 'Virtus Maximus', 
            description: 'Sempre que você demonstrar coragem frente a qualquer situação, seus aliados podem somar sua coragem no próximo roll deles. Caso estejam sofrendo algum efeito adverso, podem fazer uma rolagem para sair dele, com sua coragem como bônus.' 
          }
        ]
      },
      { 
        level: 2, 
        name: 'A Coragem de Sustentar', 
        description: 'Mantém-se firme mesmo em situações desesperadoras.',
        powers: [
          { 
            id: 'furia_tita', 
            name: 'A Fúria do Titã', 
            description: 'Sempre que você derrotar um inimigo sem que ele lhe cause dano, seus inimigos com raio de visão devem fazer um teste de moral, com penalidade igual à sua coragem. Em caso de falha, têm penalidade em todos os rolls de ataque até o fim da cena. Se a falha for maior que 5, fogem do combate temporariamente.' 
          },
          { 
            id: 'movimentos_indecifraves', 
            name: 'Movimentos Indecifráveis', 
            description: 'Sempre que você se mover ao menos 3 pontos de movimento em combate, pode somar sua coragem na guarda. Quando usar seu movimento total, soma sua coragem x2.' 
          }
        ]
      },
      { 
        level: 3, 
        name: 'O Enfrentamento da Sombra', 
        description: 'Transcendeu o medo e inspira outros.',
        powers: [
          { 
            id: 'conexao_akashica', 
            name: 'Conexão Akáshica', 
            description: 'Você pode gastar um ponto de tensão para curar sua coragem em vitalidade. Você só pode usar essa habilidade 1 vez por dia, e ela não pode lhe curar além de 2/3 dos seus pontos de vida. Além disso, você naturalmente se regenera no dobro da velocidade de uma pessoa normal.' 
          },
          { 
            id: 'alma_guerreiro', 
            name: 'Alma de Guerreiro', 
            description: 'Uma vez por cena, você pode gastar um ponto de tensão para diminuir sua coragem x2 da sua reação. Além disso, sempre que estiver enfrentando forças mais poderosas que você, você e seus aliados diminuem coragem/2 (arredondado para baixo) da reação do grupo.' 
          }
        ]
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
        powers: [
          { id: 'none_a', name: '-', description: 'Nenhum poder disponível neste nível.' },
          { id: 'none_b', name: '-', description: 'Nenhum poder disponível neste nível.' }
        ]
      },
      { 
        level: 1, 
        name: 'O Despertar da Responsabilidade', 
        description: 'Assumiu o peso de suas escolhas.',
        powers: [
          { 
            id: 'indomavel', 
            name: 'Indomável', 
            description: 'Um número de vezes por sessão igual à sua perseverança, você pode escolher ter um sucesso automático em qualquer situação cuja falha lhe daria um efeito adverso.' 
          },
          { 
            id: 'maos_precisas', 
            name: 'Mãos Precisas', 
            description: 'Você soma sua perseverança em todas as rolagens de coordenação.' 
          }
        ]
      },
      { 
        level: 2, 
        name: 'O Julgamento das Paixões', 
        description: 'Dominou suas emoções e impulsos.',
        powers: [
          { 
            id: 'alma_mais_pura', 
            name: 'A Alma Mais Pura', 
            description: 'Depois de uma hora de meditação ou reflexão, você pode fazer uma rolagem de determinação + perseverança. A dificuldade é 8 + seus pontos de tensão atuais. Em caso de sucesso, você reduz um ponto de tensão. Você só pode usar essa habilidade uma vez por dia, e recuperar tensão até um limite de perseverança x2.' 
          },
          { 
            id: 'perseguidor_implacavel', 
            name: 'Perseguidor Implacável', 
            description: 'A partir do segundo ataque feito contra um mesmo inimigo, você ganha sua perseverança no dano, caso acerte.' 
          }
        ]
      },
      { 
        level: 3, 
        name: 'A Forja da Resiliência', 
        description: 'Tornou-se inabalável em corpo e espírito.',
        powers: [
          { 
            id: 'per_aspera_ad_astra', 
            name: 'Per Aspera ad Astra', 
            description: 'Você pode escolher uma perícia qualquer e ganhar permanentemente vantagem em todos os rolls feitos com ela. Além disso, você soma sua harmonia nas rolagens dessa perícia e está imune nela aos efeitos de falha crítica. Caso já tenha vantagem por outros meios, adiciona um segundo dado de vantagem.' 
          },
          { 
            id: 'peso_culpa', 
            name: 'O Peso da Culpa', 
            description: 'Na sua presença, indivíduos com conduta criminosa ou notadamente imoral sentem-se inevitavelmente culpados. Faça uma rolagem de Determinação + Intimidação contra a convicção do alvo. Em caso de sucesso, o alvo terá sua perseverança como penalidade em qualquer rolagem, até se afastar de você ou confessar seus crimes.' 
          }
        ]
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
        powers: [
          { id: 'none_a', name: '-', description: 'Nenhum poder disponível neste nível.' },
          { id: 'none_b', name: '-', description: 'Nenhum poder disponível neste nível.' }
        ]
      },
      { 
        level: 1, 
        name: 'A Compreensão das Interdependências', 
        description: 'Percebe como tudo está conectado.',
        powers: [
          { 
            id: 'imponencia', 
            name: 'Imponência', 
            description: 'Ganha vantagem em todas as perícias de carisma e soma sua harmonia x2 na impressão, na primeira vez que conhece alguém.' 
          },
          { 
            id: 'sexto_sentido', 
            name: 'Sexto Sentido', 
            description: 'Seu personagem nunca é pego de surpresa. Além disso, um número de vezes igual à sua harmonia, ele pode perguntar ao mestre se as intenções de algum personagem são hostis ou amistosas, ou se ele está mentindo ou falando a verdade.' 
          }
        ]
      },
      { 
        level: 2, 
        name: 'O Fluxo da Harmonia', 
        description: 'Move-se em sintonia com o universo.',
        powers: [
          { 
            id: 'palavra_encantadora', 
            name: 'A Palavra Encantadora', 
            description: 'Sugestão: Você consegue convencer qualquer um a fazer o que deseja, desde que isso não prejudique o alvo. Você pode gastar um ponto de tensão para ter sucesso automático em rolagens de carisma.' 
          },
          { 
            id: 'caminho_singularidade', 
            name: 'A Caminho da Singularidade', 
            description: 'Um com o Akasha: Você pode gastar um ponto de tensão para somar sua harmonia em qualquer rolagem falhada. Além disso, consegue influenciar pequenas questões do ambiente, como modificar temperatura ou aumentar o nível de determinado elemento.' 
          }
        ]
      },
      { 
        level: 3, 
        name: 'Singularidade e Iluminação', 
        description: 'Alcançou união com o cosmos.',
        powers: [
          { 
            id: 'lideranca_suprema', 
            name: 'Liderança Suprema', 
            description: 'Líder absoluto: De forma natural, qualquer um que entre em contato com você lhe reconhece como um líder capaz. Caso deseje, você acumula fama 2 vezes mais rápido. Em combate, seus aliados são imunes a efeitos adversos de moral. Nos combates em massa, você soma sua harmonia em todas as rolagens, desde que genuinamente se preocupe com o bem-estar das tropas.' 
          },
          { 
            id: 'axioma_final', 
            name: 'O Axioma Final', 
            description: 'Você se torna um instrumento dos Akasha. Enquanto a iluminação de si ou dos outros for seu principal propósito, o universo sempre irá conspirar para salvá-lo. Toda vez que você deveria morrer, você é levado a 1 PV e é retirado de situações de perigo.' 
          }
        ]
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
