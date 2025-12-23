import React from 'react';
import { FieldCommander } from '@/types/FieldCommander';
import { 
  Shield, 
  Swords, 
  Target, 
  Castle, 
  Users, 
  Crown, 
  Anchor,
  Star,
  Brain,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface CommanderCardPreviewProps {
  commander: FieldCommander;
  scale?: number;
}

// Calcula o poder baseado no prestígio gasto
// Custo para alcançar nível N partindo de 1 = (N-1) × 2
// Poder = total gasto + 10
function calculatePower(commander: FieldCommander): number {
  const comandoCost = (commander.comando - 1) * 2;
  const estrategiaCost = (commander.estrategia - 1) * 2;
  const guardaCost = (commander.guarda - 1) * 2;
  const specsCost = commander.especializacoes_adicionais.length * 2;
  
  return comandoCost + estrategiaCost + guardaCost + specsCost + 10;
}

const SPECIALIZATION_ICONS: Record<string, React.ElementType> = {
  'Infantaria': Swords,
  'Cavalaria': Shield,
  'Arqueiro': Target,
  'Cerco': Castle,
  'Milicia': Users,
  'Elite': Crown,
  'Naval': Anchor
};

const CULTURE_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  'Anuire': { bg: 'from-blue-900 to-blue-950', accent: 'bg-amber-500', text: 'text-amber-400' },
  'Khinasi': { bg: 'from-amber-900 to-orange-950', accent: 'bg-cyan-400', text: 'text-cyan-300' },
  'Vos': { bg: 'from-red-900 to-red-950', accent: 'bg-gray-300', text: 'text-gray-200' },
  'Rjurik': { bg: 'from-emerald-900 to-green-950', accent: 'bg-amber-400', text: 'text-amber-300' },
  'Brecht': { bg: 'from-slate-800 to-slate-950', accent: 'bg-amber-500', text: 'text-amber-400' }
};

export function CommanderCardPreview({ 
  commander,
  scale = 1 
}: CommanderCardPreviewProps) {
  const colors = CULTURE_COLORS[commander.cultura_origem] || CULTURE_COLORS['Anuire'];
  const power = calculatePower(commander);
  
  const allSpecs = [
    commander.especializacao_inicial,
    ...commander.especializacoes_adicionais
  ];

  // Card horizontal: 320x90 pixels base
  const cardWidth = 320 * scale;
  const cardHeight = 90 * scale;

  return (
    <div 
      className={`relative bg-gradient-to-r ${colors.bg} rounded-lg overflow-hidden border-2 border-amber-600/50 shadow-xl`}
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

      {/* Main content - horizontal layout */}
      <div className="relative h-full flex items-center px-3 gap-3">
        
        {/* Left: Power badge */}
        <div className="flex flex-col items-center justify-center">
          <div 
            className={`${colors.accent} rounded-full flex items-center justify-center font-black text-black shadow-lg`}
            style={{ 
              width: 52 * scale, 
              height: 52 * scale,
              fontSize: `${20 * scale}px`
            }}
          >
            {power}
          </div>
          <span 
            className="text-amber-300/80 font-medium uppercase tracking-wide"
            style={{ fontSize: `${8 * scale}px` }}
          >
            Poder
          </span>
        </div>

        {/* Center: Name + Stats */}
        <div className="flex-1 flex flex-col justify-center gap-1.5">
          {/* Name */}
          <div 
            className={`${colors.text} font-bold truncate leading-tight`}
            style={{ fontSize: `${13 * scale}px` }}
          >
            {commander.nome_comandante}
          </div>
          
          {/* Stats row */}
          <div className="flex items-center gap-4">
            {/* Comando */}
            <div className="flex items-center gap-1.5 bg-black/30 rounded px-2 py-1 border border-amber-500/30">
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
            <div className="flex items-center gap-1.5 bg-black/30 rounded px-2 py-1 border border-cyan-500/30">
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
            <div className="flex items-center gap-1.5 bg-black/30 rounded px-2 py-1 border border-emerald-500/30">
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
        </div>

        {/* Right: Specializations */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            {allSpecs.slice(0, 4).map((spec, index) => {
              const IconComponent = SPECIALIZATION_ICONS[spec] || Swords;
              return (
                <div 
                  key={index}
                  className={`rounded p-1.5 border ${
                    index === 0 
                      ? 'bg-amber-900/60 border-amber-500/50' 
                      : 'bg-black/40 border-amber-500/30'
                  }`}
                  title={spec}
                >
                  <IconComponent 
                    className="text-amber-400" 
                    style={{ width: 18 * scale, height: 18 * scale }}
                  />
                </div>
              );
            })}
          </div>
          {allSpecs.length > 4 && (
            <span 
              className="text-amber-300/60"
              style={{ fontSize: `${9 * scale}px` }}
            >
              +{allSpecs.length - 4} mais
            </span>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${colors.accent} opacity-60`} />
    </div>
  );
}

export default CommanderCardPreview;
