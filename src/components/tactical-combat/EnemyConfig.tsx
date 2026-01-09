/**
 * Configuração de Inimigos para Combate
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Skull, Users } from 'lucide-react';

export type EnemyLevel = 'weak' | 'normal' | 'strong' | 'elite';

interface EnemyConfigProps {
  enemyLevel: EnemyLevel;
  enemyCount: number;
  onLevelChange: (level: EnemyLevel) => void;
  onCountChange: (count: number) => void;
  onStart: () => void;
}

const LEVEL_INFO: Record<EnemyLevel, { label: string; description: string; color: string }> = {
  weak: { 
    label: 'Fraco', 
    description: 'Stats baixos, teste fácil',
    color: 'text-green-500'
  },
  normal: { 
    label: 'Normal', 
    description: 'Stats equilibrados',
    color: 'text-yellow-500'
  },
  strong: { 
    label: 'Forte', 
    description: 'Stats elevados',
    color: 'text-orange-500'
  },
  elite: { 
    label: 'Elite', 
    description: 'Stats muito altos, desafiador',
    color: 'text-red-500'
  }
};

export function EnemyConfig({
  enemyLevel,
  enemyCount,
  onLevelChange,
  onCountChange,
  onStart
}: EnemyConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Skull className="h-5 w-5" />
          Configurar Inimigos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nível do Inimigo */}
        <div className="space-y-3">
          <Label>Nível de Dificuldade</Label>
          <RadioGroup
            value={enemyLevel}
            onValueChange={(v) => onLevelChange(v as EnemyLevel)}
            className="grid grid-cols-2 gap-2"
          >
            {(Object.keys(LEVEL_INFO) as EnemyLevel[]).map((level) => (
              <div key={level}>
                <RadioGroupItem
                  value={level}
                  id={level}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={level}
                  className={`
                    flex flex-col items-center justify-center rounded-md border-2 border-muted 
                    bg-popover p-3 hover:bg-accent hover:text-accent-foreground 
                    peer-data-[state=checked]:border-primary cursor-pointer
                    [&:has([data-state=checked])]:border-primary
                  `}
                >
                  <span className={`font-semibold ${LEVEL_INFO[level].color}`}>
                    {LEVEL_INFO[level].label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {LEVEL_INFO[level].description}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Quantidade de Inimigos */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Quantidade de Inimigos
            </Label>
            <span className="font-semibold">{enemyCount}</span>
          </div>
          <Slider
            value={[enemyCount]}
            onValueChange={([v]) => onCountChange(v)}
            min={1}
            max={4}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
          </div>
        </div>

        {/* Botão Iniciar */}
        <Button className="w-full" size="lg" onClick={onStart}>
          <Skull className="h-4 w-4 mr-2" />
          Começar Batalha!
        </Button>
      </CardContent>
    </Card>
  );
}
