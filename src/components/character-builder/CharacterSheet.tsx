import React, { useMemo } from 'react';
import { CharacterDraft, VirtuePowerChoice } from '@/types/character-builder';
import { ThemeId } from '@/themes/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  calculateDerivedStats, 
  calculateRegencyStats,
  CharacterAttributes 
} from '@/core/types';
import { calculateDomainSkills } from '@/data/character/domainSkills';
import { ATTRIBUTES } from '@/data/character/attributes';
import { getSkillsByAttribute, getSkillLabel } from '@/data/character/skills';
import { VIRTUES, getVirtueById } from '@/data/character/virtues';
import { getPrivilegeById } from '@/data/character/privileges';
import { getEquipmentById, getEquipmentName } from '@/data/character/equipment';
import { getFactionById } from '@/data/character/factions';
import { getCultureById } from '@/data/character/cultures';
import { 
  User,
  Sparkles,
  Sword,
  Mountain,
  Users,
  BookOpen,
  Brain,
  Dumbbell,
  Zap,
  Target,
  Crosshair,
  Heart,
  Eye,
  Gift,
  AlertTriangle,
  Shield,
  Swords,
  ShieldCheck,
  Wind,
  Flame,
  Crown,
  Castle,
  Factory,
  Coins,
  Vote,
  Lightbulb,
  ChevronRight
} from 'lucide-react';

// Ícones
const VIRTUE_ICONS: Record<string, React.ElementType> = {
  sabedoria: Sparkles,
  coragem: Sword,
  perseveranca: Mountain,
  harmonia: Users,
};

const ATTRIBUTE_ICONS: Record<string, React.ElementType> = {
  conhecimento: BookOpen,
  raciocinio: Brain,
  corpo: Dumbbell,
  reflexos: Zap,
  determinacao: Target,
  coordenacao: Crosshair,
  carisma: Heart,
  intuicao: Eye,
};

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  seguranca: Shield,
  industria: Factory,
  comercio: Coins,
  politica: Vote,
  inovacao: Lightbulb,
};

interface CharacterSheetProps {
  draft: CharacterDraft;
  theme: ThemeId;
  className?: string;
}

export function CharacterSheet({ draft, theme, className }: CharacterSheetProps) {
  const faction = draft.factionId ? getFactionById(draft.factionId) : null;
  const culture = draft.culture ? getCultureById(draft.culture) : null;
  
  const attributes = (draft.attributes || {}) as CharacterAttributes;
  const skills = draft.skills || {};
  const virtues = draft.virtues || {};
  
  const derivedStats = useMemo(() => {
    return calculateDerivedStats(attributes, skills);
  }, [attributes, skills]);

  const regencyStats = useMemo(() => {
    return calculateRegencyStats(attributes, skills, theme);
  }, [attributes, skills, theme]);

  const domainSkills = useMemo(() => {
    return calculateDomainSkills(attributes.intuicao || 1, skills);
  }, [attributes, skills]);

  const privilegesWithChallenges = useMemo(() => {
    return (draft.privilegeIds || []).map(privilegeId => {
      const privilege = getPrivilegeById(privilegeId);
      const challengeId = draft.challengeIds?.[privilegeId];
      const challenge = challengeId 
        ? privilege?.challenges.find(c => c.id === challengeId) 
        : null;
      return { privilege, challenge };
    }).filter(b => b.privilege);
  }, [draft.privilegeIds, draft.challengeIds]);

  const equipment = useMemo(() => {
    const items: { id: string; type: 'weapon' | 'armor' | 'item' }[] = [];
    if (draft.weaponId) items.push({ id: draft.weaponId, type: 'weapon' });
    if (draft.armorId) items.push({ id: draft.armorId, type: 'armor' });
    (draft.itemIds || []).forEach(id => items.push({ id, type: 'item' }));
    return items.map(item => ({ 
      ...item, 
      data: getEquipmentById(item.id) 
    })).filter(item => item.data);
  }, [draft.weaponId, draft.armorId, draft.itemIds]);

  const activeVirtue = useMemo(() => {
    const entry = Object.entries(virtues).find(([_, level]) => level > 0);
    if (!entry) return null;
    const [virtueId, level] = entry;
    return { virtue: getVirtueById(virtueId), level };
  }, [virtues]);

  const selectedPowers = useMemo(() => {
    if (!activeVirtue?.virtue) return [];
    const virtuePowers = draft.virtuePowers || {};
    const powers: VirtuePowerChoice[] = [];
    
    for (let lvl = 1; lvl <= (activeVirtue.level || 1); lvl++) {
      const key = `${activeVirtue.virtue.id}_${lvl}`;
      if (virtuePowers[key]) {
        powers.push(virtuePowers[key]);
      }
    }
    return powers;
  }, [activeVirtue, draft.virtuePowers]);

  return (
    <div className={cn("bg-background", className)}>
      <div className="max-w-4xl mx-auto">
        {/* Header do Personagem */}
        <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-b-0 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {draft.name || 'Personagem'}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    {faction && <span>{faction.name}</span>}
                    {faction && culture && <span>•</span>}
                    {culture && <span>{culture.name}</span>}
                  </div>
                </div>
              </div>
            </div>
            
            <Badge variant="outline" className="text-sm px-3 py-1 bg-background/50 backdrop-blur">
              {theme === 'akashic' ? '🚀 Akashic Dreams' : '🏰 Tenebralux'}
            </Badge>
          </div>
        </div>

        {/* Corpo da Ficha */}
        <div className="border border-t-0 rounded-b-xl bg-card">
          {/* Atributos e Derivados */}
          <div className="p-6 space-y-6">
            {/* Atributos Grid */}
            <section>
              <SectionTitle icon={Target} title="Atributos" />
              <div className="grid grid-cols-4 gap-3 mt-3">
                {ATTRIBUTES.map((attr) => {
                  const value = attributes[attr.id as keyof CharacterAttributes] || 1;
                  const Icon = ATTRIBUTE_ICONS[attr.id];
                  const virtueForAttr = VIRTUES.find(v => v.attributes.includes(attr.id));
                  
                  return (
                    <div 
                      key={attr.id}
                      className="relative group"
                    >
                      <div 
                        className={cn(
                          "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                          "bg-gradient-to-b from-muted/50 to-muted/20",
                          "hover:border-primary/50"
                        )}
                        style={{
                          borderColor: virtueForAttr ? `${virtueForAttr.color}30` : undefined,
                        }}
                      >
                        <Icon className="w-5 h-5 text-muted-foreground mb-1" />
                        <span className="text-2xl font-bold">{value}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {attr.name.slice(0, 5)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <Separator />

            {/* Stats de Combate e Social */}
            <section>
              <SectionTitle icon={Swords} title="Características de Combate" />
              <div className="grid grid-cols-5 gap-2 mt-3">
                <StatBox label="Vitalidade" value={derivedStats.vitalidade} icon={Heart} color="rose" />
                <StatBox label="Guarda" value={derivedStats.guarda} icon={ShieldCheck} color="amber" />
                <StatBox label="Evasão" value={derivedStats.evasao} icon={Wind} color="sky" />
                <StatBox label="Reação" value={derivedStats.reacao} icon={Zap} color="yellow" />
                <StatBox label="Vontade" value={derivedStats.vontade} icon={Flame} color="purple" />
              </div>
              
              <div className="grid grid-cols-5 gap-2 mt-3">
                <StatBox label="Movimento" value={derivedStats.movimento} variant="secondary" />
                <StatBox label="Tensão" value={derivedStats.tensao} variant="secondary" />
                <StatBox label="Fortitude" value={derivedStats.fortitude} variant="secondary" />
                <StatBox label="Convicção" value={derivedStats.conviccao} variant="secondary" />
                <StatBox label="Influência" value={derivedStats.influencia} variant="secondary" />
              </div>
            </section>

            <Separator />

            {/* Perícias de Domínio */}
            <section>
              <SectionTitle icon={Castle} title="Perícias de Domínio" />
              <div className="mt-3 space-y-3">
                {/* Regência Principal */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-emerald-500" />
                    <div>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Regência</span>
                      <p className="text-xs text-muted-foreground">Intuição + Administração</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {domainSkills.regencia}
                  </span>
                </div>
                
                {/* Grid de Domínios */}
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(DOMAIN_ICONS).map(([id, Icon]) => {
                    const value = domainSkills[id as keyof typeof domainSkills] || 0;
                    const names: Record<string, string> = {
                      seguranca: 'Segurança',
                      industria: 'Indústria',
                      comercio: 'Comércio',
                      politica: 'Política',
                      inovacao: 'Inovação',
                    };
                    
                    return (
                      <div 
                        key={id}
                        className="flex flex-col items-center p-2 rounded-lg border bg-muted/30"
                      >
                        <Icon className="w-4 h-4 text-emerald-500 mb-1" />
                        <span className="text-lg font-bold">{value}</span>
                        <span className="text-[9px] text-muted-foreground uppercase">
                          {names[id]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <Separator />

            {/* Perícias por Atributo - Compacto */}
            <section>
              <SectionTitle icon={BookOpen} title="Perícias" />
              <div className="grid grid-cols-2 gap-4 mt-3">
                {ATTRIBUTES.map((attr) => {
                  const attrSkills = getSkillsByAttribute(attr.id);
                  const hasSkills = attrSkills.some(s => (skills[s.id] || 0) > 0);
                  
                  if (!hasSkills) return null;
                  
                  return (
                    <div key={attr.id} className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider">
                        {React.createElement(ATTRIBUTE_ICONS[attr.id], { className: 'w-3 h-3' })}
                        {attr.name}
                      </div>
                      {attrSkills
                        .filter(s => (skills[s.id] || 0) > 0)
                        .map(skill => (
                          <div 
                            key={skill.id}
                            className="flex items-center justify-between text-sm py-0.5"
                          >
                            <span>{getSkillLabel(skill.id, theme)}</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map(i => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    i <= (skills[skill.id] || 0) 
                                      ? "bg-primary" 
                                      : "bg-muted"
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            </section>

            <Separator />

            {/* Virtude e Poderes */}
            {activeVirtue?.virtue && (
              <section>
                <SectionTitle 
                  icon={VIRTUE_ICONS[activeVirtue.virtue.id]} 
                  title={`Virtude: ${activeVirtue.virtue.name}`}
                  color={activeVirtue.virtue.color}
                />
                <div 
                  className="mt-3 p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: `${activeVirtue.virtue.color}10`,
                    borderColor: `${activeVirtue.virtue.color}30`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {React.createElement(VIRTUE_ICONS[activeVirtue.virtue.id], {
                        className: 'w-5 h-5',
                        style: { color: activeVirtue.virtue.color }
                      })}
                      <span className="font-medium">{activeVirtue.virtue.latin}</span>
                    </div>
                    <Badge 
                      style={{ 
                        backgroundColor: activeVirtue.virtue.color,
                        color: 'white'
                      }}
                    >
                      Nível {activeVirtue.level}
                    </Badge>
                  </div>
                  
                  {selectedPowers.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Poderes Escolhidos
                      </span>
                      {selectedPowers.map((power, idx) => (
                        <div 
                          key={idx}
                          className="flex items-start gap-2 p-2 rounded bg-background/50"
                        >
                          <ChevronRight 
                            className="w-4 h-4 mt-0.5 shrink-0" 
                            style={{ color: activeVirtue.virtue!.color }}
                          />
                          <div>
                            <span className="font-medium text-sm">{power.powerName}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              (Nível {power.level})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            <Separator />

            {/* Legados */}
            {privilegesWithChallenges.length > 0 && (
              <section>
                <SectionTitle icon={Gift} title="Legados" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {privilegesWithChallenges.map(({ privilege, challenge }) => (
                    <div 
                      key={privilege!.id}
                      className="p-3 rounded-lg border bg-muted/20"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Gift className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-green-600 dark:text-green-400 text-sm">
                          {privilege!.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {privilege!.description}
                      </p>
                      {challenge && (
                        <div className="flex items-center gap-2 pt-2 border-t border-dashed">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span className="text-xs text-red-600 dark:text-red-400">
                            {challenge.name}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Equipamento */}
            {equipment.length > 0 && (
              <section>
                <SectionTitle icon={Swords} title="Equipamento" />
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {equipment.map(({ id, type, data }) => (
                    <div 
                      key={id}
                      className={cn(
                        "p-3 rounded-lg border",
                        type === 'weapon' && "bg-red-500/5 border-red-500/20",
                        type === 'armor' && "bg-blue-500/5 border-blue-500/20",
                        type === 'item' && "bg-muted/30"
                      )}
                    >
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] mb-1",
                          type === 'weapon' && "border-red-500/50 text-red-500",
                          type === 'armor' && "border-blue-500/50 text-blue-500"
                        )}
                      >
                        {type === 'weapon' ? 'Arma' : type === 'armor' ? 'Armadura' : 'Item'}
                      </Badge>
                      <p className="font-medium text-sm">
                        {getEquipmentName(data!, theme)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reputação */}
            {draft.reputations && draft.reputations.filter(r => r.value !== 0).length > 0 && (
              <>
                <Separator />
                <section>
                  <SectionTitle icon={Users} title="Reputação" />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {draft.reputations
                      .filter(r => r.value !== 0)
                      .sort((a, b) => b.value - a.value)
                      .map((rep) => (
                        <div 
                          key={rep.factionId}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg border",
                            rep.value > 0 && "bg-green-500/5 border-green-500/20",
                            rep.value < 0 && "bg-red-500/5 border-red-500/20"
                          )}
                        >
                          <span className="text-sm truncate">{rep.factionName}</span>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "ml-2 shrink-0",
                              rep.value > 0 && "border-green-500/50 text-green-500",
                              rep.value < 0 && "border-red-500/50 text-red-500"
                            )}
                          >
                            {rep.value > 0 ? `+${rep.value}` : rep.value}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
interface SectionTitleProps {
  icon: React.ElementType;
  title: string;
  color?: string;
}

function SectionTitle({ icon: Icon, title, color }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4" style={color ? { color } : undefined} />
      <h3 className="font-semibold text-sm uppercase tracking-wider" style={color ? { color } : undefined}>
        {title}
      </h3>
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: number;
  icon?: React.ElementType;
  color?: 'rose' | 'amber' | 'sky' | 'yellow' | 'purple' | 'emerald';
  variant?: 'default' | 'secondary';
}

function StatBox({ label, value, icon: Icon, color, variant = 'default' }: StatBoxProps) {
  const colorClasses: Record<string, string> = {
    rose: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    sky: 'bg-sky-500/10 border-sky-500/30 text-sky-500',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center p-2 rounded-lg border",
        variant === 'default' && color && colorClasses[color],
        variant === 'secondary' && "bg-muted/50 border-muted-foreground/20"
      )}
    >
      {Icon && <Icon className="w-4 h-4 mb-1" />}
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[9px] uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
