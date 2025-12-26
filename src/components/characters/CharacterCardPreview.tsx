import { 
  CharacterCard, 
  SystemConfig,
  calculatePowerCost 
} from '@/types/CharacterCard';
import { 
  Sword, 
  Shield, 
  Footprints,
  Crown,
  Target,
  Building,
  Flame,
  Crosshair
} from 'lucide-react';

interface CharacterCardPreviewProps {
  character: CharacterCard;
  config: SystemConfig;
  scale?: number;
}

const CULTURE_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  'Anuire': { bg: 'from-blue-900 to-blue-950', accent: 'bg-blue-500', text: 'text-blue-200' },
  'Khinasi': { bg: 'from-amber-900 to-amber-950', accent: 'bg-amber-500', text: 'text-amber-200' },
  'Vos': { bg: 'from-red-900 to-red-950', accent: 'bg-red-500', text: 'text-red-200' },
  'Rjurik': { bg: 'from-green-900 to-green-950', accent: 'bg-green-500', text: 'text-green-200' },
  'Brecht': { bg: 'from-slate-800 to-slate-950', accent: 'bg-slate-400', text: 'text-slate-200' },
};

const SPECIALTY_ICONS: Record<string, React.ElementType> = {
  'Infantaria': Sword,
  'Cavalaria': Footprints,
  'Arqueria': Target,
  'Sitio': Building,
};

const PASSIVE_ICONS: Record<string, React.ElementType> = {
  'Ataque': Sword,
  'Defesa': Shield,
  'Mobilidade': Footprints,
};

export function CharacterCardPreview({ character, config, scale = 1 }: CharacterCardPreviewProps) {
  const colors = CULTURE_COLORS[character.culture] || CULTURE_COLORS['Anuire'];
  const powerCost = character.power_cost_override ?? calculatePowerCost(character, config);

  const cardStyle = {
    width: `${320 * scale}px`,
    minHeight: `${480 * scale}px`,
    fontSize: `${14 * scale}px`,
  };

  return (
    <div 
      className={`relative rounded-xl overflow-hidden bg-gradient-to-b ${colors.bg} border-2 border-white/20 shadow-2xl`}
      style={cardStyle}
    >
      {/* Header */}
      <div className="relative p-3">
        {/* Power Cost Badge */}
        <div className={`absolute top-2 right-2 ${colors.accent} text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg`}
          style={{ width: `${40 * scale}px`, height: `${40 * scale}px`, fontSize: `${16 * scale}px` }}
        >
          {powerCost.toFixed(1)}
        </div>

        {/* Character Type Tags */}
        <div className="flex gap-1 mb-2">
          {character.character_type.map(type => (
            <span 
              key={type}
              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                type === 'Herói' ? 'bg-yellow-500/80 text-yellow-950' : 'bg-purple-500/80 text-white'
              }`}
              style={{ fontSize: `${10 * scale}px` }}
            >
              {type}
            </span>
          ))}
        </div>

        {/* Culture */}
        <div className={`text-xs ${colors.text} mb-1`} style={{ fontSize: `${10 * scale}px` }}>
          {character.culture}
        </div>

        {/* Name */}
        <h2 
          className="text-white font-bold leading-tight"
          style={{ fontSize: `${18 * scale}px` }}
        >
          {character.name}
        </h2>

        {/* Domain */}
        {character.domain && (
          <div className="text-white/60 text-xs" style={{ fontSize: `${10 * scale}px` }}>
            {character.domain}
          </div>
        )}
      </div>

      {/* Portrait Area */}
      <div 
        className="mx-3 rounded-lg overflow-hidden bg-black/30 flex items-center justify-center"
        style={{ height: `${140 * scale}px` }}
      >
        {character.portrait_url ? (
          <img 
            src={character.portrait_url} 
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Crown className="text-white/20" style={{ width: `${48 * scale}px`, height: `${48 * scale}px` }} />
        )}
        
        {/* Coat of Arms overlay */}
        {character.coat_of_arms_url && (
          <div className="absolute bottom-2 right-4">
            <img 
              src={character.coat_of_arms_url} 
              alt="Brasão"
              className="rounded shadow-lg border border-white/20"
              style={{ width: `${40 * scale}px`, height: `${40 * scale}px`, objectFit: 'cover' }}
            />
          </div>
        )}
      </div>

      {/* Attributes */}
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {/* Comando */}
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <div className="text-white/60 text-xs" style={{ fontSize: `${9 * scale}px` }}>Comando</div>
            <div className="text-white font-bold" style={{ fontSize: `${20 * scale}px` }}>
              {character.comando}
            </div>
          </div>
          
          {/* Estratégia */}
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <div className="text-white/60 text-xs" style={{ fontSize: `${9 * scale}px` }}>Estratégia</div>
            <div className="text-white font-bold" style={{ fontSize: `${20 * scale}px` }}>
              {character.estrategia}
            </div>
          </div>
          
          {/* Guarda */}
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <div className="text-white/60 text-xs" style={{ fontSize: `${9 * scale}px` }}>Guarda</div>
            <div className="text-white font-bold" style={{ fontSize: `${20 * scale}px` }}>
              {character.guarda}
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div className="flex gap-1 mb-3 flex-wrap">
          {config.specialties.map(specialty => {
            const Icon = SPECIALTY_ICONS[specialty] || Flame;
            const hasSpecialty = character.specialties.includes(specialty as typeof character.specialties[number]);
            return (
              <div 
                key={specialty}
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                  hasSpecialty 
                    ? `${colors.accent} text-white` 
                    : 'bg-white/10 text-white/30'
                }`}
                style={{ fontSize: `${10 * scale}px` }}
              >
                <Icon style={{ width: `${12 * scale}px`, height: `${12 * scale}px` }} />
                <span>{specialty}</span>
              </div>
            );
          })}
        </div>

        {/* Passive Bonus */}
        {character.passive_bonus_type && character.passive_bonus_value > 0 && (
          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-2 mb-3">
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = PASSIVE_ICONS[character.passive_bonus_type] || Shield;
                return <Icon className="text-yellow-400" style={{ width: `${14 * scale}px`, height: `${14 * scale}px` }} />;
              })()}
              <span className="text-yellow-200 text-sm" style={{ fontSize: `${11 * scale}px` }}>
                +{character.passive_bonus_value} {character.passive_bonus_type}
                {character.passive_affects_area && (
                  <span className="text-yellow-400/70 ml-1">(Área)</span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Special Ability */}
        {(character.custom_ability_name || character.ability_id) && (
          <div className="bg-purple-500/20 border border-purple-500/40 rounded-lg p-2">
            <div className="flex items-center gap-2 mb-1">
              <Crosshair className="text-purple-400" style={{ width: `${12 * scale}px`, height: `${12 * scale}px` }} />
              <span className="text-purple-200 font-semibold" style={{ fontSize: `${11 * scale}px` }}>
                {character.custom_ability_name || 'Habilidade Especial'}
              </span>
            </div>
            {character.custom_ability_description && (
              <p className="text-white/70 text-xs leading-tight" style={{ fontSize: `${9 * scale}px` }}>
                {character.custom_ability_description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-3 py-2 flex justify-between items-center">
        <span className="text-white/40 text-xs" style={{ fontSize: `${8 * scale}px` }}>
          Tenebra Lux
        </span>
        <span className="text-white/40 text-xs" style={{ fontSize: `${8 * scale}px` }}>
          Poder: {powerCost.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
