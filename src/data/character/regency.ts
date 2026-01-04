import { ThemeId } from '@/themes/types';

export interface RegencyDefinition {
  id: string;
  labels: {
    akashic: string;
    tenebralux: string;
  };
  formula: string;
  formulaComponents: {
    attribute: string;
    skill: string;
  };
  usedIn: ('batalha' | 'campanha' | 'dominio')[];
  themeSpecific?: ThemeId;
}

export const REGENCY_ATTRIBUTES: RegencyDefinition[] = [
  {
    id: 'comando',
    labels: { akashic: 'Comando', tenebralux: 'Comando' },
    formula: 'Carisma + Pesquisa',
    formulaComponents: { attribute: 'carisma', skill: 'pesquisa' },
    usedIn: ['batalha', 'campanha'],
  },
  {
    id: 'estrategia',
    labels: { akashic: 'Estratégia', tenebralux: 'Estratégia' },
    formula: 'Raciocínio + Militarismo',
    formulaComponents: { attribute: 'raciocinio', skill: 'militarismo' },
    usedIn: ['batalha', 'campanha'],
  },
  {
    id: 'administracao',
    labels: { akashic: 'Administração', tenebralux: 'Administração' },
    formula: 'Raciocínio + Economia',
    formulaComponents: { attribute: 'raciocinio', skill: 'economia' },
    usedIn: ['dominio'],
  },
  {
    id: 'politica',
    labels: { akashic: 'Política', tenebralux: 'Política' },
    formula: 'Raciocínio + Diplomacia',
    formulaComponents: { attribute: 'raciocinio', skill: 'diplomacia' },
    usedIn: ['dominio'],
  },
  {
    id: 'tecnologia',
    labels: { akashic: 'Tecnologia', tenebralux: 'Tecnologia' },
    formula: 'Conhecimento + Engenharia',
    formulaComponents: { attribute: 'conhecimento', skill: 'engenharia' },
    usedIn: ['dominio'],
    themeSpecific: 'akashic',
  },
  {
    id: 'geomancia',
    labels: { akashic: 'Geomancia', tenebralux: 'Geomancia' },
    formula: 'Conhecimento + Arcanismo',
    formulaComponents: { attribute: 'conhecimento', skill: 'computacao' },
    usedIn: ['dominio'],
    themeSpecific: 'tenebralux',
  },
];

export function getRegencyForTheme(theme: ThemeId): RegencyDefinition[] {
  return REGENCY_ATTRIBUTES.filter(r => !r.themeSpecific || r.themeSpecific === theme);
}
