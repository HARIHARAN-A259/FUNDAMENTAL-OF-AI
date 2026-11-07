import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WS_BASE_URL } from '../api/client';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let reconnectTimeout: any = null;

    function connect() {
      const wsUrl = `${WS_BASE_URL}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== 'ping') {
            setLastMessage(data);
            // Invalidate queries so dashboard/unit/alerts refresh instantly in real-time
            queryClient.invalidateQueries({ queryKey: ['summaryStats'] });
            queryClient.invalidateQueries({ queryKey: ['activeAlerts'] });
            queryClient.invalidateQueries({ queryKey: ['unitAnalytics'] });
            queryClient.invalidateQueries({ queryKey: ['unitReadings'] });
          }
        } catch {
          // ignore parsing error
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Exponential reconnect
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);

  return { isConnected, lastMessage };
}

