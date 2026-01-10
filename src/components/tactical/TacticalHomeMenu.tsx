import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, LogIn, ListOrdered, Swords, Map, Bot } from 'lucide-react';

export function TacticalHomeMenu() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Jogar Solo',
      description: 'Jogue contra o bot em uma partida single player',
      icon: Bot,
      path: '/singleplayer-mass-combat',
      color: 'text-emerald-500',
    },
    {
      title: 'Criar Partida',
      description: 'Crie uma nova sala e convide um oponente',
      icon: Plus,
      path: '/tactical/create',
      color: 'text-green-500',
    },
    {
      title: 'Entrar em Partida',
      description: 'Entre em uma sala usando o código',
      icon: LogIn,
      path: '/tactical/join',
      color: 'text-blue-500',
    },
    {
      title: 'Minhas Partidas',
      description: 'Continue partidas em andamento',
      icon: ListOrdered,
      path: '/tactical/my-matches',
      color: 'text-amber-500',
    },
    {
      title: 'Testar Mapa',
      description: 'Visualize e teste o grid hexagonal',
      icon: Map,
      path: '/tactical/battle-test',
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Swords className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Batalha Tática</h1>
          <p className="text-muted-foreground">
            Combate em tempo real com hexágonos
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Card 
              key={item.path}
              className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
              onClick={() => navigate(item.path)}
            >
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <item.icon className={`h-12 w-12 ${item.color}`} />
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
