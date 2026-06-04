import { useState, useEffect, useRef, useCallback } from 'react';

const LIVE_URL = 'http://127.0.0.1:5000/api/monitor/live';
const MAX_LINES = 100;
const RECONNECT_DELAY = 3000;

export function useLiveLog() {
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    try {
      const es = new EventSource(LIVE_URL);
      esRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
      };

      es.onmessage = (event) => {
        const line = event.data;
        if (line) {
          setLogs(prev => {
            const next = [...prev, { text: line, timestamp: Date.now() }];
            return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
          });
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        esRef.current = null;
        // Auto-reconnect
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
      };
    } catch {
      setIsConnected(false);
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) esRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connect]);

  return { logs, isConnected };
}
