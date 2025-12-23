import { UnitCard } from '@/types/UnitCard';
import { Shield, Swords, Target, Move, Heart, Star, Coins, Users, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UnitCardPreviewProps {
  unit: UnitCard;
  commanderName?: string;
  showGameState?: boolean;
}

const experienceConfig: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  'Amador': { bg: 'from-slate-600 to-slate-700', border: 'border-slate-400/50', text: 'text-slate-200', icon: '○' },
  'Recruta': { bg: 'from-emerald-700 to-emerald-800', border: 'border-emerald-400/50', text: 'text-emerald-200', icon: '●' },
  'Profissional': { bg: 'from-blue-700 to-blue-800', border: 'border-blue-400/50', text: 'text-blue-200', icon: '◆' },
  'Veterano': { bg: 'from-purple-700 to-purple-800', border: 'border-purple-400/50', text: 'text-purple-200', icon: '★' },
  'Elite': { bg: 'from-amber-600 to-amber-700', border: 'border-amber-400/50', text: 'text-amber-100', icon: '✦' },
  'Lendário': { bg: 'from-rose-600 via-amber-600 to-purple-600', border: 'border-amber-300/70', text: 'text-amber-100', icon: '✧' }
};

const postureConfig: Record<string, { bg: string; icon: string; label: string }> = {
  'Ofensiva': { bg: 'bg-red-600', icon: '⚔', label: 'Ofensiva' },
  'Defensiva': { bg: 'bg-blue-600', icon: '🛡', label: 'Defensiva' },
  'Carga': { bg: 'bg-orange-600', icon: '🐎', label: 'Carga' },
  'Reorganização': { bg: 'bg-green-600', icon: '⟳', label: 'Reorganização' }
};

export function UnitCardPreview({ unit, commanderName, showGameState = false }: UnitCardPreviewProps) {
  const expConfig = experienceConfig[unit.experience] || experienceConfig['Amador'];
  const postureConf = unit.currentPosture ? postureConfig[unit.currentPosture] : null;

  // Calculate remaining force based on hits
  const remainingForce = unit.totalForce - (unit.hits || 0);
  const forcePercentage = (remainingForce / unit.totalForce) * 100;

  const renderStatBox = (
    icon: React.ReactNode, 
    label: string, 
    value: number, 
    colorClass: string,
    borderClass: string
  ) => (
    <div className={`flex flex-col items-center justify-center bg-gradient-to-br ${colorClass} backdrop-blur-sm rounded-lg p-2 border ${borderClass} min-w-[52px]`}>
      <div className="mb-0.5">{icon}</div>
      <span className="text-[9px] text-slate-300/80 uppercase tracking-wider">{label}</span>
      <span className="text-xl font-bold text-white drop-shadow-md">{value}</span>
    </div>
  );

  return (
    <div className="relative w-[300px] h-[420px] rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/50 border-2 border-amber-800/60">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: unit.customBackgroundImage 
            ? `url(${unit.customBackgroundImage})` 
            : unit.backgroundImage 
              ? `url(${unit.backgroundImage})`
              : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)'
        }}
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/90" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
      
      {/* Decorative Corner Accents */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-amber-500/30 rounded-tl-2xl" />
      <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-amber-500/30 rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-amber-500/30 rounded-bl-2xl" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-amber-500/30 rounded-br-2xl" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-4">
        {/* Header Row */}
        <div className="flex justify-between items-start mb-2">
          {/* Experience Badge */}
          <div className={`bg-gradient-to-r ${expConfig.bg} ${expConfig.border} border rounded-lg px-2.5 py-1 shadow-lg`}>
            <span className={`text-xs font-bold ${expConfig.text} flex items-center gap-1`}>
              <span className="text-sm">{expConfig.icon}</span>
              {unit.experience}
            </span>
          </div>
          
          {/* Maintenance Cost */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-900/90 to-yellow-900/80 rounded-lg px-2.5 py-1 border border-amber-600/40 shadow-lg">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm font-bold">{unit.maintenanceCost} GB</span>
          </div>
        </div>

        {/* Unit Name */}
        <div className="text-center mb-1">
          <h2 className="text-xl font-bold text-white drop-shadow-lg tracking-wide">
            {unit.name}
          </h2>
          <div className="h-0.5 w-20 mx-auto mt-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
        </div>

        {/* Commander */}
        {commanderName && (
          <div className="text-center mb-2">
            <span className="text-xs text-amber-300/80 italic">Comandante: {commanderName}</span>
          </div>
        )}

        {/* Current Posture */}
        {showGameState && postureConf && (
          <div className="flex justify-center mb-3">
            <div className={`${postureConf.bg} rounded-full px-4 py-1.5 shadow-lg flex items-center gap-2`}>
              <span className="text-lg">{postureConf.icon}</span>
              <span className="text-white text-sm font-semibold">{postureConf.label}</span>
            </div>
          </div>
        )}

        {/* Stats Grid - Central Focus */}
        <div className="flex-1 flex items-center justify-center py-2">
          <div className="grid grid-cols-3 gap-2">
            {renderStatBox(
              <Swords className="w-5 h-5 text-red-400" />,
              'Ataque',
              unit.attack,
              'from-red-950/80 to-red-900/60',
              'border-red-500/30'
            )}
            {renderStatBox(
              <Shield className="w-5 h-5 text-blue-400" />,
              'Defesa',
              unit.defense,
              'from-blue-950/80 to-blue-900/60',
              'border-blue-500/30'
            )}
            {renderStatBox(
              <Target className="w-5 h-5 text-green-400" />,
              'Tiro',
              unit.ranged,
              'from-green-950/80 to-green-900/60',
              'border-green-500/30'
            )}
            {renderStatBox(
              <Move className="w-5 h-5 text-amber-400" />,
              'Mov.',
              unit.movement,
              'from-amber-950/80 to-amber-900/60',
              'border-amber-500/30'
            )}
            {renderStatBox(
              <Heart className="w-5 h-5 text-pink-400" />,
              'Moral',
              unit.morale,
              'from-pink-950/80 to-pink-900/60',
              'border-pink-500/30'
            )}
            {renderStatBox(
              <Zap className="w-5 h-5 text-purple-400" />,
              'Força',
              unit.totalForce,
              'from-purple-950/80 to-purple-900/60',
              'border-purple-500/30'
            )}
          </div>
        </div>

        {/* Force Bar (Game State) */}
        {showGameState && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Força Atual</span>
              <span>{remainingForce}/{unit.totalForce}</span>
            </div>
            <div className="h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-600/30">
              <div 
                className={`h-full transition-all duration-300 ${
                  forcePercentage > 60 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                  forcePercentage > 30 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                  'bg-gradient-to-r from-red-600 to-red-400'
                }`}
                style={{ width: `${forcePercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Special Abilities */}
        {unit.specialAbilities.length > 0 && (
          <div className="mt-auto">
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] text-amber-300/80 uppercase tracking-wider font-semibold">
                Habilidades Especiais
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {unit.specialAbilities.slice(0, 4).map((ability) => (
                <Badge 
                  key={ability.id} 
                  className="text-[10px] bg-gradient-to-r from-slate-800/90 to-slate-700/80 text-slate-200 border border-amber-600/40 px-2 py-0.5 shadow-sm"
                >
                  {ability.name}
                  <span className="ml-1 text-amber-400 font-bold">Lv.{ability.level}</span>
                </Badge>
              ))}
              {unit.specialAbilities.length > 4 && (
                <Badge className="text-[10px] bg-slate-800/60 text-slate-400 border border-slate-600/30 px-2 py-0.5">
                  +{unit.specialAbilities.length - 4} mais
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Pressure Indicator (Game State) */}
        {showGameState && unit.normalPressure !== undefined && unit.normalPressure > 0 && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-xs text-yellow-400/80">Pressão:</span>
            <div className="flex gap-1">
              {Array.from({ length: unit.normalPressure }, (_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-400/50" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
