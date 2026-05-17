import { define } from '@/utils.ts';
import { getKv } from '@/utils/kv.ts';
import type { SlideshowState, WsMessage } from '@/types/slideshows.ts';

export const handler = define.handlers({
  GET(ctx) {
    if (ctx.req.headers.get('upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }
    const url = new URL(ctx.req.url);
    const room = url.searchParams.get('room');
    if (!room) return new Response('Missing room parameter', { status: 400 });

    const { socket, response } = Deno.upgradeWebSocket(ctx.req);
    const kvKey: Deno.KvKey = ['slideshow', room, 'state'];

    socket.onopen = () => {
      // Run KV watch as background task for this connection
      (async () => {
        const kv = await getKv();
        // 1. Send current state immediately on connect (reconnect recovery)
        const entry = await kv.get<SlideshowState>(kvKey);
        if (entry.value !== null && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ action: 'sync', slide: entry.value.slide }));
        }
        // 2. Watch for KV changes and push to this client
        const stream = kv.watch<SlideshowState[]>([kvKey]);
        for await (const entries of stream) {
          if (socket.readyState !== WebSocket.OPEN) break;
          const state = entries[0].value;
          if (state !== null) {
            socket.send(JSON.stringify({ action: 'sync', slide: state.slide }));
          }
        }
      })();
    };

    socket.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        if (msg.action === 'goto') {
          const kv = await getKv();
          const state: SlideshowState = { slide: msg.slide, ts: Date.now() };
          await kv.set(kvKey, state);
          // kv.watch() on all isolates fires → broadcasts sync to all clients
        } else if (msg.action === 'ping') {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ action: 'pong' }));
          }
        }
      } catch { /* ignore malformed messages */ }
    };

    socket.onclose = () => { /* kv.watch() exits on next iteration */ };
    socket.onerror = () => socket.close();

    return response;
  },
});
