import { TacticalCard, calculateCardCost } from '@/types/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Sword, Shield, Target, Heart, Zap, Skull, Users, Crown } from 'lucide-react';

interface TacticalCardPreviewProps {
  card: TacticalCard;
}

const typeColors: Record<string, string> = {
  'Ataque': 'from-red-600 to-red-800',
  'Defesa': 'from-blue-600 to-blue-800',
  'Movimento': 'from-green-600 to-green-800',
  'Moral': 'from-purple-600 to-purple-800',
};

const subtypeColors: Record<string, string> = {
  'Buff': 'bg-emerald-500',
  'Debuff': 'bg-rose-500',
  'Neutra': 'bg-slate-500',
  'Instantânea': 'bg-amber-500',
};

export function TacticalCardPreview({ card }: TacticalCardPreviewProps) {
  const cost = calculateCardCost(card);
  const gradientClass = typeColors[card.card_type] || 'from-gray-600 to-gray-800';

  return (
    <div className={`relative w-full max-w-sm mx-auto rounded-xl overflow-hidden shadow-xl bg-gradient-to-br ${gradientClass}`}>
      {/* Custo no canto superior direito */}
      <div className="absolute top-3 right-3 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-300">
        <span className="text-xl font-bold text-yellow-900">{cost}</span>
      </div>

      {/* Cabeçalho */}
      <div className="p-4 pb-2">
        <h3 className="text-xl font-bold text-white pr-14 leading-tight">
          {card.name || 'Nome da Carta'}
        </h3>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {card.card_type}
          </Badge>
          <Badge className={`text-xs ${subtypeColors[card.subtype]}`}>
            {card.subtype}
          </Badge>
        </div>
      </div>

      {/* Corpo */}
      <div className="bg-white/95 m-2 rounded-lg p-4 space-y-3">
        {/* Descrição */}
        {card.description && (
          <p className="text-sm text-gray-700 italic border-b pb-3">
            {card.description}
          </p>
        )}

        {/* Unidades Afetadas */}
        {card.affected_unit_types.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Afeta:</span>
            <div className="flex flex-wrap gap-1">
              {card.affected_unit_types.map(type => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Bônus de Atributos */}
        <div className="grid grid-cols-2 gap-2">
          {card.attack_bonus > 0 && (
            <div className="flex items-center gap-2 text-sm bg-red-50 p-2 rounded">
              <Sword className="h-4 w-4 text-red-600" />
              <span className="text-red-700">+1 Ataque</span>
            </div>
          )}
          {card.defense_bonus > 0 && (
            <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700">+1 Defesa</span>
            </div>
          )}
          {card.ranged_bonus > 0 && (
            <div className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-green-700">+1 Tiro</span>
            </div>
          )}
          {card.morale_bonus > 0 && (
            <div className="flex items-center gap-2 text-sm bg-purple-50 p-2 rounded">
              <Heart className="h-4 w-4 text-purple-600" />
              <span className="text-purple-700">+1 Moral</span>
            </div>
          )}
          {card.extra_pressure_damage > 0 && (
            <div className="flex items-center gap-2 text-sm bg-orange-50 p-2 rounded">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="text-orange-700">+1 Pressão</span>
            </div>
          )}
          {card.extra_lethal_damage > 0 && (
            <div className="flex items-center gap-2 text-sm bg-gray-900 p-2 rounded">
              <Skull className="h-4 w-4 text-white" />
              <span className="text-white">+1 Hit</span>
            </div>
          )}
        </div>

        {/* Condições Especiais */}
        <div className="space-y-1 text-xs">
          {card.ignores_pressure && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-1.5 rounded">
              ⚡ Ignora Pressão
            </div>
          )}
          {card.targets_outside_commander_unit && (
            <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 p-1.5 rounded">
              🎯 Alvo fora da unidade do comandante
            </div>
          )}
          {card.affects_enemy_unit && (
            <div className="flex items-center gap-2 text-rose-700 bg-rose-50 p-1.5 rounded">
              ⚔️ Afeta unidade inimiga
            </div>
          )}
          {card.requires_specialization && (
            <div className="flex items-center gap-2 text-cyan-700 bg-cyan-50 p-1.5 rounded">
              📚 Requer Especialização
            </div>
          )}
        </div>

        {/* Comando Exigido */}
        {card.required_command > 0 && (
          <div className="flex items-center gap-2 text-sm bg-slate-100 p-2 rounded">
            <Crown className="h-4 w-4 text-slate-600" />
            <span className="text-slate-700">Comando: {card.required_command}</span>
          </div>
        )}

        {/* Culturas */}
        {(card.bonus_cultures.length > 0 || card.penalty_cultures.length > 0) && (
          <div className="space-y-2 pt-2 border-t">
            {card.bonus_cultures.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-green-600 font-medium">Bônus:</span>
                {card.bonus_cultures.map(culture => (
                  <Badge key={culture} className="text-xs bg-green-100 text-green-700">
                    {culture}
                  </Badge>
                ))}
              </div>
            )}
            {card.penalty_cultures.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-red-600 font-medium">Penalidade:</span>
                {card.penalty_cultures.map(culture => (
                  <Badge key={culture} className="text-xs bg-red-100 text-red-700">
                    {culture}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="px-4 pb-3 flex justify-between items-center text-white/80 text-xs">
        <span>Carta Tática</span>
        <span>Birthright</span>
      </div>
    </div>
  );
}
