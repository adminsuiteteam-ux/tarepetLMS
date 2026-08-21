// ─── Real-time WebSocket Client for Tarepet LMS ──────────────────────────────
// Handles cross-device and multi-portal live bidirectional synchronization
// ─────────────────────────────────────────────────────────────────────────────

export type WSConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface WSEventMessage {
  type:
    | 'CONNECTION_ESTABLISHED'
    | 'PING'
    | 'PONG'
    | 'CBT_STORE_MUTATED'
    | 'NOTIFICATION_RECEIVED'
    | 'ACTIVITY_LOGGED'
    | 'PAYMENTS_MUTATED'
    | 'ROSTER_UPDATED'
    | 'BROADSHEET_SCORES_UPDATED'
    | 'ATTENDANCE_MARKED'
    | 'AVATAR_UPDATED'
    | 'PROFILE_UPDATED'
    | string;
  payload?: any;
  timestamp?: number | string;
  sender?: string;
}

type WSEventListener = (event: WSEventMessage) => void;
type StatusListener = (status: WSConnectionStatus) => void;

let socket: WebSocket | null = null;
let currentStatus: WSConnectionStatus = 'disconnected';
let reconnectAttempts = 0;
let reconnectTimer: any = null;
let pingInterval: any = null;
const eventListeners = new Set<WSEventListener>();
const statusListeners = new Set<StatusListener>();

function setStatus(status: WSConnectionStatus) {
  if (currentStatus !== status) {
    currentStatus = status;
    statusListeners.forEach(fn => fn(status));
  }
}

export function getWebSocketStatus(): WSConnectionStatus {
  return currentStatus;
}

export function subscribeToWebSocketStatus(listener: StatusListener): () => void {
  statusListeners.add(listener);
  listener(currentStatus);
  return () => {
    statusListeners.delete(listener);
  };
}

export function subscribeToWebSocketEvents(listener: WSEventListener): () => void {
  eventListeners.add(listener);
  return () => {
    eventListeners.delete(listener);
  };
}

function getWebSocketUrl(): string {
  if (typeof window === 'undefined') return '';

  const explicitWsUrl = (import.meta as any).env?.VITE_WS_URL;
  if (explicitWsUrl) return explicitWsUrl;

  const apiUrl = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL;
  if (apiUrl && apiUrl.startsWith('http')) {
    const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
    const hostAndPath = apiUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/?$/, '');
    return `${wsProtocol}//${hostAndPath}/ws/live/`;
  }

  const loc = window.location;
  const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';

  // In local development, if running on Vite dev server (port 5173 / 3000), target backend port 8000
  if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
    return `${protocol}//${loc.hostname}:8000/ws/live/`;
  }

  return `${protocol}//${loc.host}/ws/live/`;
}

export function initWebSocket(): () => void {
  if (typeof window === 'undefined') return () => {};

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return () => {};
  }

  const url = getWebSocketUrl();
  if (!url) return () => {};

  setStatus('connecting');

  try {
    socket = new WebSocket(url);

    socket.onopen = () => {
      setStatus('connected');
      reconnectAttempts = 0;

      // Start ping heartbeat every 25 seconds
      clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
        }
      }, 25000);
    };

    socket.onmessage = (event) => {
      try {
        const data: WSEventMessage = JSON.parse(event.data);

        if (data.type === 'PONG') return;

        // Dispatch to all registered listeners
        eventListeners.forEach(listener => {
          try {
            listener(data);
          } catch (err) {
            console.debug('[WebSocket] Listener error:', err);
          }
        });

        // Dispatch DOM event for legacy / universal listeners
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tarepet_ws_event', { detail: data }));
          if (data.type === 'CBT_STORE_MUTATED' || data.type === 'ROSTER_UPDATED' || data.type === 'BROADSHEET_SCORES_UPDATED' || data.type === 'ATTENDANCE_MARKED') {
            window.dispatchEvent(new Event('cbt_store_updated'));
          }
          if (data.type === 'PAYMENTS_MUTATED') {
            window.dispatchEvent(new Event('tarepet_payments_updated'));
          }
        }
      } catch (err) {
        // Ignored unparsable frame
      }
    };

    socket.onerror = () => {
      // Handled in onclose
    };

    socket.onclose = () => {
      setStatus('disconnected');
      clearInterval(pingInterval);

      // Reconnect with exponential backoff (1s, 2s, 4s, 8s, max 15s)
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 15000);
      reconnectAttempts++;
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        initWebSocket();
      }, delay);
    };
  } catch (err) {
    setStatus('disconnected');
  }

  return () => {
    clearInterval(pingInterval);
    clearTimeout(reconnectTimer);
    if (socket) {
      socket.close();
      socket = null;
    }
  };
}

export function sendWebSocketEvent(type: WSEventMessage['type'], payload?: any) {
  const msg: WSEventMessage = {
    type,
    payload,
    timestamp: Date.now(),
  };

  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(msg));
    } catch (e) {
      // Fallback
    }
  }

  // Also dispatch local event immediately so current window reacts instantly
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tarepet_ws_event', { detail: msg }));
  }
}
