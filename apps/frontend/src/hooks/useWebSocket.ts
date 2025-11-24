import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useOrgStore } from '@/store/orgStore';
import { CONFIG } from '@/constants/config';

type EventHandler = (data: unknown) => void;

/**
 * Hook to manage WebSocket connection for real-time updates
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
  const { tokens } = useAuthStore();
  const { currentOrg } = useOrgStore();

  useEffect(() => {
    if (!tokens?.access_token || !currentOrg) {
      // Disconnect if no auth or org
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Connect to WebSocket server
    const socket = io(CONFIG.WS_URL || 'ws://localhost:8000', {
      auth: {
        token: tokens.access_token,
      },
      query: {
        org_id: currentOrg.id,
      },
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Listen for all events and route to handlers
    socket.onAny((event: string, data: unknown) => {
      const handlers = handlersRef.current.get(event);
      if (handlers) {
        handlers.forEach((handler) => handler(data));
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [tokens?.access_token, currentOrg]);

  /**
   * Subscribe to a specific event
   */
  const subscribe = (event: string, handler: EventHandler) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = handlersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(event);
        }
      }
    };
  };

  /**
   * Emit an event to the server
   */
  const emit = (event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit event: socket not connected');
    }
  };

  return {
    isConnected,
    subscribe,
    emit,
  };
}

/**
 * Hook to subscribe to import progress events
 */
export function useImportProgress(importId?: string) {
  const { subscribe } = useWebSocket();
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (!importId) return;

    const unsubscribe = subscribe(`import:${importId}:progress`, (data) => {
      setProgress(data as typeof progress);
    });

    return unsubscribe;
  }, [importId, subscribe]);

  return progress;
}

/**
 * Hook to subscribe to export progress events
 */
export function useExportProgress(exportId?: string) {
  const { subscribe } = useWebSocket();
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (!exportId) return;

    const unsubscribe = subscribe(`export:${exportId}:progress`, (data) => {
      setProgress(data as typeof progress);
    });

    return unsubscribe;
  }, [exportId, subscribe]);

  return progress;
}

/**
 * Hook to subscribe to bulk action progress events
 */
export function useBulkActionProgress(jobId?: string) {
  const { subscribe } = useWebSocket();
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const unsubscribe = subscribe(`job:${jobId}:progress`, (data) => {
      setProgress(data as typeof progress);
    });

    return unsubscribe;
  }, [jobId, subscribe]);

  return progress;
}
