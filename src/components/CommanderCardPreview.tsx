import React from 'react';
import { FieldCommander, SPECIALIZATIONS, CommanderSpecialization } from '@/types/FieldCommander';
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
  Plus,
  User,
  Flag
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

const CULTURE_COLORS: Record<string, { bg: string; accent: string; text: string; border: string }> = {
  'Anuire': { bg: 'from-blue-900 to-blue-950', accent: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-600' },
  'Khinasi': { bg: 'from-amber-900 to-orange-950', accent: 'bg-cyan-400', text: 'text-cyan-300', border: 'border-cyan-500' },
  'Vos': { bg: 'from-red-900 to-red-950', accent: 'bg-gray-300', text: 'text-gray-200', border: 'border-gray-400' },
  'Rjurik': { bg: 'from-emerald-900 to-green-950', accent: 'bg-amber-400', text: 'text-amber-300', border: 'border-amber-500' },
  'Brecht': { bg: 'from-slate-800 to-slate-950', accent: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-600' }
};

// Total de slots de especialização disponíveis
const MAX_SPECIALIZATION_SLOTS = 7;

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

  // Card horizontal: 400x120 pixels base para acomodar mais elementos
  const cardWidth = 400 * scale;
  const cardHeight = 140 * scale;

  // Slots de especialização (preenchidos + vazios)
  const specSlots = [...allSpecs];
  while (specSlots.length < MAX_SPECIALIZATION_SLOTS) {
    specSlots.push(null as unknown as CommanderSpecialization);
  }

  return (
    <div 
      className={`relative bg-gradient-to-r ${colors.bg} rounded-lg overflow-hidden border-2 ${colors.border}/50 shadow-xl`}
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
      <div className="relative h-full flex items-stretch p-2 gap-2">
        
        {/* Left: Photo + Coat of Arms */}
        <div className="flex flex-col items-center gap-1" style={{ width: 60 * scale }}>
          {/* Commander Photo */}
          <div 
            className="rounded border border-amber-500/50 bg-black/40 flex items-center justify-center overflow-hidden"
            style={{ width: 50 * scale, height: 60 * scale }}
          >
            {commander.commander_photo_url ? (
              <img 
                src={commander.commander_photo_url} 
                alt={commander.nome_comandante}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="text-amber-500/50" style={{ width: 24 * scale, height: 24 * scale }} />
            )}
          </div>
          
          {/* Coat of Arms */}
          <div 
            className="rounded border border-amber-500/50 bg-black/40 flex items-center justify-center overflow-hidden"
            style={{ width: 40 * scale, height: 40 * scale }}
          >
            {commander.coat_of_arms_url ? (
              <img 
                src={commander.coat_of_arms_url} 
                alt="Brasão"
                className="w-full h-full object-cover"
              />
            ) : (
              <Flag className="text-amber-500/50" style={{ width: 18 * scale, height: 18 * scale }} />
            )}
          </div>
        </div>

        {/* Center: Name, Stats, Specializations */}
        <div className="flex-1 flex flex-col justify-between gap-1">
          {/* Top: Power + Name */}
          <div className="flex items-center gap-2">
            {/* Power badge */}
            <div 
              className={`${colors.accent} rounded-full flex items-center justify-center font-black text-black shadow-lg flex-shrink-0`}
              style={{ 
                width: 36 * scale, 
                height: 36 * scale,
                fontSize: `${16 * scale}px`
              }}
            >
              {power}
            </div>
            
            {/* Name */}
            <div 
              className={`${colors.text} font-bold truncate leading-tight flex-1`}
              style={{ fontSize: `${14 * scale}px` }}
            >
              {commander.nome_comandante}
            </div>
          </div>
          
          {/* Middle: Stats row */}
          <div className="flex items-center gap-2">
            {/* Comando */}
            <div className="flex items-center gap-1 bg-black/30 rounded px-1.5 py-0.5 border border-amber-500/30">
              <Star 
                className="text-amber-400" 
                style={{ width: 14 * scale, height: 14 * scale }}
                fill="currentColor"
              />
              <span 
                className="text-white font-bold"
                style={{ fontSize: `${14 * scale}px` }}
              >
                {commander.comando}
              </span>
            </div>

            {/* Estratégia */}
            <div className="flex items-center gap-1 bg-black/30 rounded px-1.5 py-0.5 border border-cyan-500/30">
              <Brain 
                className="text-cyan-400" 
                style={{ width: 14 * scale, height: 14 * scale }}
              />
              <span 
                className="text-white font-bold"
                style={{ fontSize: `${14 * scale}px` }}
              >
                {commander.estrategia}
              </span>
            </div>

            {/* Prestigio acumulado (para anotar no card físico) */}
            <div className="flex items-center gap-1 bg-black/30 rounded px-1.5 py-0.5 border border-purple-500/30 ml-auto">
              <span 
                className="text-purple-400 font-medium"
                style={{ fontSize: `${10 * scale}px` }}
              >
                PP:
              </span>
              <div 
                className="bg-black/50 rounded px-2 py-0.5 min-w-[40px] text-center border border-dashed border-purple-400/50"
                style={{ fontSize: `${12 * scale}px` }}
              >
                <span className="text-purple-300 font-bold">{commander.pontos_prestigio}</span>
              </div>
            </div>
          </div>

          {/* Bottom: Specializations slots */}
          <div className="flex items-center gap-1">
            {specSlots.map((spec, index) => {
              const IconComponent = spec ? SPECIALIZATION_ICONS[spec] : Plus;
              const isInitial = index === 0;
              const isEmpty = !spec;
              
              return (
                <div 
                  key={index}
                  className={`rounded border flex items-center justify-center ${
                    isEmpty 
                      ? 'bg-black/20 border-dashed border-amber-500/20' 
                      : isInitial 
                        ? 'bg-amber-900/60 border-amber-500/50' 
                        : 'bg-black/40 border-amber-500/30'
                  }`}
                  style={{ 
                    width: 28 * scale, 
                    height: 28 * scale,
                    padding: 4 * scale
                  }}
                  title={spec || 'Slot disponível'}
                >
                  <IconComponent 
                    className={isEmpty ? 'text-amber-500/30' : 'text-amber-400'} 
                    style={{ width: 16 * scale, height: 16 * scale }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Guard (HP) tracker */}
        <div 
          className="flex flex-col items-center justify-center gap-1 bg-black/30 rounded-lg border border-emerald-500/30 p-1.5"
          style={{ width: 50 * scale }}
        >
          <ShieldCheck 
            className="text-emerald-400" 
            style={{ width: 18 * scale, height: 18 * scale }}
          />
          <span 
            className="text-emerald-300 font-medium"
            style={{ fontSize: `${8 * scale}px` }}
          >
            GUARDA
          </span>
          
          {/* HP boxes - vertical stack to cross out */}
          <div className="flex flex-col gap-0.5">
            {Array.from({ length: Math.min(commander.guarda, 10) }).map((_, index) => (
              <div 
                key={index}
                className="bg-emerald-900/60 border border-emerald-500/50 rounded-sm"
                style={{ 
                  width: 24 * scale, 
                  height: 10 * scale 
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${colors.accent} opacity-60`} />
    </div>
  );
}

export default CommanderCardPreview;