import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';

interface JoinRoomFormProps {
  onJoinRoom: (roomCode: string, nickname: string) => Promise<void>;
  initialRoomCode?: string;
  loading?: boolean;
}

export function JoinRoomForm({ onJoinRoom, initialRoomCode = '', loading = false }: JoinRoomFormProps) {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !nickname.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onJoinRoom(roomCode.trim().toUpperCase(), nickname.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  // Formatar código automaticamente (maiúsculas, sem espaços)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value.slice(0, 6));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Entrar em Sala
        </CardTitle>
        <CardDescription>
          Digite o código da sala para entrar como oponente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-code">Código da Sala</Label>
            <Input
              id="room-code"
              placeholder="Ex: ABC123"
              value={roomCode}
              onChange={handleCodeChange}
              disabled={isLoading}
              maxLength={6}
              className="text-center font-mono text-lg tracking-widest"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="guest-nickname">Seu Nickname</Label>
            <Input
              id="guest-nickname"
              placeholder="Digite seu nickname..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isLoading}
              maxLength={20}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={roomCode.length !== 6 || !nickname.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar na Sala'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
