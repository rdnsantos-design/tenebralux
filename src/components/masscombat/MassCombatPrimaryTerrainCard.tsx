import React from 'react';
import { MassCombatPrimaryTerrain } from '@/types/MassCombatTerrain';
import { Swords, Shield, Zap, Mountain, TreePine, Snowflake, Sun, Droplets, Building, Triangle, Wheat } from 'lucide-react';

interface MassCombatPrimaryTerrainCardProps {
  terrain: MassCombatPrimaryTerrain;
  className?: string;
}

const TERRAIN_ICONS: Record<string, React.ElementType> = {
  'Planície': Wheat,
  'Montanhoso': Mountain,
  'Floresta': TreePine,
  'Ártico': Snowflake,
  'Desértico': Sun,
  'Alagado': Droplets,
  'Acidentado': Triangle,
  'Urbano': Building,
};

const TERRAIN_COLORS: Record<string, { bg: string; border: string; accent: string }> = {
  'Planície': { bg: 'bg-amber-50', border: 'border-amber-400', accent: 'text-amber-600' },
  'Montanhoso': { bg: 'bg-stone-100', border: 'border-stone-500', accent: 'text-stone-700' },
  'Floresta': { bg: 'bg-green-50', border: 'border-green-500', accent: 'text-green-700' },
  'Ártico': { bg: 'bg-cyan-50', border: 'border-cyan-400', accent: 'text-cyan-600' },
  'Desértico': { bg: 'bg-orange-50', border: 'border-orange-400', accent: 'text-orange-600' },
  'Alagado': { bg: 'bg-blue-50', border: 'border-blue-400', accent: 'text-blue-600' },
  'Acidentado': { bg: 'bg-rose-50', border: 'border-rose-400', accent: 'text-rose-600' },
  'Urbano': { bg: 'bg-slate-100', border: 'border-slate-500', accent: 'text-slate-700' },
};

export function MassCombatPrimaryTerrainCard({ terrain, className = '' }: MassCombatPrimaryTerrainCardProps) {
  const TerrainIcon = TERRAIN_ICONS[terrain.name] || Mountain;
  const colors = TERRAIN_COLORS[terrain.name] || { bg: 'bg-gray-50', border: 'border-gray-400', accent: 'text-gray-600' };

  const formatMod = (value: number) => {
    if (value === 0) return '0';
    return value > 0 ? `+${value}` : `${value}`;
  };

  const getModColor = (value: number) => {
    if (value > 0) return 'text-green-600 bg-green-100';
    if (value < 0) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div 
      className={`
        w-[280px] h-[400px] rounded-xl border-4 ${colors.border} ${colors.bg}
        flex flex-col overflow-hidden shadow-lg print:break-inside-avoid
        ${className}
      `}
    >
      {/* Header */}
      <div className={`${colors.border.replace('border', 'bg').replace('400', '500').replace('500', '600')} px-4 py-3 text-white`}>
        <div className="flex items-center justify-center gap-3">
          <TerrainIcon className="h-8 w-8" />
          <h2 className="text-2xl font-bold tracking-wide">{terrain.name}</h2>
        </div>
        <div className="text-center text-xs uppercase tracking-widest mt-1 opacity-80">
          Terreno Primário
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4">
        {/* Modifiers Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Attack */}
          <div className="flex flex-col items-center">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getModColor(terrain.attack_mod)}`}>
              <span className="text-2xl font-bold">{formatMod(terrain.attack_mod)}</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Swords className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium">Ataque</span>
            </div>
          </div>

          {/* Defense */}
          <div className="flex flex-col items-center">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getModColor(terrain.defense_mod)}`}>
              <span className="text-2xl font-bold">{formatMod(terrain.defense_mod)}</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium">Defesa</span>
            </div>
          </div>

          {/* Mobility */}
          <div className="flex flex-col items-center">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getModColor(terrain.mobility_mod)}`}>
              <span className="text-2xl font-bold">{formatMod(terrain.mobility_mod)}</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-medium">Mobilidade</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 border-dashed ${colors.border.replace('400', '300').replace('500', '300')}`}>
          <p className={`text-center text-sm leading-relaxed ${colors.accent}`}>
            {terrain.description}
          </p>
        </div>

        {/* Terrain Icon Watermark */}
        <div className="flex justify-center mt-4 opacity-20">
          <TerrainIcon className="h-12 w-12" />
        </div>
      </div>

      {/* Footer */}
      <div className={`${colors.border.replace('border', 'bg').replace('400', '200').replace('500', '200')} px-4 py-2 text-center`}>
        <span className={`text-xs font-medium ${colors.accent}`}>
          Combate em Massa
        </span>
      </div>
    </div>
  );
}
