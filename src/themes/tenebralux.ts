import { ThemeLabels } from './types';

export const tenebraluxTheme: ThemeLabels = {
  id: 'tenebralux',
  name: 'Tenebra Lux',
  tagline: 'Intriga e magia em terras ancestrais',
  icon: 'Castle',
  
  entities: {
    character: 'Personagem',
    army: 'Exército',
    unit: 'Unidade',
    commander: 'Comandante',
    domain: 'Reino',
    province: 'Província',
    holding: 'Propriedade',
    regent: 'Regente',
  },
  
  unitTypes: {
    infantry: 'Infantaria',
    cavalry: 'Cavalaria',
    archers: 'Arqueiros',
    siege: 'Máquinas de Cerco',
  },
  
  attributes: {
    conhecimento: { name: 'Conhecimento', description: 'Educação, leitura e saberes acadêmicos' },
    raciocinio: { name: 'Raciocínio', description: 'Lógica, dedução e resolução de problemas' },
    corpo: { name: 'Corpo', description: 'Força física, vigor e resistência' },
    reflexos: { name: 'Reflexos', description: 'Agilidade, velocidade e tempo de reação' },
    determinacao: { name: 'Determinação', description: 'Força de vontade e perseverança' },
    coordenacao: { name: 'Coordenação', description: 'Destreza manual e precisão' },
    carisma: { name: 'Carisma', description: 'Presença, liderança e magnetismo pessoal' },
    intuicao: { name: 'Intuição', description: 'Sexto sentido, percepção e presságios' },
  },
  
  skills: {
    melee: 'Combate com Armas',
    ranged: 'Arco e Flecha',
    arcanism: 'Arcanismo',
    stealth: 'Furtividade',
    mount: 'Montaria',
  },
  
  domainResources: {
    gold: 'Barras de Ouro',
    regency: 'Pontos de Regência',
    magic: 'Mana',
  },
  
  ui: {
    createCharacter: 'Criar Personagem',
    createArmy: 'Formar Exército',
    createCard: 'Criar Carta',
    tacticalBattle: 'Batalha Tática',
    massCombat: 'Combate em Massa',
    domainManagement: 'Gestão de Domínio',
    settings: 'Configurações',
  },
};
