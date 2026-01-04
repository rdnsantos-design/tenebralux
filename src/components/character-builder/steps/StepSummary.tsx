import React, { useMemo } from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { useTheme } from '@/themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  calculateDerivedStats, 
  calculateRegencyStats,
  CharacterAttributes 
} from '@/core/types';
import { ATTRIBUTES } from '@/data/character/attributes';
import { getSkillLabel } from '@/data/character/skills';
import { VIRTUES, getVirtueById } from '@/data/character/virtues';
import { getBlessingById } from '@/data/character/blessings';
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
  Package,
  Edit,
  Download,
  Save,
  Crown
} from 'lucide-react';

// Ícones das virtudes
const VIRTUE_ICONS: Record<string, React.ElementType> = {
  sabedoria: Sparkles,
  coragem: Sword,
  perseveranca: Mountain,
  harmonia: Users,
};

// Ícones dos atributos
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

export function StepSummary() {
  const { draft, goToStep, finalizeCharacter, canFinalize } = useCharacterBuilder();
  const { activeTheme } = useTheme();

  // Dados processados
  const faction = draft.factionId ? getFactionById(draft.factionId) : null;
  const culture = draft.culture ? getCultureById(draft.culture) : null;
  
  const attributes = (draft.attributes || {}) as CharacterAttributes;
  const skills = draft.skills || {};
  const virtues = draft.virtues || {};
  
  // Calcular derivados
  const derivedStats = useMemo(() => {
    return calculateDerivedStats(attributes, skills);
  }, [attributes, skills]);

  const regencyStats = useMemo(() => {
    return calculateRegencyStats(attributes, skills, activeTheme);
  }, [attributes, skills, activeTheme]);

  // Bênçãos e desafios
  const blessingsWithChallenges = useMemo(() => {
    return (draft.blessingIds || []).map(blessingId => {
      const blessing = getBlessingById(blessingId);
      const challengeId = draft.challengeIds?.[blessingId];
      const challenge = challengeId 
        ? blessing?.challenges.find(c => c.id === challengeId) 
        : null;
      return { blessing, challenge };
    }).filter(b => b.blessing);
  }, [draft.blessingIds, draft.challengeIds]);

  // Equipamento
  const equipment = useMemo(() => {
    const ids: string[] = [];
    if (draft.weaponId) ids.push(draft.weaponId);
    if (draft.armorId) ids.push(draft.armorId);
    if (draft.itemIds) ids.push(...draft.itemIds);
    return ids.map(id => getEquipmentById(id)).filter(Boolean);
  }, [draft.weaponId, draft.armorId, draft.itemIds]);

  // Virtude ativa
  const activeVirtue = useMemo(() => {
    const virtueId = Object.entries(virtues).find(([_, level]) => level > 0)?.[0];
    return virtueId ? getVirtueById(virtueId) : null;
  }, [virtues]);

  const handleFinish = () => {
    if (!canFinalize()) {
      alert('Há erros de validação. Revise as seções antes de finalizar.');
      return;
    }
    
    const character = finalizeCharacter();
    if (character) {
      // Salvar no localStorage
      const characters = JSON.parse(localStorage.getItem('akashic_characters') || '[]');
      characters.push(character);
      localStorage.setItem('akashic_characters', JSON.stringify(characters));
      
      alert(`Personagem "${draft.name}" criado com sucesso!`);
    }
  };

  const handleExportPDF = () => {
    // Placeholder para exportação PDF
    alert('Exportação de PDF será implementada em breve!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resumo do Personagem</h2>
          <p className="text-muted-foreground">
            Revise todas as escolhas antes de finalizar.
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {activeTheme === 'akashic' ? '🚀 Akashic' : '🏰 Tenebra'}
        </Badge>
      </div>

      {/* Nome e Conceito */}
      <SummarySection 
        title="Conceito" 
        icon={User} 
        step={1}
        onEdit={() => goToStep(1)}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{draft.name || 'Sem nome'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {faction && (
              <Badge variant="secondary">{faction.name}</Badge>
            )}
            {culture && (
              <Badge variant="outline">{culture.name}</Badge>
            )}
          </div>
          {(faction || culture) && (
            <p className="text-sm text-muted-foreground">
              {culture?.description || faction?.description}
            </p>
          )}
        </div>
      </SummarySection>

      {/* Atributos */}
      <SummarySection 
        title="Atributos" 
        icon={Target} 
        step={2}
        onEdit={() => goToStep(2)}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ATTRIBUTES.map((attr) => {
            const value = attributes[attr.id as keyof CharacterAttributes] || 1;
            const Icon = ATTRIBUTE_ICONS[attr.id] || Target;
            
            return (
              <div 
                key={attr.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{attr.name}</div>
                  <div className="font-bold">{value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </SummarySection>

      {/* Perícias Principais */}
      <SummarySection 
        title="Perícias" 
        icon={BookOpen} 
        step={3}
        onEdit={() => goToStep(3)}
      >
        <div className="space-y-2">
          {Object.entries(skills)
            .filter(([_, value]) => value > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([skillId, value]) => (
              <div 
                key={skillId}
                className="flex items-center justify-between"
              >
                <span className="text-sm">{getSkillLabel(skillId, activeTheme)}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        i <= value ? "bg-primary" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          {Object.values(skills).filter(v => v > 0).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma perícia desenvolvida</p>
          )}
          {Object.values(skills).filter(v => v > 0).length > 10 && (
            <p className="text-xs text-muted-foreground">
              + {Object.values(skills).filter(v => v > 0).length - 10} outras perícias
            </p>
          )}
        </div>
      </SummarySection>

      {/* Características Derivadas */}
      <SummarySection 
        title="Características" 
        icon={Shield} 
        step={4}
        onEdit={() => goToStep(4)}
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatBadge label="Vitalidade" value={derivedStats.vitalidade} color="red" />
          <StatBadge label="Guarda" value={derivedStats.guarda} color="red" />
          <StatBadge label="Evasão" value={derivedStats.evasao} color="red" />
          <StatBadge label="Vontade" value={derivedStats.vontade} color="blue" />
          <StatBadge label="Reação" value={derivedStats.reacao} color="amber" />
        </div>
        <Separator className="my-3" />
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <StatBadge label="Comando" value={regencyStats.comando} color="purple" icon={Crown} />
          <StatBadge label="Estratégia" value={regencyStats.estrategia} color="purple" />
          <StatBadge label="Admin." value={regencyStats.administracao} color="purple" />
          <StatBadge label="Política" value={regencyStats.politica} color="purple" />
          <StatBadge 
            label={activeTheme === 'akashic' ? 'Tecnol.' : 'Geomancia'} 
            value={regencyStats.tecnologia || regencyStats.geomancia || 0} 
            color="purple" 
          />
        </div>
      </SummarySection>

      {/* Bênçãos e Desafios */}
      <SummarySection 
        title="Legados" 
        icon={Gift} 
        step={5}
        onEdit={() => goToStep(5)}
      >
        {blessingsWithChallenges.length > 0 ? (
          <div className="space-y-3">
            {blessingsWithChallenges.map(({ blessing, challenge }) => (
              <div key={blessing!.id} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {blessing!.name}
                  </span>
                </div>
                {challenge && (
                  <div className="flex items-center gap-2 ml-6">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">
                      {challenge.name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma bênção selecionada</p>
        )}
      </SummarySection>

      {/* Virtude */}
      <SummarySection 
        title="Virtude" 
        icon={activeVirtue ? VIRTUE_ICONS[activeVirtue.id] : Sparkles} 
        step={6}
        onEdit={() => goToStep(6)}
      >
        {activeVirtue ? (
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${activeVirtue.color}15` }}
          >
            <div className="flex items-center gap-2 mb-1">
              {React.createElement(VIRTUE_ICONS[activeVirtue.id] || Sparkles, {
                className: "w-5 h-5",
                style: { color: activeVirtue.color }
              })}
              <span className="font-medium" style={{ color: activeVirtue.color }}>
                {activeVirtue.name}
              </span>
              <Badge variant="outline">Nível 1</Badge>
            </div>
            <p className="text-sm text-muted-foreground ml-7">
              {activeVirtue.levels[1]?.name}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma virtude selecionada</p>
        )}
      </SummarySection>

      {/* Equipamento */}
      <SummarySection 
        title="Equipamento" 
        icon={Package} 
        step={7}
        onEdit={() => goToStep(7)}
      >
        {equipment.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {equipment.map((item) => (
              <Badge key={item!.id} variant="secondary">
                {getEquipmentName(item!, activeTheme)}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum equipamento selecionado</p>
        )}
      </SummarySection>

      {/* Ações */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleExportPDF}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button 
              size="lg"
              onClick={handleFinish}
              className="gap-2"
              disabled={!canFinalize()}
            >
              <Save className="w-4 h-4" />
              Finalizar Personagem
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Você pode voltar e editar qualquer seção clicando no botão de edição.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de Seção do Resumo
interface SummarySectionProps {
  title: string;
  icon: React.ElementType;
  step: number;
  onEdit: () => void;
  children: React.ReactNode;
}

function SummarySection({ title, icon: Icon, step, onEdit, children }: SummarySectionProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1">
            <Edit className="w-3 h-3" />
            Editar
          </Button>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Componente de Badge de Stat
interface StatBadgeProps {
  label: string;
  value: number;
  color: 'red' | 'blue' | 'amber' | 'purple' | 'green';
  icon?: React.ElementType;
}

function StatBadge({ label, value, color, icon: Icon }: StatBadgeProps) {
  const colorClasses = {
    red: 'bg-red-500/10 text-red-500 border-red-500/30',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    green: 'bg-green-500/10 text-green-500 border-green-500/30',
  };

  return (
    <div className={cn(
      "flex flex-col items-center p-2 rounded-lg border",
      colorClasses[color]
    )}>
      {Icon && <Icon className="w-4 h-4 mb-1" />}
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}
