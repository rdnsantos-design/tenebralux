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
  headerBg: string;
}> = {
  'Anuire': { 
    gradient: 'from-blue-950 via-blue-900 to-slate-900', 
    border: 'border-blue-500/50', 
    accent: 'text-blue-400',
    glow: 'shadow-blue-500/20',
    headerBg: 'from-blue-800 to-blue-900'
  },
  'Khinasi': { 
    gradient: 'from-amber-950 via-orange-900 to-red-950', 
    border: 'border-amber-500/50', 
    accent: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    headerBg: 'from-amber-700 to-orange-900'
  },
  'Vos': { 
    gradient: 'from-red-950 via-rose-900 to-slate-900', 
    border: 'border-red-500/50', 
    accent: 'text-red-400',
    glow: 'shadow-red-500/20',
    headerBg: 'from-red-800 to-rose-900'
  },
  'Rjurik': { 
    gradient: 'from-emerald-950 via-green-900 to-teal-950', 
    border: 'border-emerald-500/50', 
    accent: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    headerBg: 'from-emerald-700 to-green-900'
  },
  'Brecht': { 
    gradient: 'from-purple-950 via-violet-900 to-indigo-950', 
    border: 'border-purple-500/50', 
    accent: 'text-purple-400',
    glow: 'shadow-purple-500/20',
    headerBg: 'from-purple-700 to-violet-900'
  }
};

const specializationIcons: Record<string, { icon: React.ReactNode; abbrev: string }> = {
  'Infantaria': { icon: <Sword className="w-3 h-3" />, abbrev: 'INF' },
  'Cavalaria': { icon: <span className="text-xs">🐎</span>, abbrev: 'CAV' },
  'Arqueiro': { icon: <Target className="w-3 h-3" />, abbrev: 'ARQ' },
  'Cerco': { icon: <Castle className="w-3 h-3" />, abbrev: 'CER' },
  'Milicia': { icon: <Shield className="w-3 h-3" />, abbrev: 'MIL' },
  'Elite': { icon: <Crown className="w-3 h-3" />, abbrev: 'ELI' },
  'Naval': { icon: <Anchor className="w-3 h-3" />, abbrev: 'NAV' }
};

export function CommanderCardPreview({ commander, isGeneral = false, unitsCommanded = 0 }: CommanderCardPreviewProps) {
  const theme = cultureThemes[commander.cultura_origem] || cultureThemes['Anuire'];
  const derived = calculateDerivedFields(commander);

  const allSpecializations = [
    commander.especializacao_inicial,
    ...commander.especializacoes_adicionais
  ];

  return (
    <div className={`relative w-[300px] h-[420px] rounded-2xl overflow-hidden shadow-2xl ${theme.glow} border-2 ${theme.border}`}>
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />

      {/* ═══════════════════════════════════════════════════════════════
          HEADER STRIP - Visível quando o card está sob a unidade
          Altura: ~70px - Contém: Comando, Estratégia, Especializações
          ═══════════════════════════════════════════════════════════════ */}
      <div className={`relative z-20 bg-gradient-to-r ${theme.headerBg} border-b-2 ${theme.border}`}>
        {/* General Banner (se for general) */}
        {isGeneral && (
          <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 py-0.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Medal className="w-3 h-3 text-amber-950" />
              <span className="text-[10px] font-bold text-amber-950 uppercase tracking-wider">General</span>
              <Medal className="w-3 h-3 text-amber-950" />
            </div>
          </div>
        )}
        
        {/* Stats Row - CMD | EST | Specs */}
        <div className="flex items-center justify-between px-2 py-2">
          {/* Comando */}
          <div className="flex items-center gap-1 bg-black/30 rounded-lg px-2 py-1.5 border border-blue-400/30">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-300 font-medium">CMD</span>
            <span className="text-lg font-black text-white ml-1">{commander.comando}</span>
          </div>

          {/* Estratégia */}
          <div className="flex items-center gap-1 bg-black/30 rounded-lg px-2 py-1.5 border border-purple-400/30">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-300 font-medium">EST</span>
            <span className="text-lg font-black text-white ml-1">{commander.estrategia}</span>
          </div>

          {/* Especializações (ícones compactos) */}
          <div className="flex items-center gap-0.5">
            {allSpecializations.slice(0, 4).map((spec, index) => {
              const specConfig = specializationIcons[spec] || specializationIcons['Infantaria'];
              return (
                <div 
                  key={`${spec}-${index}`}
                  className={`w-7 h-7 rounded-md flex items-center justify-center border ${
                    index === 0 
                      ? 'bg-amber-900/60 border-amber-500/50 ring-1 ring-amber-400/50' 
                      : 'bg-slate-800/60 border-slate-600/50'
                  }`}
                  title={spec}
                >
                  {specConfig.icon}
                </div>
              );
            })}
            {allSpecializations.length > 4 && (
              <div className="w-7 h-7 rounded-md flex items-center justify-center bg-slate-800/60 border border-slate-600/50 text-xs text-slate-400">
                +{allSpecializations.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CORPO DO CARD - Informações detalhadas
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col p-3" style={{ height: isGeneral ? 'calc(100% - 88px)' : 'calc(100% - 68px)' }}>
        {/* Commander Name & Culture */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white drop-shadow-lg truncate">
              {commander.nome_comandante}
            </h2>
            {commander.unidade_de_origem && (
              <p className="text-[10px] text-slate-400 italic truncate">
                {commander.unidade_de_origem}
              </p>
            )}
          </div>
          <Badge className={`bg-black/50 ${theme.accent} text-[10px] font-bold px-2 py-0.5 border ${theme.border}`}>
            {commander.cultura_origem}
          </Badge>
        </div>

        {/* Guarda & Prestige Row */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-green-950/40 rounded-lg px-3 py-2 border border-green-600/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-300">Guarda</span>
              </div>
              <span className="text-xl font-black text-white">{commander.guarda}</span>
            </div>
            {/* Visual guard pips */}
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-sm ${
                    i < commander.guarda ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-slate-800/60'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="bg-amber-950/40 rounded-lg px-3 py-2 border border-amber-600/30">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-300">PP</span>
            </div>
            <span className="text-xl font-black text-amber-200">{commander.pontos_prestigio}</span>
          </div>
        </div>

        {/* Derived Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center justify-between bg-blue-950/30 rounded-lg px-2.5 py-1.5 border border-blue-600/20">
            <span className="text-[10px] text-blue-300/80">Cartas Táticas</span>
            <span className="text-sm font-bold text-white">{derived.pontos_compra_taticos}</span>
          </div>
          <div className="flex items-center justify-between bg-purple-950/30 rounded-lg px-2.5 py-1.5 border border-purple-600/20">
            <span className="text-[10px] text-purple-300/80">Cartas Estrat.</span>
            <span className="text-sm font-bold text-white">{derived.pontos_compra_estrategicos}</span>
          </div>
          <div className="flex items-center justify-between bg-slate-800/30 rounded-lg px-2.5 py-1.5 border border-slate-600/20">
            <span className="text-[10px] text-slate-300/80">Unidades</span>
            <span className="text-sm font-bold text-white">
              {unitsCommanded > 0 ? `${unitsCommanded}/${derived.unidades_lideradas}` : derived.unidades_lideradas}
            </span>
          </div>
          <div className="flex items-center justify-between bg-slate-800/30 rounded-lg px-2.5 py-1.5 border border-slate-600/20">
            <span className="text-[10px] text-slate-300/80">Influência</span>
            <span className="text-sm font-bold text-white">{derived.area_influencia} hex</span>
          </div>
        </div>

        {/* Specializations Full List */}
        <div className="mt-auto">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Star className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] text-amber-300/80 uppercase tracking-wider font-semibold">
              Especializações
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {allSpecializations.map((spec, index) => {
              const specConfig = specializationIcons[spec] || specializationIcons['Infantaria'];
              return (
                <Badge 
                  key={`${spec}-${index}`}
                  className={`text-[9px] px-1.5 py-0.5 flex items-center gap-1 ${
                    index === 0 
                      ? 'bg-amber-900/60 text-amber-200 border-amber-500/50 ring-1 ring-amber-400/30' 
                      : 'bg-slate-800/60 text-slate-300 border-slate-600/50'
                  }`}
                >
                  {specConfig.icon}
                  <span>{specConfig.abbrev}</span>
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        {commander.notas && (
          <div className="mt-2 text-[9px] text-slate-400 italic line-clamp-2 bg-black/30 rounded-lg p-1.5 border border-slate-700/30">
            "{commander.notas}"
          </div>
        )}
      </div>
    </div>
  );
}
