import { TacticalCulture, CULTURES } from './TacticalCard';

export type CommanderSpecialization = 
  | 'Infantaria' 
  | 'Cavalaria' 
  | 'Arqueiro' 
  | 'Cerco' 
  | 'Milicia' 
  | 'Elite' 
  | 'Naval';

export const SPECIALIZATIONS: CommanderSpecialization[] = [
  'Infantaria',
  'Cavalaria',
  'Arqueiro',
  'Cerco',
  'Milicia',
  'Elite',
  'Naval'
];

export interface FieldCommander {
  id: string;
  nome_comandante: string;
  cultura_origem: TacticalCulture;
  especializacao_inicial: CommanderSpecialization;
  comando: number;
  estrategia: number;
  guarda: number;
  pontos_prestigio: number;
  especializacoes_adicionais: CommanderSpecialization[];
  unidade_de_origem?: string;
  notas?: string;
  regent_id?: string; // ID do regente associado
  commander_photo_url?: string; // Foto do comandante
  coat_of_arms_url?: string; // Brasão do reino
  created_at?: string;
  updated_at?: string;
}

// Custos de evolução em Pontos de Prestígio
export const EVOLUTION_COSTS = {
  comando: 3,
  estrategia: 3,
  guarda: 2,
  nova_especializacao: 2
} as const;

// Campos derivados calculados
export function calculateDerivedFields(commander: Partial<FieldCommander>) {
  const comando = commander.comando || 1;
  const estrategia = commander.estrategia || 0;
  const especializacoes = [
    commander.especializacao_inicial,
    ...(commander.especializacoes_adicionais || [])
  ].filter(Boolean);

  return {
    pontos_compra_taticos: comando,
    pontos_compra_estrategicos: estrategia,
    unidades_lideradas: comando,
    area_influencia: comando % 2 === 1 ? Math.floor(comando / 2) + 1 : Math.floor(comando / 2),
    total_especializacoes: especializacoes.length,
    desconto_cartas: especializacoes // retorna as especializações que geram desconto
  };
}

// Verifica se pode evoluir um atributo
export function canEvolve(commander: FieldCommander, attribute: keyof typeof EVOLUTION_COSTS): boolean {
  const cost = EVOLUTION_COSTS[attribute];
  return commander.pontos_prestigio >= cost;
}

// Aplica evolução e retorna o novo estado
export function applyEvolution(
  commander: FieldCommander, 
  attribute: 'comando' | 'estrategia' | 'guarda'
): Partial<FieldCommander> {
  const cost = EVOLUTION_COSTS[attribute];
  if (commander.pontos_prestigio < cost) {
    throw new Error(`Prestígio insuficiente. Necessário: ${cost} PP`);
  }

  return {
    [attribute]: commander[attribute] + 1,
    pontos_prestigio: commander.pontos_prestigio - cost
  };
}

// Adiciona nova especialização
export function addSpecialization(
  commander: FieldCommander, 
  newSpec: CommanderSpecialization
): Partial<FieldCommander> {
  const cost = EVOLUTION_COSTS.nova_especializacao;
  if (commander.pontos_prestigio < cost) {
    throw new Error(`Prestígio insuficiente. Necessário: ${cost} PP`);
  }

  const allSpecs = [commander.especializacao_inicial, ...commander.especializacoes_adicionais];
  if (allSpecs.includes(newSpec)) {
    throw new Error('Comandante já possui esta especialização');
  }

  return {
    especializacoes_adicionais: [...commander.especializacoes_adicionais, newSpec],
    pontos_prestigio: commander.pontos_prestigio - cost
  };
}

export { CULTURES };
