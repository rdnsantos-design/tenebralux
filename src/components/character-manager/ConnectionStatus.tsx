import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAuth } from '@/contexts/AuthContext';
import { Wifi, WifiOff, Cloud, HardDrive } from 'lucide-react';

export function ConnectionStatus() {
  const { isOnline } = useOnlineStatus();
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isOnline ? (
        <Wifi className="w-4 h-4 text-green-500" />
      ) : (
        <WifiOff className="w-4 h-4 text-destructive" />
      )}

      {user ? (
        <div className="flex items-center gap-1">
          <Cloud className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">Nuvem</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <HardDrive className="w-4 h-4 text-muted-foreground" />
          <span className="hidden sm:inline">Local</span>
        </div>
      )}
    </div>
  );
}
