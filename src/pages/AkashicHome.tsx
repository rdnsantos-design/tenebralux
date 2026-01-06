import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Users, Hexagon, Globe, Map, Route, 
  UserPlus, Gamepad2, Layers, Swords, Settings,
  ChevronRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useTheme } from '@/themes';
import { cn } from '@/lib/utils';

type GameMode = 'rpg' | 'tactical' | 'strategic' | null;

interface GameModeData {
  id: GameMode;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  options: {
    label: string;
    description: string;
    path: string;
    icon: React.ElementType;
  }[];
}

const gameModes: GameModeData[] = [
  {
    id: 'rpg',
    title: 'RPG',
    subtitle: 'Aventuras Narrativas',
    icon: Users,
    color: 'text-akashic-cyan',
    gradient: 'from-akashic-cyan/20 to-akashic-violet/20',
    options: [
      { label: 'Criar Agente', description: 'Novo personagem do zero', path: '/character-builder', icon: UserPlus },
      { label: 'Meus Agentes', description: 'Gerenciar personagens', path: '/character-builder', icon: Users },
      { label: 'Regras & Dados', description: 'Referência rápida', path: '/character-builder', icon: Settings },
    ],
  },
  {
    id: 'tactical',
    title: 'Tático',
    subtitle: 'Combate Hexagonal',
    icon: Hexagon,
    color: 'text-akashic-violet',
    gradient: 'from-akashic-violet/20 to-akashic-orange/20',
    options: [
      { label: 'Jogar Online', description: 'Batalha em tempo real', path: '/tactical', icon: Gamepad2 },
      { label: 'Unidades', description: 'Gerenciar tropas', path: '/army', icon: Swords },
      { label: 'Terrenos', description: 'Tiles hexagonais', path: '/battlemap', icon: Hexagon },
    ],
  },
  {
    id: 'strategic',
    title: 'Estratégico',
    subtitle: 'Conquista Galáctica',
    icon: Globe,
    color: 'text-akashic-orange',
    gradient: 'from-akashic-orange/20 to-akashic-cyan/20',
    options: [
      { label: 'Card Game', description: 'Batalhas em massa', path: '/game', icon: Layers },
      { label: 'Sistemas Estelares', description: 'Gestão de domínios', path: '/domains', icon: Map },
      { label: 'Rotas Estelares', description: 'Navegação e viagens', path: '/travel', icon: Route },
    ],
  },
];

const sharedTools = [
  { label: 'Personagens', path: '/character-builder', icon: UserPlus },
  { label: 'Exércitos', path: '/army', icon: Users },
  { label: 'Domínios', path: '/domains', icon: Map },
  { label: 'Viagem', path: '/travel', icon: Route },
];

// Floating particles component
function CosmicParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-akashic-cyan/40 rounded-full"
          initial={{
            x: Math.random() * 100 + '%',
            y: Math.random() * 100 + '%',
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, '-10%'],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// Hexagonal game mode button
function HexButton({ 
  mode, 
  isActive, 
  onClick 
}: { 
  mode: GameModeData; 
  isActive: boolean; 
  onClick: () => void;
}) {
  const Icon = mode.icon;
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative group',
        'w-40 h-44 md:w-48 md:h-52',
        'flex flex-col items-center justify-center',
        'transition-all duration-300',
        isActive && 'scale-110 z-10'
      )}
      whileHover={{ scale: isActive ? 1.1 : 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Hexagon shape using clip-path */}
      <div 
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-br',
          mode.gradient,
          'border-2 border-akashic-cyan/30',
          'transition-all duration-300',
          isActive && 'border-akashic-cyan shadow-lg shadow-akashic-cyan/30'
        )}
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
      />
      
      {/* Glow effect */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-akashic-cyan/10"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <Icon className={cn('w-10 h-10 md:w-12 md:h-12', mode.color)} />
        <span className="text-lg md:text-xl font-bold text-foreground">{mode.title}</span>
        <span className="text-xs text-muted-foreground">{mode.subtitle}</span>
      </div>
    </motion.button>
  );
}

// Expanded options panel
function ExpandedOptions({ mode, onNavigate }: { mode: GameModeData; onNavigate: (path: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto"
    >
      {mode.options.map((option, index) => {
        const Icon = option.icon;
        return (
          <motion.button
            key={option.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onNavigate(option.path)}
            className={cn(
              'group relative p-6 rounded-xl',
              'bg-gradient-to-br from-card/80 to-akashic-deep/50',
              'border border-akashic-cyan/20',
              'hover:border-akashic-cyan/50 hover:shadow-lg hover:shadow-akashic-cyan/10',
              'transition-all duration-300',
              'text-left'
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                'p-3 rounded-lg bg-gradient-to-br',
                mode.gradient
              )}>
                <Icon className={cn('w-6 h-6', mode.color)} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-akashic-cyan transition-colors">
                  {option.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-akashic-cyan group-hover:translate-x-1 transition-all" />
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

export default function AkashicHome() {
  const navigate = useNavigate();
  const { labels } = useTheme();
  const [selectedMode, setSelectedMode] = useState<GameMode>(null);

  return (
    <div className="min-h-screen bg-akashic-deep relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-akashic-deep via-akashic-space to-akashic-deep" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-akashic-violet/10 via-transparent to-transparent" />
      <CosmicParticles />
      
      {/* Header */}
      <header className="relative z-20 flex justify-between items-center p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Rocket className="w-8 h-8 text-akashic-cyan" />
          <span className="text-lg font-semibold text-foreground hidden md:block">
            {labels.name}
          </span>
        </div>
        <ThemeSwitcher />
      </header>
      
      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center px-4 pt-8 md:pt-16">
        {/* Title */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4">
            <span className="bg-gradient-to-r from-akashic-cyan via-akashic-violet to-akashic-orange bg-clip-text text-transparent">
              {labels.name}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-akashic-orange" />
            {labels.tagline}
            <Sparkles className="w-5 h-5 text-akashic-orange" />
          </p>
        </motion.div>
        
        {/* Game Mode Selector */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 md:gap-8 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {gameModes.map((mode) => (
            <HexButton
              key={mode.id}
              mode={mode}
              isActive={selectedMode === mode.id}
              onClick={() => setSelectedMode(selectedMode === mode.id ? null : mode.id)}
            />
          ))}
        </motion.div>
        
        {/* Expanded Options */}
        <AnimatePresence mode="wait">
          {selectedMode && (
            <ExpandedOptions
              mode={gameModes.find(m => m.id === selectedMode)!}
              onNavigate={navigate}
            />
          )}
        </AnimatePresence>
        
        {/* Quick Play Buttons - Show when no mode selected */}
        <AnimatePresence>
          {!selectedMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-wrap justify-center gap-4 mb-12"
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-akashic-cyan to-akashic-violet hover:from-akashic-cyan/90 hover:to-akashic-violet/90 text-white shadow-lg shadow-akashic-cyan/30"
                onClick={() => navigate('/tactical')}
              >
                <Hexagon className="w-5 h-5 mr-2" />
                Batalha Tática Online
              </Button>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-akashic-violet to-akashic-orange hover:from-akashic-violet/90 hover:to-akashic-orange/90 text-white shadow-lg shadow-akashic-violet/30"
                onClick={() => navigate('/game')}
              >
                <Layers className="w-5 h-5 mr-2" />
                Card Game Online
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Shared Tools Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="fixed bottom-0 left-0 right-0 bg-akashic-deep/90 backdrop-blur-md border-t border-akashic-cyan/20"
        >
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-center gap-2 md:gap-6">
            {sharedTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.label}
                  variant="ghost"
                  size="sm"
                  className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-muted-foreground hover:text-akashic-cyan hover:bg-akashic-cyan/10"
                  onClick={() => navigate(tool.path)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs md:text-sm">{tool.label}</span>
                </Button>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
