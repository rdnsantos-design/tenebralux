import { Regent } from '@/types/Army';
import { Crown, Coins, Sparkles, Users, Brain, Castle, User } from 'lucide-react';

interface RegentCardPreviewProps {
  regent: Regent;
  commanderCount?: number;
  armyCount?: number;
}

export function RegentCardPreview({ regent, commanderCount = 0, armyCount = 0 }: RegentCardPreviewProps) {
  // Gerar cor baseada no nome do domínio para consistência visual
  const getDomainColor = (domain: string) => {
    const hash = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hues = [
      { primary: 'from-amber-900 via-amber-800 to-yellow-900', border: 'border-amber-500/60', accent: 'text-amber-400', glow: 'shadow-amber-500/20' },
      { primary: 'from-purple-900 via-indigo-900 to-purple-950', border: 'border-purple-500/60', accent: 'text-purple-400', glow: 'shadow-purple-500/20' },
      { primary: 'from-emerald-900 via-teal-900 to-emerald-950', border: 'border-emerald-500/60', accent: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
      { primary: 'from-rose-900 via-red-900 to-rose-950', border: 'border-rose-500/60', accent: 'text-rose-400', glow: 'shadow-rose-500/20' },
      { primary: 'from-sky-900 via-blue-900 to-sky-950', border: 'border-sky-500/60', accent: 'text-sky-400', glow: 'shadow-sky-500/20' },
    ];
    return hues[hash % hues.length];
  };

  const colors = getDomainColor(regent.domain);

  const renderStars = (value: number, max: number = 5) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${
              i < value 
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-400/50' 
                : 'bg-slate-700/50 border border-slate-600/30'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`relative w-[300px] h-[420px] rounded-2xl overflow-hidden shadow-2xl ${colors.glow} border-2 ${colors.border}`}>
      {/* Ornate Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.primary}`} />
      
      {/* Decorative Pattern - Royal Heraldry Style */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="royalPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M10 0L20 10L10 20L0 10Z" fill="currentColor" opacity="0.5" />
          </pattern>
          <rect width="100" height="100" fill="url(#royalPattern)" />
        </svg>
      </div>

      {/* Top Ornamental Border */}
      <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent`} />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-5">
        {/* Crown Header */}
        <div className="flex justify-center mb-2">
          <div className="relative">
            <div className="absolute inset-0 blur-lg bg-amber-400/30 rounded-full" />
            <Crown className={`relative w-10 h-10 ${colors.accent} drop-shadow-lg`} />
          </div>
        </div>

        {/* Regent Name */}
        <div className="text-center mb-1">
          <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow-lg font-serif">
            {regent.name}
          </h2>
          <div className={`h-0.5 w-24 mx-auto mt-1 bg-gradient-to-r from-transparent ${colors.accent.replace('text-', 'via-')} to-transparent opacity-60`} />
        </div>

        {/* Player Name */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <User className="w-3 h-3 text-slate-400" />
          <span className="text-sm text-slate-300 italic">{regent.character}</span>
        </div>

        {/* Domain Banner */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-black/40 rounded-lg blur-sm" />
          <div className="relative bg-gradient-to-r from-slate-900/80 via-slate-800/90 to-slate-900/80 rounded-lg px-4 py-3 border border-slate-600/30">
            <div className="flex items-center justify-center gap-2">
              <Castle className={`w-5 h-5 ${colors.accent}`} />
              <span className="text-lg font-semibold text-white tracking-wide">{regent.domain}</span>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Gold Bars */}
          <div className="bg-gradient-to-br from-amber-950/80 to-yellow-950/60 rounded-xl p-3 border border-amber-600/30 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="text-xs text-amber-300/80 uppercase tracking-wider font-medium">Gold Bars</span>
            </div>
            <div className="text-3xl font-bold text-amber-100 text-center">
              {regent.goldBars}
            </div>
          </div>

          {/* Regency Points */}
          <div className="bg-gradient-to-br from-purple-950/80 to-indigo-950/60 rounded-xl p-3 border border-purple-600/30 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-purple-300/80 uppercase tracking-wider font-medium">Regência</span>
            </div>
            <div className="text-3xl font-bold text-purple-100 text-center">
              {regent.regencyPoints}
            </div>
          </div>
        </div>

        {/* Military Skills */}
        <div className="flex-1 space-y-3">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-600/20 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">Comando</span>
              </div>
              {renderStars(regent.comando)}
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-600/20 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-300">Estratégia</span>
              </div>
              {renderStars(regent.estrategia)}
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-auto pt-3 border-t border-slate-600/30">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{commanderCount} comandantes</span>
            <span>{armyCount} exércitos</span>
          </div>
        </div>
      </div>

      {/* Bottom Ornamental Border */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent`} />
    </div>
  );
}
