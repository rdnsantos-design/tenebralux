import { ThemeId } from '@/themes/types';

export interface SkillDefinition {
  id: string;
  attributeId: string;
  labels: {
    akashic: string;
    tenebralux: string;
  };
}

export const SKILLS: SkillDefinition[] = [
  // CONHECIMENTO (5)
  { id: 'ciencias', attributeId: 'conhecimento', labels: { akashic: 'Ciências', tenebralux: 'Ciências' } },
  { id: 'linguas', attributeId: 'conhecimento', labels: { akashic: 'Línguas', tenebralux: 'Línguas' } },
  { id: 'economia', attributeId: 'conhecimento', labels: { akashic: 'Economia', tenebralux: 'Economia' } },
  { id: 'diplomacia', attributeId: 'conhecimento', labels: { akashic: 'Diplomacia', tenebralux: 'Diplomacia' } },
  { id: 'militarismo', attributeId: 'conhecimento', labels: { akashic: 'Militarismo', tenebralux: 'Militarismo' } },
  
  // RACIOCÍNIO (5)
  { id: 'engenharia', attributeId: 'raciocinio', labels: { akashic: 'Engenharia', tenebralux: 'Engenharia' } },
  { id: 'pesquisa', attributeId: 'raciocinio', labels: { akashic: 'Pesquisa', tenebralux: 'Pesquisa' } },
  { id: 'computacao', attributeId: 'raciocinio', labels: { akashic: 'Computação', tenebralux: 'Arcanismo' } },
  { id: 'logica', attributeId: 'raciocinio', labels: { akashic: 'Lógica', tenebralux: 'Lógica' } },
  { id: 'investigacao', attributeId: 'raciocinio', labels: { akashic: 'Investigação', tenebralux: 'Investigação' } },
  
  // CORPO (5)
  { id: 'resistencia', attributeId: 'corpo', labels: { akashic: 'Resistência', tenebralux: 'Resistência' } },
  { id: 'potencia', attributeId: 'corpo', labels: { akashic: 'Potência', tenebralux: 'Potência' } },
  { id: 'atletismo', attributeId: 'corpo', labels: { akashic: 'Atletismo', tenebralux: 'Atletismo' } },
  { id: 'vigor', attributeId: 'corpo', labels: { akashic: 'Vigor', tenebralux: 'Vigor' } },
  { id: 'bravura', attributeId: 'corpo', labels: { akashic: 'Bravura', tenebralux: 'Bravura' } },
  
  // REFLEXOS (5)
  { id: 'esquiva', attributeId: 'reflexos', labels: { akashic: 'Esquiva', tenebralux: 'Esquiva' } },
  { id: 'pilotagem', attributeId: 'reflexos', labels: { akashic: 'Pilotagem', tenebralux: 'Condução' } },
  { id: 'luta', attributeId: 'reflexos', labels: { akashic: 'Luta', tenebralux: 'Luta' } },
  { id: 'prontidao', attributeId: 'reflexos', labels: { akashic: 'Prontidão', tenebralux: 'Prontidão' } },
  { id: 'tatica', attributeId: 'reflexos', labels: { akashic: 'Tática', tenebralux: 'Tática' } },
  
  // DETERMINAÇÃO (5)
  { id: 'resiliencia', attributeId: 'determinacao', labels: { akashic: 'Resiliência', tenebralux: 'Resiliência' } },
  { id: 'autocontrole', attributeId: 'determinacao', labels: { akashic: 'Autocontrole', tenebralux: 'Autocontrole' } },
  { id: 'sobrevivencia', attributeId: 'determinacao', labels: { akashic: 'Sobrevivência', tenebralux: 'Sobrevivência' } },
  { id: 'intimidacao_det', attributeId: 'determinacao', labels: { akashic: 'Intimidação', tenebralux: 'Intimidação' } },
  { id: 'superacao', attributeId: 'determinacao', labels: { akashic: 'Superação', tenebralux: 'Superação' } },
  
  // COORDENAÇÃO (5)
  { id: 'tiro', attributeId: 'coordenacao', labels: { akashic: 'Tiro', tenebralux: 'Arqueria' } },
  { id: 'laminas', attributeId: 'coordenacao', labels: { akashic: 'Lâminas', tenebralux: 'Lâminas' } },
  { id: 'destreza', attributeId: 'coordenacao', labels: { akashic: 'Destreza', tenebralux: 'Destreza' } },
  { id: 'artilharia', attributeId: 'coordenacao', labels: { akashic: 'Artilharia', tenebralux: 'Cerco' } },
  { id: 'furtividade', attributeId: 'coordenacao', labels: { akashic: 'Furtividade', tenebralux: 'Furtividade' } },
  
  // CARISMA (5)
  { id: 'persuasao', attributeId: 'carisma', labels: { akashic: 'Persuasão', tenebralux: 'Persuasão' } },
  { id: 'enganacao', attributeId: 'carisma', labels: { akashic: 'Enganação', tenebralux: 'Enganação' } },
  { id: 'performance', attributeId: 'carisma', labels: { akashic: 'Performance', tenebralux: 'Performance' } },
  { id: 'intimidacao_car', attributeId: 'carisma', labels: { akashic: 'Intimidação', tenebralux: 'Intimidação' } },
  { id: 'lideranca', attributeId: 'carisma', labels: { akashic: 'Liderança', tenebralux: 'Liderança' } },
  
  // INTUIÇÃO (5)
  { id: 'percepcao', attributeId: 'intuicao', labels: { akashic: 'Percepção', tenebralux: 'Percepção' } },
  { id: 'empatia', attributeId: 'intuicao', labels: { akashic: 'Empatia', tenebralux: 'Empatia' } },
  { id: 'instinto', attributeId: 'intuicao', labels: { akashic: 'Instinto', tenebralux: 'Instinto' } },
  { id: 'augurio', attributeId: 'intuicao', labels: { akashic: 'Augúrio', tenebralux: 'Augúrio' } },
  { id: 'artes', attributeId: 'intuicao', labels: { akashic: 'Artes', tenebralux: 'Artes' } },
];

export function getSkillsByAttribute(attributeId: string): SkillDefinition[] {
  return SKILLS.filter(s => s.attributeId === attributeId);
}

export function getSkillLabel(skillId: string, theme: ThemeId): string {
  const skill = SKILLS.find(s => s.id === skillId);
  return skill ? skill.labels[theme] : skillId;
}

export function getSkillById(skillId: string): SkillDefinition | undefined {
  return SKILLS.find(s => s.id === skillId);
}
