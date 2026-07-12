import { apiClient } from './client';

export interface WsCapability {
  available: boolean;
  transport: 'socket.io' | 'websocket' | 'none';
}

/**
 * Probe whether the backend actually serves real-time connections on this
 * deployment. The Socket.IO server is attached whenever the HTTP server starts
 * (both the long-running Node host and Vercel), so this returns `available: true`
 * with `transport: 'socket.io'` when real-time is supported.
 */
export async function getWsCapability(): Promise<WsCapability> {
  try {
    const res = await apiClient.get<WsCapability>('/ws');
    return res.data ?? { available: false, transport: 'none' };
  } catch {
    // If the probe itself fails, assume WebSockets are unsupported so we never
    // hammer the unsupported endpoint with upgrade attempts.
    return { available: false, transport: 'none' };
  }
}
