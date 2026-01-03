export type ThemeId = 'akashic' | 'tenebralux';

export interface ThemeLabels {
  // Metadata
  id: ThemeId;
  name: string;
  tagline: string;
  icon: string; // Lucide icon name
  
  // Entidades principais
  entities: {
    character: string;      // "Agente" / "Personagem"
    army: string;           // "Esquadrão" / "Exército"
    unit: string;           // "Unidade" / "Unidade"
    commander: string;      // "Oficial" / "Comandante"
    domain: string;         // "Sistema Estelar" / "Reino"
    province: string;       // "Planeta" / "Província"
    holding: string;        // "Instalação" / "Propriedade"
    regent: string;         // "Chanceler" / "Regente"
  };
  
  // Tipos de unidade militar
  unitTypes: {
    infantry: string;       // "Marines" / "Infantaria"
    cavalry: string;        // "Pilotos" / "Cavalaria"
    archers: string;        // "Artilheiros" / "Arqueiros"
    siege: string;          // "Bombardeiros" / "Cerco"
  };
  
  // Atributos (nomes iguais, descrições diferentes)
  attributes: {
    conhecimento: { name: string; description: string };
    raciocinio: { name: string; description: string };
    corpo: { name: string; description: string };
    reflexos: { name: string; description: string };
    determinacao: { name: string; description: string };
    coordenacao: { name: string; description: string };
    carisma: { name: string; description: string };
    intuicao: { name: string; description: string };
  };
  
  // Perícias que mudam nome entre temas
  skills: {
    melee: string;          // "Combate CaC" / "Luta"
    ranged: string;         // "Armas de Energia" / "Arco e Flecha"
    arcanism: string;       // "Tecnologia Avançada" / "Arcanismo"
    stealth: string;        // "Infiltração" / "Furtividade"
    mount: string;          // "Pilotagem" / "Montaria"
  };
  
  // Recursos de domínio
  domainResources: {
    gold: string;           // "Créditos" / "Ouro"
    regency: string;        // "Influência" / "Regência"
    magic: string;          // "Energia" / "Mana"
  };
  
  // UI Labels
  ui: {
    createCharacter: string;
    createArmy: string;
    createCard: string;
    tacticalBattle: string;
    massCombat: string;
    domainManagement: string;
    settings: string;
  };
}
