import { TerrainType } from '@/types/Terrain';
import { cn } from '@/lib/utils';

interface TerrainHexTileProps {
  terrain: TerrainType;
  size?: 'sm' | 'md' | 'lg';
  showModifiers?: boolean;
  className?: string;
}

const tagColors: Record<string, string> = {
  'Elevação': 'from-amber-600 to-amber-800',
  'Profundidade': 'from-blue-500 to-blue-700',
  'Obstrução': 'from-orange-500 to-red-600',
  'Fortificação': 'from-gray-500 to-gray-700',
  'Cobertura': 'from-green-500 to-green-700',
  'Obstáculo': 'from-stone-500 to-stone-700',
  'Desnível': 'from-purple-500 to-purple-700',
  'Calor': 'from-yellow-400 to-yellow-600',
  'Frio': 'from-slate-100 to-slate-300',
};

// Specific terrain name colors (override tag colors)
const terrainNameColors: Record<string, string> = {
  'Planície': 'from-orange-300 to-orange-400',
  'Brejo': 'from-gray-800 to-gray-900',
  'Pântano': 'from-gray-900 to-black',
};

const sizeClasses = {
  sm: 'w-24 h-28',
  md: 'w-32 h-36',
  lg: 'w-40 h-46',
};

const fontSizes = {
  sm: 'text-[8px]',
  md: 'text-[10px]',
  lg: 'text-xs',
};

export function TerrainHexTile({ terrain, size = 'md', showModifiers = true, className }: TerrainHexTileProps) {
  // Check for specific terrain name color first, then tag color, then default
  const gradientClass = terrainNameColors[terrain.name] 
    || (terrain.tag ? tagColors[terrain.tag] : null) 
    || 'from-green-400 to-green-600';
  
  const formatMod = (value: number | string, prefix?: string) => {
    if (typeof value === 'string') return value;
    if (value === 0) return '0';
    return value > 0 ? `+${value}` : `${value}`;
  };

  return (
    <div className={cn('relative inline-block', sizeClasses[size], className)}>
      {/* Hexagon shape with clip-path */}
      <div 
        className={cn(
          'absolute inset-0 bg-gradient-to-br shadow-lg',
          gradientClass
        )}
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
      >
        {/* Background image */}
        {terrain.image_url && (
          <img 
            src={terrain.image_url} 
            alt={terrain.name}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}
          />
        )}
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-1">
          {/* Terrain name */}
          <div className={cn(
            'font-bold text-center leading-tight drop-shadow-md',
            size === 'lg' ? 'text-sm' : size === 'md' ? 'text-xs' : 'text-[10px]'
          )}>
            {terrain.name}
          </div>
          
          {/* Tag badge */}
          {terrain.tag && (
            <div className={cn(
              'bg-black/40 rounded px-1 mt-0.5',
              fontSizes[size]
            )}>
              {terrain.tag}
            </div>
          )}
          
          {/* Level indicator */}
          <div className={cn(
            'flex gap-0.5 mt-0.5',
            fontSizes[size]
          )}>
            {Array.from({ length: terrain.level }).map((_, i) => (
              <span key={i} className="text-yellow-300">★</span>
            ))}
            {terrain.level === 0 && <span className="text-white/60">—</span>}
          </div>
          
          {/* Modifiers */}
          {showModifiers && (
            <div className={cn(
              'grid grid-cols-2 gap-x-1 mt-1 bg-black/30 rounded px-1 py-0.5',
              fontSizes[size]
            )}>
              <span title="Movimento">🦶{formatMod(terrain.movement_mod)}</span>
              <span title="Defesa">🛡️{formatMod(terrain.defense_mod)}</span>
              <span title="Moral">❤️{formatMod(terrain.morale_mod)}</span>
              <span title="Tiro">🏹{formatMod(terrain.ranged_mod)}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Hexagon border */}
      <svg 
        viewBox="0 0 100 115" 
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <polygon 
          points="50,0 100,28.75 100,86.25 50,115 0,86.25 0,28.75" 
          fill="none" 
          stroke="rgba(0,0,0,0.5)" 
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
