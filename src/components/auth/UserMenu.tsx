import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Cloud } from 'lucide-react';

export function UserMenu() {
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        <Button variant="outline" onClick={() => setShowAuthModal(true)}>
          <User className="w-4 h-4 mr-2" />
          Entrar
        </Button>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </>
    );
  }

  const initials = profile?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{profile?.display_name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Cloud className="w-4 h-4 mr-2 text-green-500" />
          Sincronizado na nuvem
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
