import { ThemeId } from '@/themes/types';

export interface ChallengeDefinition {
  id: string;
  name: string;
  description: string;
  effect?: string;
}

export interface PrivilegeDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  effect?: string;
  challenges: [ChallengeDefinition, ChallengeDefinition]; // Sempre exatamente 2 desafios
}

export interface PrivilegeCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const PRIVILEGE_CATEGORIES: PrivilegeCategory[] = [
  { id: 'recursos', name: 'Recursos e Status', icon: 'Coins', color: '#f39c12' },
  { id: 'educacao', name: 'Educação e Cultura', icon: 'GraduationCap', color: '#3498db' },
  { id: 'genetica', name: 'Genética e Saúde', icon: 'Dna', color: '#27ae60' },
  { id: 'conexoes', name: 'Conexões e Influência', icon: 'Users', color: '#9b59b6' },
  { id: 'talento', name: 'Talentos Naturais', icon: 'Sparkles', color: '#e74c3c' },
];

export const PRIVILEGES: PrivilegeDefinition[] = [
  // RECURSOS E STATUS
  {
    id: 'nascido_elite',
    name: 'Nascido na Elite',
    category: 'recursos',
    description: 'Nasceu em família com grande riqueza e conexões sociais.',
    effect: 'Começa com equipamento de qualidade superior e 3x mais créditos iniciais.',
    challenges: [
      { 
        id: 'pressao_perfeicao', 
        name: 'Pressão da Perfeição', 
        description: 'A família espera excelência absoluta em tudo.',
        effect: 'Testes de Autocontrole em situações de falha pública. -1 em Superação quando observado.'
      },
      { 
        id: 'arrogancia_nobreza', 
        name: 'Arrogância da Nobreza', 
        description: 'Comportamento elitista dificulta conexões com pessoas comuns.',
        effect: '+1 dificuldade em testes sociais com classes inferiores. Visto como esnobe.'
      }
    ]
  },
  {
    id: 'conexoes_politicas',
    name: 'Conexões Políticas',
    category: 'recursos',
    description: 'Família com influência política. Portas se abrem para você.',
    effect: '+1 em Diplomacia quando tratando com autoridades.',
    challenges: [
      { 
        id: 'obrigacoes_familiares', 
        name: 'Obrigações Familiares', 
        description: 'Deve favores à família e pode ser convocado.',
        effect: 'Periodicamente deve cumprir missões ou favores para a família.'
      },
      { 
        id: 'inimigos_herdados', 
        name: 'Inimigos Herdados', 
        description: 'Rivais políticos da família te perseguem.',
        effect: 'Tem inimigos poderosos que não escolheu ter.'
      }
    ]
  },
  
  // EDUCAÇÃO E CULTURA
  {
    id: 'educacao_elite',
    name: 'Educação de Elite',
    category: 'educacao',
    description: 'Formação nas melhores instituições.',
    effect: '+1 em Conhecimento. Bônus em perícias científicas.',
    challenges: [
      { 
        id: 'distante_realidade', 
        name: 'Distante da Realidade', 
        description: 'Educação teórica não preparou para a vida real.',
        effect: '-1 em Sobrevivência e situações práticas de rua.'
      },
      { 
        id: 'arrogancia_intelectual', 
        name: 'Arrogância Intelectual', 
        description: 'Menospreza quem considera menos instruído.',
        effect: '-1 em Empatia com pessoas "menos educadas".'
      }
    ]
  },
  {
    id: 'poliglota',
    name: 'Poliglota Natural',
    category: 'educacao',
    description: 'Facilidade extraordinária com idiomas.',
    effect: '+2 em Línguas. Aprende idiomas em metade do tempo.',
    challenges: [
      { 
        id: 'sotaque_marcante', 
        name: 'Sotaque Marcante', 
        description: 'Seu modo de falar te identifica facilmente.',
        effect: '-1 em Furtividade social. Facilmente rastreável.'
      },
      { 
        id: 'mistura_idiomas', 
        name: 'Mistura Idiomas', 
        description: 'Sob stress, confunde palavras de diferentes línguas.',
        effect: 'Sob stress, teste Autocontrole ou falha em comunicação.'
      }
    ]
  },
  {
    id: 'treinamento_marcial',
    name: 'Treinamento Marcial',
    category: 'educacao',
    description: 'Treinamento intensivo em artes marciais desde jovem.',
    effect: '+1 em Combate Corpo a Corpo. Conhece técnicas avançadas.',
    challenges: [
      { 
        id: 'disciplina_rigida', 
        name: 'Disciplina Rígida', 
        description: 'Treinamento brutal deixou marcas psicológicas.',
        effect: 'Dificuldade em relaxar ou se divertir. -1 em situações sociais informais.'
      },
      { 
        id: 'sede_combate', 
        name: 'Sede de Combate', 
        description: 'Instinto de lutar difícil de controlar.',
        effect: 'Teste Autocontrole para evitar confrontos físicos.'
      }
    ]
  },
  
  // GENÉTICA E SAÚDE
  {
    id: 'resistencia_sobrehumana',
    name: 'Resistência Sobrehumana',
    category: 'genetica',
    description: 'Sistema imunológico excepcional e resistência física.',
    effect: '+1 em Corpo. Vantagem contra doenças e venenos.',
    challenges: [
      { 
        id: 'descuidado_saude', 
        name: 'Descuidado com a Saúde', 
        description: 'Nunca ficou doente, ignora sinais de alerta.',
        effect: '-1 para perceber ferimentos próprios. Pode não notar envenenamento.'
      },
      { 
        id: 'dores_cronicas', 
        name: 'Dores Crônicas', 
        description: 'Resistência veio com custo de dores constantes.',
        effect: '-1 em testes de Concentração. Dificuldade para dormir.'
      }
    ]
  },
  {
    id: 'beleza_natural',
    name: 'Beleza Natural',
    category: 'genetica',
    description: 'Traços físicos excepcionalmente atraentes.',
    effect: '+1 em Persuasão e Performance.',
    challenges: [
      { 
        id: 'vaidade', 
        name: 'Vaidade', 
        description: 'Extremamente preocupado com aparência.',
        effect: '-1 em Bravura quando aparência está ameaçada.'
      },
      { 
        id: 'objetificado', 
        name: 'Objetificado', 
        description: 'Pessoas não levam você a sério.',
        effect: '-1 em Intimidação. Subestimado frequentemente.'
      }
    ]
  },
  {
    id: 'reflexos_excepcionais',
    name: 'Reflexos Excepcionais',
    category: 'genetica',
    description: 'Tempo de reação muito acima da média.',
    effect: '+1 em Reflexos. Vantagem em iniciativa.',
    challenges: [
      { 
        id: 'hiperativo', 
        name: 'Hiperativo', 
        description: 'Dificuldade em ficar parado ou esperar.',
        effect: '-1 em testes que exigem paciência ou espera prolongada.'
      },
      { 
        id: 'reacao_exagerada', 
        name: 'Reação Exagerada', 
        description: 'Responde a ameaças antes de pensar.',
        effect: 'Teste Autocontrole para não reagir impulsivamente a sustos.'
      }
    ]
  },
  
  // CONEXÕES E INFLUÊNCIA
  {
    id: 'mentor_poderoso',
    name: 'Mentor Poderoso',
    category: 'conexoes',
    description: 'Um indivíduo influente guia sua carreira.',
    effect: 'Pode pedir conselhos e favores a uma figura de autoridade.',
    challenges: [
      { 
        id: 'sombra_mentor', 
        name: 'Sombra do Mentor', 
        description: 'Sempre comparado ao mentor, nunca bom o suficiente.',
        effect: '-1 em Autocontrole contra críticas. Complexo de inferioridade.'
      },
      { 
        id: 'divida_mentor', 
        name: 'Dívida com o Mentor', 
        description: 'O mentor espera retorno do investimento.',
        effect: 'Deve obediência e favores ao mentor.'
      }
    ]
  },
  {
    id: 'rede_contatos',
    name: 'Rede de Contatos',
    category: 'conexoes',
    description: 'Conhece pessoas em todos os lugares.',
    effect: '+1 em Investigação para encontrar informações ou pessoas.',
    challenges: [
      { 
        id: 'favores_devidos', 
        name: 'Favores Devidos', 
        description: 'Sua rede é baseada em troca de favores.',
        effect: 'Frequentemente cobrado por favores passados.'
      },
      { 
        id: 'informacao_comprometedora', 
        name: 'Informação Comprometedora', 
        description: 'Seus contatos sabem demais sobre você.',
        effect: 'Vulnerável a chantagem. Segredos podem vazar.'
      }
    ]
  },
  
  // TALENTOS NATURAIS
  {
    id: 'memoria_eidetica',
    name: 'Memória Eidética',
    category: 'talento',
    description: 'Lembra de tudo que vê ou ouve.',
    effect: '+2 em Pesquisa. Nunca esquece informações importantes.',
    challenges: [
      { 
        id: 'traumas_vividos', 
        name: 'Traumas Vívidos', 
        description: 'Memórias ruins são tão vívidas quanto as boas.',
        effect: 'Flashbacks de experiências traumáticas. -1 Fortitude.'
      },
      { 
        id: 'sobrecarga_informacao', 
        name: 'Sobrecarga de Informação', 
        description: 'Às vezes sabe demais para o próprio bem.',
        effect: '+1 dificuldade para filtrar informação irrelevante.'
      }
    ]
  },
  {
    id: 'sexto_sentido',
    name: 'Sexto Sentido',
    category: 'talento',
    description: 'Intuição aguçada sobre perigos.',
    effect: '+1 em Instinto. Sente emboscadas e traições.',
    challenges: [
      { 
        id: 'paranoico', 
        name: 'Paranóico', 
        description: 'Desconfia de todos, mesmo aliados.',
        effect: '-1 em Empatia e Diplomacia. Dificuldade em confiar.'
      },
      { 
        id: 'pressentimentos', 
        name: 'Pressentimentos Perturbadores', 
        description: 'Visões e sensações que nem sempre fazem sentido.',
        effect: 'Sofre de insônia e ansiedade. -1 em descanso.'
      }
    ]
  },
];

// Funções auxiliares
export function getPrivilegesByCategory(categoryId: string): PrivilegeDefinition[] {
  return PRIVILEGES.filter(p => p.category === categoryId);
}

export function getPrivilegeById(id: string): PrivilegeDefinition | undefined {
  return PRIVILEGES.find(p => p.id === id);
}

export function getChallengeById(privilegeId: string, challengeId: string): ChallengeDefinition | undefined {
  const privilege = getPrivilegeById(privilegeId);
  return privilege?.challenges.find(c => c.id === challengeId);
}

export function getCategoryById(id: string): PrivilegeCategory | undefined {
  return PRIVILEGE_CATEGORIES.find(c => c.id === id);
}

// Mantém compatibilidade com código antigo (deprecated)
export type BlessingDefinition = PrivilegeDefinition;
export type BlessingCategory = PrivilegeCategory;
export const BLESSINGS = PRIVILEGES;
export const BLESSING_CATEGORIES = PRIVILEGE_CATEGORIES;
export const getBlessingsByCategory = getPrivilegesByCategory;
export const getBlessingById = getPrivilegeById;
