import { ThemeId } from '@/themes/types';
import { FactionReputation } from '@/types/character-builder';
import { AKASHIC_FACTIONS, TENEBRA_FACTIONS } from './factions';

// Organizações adicionais para Akashic (além das facções de personagem)
export const AKASHIC_ORGANIZATIONS = [
  { id: 'guilda_navegadores', name: 'Guilda dos Navegadores' },
  { id: 'sindicato_comerciantes', name: 'Sindicato dos Comerciantes' },
  { id: 'ordem_sentinelas', name: 'Ordem dos Sentinelas' },
  { id: 'coletivo_tecnomagos', name: 'Coletivo dos Tecnomagos' },
  { id: 'liga_pioneiros', name: 'Liga dos Pioneiros' },
  { id: 'consorcio_mineiros', name: 'Consórcio dos Mineiros' },
  { id: 'irmandade_caravelas', name: 'Irmandade das Caravelas' },
  { id: 'assemblea_cientistas', name: 'Assembleia dos Cientistas' },
];

// Organizações adicionais para Tenebralux
export const TENEBRA_ORGANIZATIONS = [
  { id: 'ordem_templarios', name: 'Ordem dos Templários' },
  { id: 'guilda_mercadores', name: 'Guilda dos Mercadores' },
  { id: 'circulo_magos', name: 'Círculo dos Magos' },
  { id: 'irmandade_ladinos', name: 'Irmandade dos Ladinos' },
  { id: 'companhia_mercenarios', name: 'Companhia dos Mercenários' },
  { id: 'conclave_sacerdotes', name: 'Conclave dos Sacerdotes' },
  { id: 'liga_artesaos', name: 'Liga dos Artesãos' },
  { id: 'conselho_ancioes', name: 'Conselho dos Anciões' },
];

export function getDefaultReputations(theme: ThemeId): FactionReputation[] {
  const factions = theme === 'akashic' ? AKASHIC_FACTIONS : TENEBRA_FACTIONS;
  const organizations = theme === 'akashic' ? AKASHIC_ORGANIZATIONS : TENEBRA_ORGANIZATIONS;
  
  // Combinar facções de personagem com organizações
  const reputations: FactionReputation[] = [
    // Facções principais
    ...factions.map(f => ({
      factionId: f.id,
      factionName: f.name,
      value: 0,
      isCustom: false,
    })),
    // Organizações adicionais
    ...organizations.map(o => ({
      factionId: o.id,
      factionName: o.name,
      value: 0,
      isCustom: false,
    })),
  ];
  
  return reputations;
}

export function getReputationLabel(value: number): { label: string; color: string } {
  if (value >= 5) return { label: 'Venerado', color: 'text-emerald-500' };
  if (value >= 3) return { label: 'Estimado', color: 'text-green-500' };
  if (value >= 1) return { label: 'Amigável', color: 'text-lime-500' };
  if (value === 0) return { label: 'Neutro', color: 'text-muted-foreground' };
  if (value >= -2) return { label: 'Desconfiado', color: 'text-amber-500' };
  if (value >= -4) return { label: 'Hostil', color: 'text-orange-500' };
  return { label: 'Inimigo', color: 'text-red-500' };
}
