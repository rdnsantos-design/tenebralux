import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';

interface CreateRoomFormProps {
  onCreateRoom: (nickname: string) => Promise<void>;
  loading?: boolean;
}

export function CreateRoomForm({ onCreateRoom, loading = false }: CreateRoomFormProps) {
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onCreateRoom(nickname.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Criar Sala
        </CardTitle>
        <CardDescription>
          Crie uma nova sala e compartilhe o código com seu oponente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="host-nickname">Seu Nickname</Label>
            <Input
              id="host-nickname"
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
            disabled={!nickname.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Sala'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
