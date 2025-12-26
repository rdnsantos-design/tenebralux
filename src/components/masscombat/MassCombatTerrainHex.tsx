import React from 'react';
import { MassCombatPrimaryTerrain, MassCombatSecondaryTerrain, VISIBILITY_OPTIONS } from '@/types/MassCombatTerrain';
import { Swords, Shield, Move, Eye, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MassCombatTerrainHexProps {
  terrain: MassCombatPrimaryTerrain | MassCombatSecondaryTerrain;
  type: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showModifiers?: boolean;
  className?: string;
}

const primaryColors: Record<string, string> = {
  'Planície': 'from-amber-400 to-amber-600',
  'Floresta': 'from-emerald-600 to-emerald-800',
  'Montanha': 'from-stone-500 to-stone-700',
  'Deserto': 'from-yellow-400 to-orange-500',
  'Pântano': 'from-slate-700 to-slate-900',
  'Costeiro': 'from-cyan-400 to-blue-500',
  'Urbano': 'from-zinc-500 to-zinc-700',
  'Campo Nevado': 'from-slate-200 to-slate-400',
};

const secondaryColors: Record<string, string> = {
  'Elevação': 'from-orange-400 to-orange-600',
  'Ocultação': 'from-violet-500 to-violet-700',
  'Passagem Estreita': 'from-rose-500 to-rose-700',
  'Solo Instável': 'from-amber-600 to-amber-800',
  'Vegetação Densa': 'from-green-600 to-green-800',
  'Ruínas': 'from-stone-600 to-stone-800',
  'Gelo Escorregadio': 'from-sky-200 to-sky-400',
  'Lama Profunda': 'from-amber-800 to-amber-950',
  'Emboscada': 'from-red-600 to-red-800',
  'Ventos Fortes': 'from-teal-400 to-teal-600',
};

const sizeClasses = {
  sm: 'w-24 h-28',
  md: 'w-32 h-36',
  lg: 'w-40 h-44',
};

const fontSizes = {
  sm: { title: 'text-[8px]', mod: 'text-[7px]', icon: 'w-2.5 h-2.5' },
  md: { title: 'text-[10px]', mod: 'text-[8px]', icon: 'w-3 h-3' },
  lg: { title: 'text-xs', mod: 'text-[9px]', icon: 'w-3.5 h-3.5' },
};

export function MassCombatTerrainHex({ 
  terrain, 
  type,
  size = 'md', 
  showModifiers = true, 
  className 
}: MassCombatTerrainHexProps) {
  const isPrimary = type === 'primary';
  const colorMap = isPrimary ? primaryColors : secondaryColors;
  const gradientClass = colorMap[terrain.name] || (isPrimary ? 'from-gray-500 to-gray-700' : 'from-purple-500 to-purple-700');
  
  const formatMod = (value: number, prefix?: string) => {
    if (value === 0) return null;
    return `${prefix || ''}${value > 0 ? '+' : ''}${value}`;
  };

  const primaryTerrain = terrain as MassCombatPrimaryTerrain;
  const secondaryTerrain = terrain as MassCombatSecondaryTerrain;

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {/* Hexagonal shape with clip-path */}
      <div 
        className={cn(
          'absolute inset-0 bg-gradient-to-br shadow-lg',
          gradientClass
        )}
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
      >
        {/* Background image if available */}
        {terrain.image_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ 
              backgroundImage: `url(${terrain.image_url})`,
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}
          />
        )}
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-white">
          {/* Type badge */}
          <div className={cn(
            'absolute top-2 px-1.5 py-0.5 rounded text-white/90 font-bold uppercase tracking-wider',
            fontSizes[size].mod,
            isPrimary ? 'bg-black/30' : 'bg-white/20'
          )}>
            {isPrimary ? 'Primário' : 'Secundário'}
          </div>
          
          {/* Name */}
          <div className={cn(
            'font-bold text-center leading-tight mt-3 drop-shadow-md',
            fontSizes[size].title
          )}>
            {terrain.name}
          </div>
          
          {/* Modifiers */}
          {showModifiers && (
            <div className="flex flex-wrap justify-center gap-1 mt-1">
              {formatMod(terrain.attack_mod) && (
                <div className={cn('flex items-center gap-0.5 bg-black/30 px-1 py-0.5 rounded', fontSizes[size].mod)}>
                  <Swords className={fontSizes[size].icon} />
                  <span>{formatMod(terrain.attack_mod)}</span>
                </div>
              )}
              {formatMod(terrain.defense_mod) && (
                <div className={cn('flex items-center gap-0.5 bg-black/30 px-1 py-0.5 rounded', fontSizes[size].mod)}>
                  <Shield className={fontSizes[size].icon} />
                  <span>{formatMod(terrain.defense_mod)}</span>
                </div>
              )}
              {formatMod(terrain.mobility_mod) && (
                <div className={cn('flex items-center gap-0.5 bg-black/30 px-1 py-0.5 rounded', fontSizes[size].mod)}>
                  <Move className={fontSizes[size].icon} />
                  <span>{formatMod(terrain.mobility_mod)}</span>
                </div>
              )}
              {isPrimary && primaryTerrain.visibility !== 'normal' && (
                <div className={cn('flex items-center gap-0.5 bg-black/30 px-1 py-0.5 rounded', fontSizes[size].mod)}>
                  <Eye className={fontSizes[size].icon} />
                  <span>{VISIBILITY_OPTIONS.find(v => v.value === primaryTerrain.visibility)?.modifier || 0}</span>
                </div>
              )}
              {!isPrimary && formatMod(secondaryTerrain.strategy_mod) && (
                <div className={cn('flex items-center gap-0.5 bg-black/30 px-1 py-0.5 rounded', fontSizes[size].mod)}>
                  <Lightbulb className={fontSizes[size].icon} />
                  <span>{formatMod(secondaryTerrain.strategy_mod)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Hexagonal border overlay */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 115"
        preserveAspectRatio="none"
      >
        <polygon 
          points="50,2 98,28 98,87 50,113 2,87 2,28" 
          fill="none" 
          stroke="rgba(255,255,255,0.4)" 
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
