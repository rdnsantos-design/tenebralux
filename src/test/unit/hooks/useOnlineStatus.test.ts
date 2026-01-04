import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

describe('useOnlineStatus', () => {
  const originalNavigator = window.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restaurar navigator.onLine
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  describe('Estado inicial', () => {
    it('deve iniciar com isOnline baseado em navigator.onLine', () => {
      Object.defineProperty(window, 'navigator', {
        value: { onLine: true },
        writable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());
      expect(result.current.isOnline).toBe(true);
    });

    it('deve iniciar offline se navigator.onLine é false', () => {
      Object.defineProperty(window, 'navigator', {
        value: { onLine: false },
        writable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());
      expect(result.current.isOnline).toBe(false);
    });

    it('deve iniciar com wasOffline false', () => {
      const { result } = renderHook(() => useOnlineStatus());
      expect(result.current.wasOffline).toBe(false);
    });
  });

  describe('Eventos de conexão', () => {
    it('deve atualizar para online quando evento online é disparado', () => {
      Object.defineProperty(window, 'navigator', {
        value: { onLine: false },
        writable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());
      expect(result.current.isOnline).toBe(false);

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('deve atualizar para offline quando evento offline é disparado', () => {
      Object.defineProperty(window, 'navigator', {
        value: { onLine: true },
        writable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());
      expect(result.current.isOnline).toBe(true);

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('deve setar wasOffline true quando reconecta', () => {
      Object.defineProperty(window, 'navigator', {
        value: { onLine: true },
        writable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());

      // Desconectar
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);

      // Reconectar
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(true);
    });
  });

  describe('resetWasOffline', () => {
    it('deve resetar wasOffline para false', () => {
      Object.defineProperty(window, 'navigator', {
        value: { onLine: false },
        writable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());

      // Simular reconexão
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.wasOffline).toBe(true);

      // Resetar
      act(() => {
        result.current.resetWasOffline();
      });

      expect(result.current.wasOffline).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('deve remover event listeners ao desmontar', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useOnlineStatus());

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });
});
