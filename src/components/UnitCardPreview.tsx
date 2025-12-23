import { UnitCard } from '@/types/UnitCard';
import { Shield, Swords, Target, Move, Heart, Star, Coins, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UnitCardPreviewProps {
  unit: UnitCard;
}

const experienceColors: Record<string, string> = {
  'Amador': 'bg-slate-500',
  'Recruta': 'bg-emerald-600',
  'Profissional': 'bg-blue-600',
  'Veterano': 'bg-purple-600',
  'Elite': 'bg-amber-500',
  'Lendário': 'bg-gradient-to-r from-amber-500 via-red-500 to-purple-600'
};

const postureColors: Record<string, string> = {
  'Ofensiva': 'bg-red-600',
  'Defensiva': 'bg-blue-600',
  'Carga': 'bg-orange-600',
  'Reorganização': 'bg-green-600'
};

export function UnitCardPreview({ unit }: UnitCardPreviewProps) {
  const expColor = experienceColors[unit.experience] || 'bg-muted';
  const postureColor = unit.currentPosture ? postureColors[unit.currentPosture] : null;

  return (
    <div className="relative w-[280px] h-[400px] rounded-xl overflow-hidden shadow-2xl border-2 border-amber-700/50">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: unit.customBackgroundImage 
            ? `url(${unit.customBackgroundImage})` 
            : unit.backgroundImage 
              ? `url(${unit.backgroundImage})`
              : 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          {/* Experience Badge */}
          <Badge className={`${expColor} text-white text-xs font-bold px-2 py-1 shadow-lg`}>
            {unit.experience}
          </Badge>
          
          {/* Maintenance Cost */}
          <div className="flex items-center gap-1 bg-amber-900/80 rounded-full px-2 py-1">
            <Coins className="w-3 h-3 text-amber-400" />
            <span className="text-amber-200 text-xs font-bold">{unit.maintenanceCost}</span>
          </div>
        </div>

        {/* Unit Name */}
        <h2 className="text-xl font-bold text-white text-center mb-2 drop-shadow-lg tracking-wide">
          {unit.name}
        </h2>

        {/* Current Posture */}
        {unit.currentPosture && (
          <div className="flex justify-center mb-3">
            <Badge className={`${postureColor} text-white text-xs font-semibold px-3 py-1`}>
              {unit.currentPosture}
            </Badge>
          </div>
        )}

        {/* Stats Grid */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-3 w-full max-w-[200px]">
            {/* Attack */}
            <div className="flex items-center gap-2 bg-red-900/60 backdrop-blur-sm rounded-lg p-2 border border-red-500/30">
              <Swords className="w-5 h-5 text-red-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-red-300 uppercase tracking-wider">Ataque</span>
                <span className="text-lg font-bold text-white">{unit.attack}</span>
              </div>
            </div>

            {/* Defense */}
            <div className="flex items-center gap-2 bg-blue-900/60 backdrop-blur-sm rounded-lg p-2 border border-blue-500/30">
              <Shield className="w-5 h-5 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-blue-300 uppercase tracking-wider">Defesa</span>
                <span className="text-lg font-bold text-white">{unit.defense}</span>
              </div>
            </div>

            {/* Ranged */}
            <div className="flex items-center gap-2 bg-green-900/60 backdrop-blur-sm rounded-lg p-2 border border-green-500/30">
              <Target className="w-5 h-5 text-green-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-green-300 uppercase tracking-wider">Tiro</span>
                <span className="text-lg font-bold text-white">{unit.ranged}</span>
              </div>
            </div>

            {/* Movement */}
            <div className="flex items-center gap-2 bg-amber-900/60 backdrop-blur-sm rounded-lg p-2 border border-amber-500/30">
              <Move className="w-5 h-5 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-amber-300 uppercase tracking-wider">Mov.</span>
                <span className="text-lg font-bold text-white">{unit.movement}</span>
              </div>
            </div>

            {/* Morale */}
            <div className="flex items-center gap-2 bg-purple-900/60 backdrop-blur-sm rounded-lg p-2 border border-purple-500/30 col-span-2">
              <Heart className="w-5 h-5 text-purple-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-purple-300 uppercase tracking-wider">Moral</span>
                <span className="text-lg font-bold text-white">{unit.morale}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Force */}
        <div className="mt-auto">
          <div className="flex items-center justify-center gap-2 bg-slate-900/80 backdrop-blur-sm rounded-lg p-2 border border-slate-500/30">
            <Users className="w-5 h-5 text-slate-300" />
            <span className="text-sm text-slate-300 font-medium">Força Total:</span>
            <span className="text-xl font-bold text-white">{unit.totalForce}</span>
          </div>
        </div>

        {/* Special Abilities */}
        {unit.specialAbilities.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold">Habilidades</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {unit.specialAbilities.slice(0, 3).map((ability) => (
                <Badge 
                  key={ability.id} 
                  variant="outline" 
                  className="text-[9px] bg-amber-950/60 text-amber-200 border-amber-600/50 px-1.5 py-0.5"
                >
                  {ability.name} Lv.{ability.level}
                </Badge>
              ))}
              {unit.specialAbilities.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-[9px] bg-slate-950/60 text-slate-300 border-slate-600/50 px-1.5 py-0.5"
                >
                  +{unit.specialAbilities.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Pressure & Hits indicators (game state) */}
        {(unit.normalPressure !== undefined || unit.hits !== undefined) && (
          <div className="mt-2 flex justify-center gap-4 text-xs">
            {unit.normalPressure !== undefined && unit.normalPressure > 0 && (
              <span className="text-yellow-400">Pressão: {unit.normalPressure}</span>
            )}
            {unit.hits !== undefined && unit.hits > 0 && (
              <span className="text-red-400">Hits: {unit.hits}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
