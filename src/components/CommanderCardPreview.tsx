import { FieldCommander, calculateDerivedFields } from '@/types/FieldCommander';
import { Crown, Shield, Brain, Star, Award, Users, Sword, Target, Castle, Anchor, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CommanderCardPreviewProps {
  commander: FieldCommander;
  isGeneral?: boolean;
  unitsCommanded?: number;
}

const cultureThemes: Record<string, { 
  gradient: string; 
  border: string; 
  accent: string; 
  glow: string;
  pattern: string;
}> = {
  'Anuire': { 
    gradient: 'from-blue-950 via-blue-900 to-slate-900', 
    border: 'border-blue-500/50', 
    accent: 'text-blue-400',
    glow: 'shadow-blue-500/20',
    pattern: 'bg-blue-800/10'
  },
  'Khinasi': { 
    gradient: 'from-amber-950 via-orange-900 to-red-950', 
    border: 'border-amber-500/50', 
    accent: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    pattern: 'bg-amber-800/10'
  },
  'Vos': { 
    gradient: 'from-red-950 via-rose-900 to-slate-900', 
    border: 'border-red-500/50', 
    accent: 'text-red-400',
    glow: 'shadow-red-500/20',
    pattern: 'bg-red-800/10'
  },
  'Rjurik': { 
    gradient: 'from-emerald-950 via-green-900 to-teal-950', 
    border: 'border-emerald-500/50', 
    accent: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    pattern: 'bg-emerald-800/10'
  },
  'Brecht': { 
    gradient: 'from-purple-950 via-violet-900 to-indigo-950', 
    border: 'border-purple-500/50', 
    accent: 'text-purple-400',
    glow: 'shadow-purple-500/20',
    pattern: 'bg-purple-800/10'
  }
};

const specializationIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  'Infantaria': { icon: <Sword className="w-3 h-3" />, color: 'text-red-400 bg-red-950/60 border-red-600/40' },
  'Cavalaria': { icon: <span className="text-sm">🐎</span>, color: 'text-amber-400 bg-amber-950/60 border-amber-600/40' },
  'Arqueiro': { icon: <Target className="w-3 h-3" />, color: 'text-green-400 bg-green-950/60 border-green-600/40' },
  'Cerco': { icon: <Castle className="w-3 h-3" />, color: 'text-stone-400 bg-stone-950/60 border-stone-600/40' },
  'Milicia': { icon: <Shield className="w-3 h-3" />, color: 'text-slate-400 bg-slate-900/60 border-slate-600/40' },
  'Elite': { icon: <Crown className="w-3 h-3" />, color: 'text-purple-400 bg-purple-950/60 border-purple-600/40' },
  'Naval': { icon: <Anchor className="w-3 h-3" />, color: 'text-cyan-400 bg-cyan-950/60 border-cyan-600/40' }
};

export function CommanderCardPreview({ commander, isGeneral = false, unitsCommanded = 0 }: CommanderCardPreviewProps) {
  const theme = cultureThemes[commander.cultura_origem] || cultureThemes['Anuire'];
  const derived = calculateDerivedFields(commander);

  const allSpecializations = [
    commander.especializacao_inicial,
    ...commander.especializacoes_adicionais
  ];

  const renderAttributeBar = (value: number, maxValue: number = 5, colorClass: string) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: maxValue }, (_, i) => (
          <div
            key={i}
            className={`h-2.5 flex-1 rounded-sm ${
              i < value ? colorClass : 'bg-slate-800/60'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`relative w-[300px] h-[420px] rounded-2xl overflow-hidden shadow-2xl ${theme.glow} border-2 ${theme.border}`}>
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
      
      {/* Decorative Pattern */}
      <div className={`absolute inset-0 ${theme.pattern}`}>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.03) 0%, transparent 50%),
                           radial-gradient(circle at 70% 80%, rgba(255,255,255,0.03) 0%, transparent 50%)`
        }} />
      </div>

      {/* General Banner */}
      {isGeneral && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 py-1 text-center z-20 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <Medal className="w-4 h-4 text-amber-950" />
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">General do Exército</span>
            <Medal className="w-4 h-4 text-amber-950" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`relative z-10 h-full flex flex-col p-4 ${isGeneral ? 'pt-10' : ''}`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          {/* Culture Badge */}
          <Badge className={`bg-black/50 ${theme.accent} text-xs font-bold px-2.5 py-1 shadow-lg border ${theme.border}`}>
            {commander.cultura_origem}
          </Badge>
          
          {/* Prestige Points */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-900/80 to-yellow-900/70 rounded-lg px-2.5 py-1 border border-amber-600/40 shadow-lg">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm font-bold">{commander.pontos_prestigio} PP</span>
          </div>
        </div>

        {/* Commander Icon & Name */}
        <div className="flex flex-col items-center mb-2">
          <div className="relative mb-2">
            <div className={`absolute inset-0 blur-md ${theme.accent.replace('text-', 'bg-')}/30 rounded-full`} />
            <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border-2 ${theme.border}`}>
              <Crown className={`w-6 h-6 ${theme.accent}`} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white text-center drop-shadow-lg tracking-wide">
            {commander.nome_comandante}
          </h2>
          {commander.unidade_de_origem && (
            <p className="text-xs text-slate-400 italic mt-0.5">
              {commander.unidade_de_origem}
            </p>
          )}
        </div>

        {/* Main Attributes */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 mb-3">
          <div className="space-y-2.5">
            {/* Comando */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-300 font-medium">Comando</span>
                </div>
                <span className="text-lg font-bold text-white">{commander.comando}</span>
              </div>
              {renderAttributeBar(commander.comando, 5, 'bg-gradient-to-r from-blue-500 to-blue-400')}
            </div>

            {/* Estratégia */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-300 font-medium">Estratégia</span>
                </div>
                <span className="text-lg font-bold text-white">{commander.estrategia}</span>
              </div>
              {renderAttributeBar(commander.estrategia, 5, 'bg-gradient-to-r from-purple-500 to-purple-400')}
            </div>

            {/* Guarda */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-300 font-medium">Guarda</span>
                </div>
                <span className="text-lg font-bold text-white">{commander.guarda}</span>
              </div>
              {renderAttributeBar(commander.guarda, 5, 'bg-gradient-to-r from-green-500 to-green-400')}
            </div>
          </div>
        </div>

        {/* Derived Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="flex items-center justify-between bg-blue-950/40 rounded-lg px-2.5 py-2 border border-blue-600/20">
            <span className="text-blue-300/80">Cartas Táticas</span>
            <span className="text-white font-bold">{derived.pontos_compra_taticos}</span>
          </div>
          <div className="flex items-center justify-between bg-purple-950/40 rounded-lg px-2.5 py-2 border border-purple-600/20">
            <span className="text-purple-300/80">Cartas Estratégicas</span>
            <span className="text-white font-bold">{derived.pontos_compra_estrategicos}</span>
          </div>
          <div className="flex items-center justify-between bg-green-950/40 rounded-lg px-2.5 py-2 border border-green-600/20">
            <span className="text-green-300/80">Unidades</span>
            <span className="text-white font-bold">{unitsCommanded > 0 ? `${unitsCommanded}/${derived.unidades_lideradas}` : derived.unidades_lideradas}</span>
          </div>
          <div className="flex items-center justify-between bg-amber-950/40 rounded-lg px-2.5 py-2 border border-amber-600/20">
            <span className="text-amber-300/80">Influência</span>
            <span className="text-white font-bold">{derived.area_influencia} hex</span>
          </div>
        </div>

        {/* Specializations */}
        <div className="mt-auto">
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] text-amber-300/80 uppercase tracking-wider font-semibold">
              Especializações ({allSpecializations.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allSpecializations.map((spec, index) => {
              const specConfig = specializationIcons[spec] || specializationIcons['Infantaria'];
              return (
                <Badge 
                  key={`${spec}-${index}`}
                  className={`text-[10px] ${specConfig.color} border px-2 py-1 flex items-center gap-1 ${
                    index === 0 ? 'ring-1 ring-amber-500/50' : ''
                  }`}
                >
                  {specConfig.icon}
                  <span>{spec}</span>
                  {index === 0 && <span className="text-amber-400 ml-0.5">★</span>}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        {commander.notas && (
          <div className="mt-2 text-[10px] text-slate-400 italic line-clamp-2 bg-black/30 rounded-lg p-2 border border-slate-700/30">
            "{commander.notas}"
          </div>
        )}
      </div>
    </div>
  );
}
