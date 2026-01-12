import React, { useEffect } from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { useTheme } from '@/themes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getFactionsByTheme, getFactionById, FactionDefinition, getFactionFreeSkillPoints } from '@/data/character/factions';
import { getCulturesByTheme, getCulturesByFaction, getCultureById, CultureDefinition } from '@/data/character/cultures';
import { VIRTUES, getVirtueById } from '@/data/character/virtues';
import { ATTRIBUTES } from '@/data/character/attributes';
import { Sparkles, Moon, Check, Circle, Globe, Building2, Cpu, Rocket, Ghost, Crown, Landmark, TreePine, Ship, Axe, Star, Shield, Users, Handshake, Scale, BookOpen, Sword, Skull, Compass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Globe,
  Building2,
  Cpu,
  Rocket,
  Ghost,
  Crown,
  Landmark,
  TreePine,
  Ship,
  Axe,
  Circle,
  Shield,
  Users,
  Handshake,
  Scale,
  BookOpen,
  Sword,
  Skull,
  Star,
  Compass,
};

interface StepConceptProps {
  onBack?: () => void;
}

export function StepConcept({ onBack }: StepConceptProps) {
  const { draft, updateDraft, getStepValidation } = useCharacterBuilder();
  const { activeTheme, setActiveTheme } = useTheme();
  const validation = getStepValidation(1);

  // Sincronizar tema do draft com tema global
  useEffect(() => {
    if (draft.theme !== activeTheme) {
      updateDraft({ theme: activeTheme });
    }
  }, [activeTheme, draft.theme, updateDraft]);

  const handleThemeChange = (theme: 'akashic' | 'tenebralux') => {
    setActiveTheme(theme);
    updateDraft({ 
      theme, 
      factionId: undefined, // Reset faction ao mudar tema
      culture: undefined    // Reset culture ao mudar tema
    });
  };

  const handleFactionSelect = (factionId: string | undefined) => {
    updateDraft({ 
      factionId,
      culture: undefined // Reset culture ao mudar facção
    });
  };

  const factions = getFactionsByTheme(draft.theme || activeTheme);
  const cultures = draft.factionId 
    ? getCulturesByFaction(draft.factionId)
    : getCulturesByTheme(draft.theme || activeTheme);

  const nameError = validation.errors.find(e => e.field === 'name');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conceito do Personagem</h2>
          <p className="text-muted-foreground">
            Defina a identidade básica do seu personagem: quem ele é e de onde vem.
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Voltar à Lista
          </Button>
        )}
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-base font-semibold">
          Nome do Personagem *
        </Label>
        <Input
          id="name"
          placeholder="Digite o nome do personagem"
          value={draft.name || ''}
          onChange={(e) => updateDraft({ name: e.target.value })}
          className={cn(
            "text-lg h-12",
            nameError && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {nameError && (
          <p className="text-sm text-destructive">{nameError.message}</p>
        )}
      </div>

      {/* Tema */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Cenário / Tema *</Label>
        <p className="text-sm text-muted-foreground">
          Escolha o universo onde seu personagem existe.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ThemeCard
            id="akashic"
            name="Akashic Odyssey"
            description="Ficção científica com impérios estelares, tecnologia avançada e exploração espacial."
            icon={<Sparkles className="w-6 h-6" />}
            color="from-blue-500/20 to-purple-500/20"
            selected={draft.theme === 'akashic'}
            onClick={() => handleThemeChange('akashic')}
          />
          <ThemeCard
            id="tenebralux"
            name="Tenebra Lux"
            description="Fantasia medieval com reinos, magia ancestral e intrigas políticas."
            icon={<Moon className="w-6 h-6" />}
            color="from-amber-500/20 to-red-500/20"
            selected={draft.theme === 'tenebralux'}
            onClick={() => handleThemeChange('tenebralux')}
          />
        </div>
      </div>

      {/* Facção */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold">Facção</Label>
            <p className="text-sm text-muted-foreground">
              Escolha a organização ou grupo ao qual pertence (opcional).
            </p>
          </div>
          {draft.factionId && (
            <button
              onClick={() => handleFactionSelect(undefined)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Limpar seleção
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {factions.map((faction) => (
            <FactionCard
              key={faction.id}
              faction={faction}
              selected={draft.factionId === faction.id}
              onClick={() => handleFactionSelect(
                draft.factionId === faction.id ? undefined : faction.id
              )}
            />
          ))}
        </div>
      </div>

      {/* Cultura */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Cultura</Label>
        <p className="text-sm text-muted-foreground">
          A origem cultural do seu personagem define sua visão de mundo.
          {draft.factionId && ' (Filtrado pela facção selecionada)'}
        </p>

        <RadioGroup
          value={draft.culture || ''}
          onValueChange={(value) => updateDraft({ culture: value })}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {cultures.map((culture) => (
            <CultureOption key={culture.id} culture={culture} />
          ))}
        </RadioGroup>
      </div>

      {/* Preview */}
      {draft.name && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              <span className="font-bold">{draft.name}</span>
              {draft.culture && (
                <span className="text-muted-foreground">
                  {' '}é um(a) {getCultureById(draft.culture)?.name || draft.culture}
                </span>
              )}
              {draft.factionId && (
                <span className="text-muted-foreground">
                  {' '}da {getFactionById(draft.factionId)?.name}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componentes auxiliares

interface ThemeCardProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  selected: boolean;
  onClick: () => void;
}

function ThemeCard({ id, name, description, icon, color, selected, onClick }: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative p-6 rounded-lg border-2 text-left transition-all",
        "bg-gradient-to-br",
        color,
        selected 
          ? "border-primary ring-2 ring-primary/20" 
          : "border-transparent hover:border-muted-foreground/30"
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3">
          <Check className="w-5 h-5 text-primary" />
        </div>
      )}
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="font-bold text-lg">{name}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

interface FactionCardProps {
  faction: FactionDefinition;
  selected: boolean;
  onClick: () => void;
}

function FactionCard({ faction, selected, onClick }: FactionCardProps) {
  const IconComponent = ICON_MAP[faction.icon] || Circle;
  
  // Obter informações de bônus
  const virtueInfo = faction.virtue 
    ? faction.virtue === 'choice' 
      ? 'Livre escolha' 
      : getVirtueById(faction.virtue)?.name
    : null;
  
  const attrBonuses = faction.attributeBonuses?.map(attrId => 
    ATTRIBUTES.find(a => a.id === attrId)?.name || attrId
  );
  
  const freePoints = faction.freeSkillPoints;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border text-left transition-all",
        selected 
          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
          : "border-muted hover:border-muted-foreground/50 hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <IconComponent 
          className="w-4 h-4" 
          style={{ color: faction.color }}
        />
        <span className="font-medium text-sm">{faction.name}</span>
        {selected && <Check className="w-4 h-4 text-primary ml-auto" />}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
        {faction.description}
      </p>
      
      {/* Bônus da Facção */}
      <div className="flex flex-wrap gap-1 mt-1">
        {virtueInfo && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {virtueInfo}
          </Badge>
        )}
        {attrBonuses && attrBonuses.length > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            +1 {attrBonuses.join(', ')}
          </Badge>
        )}
        {freePoints && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            <Star className="w-2.5 h-2.5 mr-0.5" />
            {freePoints} pts livres
          </Badge>
        )}
      </div>
    </button>
  );
}

interface CultureOptionProps {
  culture: CultureDefinition;
}

function CultureOption({ culture }: CultureOptionProps) {
  return (
    <Label
      htmlFor={culture.id}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all",
        "hover:border-muted-foreground/50 hover:bg-muted/50",
        "[&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
      )}
    >
      <RadioGroupItem value={culture.id} id={culture.id} className="mt-1" />
      <div>
        <span className="font-medium">{culture.name}</span>
        <p className="text-xs text-muted-foreground">{culture.description}</p>
      </div>
    </Label>
  );
}
