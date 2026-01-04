import { ThemeId } from '@/themes/types';

export interface ChallengeDefinition {
  id: string;
  name: string;
  description: string;
  effect?: string;
}

export interface BlessingDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  effect?: string;
  challenges: ChallengeDefinition[];
}

export interface BlessingCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const BLESSING_CATEGORIES: BlessingCategory[] = [
  { id: 'riqueza', name: 'Riqueza e Sociedade', icon: 'Coins', color: '#f39c12' },
  { id: 'cultura', name: 'Cultura e Educação', icon: 'GraduationCap', color: '#3498db' },
  { id: 'genetica', name: 'Genética e Saúde', icon: 'Dna', color: '#27ae60' },
  { id: 'conexoes', name: 'Conexões e Influência', icon: 'Users', color: '#9b59b6' },
  { id: 'talento', name: 'Talentos Naturais', icon: 'Sparkles', color: '#e74c3c' },
];

export const BLESSINGS: BlessingDefinition[] = [
  // RIQUEZA E SOCIEDADE
  {
    id: 'riqueza_familiar',
    name: 'Riqueza Familiar',
    category: 'riqueza',
    description: 'Nasceu em família abastada com recursos abundantes.',
    effect: 'Começa com equipamento de qualidade superior e 3x mais créditos iniciais.',
    challenges: [
      { 
        id: 'mimado', 
        name: 'Mimado', 
        description: 'Espera que os problemas se resolvam sozinhos.',
        effect: '-1 em Superação. Dificuldade +1 em situações de privação.'
      },
      { 
        id: 'alvo_inveja', 
        name: 'Alvo de Inveja', 
        description: 'Sua fortuna atrai inimigos e interesseiros.',
        effect: '+1 dificuldade em testes sociais com pessoas de classe inferior.'
      }
    ]
  },
  {
    id: 'conexoes_politicas',
    name: 'Conexões Políticas',
    category: 'riqueza',
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
  
  // CULTURA E EDUCAÇÃO
  {
    id: 'educacao_elite',
    name: 'Educação de Elite',
    category: 'cultura',
    description: 'Formação nas melhores instituições.',
    effect: '+1 em uma perícia de Conhecimento à escolha.',
    challenges: [
      { 
        id: 'arrogante', 
        name: 'Arrogante Intelectual', 
        description: 'Menospreza quem considera menos instruído.',
        effect: '-1 em Empatia com pessoas "comuns".'
      },
      { 
        id: 'teorico_demais', 
        name: 'Teórico Demais', 
        description: 'Despreza trabalho manual e prático.',
        effect: '-1 em Sobrevivência e tarefas práticas.'
      }
    ]
  },
  {
    id: 'poliglota',
    name: 'Poliglota Natural',
    category: 'cultura',
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
  
  // GENÉTICA E SAÚDE
  {
    id: 'fisico_excepcional',
    name: 'Físico Excepcional',
    category: 'genetica',
    description: 'Geneticamente abençoado com força e resistência.',
    effect: '+1 em Atletismo ou Potência (escolha na criação).',
    challenges: [
      { 
        id: 'metabolismo_acelerado', 
        name: 'Metabolismo Acelerado', 
        description: 'Precisa comer muito mais que o normal.',
        effect: 'Consome o dobro de recursos. Penalidade severa se faminto.'
      },
      { 
        id: 'intimidador_involuntario', 
        name: 'Intimidador Involuntário', 
        description: 'Seu físico assusta pessoas mesmo sem querer.',
        effect: '-1 em Diplomacia e interações delicadas.'
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
    id: 'constituicao_robusta',
    name: 'Constituição Robusta',
    category: 'genetica',
    description: 'Sistema imunológico excepcional.',
    effect: '+2 Vitalidade. Vantagem em testes contra doenças.',
    challenges: [
      { 
        id: 'sensibilidade_quimica', 
        name: 'Sensibilidade Química', 
        description: 'Reage mal a medicamentos e substâncias.',
        effect: 'Medicamentos têm efeitos colaterais. Drogas são perigosas.'
      },
      { 
        id: 'excesso_confianca', 
        name: 'Excesso de Confiança', 
        description: 'Ignora limites do próprio corpo.',
        effect: '-1 em Autocontrole para reconhecer ferimentos.'
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
    id: 'reflexos_felinos',
    name: 'Reflexos Felinos',
    category: 'talento',
    description: 'Reações extraordinariamente rápidas.',
    effect: '+1 em Reação. Vantagem em testes de iniciativa.',
    challenges: [
      { 
        id: 'hiperativo', 
        name: 'Hiperativo', 
        description: 'Dificuldade em ficar parado ou esperar.',
        effect: '-1 em testes que exigem paciência ou espera.'
      },
      { 
        id: 'reacao_exagerada', 
        name: 'Reação Exagerada', 
        description: 'Responde a ameaças antes de pensar.',
        effect: 'Teste Autocontrole para não reagir impulsivamente.'
      }
    ]
  },
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
export function getBlessingsByCategory(categoryId: string): BlessingDefinition[] {
  return BLESSINGS.filter(b => b.category === categoryId);
}

export function getBlessingById(id: string): BlessingDefinition | undefined {
  return BLESSINGS.find(b => b.id === id);
}

export function getChallengeById(blessingId: string, challengeId: string): ChallengeDefinition | undefined {
  const blessing = getBlessingById(blessingId);
  return blessing?.challenges.find(c => c.id === challengeId);
}

export function getCategoryById(id: string): BlessingCategory | undefined {
  return BLESSING_CATEGORIES.find(c => c.id === id);
}
