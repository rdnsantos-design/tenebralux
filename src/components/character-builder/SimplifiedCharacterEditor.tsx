import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Crown, Swords, Shield, Target, Heart, Footprints, Flag, Users } from 'lucide-react';
import {
  SimplifiedCharacter,
  SimplifiedWeaponType,
  CharacterLevel,
  SIMPLIFIED_WEAPONS,
  CHARACTER_LEVELS,
  LEVEL_STAT_SUGGESTIONS,
  calculateDefense,
  createEmptySimplifiedCharacter
} from '@/types/simplified-character';
import { useTheme } from '@/themes';

interface SimplifiedCharacterEditorProps {
  character?: SimplifiedCharacter;
  onSave: (character: Omit<SimplifiedCharacter, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function SimplifiedCharacterEditor({
  character,
  onSave,
  onCancel
}: SimplifiedCharacterEditorProps) {
  const { activeTheme } = useTheme();
  const [formData, setFormData] = useState(() => {
    if (character) {
      return { ...character };
    }
    return createEmptySimplifiedCharacter(activeTheme);
  });

  // Recalcula defesa quando guarda ou resistência mudam
  useEffect(() => {
    const newDefesa = calculateDefense(formData.guarda, formData.resistencia);
    if (newDefesa !== formData.defesa) {
      setFormData(prev => ({ ...prev, defesa: newDefesa }));
    }
  }, [formData.guarda, formData.resistencia]);

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateDomainStat = (stat: keyof NonNullable<SimplifiedCharacter['domainStats']>, value: number) => {
    setFormData(prev => ({
      ...prev,
      domainStats: {
        regencia: 0,
        seguranca: 0,
        industria: 0,
        comercio: 0,
        politica: 0,
        inovacao: 0,
        ...prev.domainStats,
        [stat]: value
      }
    }));
  };

  const handleRegentToggle = (checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        isRegent: true,
        domainStats: prev.domainStats || {
          regencia: 2,
          seguranca: 2,
          industria: 2,
          comercio: 2,
          politica: 2,
          inovacao: 2
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        isRegent: false,
        domainStats: undefined
      }));
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      return;
    }
    onSave({
      ...formData,
      isSimplified: true,
      theme: activeTheme
    });
  };

  const selectedWeapon = SIMPLIFIED_WEAPONS[formData.weaponType];
  const levelInfo = LEVEL_STAT_SUGGESTIONS[formData.level];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {character ? 'Editar' : 'Criar'} Personagem Resumido
            </h1>
            <p className="text-sm text-muted-foreground">
              Ficha simplificada para NPCs e combate
            </p>
          </div>
        </div>

        {/* Identificação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Nome do personagem"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level">Nível</Label>
                <Select
                  value={formData.level}
                  onValueChange={(v) => updateField('level', v as CharacterLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHARACTER_LEVELS.map((lvl) => (
                      <SelectItem key={lvl.value} value={lvl.value}>
                        <div className="flex items-center gap-2">
                          <span>{lvl.label}</span>
                          <span className="text-xs text-muted-foreground">
                            ({LEVEL_STAT_SUGGESTIONS[lvl.value].description})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium">Regente</p>
                  <p className="text-xs text-muted-foreground">
                    Habilita perícias de domínio
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.isRegent}
                onCheckedChange={handleRegentToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats de Combate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Swords className="w-5 h-5" />
              Combate
            </CardTitle>
            <CardDescription>
              Sugestão para {CHARACTER_LEVELS.find(l => l.value === formData.level)?.label}: 
              stats entre {levelInfo.statRange.min} e {levelInfo.statRange.max}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Defesa */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Guarda
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.guarda}
                  onChange={(e) => updateField('guarda', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Resistência</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.resistencia}
                  onChange={(e) => updateField('resistencia', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Defesa</Label>
                <div className="h-10 px-3 flex items-center bg-muted rounded-md font-semibold">
                  {formData.defesa}
                </div>
              </div>
            </div>

            {/* Evasão, Vitalidade, Movimento */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Evasão</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.evasao}
                  onChange={(e) => updateField('evasao', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  Vitalidade
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.vitalidade}
                  onChange={(e) => updateField('vitalidade', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Footprints className="w-4 h-4" />
                  Movimento
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={formData.movimento}
                  onChange={(e) => updateField('movimento', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <Separator />

            {/* Perícias de Guerra */}
            <div>
              <Label className="flex items-center gap-1 mb-3">
                <Flag className="w-4 h-4" />
                Perícias de Guerra
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Estratégia (General)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={formData.estrategia}
                    onChange={(e) => updateField('estrategia', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Comando (Líder de Campo)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={formData.comando}
                    onChange={(e) => updateField('comando', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Ataques */}
            <div>
              <Label className="flex items-center gap-1 mb-3">
                <Target className="w-4 h-4" />
                Ataques (Atributo + Perícia)
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Tiro</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={formData.tiro}
                    onChange={(e) => updateField('tiro', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Luta</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={formData.luta}
                    onChange={(e) => updateField('luta', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Lâminas</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={formData.laminas}
                    onChange={(e) => updateField('laminas', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arma */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Arma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(SIMPLIFIED_WEAPONS) as SimplifiedWeaponType[]).map((type) => {
                const weapon = SIMPLIFIED_WEAPONS[type];
                const isSelected = formData.weaponType === type;
                return (
                  <Card
                    key={type}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-muted-foreground/50'
                    }`}
                    onClick={() => updateField('weaponType', type)}
                  >
                    <CardContent className="p-3 text-center">
                      <p className="font-semibold">{weapon.name}</p>
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        <p>Dano: {weapon.damage}</p>
                        <p>Vel: +{weapon.speedModifier}</p>
                        <p>Mov: {weapon.movementModifier >= 0 ? '+' : ''}{weapon.movementModifier}</p>
                        {weapon.bonusDamageRule && (
                          <p className="text-primary">Bônus: {weapon.bonusDamageRule}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {selectedWeapon && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="font-medium">{selectedWeapon.name}</p>
                <p className="text-muted-foreground">
                  Dano {selectedWeapon.damage} • Alcance {selectedWeapon.range}m • 
                  Velocidade +{selectedWeapon.speedModifier} • 
                  Movimento {selectedWeapon.movementModifier >= 0 ? '+' : ''}{selectedWeapon.movementModifier}
                  {selectedWeapon.bonusDamageRule && (
                    <span className="text-primary"> • Bônus {selectedWeapon.bonusDamageRule}</span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats de Domínio (apenas se Regente) */}
        {formData.isRegent && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Perícias de Domínio
              </CardTitle>
              <CardDescription>
                Stats para o jogo de domínio/regência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { key: 'regencia', label: 'Regência' },
                  { key: 'seguranca', label: 'Segurança' },
                  { key: 'industria', label: 'Indústria' },
                  { key: 'comercio', label: 'Comércio' },
                  { key: 'politica', label: 'Política' },
                  { key: 'inovacao', label: 'Inovação' }
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={formData.domainStats?.[key as keyof NonNullable<SimplifiedCharacter['domainStats']>] || 0}
                      onChange={(e) => updateDomainStat(
                        key as keyof NonNullable<SimplifiedCharacter['domainStats']>,
                        parseInt(e.target.value) || 0
                      )}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Anotações sobre o personagem..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Personagem
          </Button>
        </div>
      </div>
    </div>
  );
}
