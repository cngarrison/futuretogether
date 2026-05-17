import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import type { ConnectionStatus, SlideshowRole, WsMessage } from '@/types/slideshows.ts';

// Exported signals — consumed by display components in this page tree
export const currentSlide = signal(0);
export const connectionStatus = signal<ConnectionStatus>('offline');

// Internal WS send function — replaced on each successful connect
let _sendFn: (slide: number) => void = () => {};

/** Call from controller to navigate all connected clients */
export function navigate(slide: number): void {
  _sendFn(slide);
}

interface SlideshowSyncProps {
  room: string;
  role: SlideshowRole;
  initialSlide?: number;
}

export default function SlideshowSync({ room, role, initialSlide = 0 }: SlideshowSyncProps) {
  useEffect(() => {
    currentSlide.value = initialSlide;
    let ws: WebSocket | null = null;
    let retryDelay = 50;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      connectionStatus.value = 'reconnecting';
      const protocol = globalThis.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${globalThis.location.host}/ws/slideshow-sync?room=${encodeURIComponent(room)}`);

      ws.onopen = () => {
        retryDelay = 50;
        connectionStatus.value = 'connected';
        _sendFn = (slide: number) => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'goto', slide }));
          }
        };
        ws.send(JSON.stringify({ action: 'hello', role }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WsMessage;
          if (msg.action === 'sync') {
            currentSlide.value = msg.slide;
          }
          // pong is silently acknowledged
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        connectionStatus.value = 'offline';
        _sendFn = () => {};
        if (!destroyed) {
          retryTimer = setTimeout(connect, retryDelay);
          retryDelay = Math.min(retryDelay * 2, 30_000);
        }
      };

      ws.onerror = () => ws?.close();
    }

    connect();

    // Heartbeat: keep connection alive through idle periods
    const heartbeat = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'ping' }));
      }
    }, 20_000);

    return () => {
      destroyed = true;
      if (retryTimer !== null) clearTimeout(retryTimer);
      clearInterval(heartbeat);
      _sendFn = () => {};
      ws?.close();
    };
  }, [room]);

  return null;
}
