import React from 'react';
import { useTheme } from '@/themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Rocket, Castle, ChevronDown } from 'lucide-react';

export function ThemeSwitcher() {
  const { activeTheme, setActiveTheme, labels, themes } = useTheme();
  
  const Icon = activeTheme === 'akashic' ? Rocket : Castle;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Icon className="h-4 w-4" />
          {labels.name}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => setActiveTheme('akashic')}
          className={activeTheme === 'akashic' ? 'bg-accent' : ''}
        >
          <Rocket className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">{themes.akashic.name}</span>
            <span className="text-xs text-muted-foreground">{themes.akashic.tagline}</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setActiveTheme('tenebralux')}
          className={activeTheme === 'tenebralux' ? 'bg-accent' : ''}
        >
          <Castle className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">{themes.tenebralux.name}</span>
            <span className="text-xs text-muted-foreground">{themes.tenebralux.tagline}</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
