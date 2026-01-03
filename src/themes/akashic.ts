import { ThemeLabels } from './types';

export const akashicTheme: ThemeLabels = {
  id: 'akashic',
  name: 'Akashic Odyssey',
  tagline: 'Aventuras no cosmos infinito',
  icon: 'Rocket',
  
  entities: {
    character: 'Agente',
    army: 'Esquadrão',
    unit: 'Unidade',
    commander: 'Oficial',
    domain: 'Sistema Estelar',
    province: 'Planeta',
    holding: 'Instalação',
    regent: 'Chanceler',
  },
  
  unitTypes: {
    infantry: 'Marines Espaciais',
    cavalry: 'Pilotos de Caça',
    archers: 'Artilheiros',
    siege: 'Bombardeiros Orbitais',
  },
  
  attributes: {
    conhecimento: { name: 'Conhecimento', description: 'Educação formal e memória técnica' },
    raciocinio: { name: 'Raciocínio', description: 'Capacidade analítica e processamento lógico' },
    corpo: { name: 'Corpo', description: 'Aptidão física e resistência biológica' },
    reflexos: { name: 'Reflexos', description: 'Velocidade de reação e coordenação neural' },
    determinacao: { name: 'Determinação', description: 'Força de vontade e foco mental' },
    coordenacao: { name: 'Coordenação', description: 'Precisão motora e controle fino' },
    carisma: { name: 'Carisma', description: 'Presença social e capacidade de liderança' },
    intuicao: { name: 'Intuição', description: 'Percepção extrassensorial e instinto' },
  },
  
  skills: {
    melee: 'Combate Corpo a Corpo',
    ranged: 'Armas de Energia',
    arcanism: 'Tecnologia Avançada',
    stealth: 'Infiltração',
    mount: 'Pilotagem',
  },
  
  domainResources: {
    gold: 'Créditos',
    regency: 'Influência',
    magic: 'Energia Quântica',
  },
  
  ui: {
    createCharacter: 'Criar Agente',
    createArmy: 'Formar Esquadrão',
    createCard: 'Criar Carta',
    tacticalBattle: 'Batalha Tática',
    massCombat: 'Combate em Massa',
    domainManagement: 'Gestão de Sistema',
    settings: 'Configurações',
  },
};
