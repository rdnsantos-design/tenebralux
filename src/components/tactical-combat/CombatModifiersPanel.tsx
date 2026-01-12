/**
 * Painel de Modificadores de Combate
 * Permite ao jogador selecionar modificadores de ambiente antes de atacar
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Move, Mountain, Sun, Target } from 'lucide-react';
import { 
  CombatModifiers, 
  DistanceRange, 
  LightingCondition, 
  CoverLevel, 
  TargetMovement, 
  PositionAdvantage,
  DISTANCE_MODIFIERS,
  LIGHTING_MODIFIERS,
  COVER_GUARD_BONUS,
  TARGET_MOVEMENT_MODIFIERS,
  POSITION_MODIFIERS,
  calculateAttackModifiers,
  calculateDefenseModifiers
} from '@/lib/tacticalCombatEngine';

interface CombatModifiersPanelProps {
  modifiers: Partial<CombatModifiers>;
  onChange: (modifiers: Partial<CombatModifiers>) => void;
  disabled?: boolean;
}

const DISTANCE_OPTIONS: { value: DistanceRange; label: string; description: string }[] = [
  { value: 'point-blank', label: 'Queima-Roupa', description: '≤2m (+2 ATQ, -2 Guarda alvo)' },
  { value: 'short', label: 'Curto', description: '≤10m (+1 ATQ)' },
  { value: 'medium', label: 'Médio', description: '10-50m (0)' },
  { value: 'long', label: 'Longo', description: '50-200m (-2 ATQ)' },
  { value: 'extreme', label: 'Extremo', description: '200m+ (-4 ATQ)' },
];

const LIGHTING_OPTIONS: { value: LightingCondition; label: string; description: string }[] = [
  { value: 'normal', label: 'Normal', description: '0' },
  { value: 'dim', label: 'Penumbra', description: '-2 ATQ' },
  { value: 'darkness', label: 'Escuridão', description: '-4 ATQ' },
];

const COVER_OPTIONS: { value: CoverLevel; label: string; description: string }[] = [
  { value: 'none', label: 'Nenhuma', description: '0' },
  { value: 'partial', label: 'Parcial (25%)', description: '+2 Guarda' },
  { value: 'substantial', label: 'Substancial (50%)', description: '+4 Guarda' },
  { value: 'almost-total', label: 'Quase Total (75%)', description: '+6 Guarda' },
  { value: 'total', label: 'Total (100%)', description: 'Impossível atacar' },
];

const MOVEMENT_OPTIONS: { value: TargetMovement; label: string; description: string }[] = [
  { value: 'stationary', label: 'Parado/Inconsciente', description: '+2 ATQ' },
  { value: 'normal', label: 'Normal', description: '0' },
  { value: 'running', label: 'Correndo', description: '-2 ATQ' },
  { value: 'sprint', label: 'Sprint', description: '-4 ATQ' },
];

const POSITION_OPTIONS: { value: PositionAdvantage; label: string; description: string }[] = [
  { value: 'none', label: 'Nenhuma', description: '0' },
  { value: 'elevated', label: 'Terreno Elevado', description: '+2 ATQ' },
  { value: 'lowground', label: 'Terreno Baixo', description: '-2 ATQ' },
  { value: 'flanking', label: 'Flanqueando', description: '+2 ATQ' },
  { value: 'rear', label: 'Pelas Costas', description: '+4 ATQ' },
  { value: 'surprise', label: 'Surpresa (1º ataque)', description: 'Alvo não usa Esquiva' },
];

export function CombatModifiersPanel({ modifiers, onChange, disabled = false }: CombatModifiersPanelProps) {
  const attackMod = calculateAttackModifiers(modifiers);
  const defenseMod = calculateDefenseModifiers(modifiers);

  const handleChange = <K extends keyof CombatModifiers>(key: K, value: CombatModifiers[K]) => {
    onChange({ ...modifiers, [key]: value });
  };

  return (
    <Card className="border-amber-500/30 bg-amber-50/5">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Modificadores de Combate
          </span>
          <div className="flex gap-2">
            <Badge variant={attackMod >= 0 ? 'default' : 'destructive'}>
              ATQ: {attackMod >= 0 ? '+' : ''}{attackMod}
            </Badge>
            {defenseMod.guardBonus !== 0 && (
              <Badge variant="secondary">
                Guarda alvo: +{defenseMod.guardBonus}
              </Badge>
            )}
            {defenseMod.ignoreEsquiva && (
              <Badge variant="outline" className="text-amber-600">
                Ignora Esquiva
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Distância */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Target className="h-3 w-3" />
              Distância
            </Label>
            <Select
              value={modifiers.distance || 'medium'}
              onValueChange={(v) => handleChange('distance', v as DistanceRange)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISTANCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Iluminação */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Sun className="h-3 w-3" />
              Iluminação
            </Label>
            <Select
              value={modifiers.lighting || 'normal'}
              onValueChange={(v) => handleChange('lighting', v as LightingCondition)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIGHTING_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cobertura do Alvo */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Mountain className="h-3 w-3" />
              Cobertura Alvo
            </Label>
            <Select
              value={modifiers.cover || 'none'}
              onValueChange={(v) => handleChange('cover', v as CoverLevel)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COVER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Movimento do Alvo */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Move className="h-3 w-3" />
              Mov. Alvo
            </Label>
            <Select
              value={modifiers.targetMovement || 'normal'}
              onValueChange={(v) => handleChange('targetMovement', v as TargetMovement)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Posição */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Posição
            </Label>
            <Select
              value={modifiers.position || 'none'}
              onValueChange={(v) => handleChange('position', v as PositionAdvantage)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
