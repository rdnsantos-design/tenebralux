import { useState, useEffect } from 'react';

const PLAYER_ID_KEY = 'tactical_player_id';
const PLAYER_NAME_KEY = 'tactical_player_name';

export function usePlayerId() {
  const [playerId, setPlayerId] = useState<string>(() => {
    const stored = localStorage.getItem(PLAYER_ID_KEY);
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, newId);
    return newId;
  });

  const [playerName, setPlayerNameState] = useState<string>(() => {
    return localStorage.getItem(PLAYER_NAME_KEY) || '';
  });

  const setPlayerName = (name: string) => {
    localStorage.setItem(PLAYER_NAME_KEY, name);
    setPlayerNameState(name);
  };

  return {
    playerId,
    playerName,
    setPlayerName,
  };
}
