import { FieldCommander, calculateDerivedFields, SPECIALIZATIONS } from '@/types/FieldCommander';
import { Crown, Shield, Brain, Compass, Star, Award, Users, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CommanderCardPreviewProps {
  commander: FieldCommander;
}

const cultureColors: Record<string, { bg: string; border: string; accent: string }> = {
  'Anuire': { bg: 'from-blue-900 to-slate-900', border: 'border-blue-500/50', accent: 'text-blue-400' },
  'Khinasi': { bg: 'from-amber-900 to-orange-950', border: 'border-amber-500/50', accent: 'text-amber-400' },
  'Vos': { bg: 'from-red-900 to-slate-900', border: 'border-red-500/50', accent: 'text-red-400' },
  'Rjurik': { bg: 'from-emerald-900 to-slate-900', border: 'border-emerald-500/50', accent: 'text-emerald-400' },
  'Brecht': { bg: 'from-purple-900 to-slate-900', border: 'border-purple-500/50', accent: 'text-purple-400' }
};

const specializationIcons: Record<string, string> = {
  'Infantaria': '⚔️',
  'Cavalaria': '🐎',
  'Arqueiro': '🏹',
  'Cerco': '🏰',
  'Milicia': '🛡️',
  'Elite': '👑',
  'Naval': '⚓'
};

export function CommanderCardPreview({ commander }: CommanderCardPreviewProps) {
  const colors = cultureColors[commander.cultura_origem] || cultureColors['Anuire'];
  const derived = calculateDerivedFields(commander);

  const allSpecializations = [
    commander.especializacao_inicial,
    ...commander.especializacoes_adicionais
  ];

  return (
    <div className={`relative w-[280px] h-[400px] rounded-xl overflow-hidden shadow-2xl border-2 ${colors.border}`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`} />
      
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)`
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          {/* Culture Badge */}
          <Badge className={`bg-black/50 ${colors.accent} text-xs font-bold px-2 py-1 shadow-lg border ${colors.border}`}>
            {commander.cultura_origem}
          </Badge>
          
          {/* Prestige Points */}
          <div className="flex items-center gap-1 bg-amber-900/80 rounded-full px-2 py-1">
            <Award className="w-3 h-3 text-amber-400" />
            <span className="text-amber-200 text-xs font-bold">{commander.pontos_prestigio} PP</span>
          </div>
        </div>

        {/* Commander Name */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <Crown className={`w-5 h-5 ${colors.accent}`} />
          <h2 className="text-xl font-bold text-white text-center drop-shadow-lg tracking-wide">
            {commander.nome_comandante}
          </h2>
        </div>

        {/* Origin Unit */}
        {commander.unidade_de_origem && (
          <p className="text-xs text-center text-slate-400 mb-3 italic">
            {commander.unidade_de_origem}
          </p>
        )}

        {/* Main Stats */}
        <div className="flex-1 flex flex-col justify-center gap-3">
          {/* Primary Attributes */}
          <div className="grid grid-cols-3 gap-2">
            {/* Comando */}
            <div className="flex flex-col items-center bg-slate-900/60 backdrop-blur-sm rounded-lg p-2 border border-slate-500/30">
              <Users className="w-5 h-5 text-blue-400 mb-1" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Comando</span>
              <span className="text-2xl font-bold text-white">{commander.comando}</span>
            </div>

            {/* Estratégia */}
            <div className="flex flex-col items-center bg-slate-900/60 backdrop-blur-sm rounded-lg p-2 border border-slate-500/30">
              <Brain className="w-5 h-5 text-purple-400 mb-1" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Estratégia</span>
              <span className="text-2xl font-bold text-white">{commander.estrategia}</span>
            </div>

            {/* Guarda */}
            <div className="flex flex-col items-center bg-slate-900/60 backdrop-blur-sm rounded-lg p-2 border border-slate-500/30">
              <Shield className="w-5 h-5 text-green-400 mb-1" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Guarda</span>
              <span className="text-2xl font-bold text-white">{commander.guarda}</span>
            </div>
          </div>

          {/* Derived Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between bg-blue-900/40 rounded-lg px-3 py-2 border border-blue-500/20">
              <span className="text-blue-300">Cartas Táticas</span>
              <span className="text-white font-bold">{derived.pontos_compra_taticos}</span>
            </div>
            <div className="flex items-center justify-between bg-purple-900/40 rounded-lg px-3 py-2 border border-purple-500/20">
              <span className="text-purple-300">Cartas Estratégicas</span>
              <span className="text-white font-bold">{derived.pontos_compra_estrategicos}</span>
            </div>
            <div className="flex items-center justify-between bg-green-900/40 rounded-lg px-3 py-2 border border-green-500/20">
              <span className="text-green-300">Unidades Lideradas</span>
              <span className="text-white font-bold">{derived.unidades_lideradas}</span>
            </div>
            <div className="flex items-center justify-between bg-amber-900/40 rounded-lg px-3 py-2 border border-amber-500/20">
              <span className="text-amber-300">Área de Influência</span>
              <span className="text-white font-bold">{derived.area_influencia}</span>
            </div>
          </div>
        </div>

        {/* Specializations */}
        <div className="mt-auto">
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold">
              Especializações ({allSpecializations.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {allSpecializations.map((spec, index) => (
              <Badge 
                key={`${spec}-${index}`}
                variant="outline" 
                className={`text-[10px] ${index === 0 ? 'bg-amber-950/80 text-amber-200 border-amber-500/50' : 'bg-slate-950/60 text-slate-200 border-slate-500/50'} px-2 py-0.5`}
              >
                {specializationIcons[spec] || '⚔️'} {spec}
              </Badge>
            ))}
          </div>
        </div>

        {/* Notes */}
        {commander.notas && (
          <div className="mt-2 text-[10px] text-slate-400 italic line-clamp-2 bg-black/30 rounded p-2">
            {commander.notas}
          </div>
        )}
      </div>
    </div>
  );
}
