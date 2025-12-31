import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, LogIn, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GameLobbyProps {
  onCreateRoom: (nickname: string) => Promise<string | null>;
  onJoinRoom: (roomCode: string, nickname: string) => Promise<boolean>;
  loading: boolean;
}

export function GameLobby({ onCreateRoom, onJoinRoom, loading }: GameLobbyProps) {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!nickname.trim()) {
      toast.error('Digite seu nickname!');
      return;
    }
    
    const code = await onCreateRoom(nickname.trim());
    if (code) {
      setCreatedRoomCode(code);
    }
  };

  const handleJoin = async () => {
    if (!nickname.trim()) {
      toast.error('Digite seu nickname!');
      return;
    }
    if (!roomCode.trim()) {
      toast.error('Digite o código da sala!');
      return;
    }
    
    await onJoinRoom(roomCode.trim().toUpperCase(), nickname.trim());
  };

  const copyRoomCode = () => {
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      toast.success('Código copiado!');
    }
  };

  if (createdRoomCode) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Users className="w-6 h-6" />
            Sala Criada!
          </CardTitle>
          <CardDescription>
            Compartilhe este código com seu oponente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="text-4xl font-mono font-bold tracking-widest bg-muted px-6 py-3 rounded-lg">
              {createdRoomCode}
            </div>
            <Button variant="outline" size="icon" onClick={copyRoomCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Aguardando oponente...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Users className="w-6 h-6" />
          Entrar no Jogo
        </CardTitle>
        <CardDescription>
          Crie uma nova sala ou entre em uma existente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="nickname">Seu Nickname</Label>
            <Input
              id="nickname"
              placeholder="Ex: Comandante_Norte"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Criar Sala</TabsTrigger>
            <TabsTrigger value="join">Entrar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground text-center">
              Crie uma sala e compartilhe o código com seu oponente
            </p>
            <Button 
              className="w-full" 
              onClick={handleCreate}
              disabled={loading || !nickname.trim()}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Criar Nova Sala
            </Button>
          </TabsContent>
          
          <TabsContent value="join" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="roomCode">Código da Sala</Label>
              <Input
                id="roomCode"
                placeholder="Ex: ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="font-mono text-center text-lg tracking-widest"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleJoin}
              disabled={loading || !nickname.trim() || !roomCode.trim()}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              Entrar na Sala
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
