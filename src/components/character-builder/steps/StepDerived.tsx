import React, { useMemo } from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { useTheme } from '@/themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  calculateDerivedStats, 
  calculateRegencyStats,
  calculateDomainSkills,
  CharacterAttributes,
  DerivedStats,
  RegencyStats 
} from '@/core/types';
import { DERIVED_STATS, getDerivedStatsByCategory, DerivedStatDefinition } from '@/data/character/derivedStats';
import { REGENCY_ATTRIBUTES, getRegencyForTheme, RegencyDefinition } from '@/data/character/regency';
import { 
  DOMAIN_SKILL_DEFINITIONS, 
  DomainSkillDefinition, 
  DomainSkillsResult 
} from '@/data/character/domainSkills';
import { 
  Heart, 
  Shield, 
  Zap, 
  Move, 
  Eye,
  Brain,
  MessageSquare,
  Sparkles,
  Battery,
  Flame,
  Sword,
  Crown,
  Building2,
  Users,
  Cpu,
  Wand2,
  Info,
  Factory,
  Coins,
  Lightbulb,
  Castle
} from 'lucide-react';

// Mapeamento de ícones por stat
const STAT_ICONS: Record<string, React.ElementType> = {
  vitalidade: Heart,
  evasao: Eye,
  guarda: Shield,
  reacao: Zap,
  movimento: Move,
  vontade: Brain,
  conviccao: MessageSquare,
  influencia: Sparkles,
  tensao: Battery,
  fortitude: Flame,
  // Regência
  comando: Crown,
  estrategia: Sword,
  administracao: Building2,
  politica: Users,
  tecnologia: Cpu,
  geomancia: Wand2,
  // Perícias de Domínio
  regencia: Castle,
  seguranca: Shield,
  industria: Factory,
  comercio: Coins,
  inovacao: Lightbulb,
};

// Cores por categoria
const CATEGORY_COLORS = {
  physical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500' },
  social: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500' },
  resources: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500' },
  regency: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500' },
  domain: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500' },
};

export function StepDerived() {
  const { draft } = useCharacterBuilder();
  const { activeTheme } = useTheme();

  const attributes = (draft.attributes || {
    conhecimento: 1,
    raciocinio: 1,
    corpo: 1,
    reflexos: 1,
    determinacao: 1,
    coordenacao: 1,
    carisma: 1,
    intuicao: 1,
  }) as CharacterAttributes;

  const skills = draft.skills || {};

  // Calcular stats derivados
  const derivedStats = useMemo(() => {
    return calculateDerivedStats(attributes, skills);
  }, [attributes, skills]);

  // Calcular stats de regência
  const regencyStats = useMemo(() => {
    return calculateRegencyStats(attributes, skills, activeTheme);
  }, [attributes, skills, activeTheme]);

  // Calcular perícias de domínio
  const domainSkills = useMemo(() => {
    return calculateDomainSkills(attributes.intuicao, skills);
  }, [attributes.intuicao, skills]);

  // Stats por categoria
  const physicalStats = getDerivedStatsByCategory('physical');
  const socialStats = getDerivedStatsByCategory('social');
  const resourceStats = getDerivedStatsByCategory('resources');
  const regencyDefs = getRegencyForTheme(activeTheme);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Características Derivadas</h2>
        <p className="text-muted-foreground">
          Valores calculados automaticamente com base nos seus atributos e perícias.
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>
                Estas características são calculadas automaticamente. Você pode voltar 
                aos steps anteriores para ajustar atributos ou perícias se quiser 
                modificar estes valores.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Combate Físico */}
        <CategoryCard
          title="Combate Físico"
          description="Capacidades de combate corpo a corpo"
          category="physical"
          stats={physicalStats}
          derivedStats={derivedStats}
        />

        {/* Combate Social */}
        <CategoryCard
          title="Combate Social"
          description="Capacidades de interação e debate"
          category="social"
          stats={socialStats}
          derivedStats={derivedStats}
        />

        {/* Recursos */}
        <CategoryCard
          title="Recursos"
          description="Limites e resistências"
          category="resources"
          stats={resourceStats}
          derivedStats={derivedStats}
        />

        {/* Regência */}
        <RegencyCard
          title="Atributos de Regência"
          description="Para Batalha, Campanha e Domínio"
          regencyDefs={regencyDefs}
          regencyStats={regencyStats}
          theme={activeTheme}
        />

        {/* Perícias de Domínio */}
        <DomainSkillsCard
          title="Perícias de Domínio"
          description="Para gestão e desenvolvimento de territórios"
          domainSkills={domainSkills}
        />
      </div>

      {/* Resumo Visual */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Resumo Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickStat 
              label="Vitalidade" 
              value={derivedStats.vitalidade} 
              icon={Heart}
              color="text-red-500"
            />
            <QuickStat 
              label="Guarda" 
              value={derivedStats.guarda} 
              icon={Shield}
              color="text-red-500"
            />
            <QuickStat 
              label="Vontade" 
              value={derivedStats.vontade} 
              icon={Brain}
              color="text-blue-500"
            />
            <QuickStat 
              label="Comando" 
              value={regencyStats.comando} 
              icon={Crown}
              color="text-purple-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de Card de Categoria
interface CategoryCardProps {
  title: string;
  description: string;
  category: 'physical' | 'social' | 'resources';
  stats: DerivedStatDefinition[];
  derivedStats: DerivedStats;
}

function CategoryCard({ 
  title, 
  description, 
  category, 
  stats, 
  derivedStats,
}: CategoryCardProps) {
  const colors = CATEGORY_COLORS[category];

  return (
    <Card className={cn("overflow-hidden", colors.border)}>
      <CardHeader className={cn("py-3", colors.bg)}>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {stats.map((stat) => {
          const Icon = STAT_ICONS[stat.id] || Zap;
          const value = derivedStats[stat.id as keyof DerivedStats] || 0;

          return (
            <div key={stat.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={cn("w-4 h-4", colors.text)} />
                <span className="font-medium">{stat.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {stat.formula}
                </span>
                <Badge variant="secondary" className="min-w-[40px] justify-center">
                  {value}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Componente de Card de Regência
interface RegencyCardProps {
  title: string;
  description: string;
  regencyDefs: RegencyDefinition[];
  regencyStats: RegencyStats;
  theme: 'akashic' | 'tenebralux';
}

function RegencyCard({ 
  title, 
  description, 
  regencyDefs, 
  regencyStats,
  theme 
}: RegencyCardProps) {
  const colors = CATEGORY_COLORS.regency;

  return (
    <Card className={cn("overflow-hidden", colors.border)}>
      <CardHeader className={cn("py-3", colors.bg)}>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {regencyDefs.map((reg) => {
          const Icon = STAT_ICONS[reg.id] || Crown;
          const value = regencyStats[reg.id as keyof RegencyStats] || 0;
          const label = reg.labels[theme];

          return (
            <div key={reg.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={cn("w-4 h-4", colors.text)} />
                <span className="font-medium">{label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {reg.formula}
                </span>
                <div className="flex items-center gap-1">
                  {reg.usedIn.map(mode => (
                    <Badge key={mode} variant="outline" className="text-[10px] px-1">
                      {mode === 'batalha' && '⚔️'}
                      {mode === 'campanha' && '🎴'}
                      {mode === 'dominio' && '👑'}
                    </Badge>
                  ))}
                </div>
                <Badge variant="secondary" className="min-w-[40px] justify-center">
                  {value}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Componente de Card de Perícias de Domínio
interface DomainSkillsCardProps {
  title: string;
  description: string;
  domainSkills: DomainSkillsResult;
}

function DomainSkillsCard({ 
  title, 
  description, 
  domainSkills 
}: DomainSkillsCardProps) {
  const colors = CATEGORY_COLORS.domain;

  return (
    <Card className={cn("overflow-hidden lg:col-span-2", colors.border)}>
      <CardHeader className={cn("py-3", colors.bg)}>
        <CardTitle className="text-base flex items-center gap-2">
          <Castle className={cn("w-5 h-5", colors.text)} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {/* Regência Principal */}
        <div className="mb-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Castle className={cn("w-6 h-6", colors.text)} />
            <div>
              <span className="font-bold text-lg">Regência</span>
              <p className="text-xs text-muted-foreground">Intuição + Administração</p>
            </div>
          </div>
          <Badge className="text-lg px-4 py-1 bg-emerald-500 text-white">
            {domainSkills.regencia}
          </Badge>
        </div>

        {/* Grid de Perícias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {DOMAIN_SKILL_DEFINITIONS.map((skill) => {
            const Icon = STAT_ICONS[skill.id] || Zap;
            const value = domainSkills[skill.id as keyof DomainSkillsResult] || 0;

            return (
              <div 
                key={skill.id} 
                className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("w-5 h-5", colors.text)} />
                  <span className="font-medium">{skill.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {skill.formula}
                  </span>
                  <Badge variant="secondary" className="min-w-[36px] justify-center">
                    {value}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de Stat Rápido
interface QuickStatProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

function QuickStat({ label, value, icon: Icon, color }: QuickStatProps) {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
      <Icon className={cn("w-6 h-6 mb-1", color)} />
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
