import { WebSocketManager } from './ws-manager.js';

/**
 * Singleton WebSocket manager shared across the application (HTTP server
 * bootstrap, repositories broadcasting events, and the status route).
 */
const wsManager = new WebSocketManager();

export function getWebSocketManager(): WebSocketManager {
  return wsManager;
}

export { WebSocketManager };
export * from './types.js';
