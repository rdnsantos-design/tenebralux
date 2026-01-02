import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Room, MatchState, GamePhase } from '@/types/multiplayer';

interface PhaseGuardResult {
  correctedPhase: GamePhase | null;
  isValid: boolean;
}

// Detecta inconsistências entre current_phase e flags do match_state
export function detectPhaseInconsistency(
  room: Room, 
  matchState: any
): PhaseGuardResult {
  const currentPhase = room.current_phase;
  
  // Se ambos decks confirmados mas ainda em deckbuilding → deveria ser deployment
  if (currentPhase === 'deckbuilding') {
    if (matchState.player1_deck_confirmed && matchState.player2_deck_confirmed) {
      return { correctedPhase: 'deployment', isValid: false };
    }
  }
  
  // Se ambos deployments confirmados mas ainda em deployment → deveria ser combat
  if (currentPhase === 'deployment') {
    if (matchState.player1_deployment_confirmed && matchState.player2_deployment_confirmed) {
      return { correctedPhase: 'combat', isValid: false };
    }
  }
  
  // combat_setup é fase legada → deveria ser deployment ou combat
  if (currentPhase === 'combat_setup') {
    // Se deployments não confirmados, voltar para deployment
    if (!matchState.player1_deployment_confirmed || !matchState.player2_deployment_confirmed) {
      return { correctedPhase: 'deployment', isValid: false };
    }
    // Se deployments confirmados, ir para combat
    return { correctedPhase: 'combat', isValid: false };
  }
  
  return { correctedPhase: null, isValid: true };
}

// Hook para auto-correção de fase
export function usePhaseGuard(
  room: Room | null,
  matchState: any,
  sessionId: string
) {
  const checkAndFixPhase = useCallback(async () => {
    if (!room || !matchState) return;
    
    const result = detectPhaseInconsistency(room, matchState);
    
    if (!result.isValid && result.correctedPhase) {
      console.warn(
        `[PhaseGuard] Inconsistência detectada: ${room.current_phase} → ${result.correctedPhase}`
      );
      
      // Registrar no match_actions como system_fix
      try {
        await supabase.from('match_actions').insert({
          room_id: room.id,
          player_number: 0, // system
          action_type: 'system_fix',
          action_data: {
            from_phase: room.current_phase,
            to_phase: result.correctedPhase,
            reason: 'phase_inconsistency_detected'
          },
          phase: room.current_phase,
          state_version: matchState.version ?? 0
        });
        
        // Atualizar a fase no banco
        await supabase
          .from('rooms')
          .update({ current_phase: result.correctedPhase })
          .eq('id', room.id);
          
        toast.info(`Fase corrigida automaticamente: ${result.correctedPhase}`);
      } catch (err) {
        console.error('[PhaseGuard] Erro ao corrigir fase:', err);
      }
    }
  }, [room, matchState]);
  
  useEffect(() => {
    checkAndFixPhase();
  }, [checkAndFixPhase]);
}

// Valida se uma ação é permitida na fase atual
export function validatePhaseAction(
  currentPhase: GamePhase,
  allowedPhases: GamePhase[],
  actionName: string
): { valid: boolean; error?: string } {
  if (!allowedPhases.includes(currentPhase)) {
    return {
      valid: false,
      error: `Ação "${actionName}" não permitida na fase "${currentPhase}". Fases válidas: ${allowedPhases.join(', ')}`
    };
  }
  return { valid: true };
}

// Hook para bloquear ações fora de fase
export function usePhaseActionGuard(currentPhase: GamePhase) {
  const guardAction = useCallback((
    allowedPhases: GamePhase[],
    actionName: string,
    action: () => Promise<void> | void
  ) => {
    return async () => {
      const validation = validatePhaseAction(currentPhase, allowedPhases, actionName);
      
      if (!validation.valid) {
        toast.error(validation.error);
        console.warn(`[PhaseGuard] Ação bloqueada: ${actionName} na fase ${currentPhase}`);
        return;
      }
      
      await action();
    };
  }, [currentPhase]);
  
  return { guardAction };
}
