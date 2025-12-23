import React from 'react';
import { FieldCommander, SPECIALIZATIONS, CommanderSpecialization } from '@/types/FieldCommander';
import { 
  Swords, 
  Target, 
  Castle, 
  Star,
  Brain,
  ShieldCheck,
  User,
  Flag,
  Crosshair,
  Sparkles,
  PersonStanding
} from 'lucide-react';

interface CommanderCardPreviewProps {
  commander: FieldCommander;
  scale?: number;
}

// Calcula o poder baseado no prestígio gasto
function calculatePower(commander: FieldCommander): number {
  const comandoCost = (commander.comando - 1) * 2;
  const estrategiaCost = (commander.estrategia - 1) * 2;
  const guardaCost = (commander.guarda - 1) * 2;
  const specsCost = commander.especializacoes_adicionais.length * 2;
  
  return comandoCost + estrategiaCost + guardaCost + specsCost + 10;
}

// Ícones para as 5 especializações fixas
const SPECIALIZATION_ICONS: Record<CommanderSpecialization, React.ElementType> = {
  'Infantaria': Swords,
  'Cavalaria': PersonStanding,
  'Tiro': Crosshair,
  'Cerco': Castle,
  'Magia': Sparkles
};

const CULTURE_COLORS: Record<string, { bg: string; accent: string; text: string; border: string }> = {
  'Anuire': { bg: 'from-blue-900 to-blue-950', accent: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-600' },
  'Khinasi': { bg: 'from-amber-900 to-orange-950', accent: 'bg-cyan-400', text: 'text-cyan-300', border: 'border-cyan-500' },
  'Vos': { bg: 'from-red-900 to-red-950', accent: 'bg-gray-300', text: 'text-gray-200', border: 'border-gray-400' },
  'Rjurik': { bg: 'from-emerald-900 to-green-950', accent: 'bg-amber-400', text: 'text-amber-300', border: 'border-amber-500' },
  'Brecht': { bg: 'from-slate-800 to-slate-950', accent: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-600' }
};

export function CommanderCardPreview({ 
  commander,
  scale = 1 
}: CommanderCardPreviewProps) {
  const colors = CULTURE_COLORS[commander.cultura_origem] || CULTURE_COLORS['Anuire'];
  const power = calculatePower(commander);
  
  const activeSpecs = new Set([
    commander.especializacao_inicial,
    ...commander.especializacoes_adicionais
  ]);

  // Card vertical maior: 320x480 pixels base
  const cardWidth = 320 * scale;
  const cardHeight = 480 * scale;

  return (
    <div 
      className={`relative bg-gradient-to-b ${colors.bg} rounded-lg overflow-hidden border-2 ${colors.border}/50 shadow-xl`}
      style={{ 
        width: cardWidth, 
        height: cardHeight,
        fontSize: `${12 * scale}px`
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.03) 10px,
            rgba(255,255,255,0.03) 20px
          )`
        }} />
      </div>

      {/* Main content - vertical layout */}
      <div className="relative h-full flex flex-col p-3 gap-2">
        
        {/* Top: Photo left, Coat of Arms right */}
        <div className="flex items-start justify-between gap-2">
          {/* Commander Photo */}
          <div 
            className="rounded border-2 border-amber-500/50 bg-black/40 flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ width: 100 * scale, height: 120 * scale }}
          >
            {commander.commander_photo_url ? (
              <img 
                src={commander.commander_photo_url} 
                alt={commander.nome_comandante}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="text-amber-500/50" style={{ width: 48 * scale, height: 48 * scale }} />
            )}
          </div>
          
          {/* Coat of Arms */}
          <div 
            className="rounded border-2 border-amber-500/50 bg-black/40 flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ width: 80 * scale, height: 100 * scale }}
          >
            {commander.coat_of_arms_url ? (
              <img 
                src={commander.coat_of_arms_url} 
                alt="Brasão"
                className="w-full h-full object-cover"
              />
            ) : (
              <Flag className="text-amber-500/50" style={{ width: 36 * scale, height: 36 * scale }} />
            )}
          </div>
        </div>

        {/* Name + Power */}
        <div className="flex items-center gap-2">
          <div 
            className={`${colors.accent} rounded-full flex items-center justify-center font-black text-black shadow-lg flex-shrink-0`}
            style={{ 
              width: 40 * scale, 
              height: 40 * scale,
              fontSize: `${18 * scale}px`
            }}
          >
            {power}
          </div>
          <div 
            className={`${colors.text} font-bold truncate leading-tight flex-1`}
            style={{ fontSize: `${16 * scale}px` }}
          >
            {commander.nome_comandante}
          </div>
        </div>
        
        {/* Stats row: Comando, Estratégia, Guarda */}
        <div className="flex items-center gap-2 justify-between">
          {/* Comando */}
          <div className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-amber-500/30 flex-1 justify-center">
            <Star 
              className="text-amber-400" 
              style={{ width: 16 * scale, height: 16 * scale }}
              fill="currentColor"
            />
            <span 
              className="text-white font-bold"
              style={{ fontSize: `${16 * scale}px` }}
            >
              {commander.comando}
            </span>
          </div>

          {/* Estratégia */}
          <div className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-cyan-500/30 flex-1 justify-center">
            <Brain 
              className="text-cyan-400" 
              style={{ width: 16 * scale, height: 16 * scale }}
            />
            <span 
              className="text-white font-bold"
              style={{ fontSize: `${16 * scale}px` }}
            >
              {commander.estrategia}
            </span>
          </div>

          {/* Guarda */}
          <div className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-emerald-500/30 flex-1 justify-center">
            <ShieldCheck 
              className="text-emerald-400" 
              style={{ width: 16 * scale, height: 16 * scale }}
            />
            <span 
              className="text-white font-bold"
              style={{ fontSize: `${16 * scale}px` }}
            >
              {commander.guarda}
            </span>
          </div>
        </div>

        {/* 5 Specialization slots */}
        <div className="flex items-center justify-center gap-2">
          {SPECIALIZATIONS.map((spec) => {
            const IconComponent = SPECIALIZATION_ICONS[spec];
            const hasSpec = activeSpecs.has(spec);
            
            return (
              <div 
                key={spec}
                className={`rounded border flex flex-col items-center justify-center gap-0.5 ${
                  hasSpec 
                    ? 'bg-amber-900/60 border-amber-500/50' 
                    : 'bg-black/20 border-amber-500/20'
                }`}
                style={{ 
                  width: 48 * scale, 
                  height: 48 * scale,
                  padding: 4 * scale
                }}
                title={spec}
              >
                <IconComponent 
                  className={hasSpec ? 'text-amber-400' : 'text-amber-500/30'} 
                  style={{ width: 20 * scale, height: 20 * scale }}
                />
                <span 
                  className={`font-medium ${hasSpec ? 'text-amber-300' : 'text-amber-500/30'}`}
                  style={{ fontSize: `${7 * scale}px` }}
                >
                  {spec.substring(0, 3).toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>

        {/* D&D Stats Section */}
        <div className="bg-black/30 rounded border border-amber-500/20 p-2">
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="flex flex-col">
              <span className="text-amber-500/70" style={{ fontSize: `${8 * scale}px` }}>CLASSE</span>
              <span className="text-white font-medium" style={{ fontSize: `${10 * scale}px` }}>
                {commander.classe || '-'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-amber-500/70" style={{ fontSize: `${8 * scale}px` }}>NÍVEL</span>
              <span className="text-white font-medium" style={{ fontSize: `${10 * scale}px` }}>
                {commander.nivel || '-'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-amber-500/70" style={{ fontSize: `${8 * scale}px` }}>AC</span>
              <span className="text-white font-medium" style={{ fontSize: `${10 * scale}px` }}>
                {commander.ac || '-'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-amber-500/70" style={{ fontSize: `${8 * scale}px` }}>ATAQUE</span>
              <span className="text-white font-medium" style={{ fontSize: `${10 * scale}px` }}>
                {commander.ataque || '-'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-amber-500/70" style={{ fontSize: `${8 * scale}px` }}>HP</span>
              <span className="text-white font-medium" style={{ fontSize: `${10 * scale}px` }}>
                {commander.hit_points || '-'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-amber-500/70" style={{ fontSize: `${8 * scale}px` }}>PP</span>
              <span className="text-purple-300 font-bold" style={{ fontSize: `${10 * scale}px` }}>
                {commander.pontos_prestigio}
              </span>
            </div>
          </div>
          {commander.habilidades && (
            <div className="mt-1 pt-1 border-t border-amber-500/20">
              <span className="text-amber-500/70" style={{ fontSize: `${8 * scale}px` }}>HABILIDADES: </span>
              <span className="text-white/80" style={{ fontSize: `${9 * scale}px` }}>
                {commander.habilidades}
              </span>
            </div>
          )}
        </div>

        {/* Bio Section */}
        <div className="bg-black/30 rounded border border-amber-500/20 p-2 flex-1">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div className="flex items-center gap-1">
              <span className="text-amber-500/70" style={{ fontSize: `${8 * scale}px` }}>REGENTE:</span>
              <span className="text-white/90 truncate" style={{ fontSize: `${9 * scale}px` }}>
                {commander.regent_id || '-'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-amber-500/70" style={{ fontSize: `${8 * scale}px` }}>IDADE:</span>
              <span className="text-white/90" style={{ fontSize: `${9 * scale}px` }}>
                {commander.idade || '-'}
              </span>
            </div>
            <div className="flex items-center gap-1 col-span-2">
              <span className="text-amber-500/70" style={{ fontSize: `${8 * scale}px` }}>DOMÍNIO:</span>
              <span className="text-white/90 truncate" style={{ fontSize: `${9 * scale}px` }}>
                {commander.dominio || '-'}
              </span>
            </div>
          </div>
          {commander.notas && (
            <div className="mt-1 pt-1 border-t border-amber-500/20">
              <span className="text-white/70 italic" style={{ fontSize: `${9 * scale}px` }}>
                {commander.notas}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${colors.accent} opacity-60`} />
    </div>
  );
}

export default CommanderCardPreview;
