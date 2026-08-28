// ─── Real-time WebSocket & Cross-Tab Client for Tarepet LMS ──────────────────
// Handles cross-device, cross-tab, and multi-portal live bidirectional synchronization
// with seamless BroadcastChannel and Storage-event fallbacks.
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
const MAX_RECONNECT_ATTEMPTS = 2; // Stop spamming if backend WS is not provisioned (WSGI mode)
let reconnectTimer: any = null;
let pingInterval: any = null;
const eventListeners = new Set<WSEventListener>();
const statusListeners = new Set<StatusListener>();

// ── Native Cross-Tab Sync via BroadcastChannel ───────────────────────────────
const SYNC_CHANNEL_NAME = 'tarepet_live_sync';
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event?.data && typeof event.data === 'object') {
        dispatchIncomingEvent(event.data);
      }
    };
  } catch {
    broadcastChannel = null;
  }
}

// Storage event fallback for older browsers / isolated frames
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'tarepet_ws_sync_event' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed && parsed.type) {
          dispatchIncomingEvent(parsed);
        }
      } catch {
        // Ignore malformed storage payloads
      }
    }
  });
}

function setStatus(status: WSConnectionStatus) {
  if (currentStatus !== status) {
    currentStatus = status;
    statusListeners.forEach(fn => {
      try {
        fn(status);
      } catch (err) {
        console.debug('[WS] Status listener error:', err);
      }
    });
  }
}

function dispatchIncomingEvent(data: WSEventMessage) {
  if (!data || data.type === 'PONG') return;

  // Dispatch to all registered JS listeners
  eventListeners.forEach(listener => {
    try {
      listener(data);
    } catch (err) {
      console.debug('[WS] Listener error:', err);
    }
  });

  // Dispatch DOM event for reactive components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tarepet_ws_event', { detail: data }));
    if (
      data.type === 'CBT_STORE_MUTATED' ||
      data.type === 'ROSTER_UPDATED' ||
      data.type === 'BROADSHEET_SCORES_UPDATED' ||
      data.type === 'ATTENDANCE_MARKED'
    ) {
      window.dispatchEvent(new Event('cbt_store_updated'));
    }
    if (data.type === 'PAYMENTS_MUTATED') {
      window.dispatchEvent(new Event('tarepet_payments_updated'));
    }
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

function getWebSocketUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Explicit WS URL environment variable
  const explicitWsUrl = (import.meta as any).env?.VITE_WS_URL;
  if (explicitWsUrl) return explicitWsUrl;

  const loc = window.location;

  // 2. In local development with Django Channels on port 8000
  if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${loc.hostname}:8000/ws/live/`;
  }

  // 3. In production, only connect if VITE_WS_ENABLED is explicitly enabled
  const wsEnabled = (import.meta as any).env?.VITE_WS_ENABLED === 'true';
  if (wsEnabled) {
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${loc.host}/ws/live/`;
  }

  // When backend is running standard WSGI (Gunicorn), rely on high-speed BroadcastChannel
  return null;
}

export function initWebSocket(): () => void {
  if (typeof window === 'undefined') return () => {};

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return () => {};
  }

  const url = getWebSocketUrl();
  if (!url) {
    // Backend WS endpoint not configured; use instant BroadcastChannel mode
    setStatus('disconnected');
    return () => {};
  }

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    setStatus('disconnected');
    return () => {};
  }

  setStatus('connecting');

  try {
    socket = new WebSocket(url);

    socket.onopen = () => {
      setStatus('connected');
      reconnectAttempts = 0;

      // Heartbeat ping every 25 seconds
      clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
          } catch {
            // Heartbeat failed
          }
        }
      }, 25000);
    };

    socket.onmessage = (event) => {
      try {
        const data: WSEventMessage = JSON.parse(event.data);
        dispatchIncomingEvent(data);
      } catch {
        // Ignored unparsable frame
      }
    };

    socket.onerror = () => {
      // Handled in onclose
    };

    socket.onclose = () => {
      setStatus('disconnected');
      clearInterval(pingInterval);

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
        reconnectAttempts++;
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          initWebSocket();
        }, delay);
      }
    };
  } catch {
    setStatus('disconnected');
  }

  return () => {
    clearInterval(pingInterval);
    clearTimeout(reconnectTimer);
    if (socket) {
      try {
        socket.close();
      } catch {
        // Ignore close error
      }
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

  // 1. Send via WebSocket if connection is open
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(msg));
    } catch {
      // WS send fallback
    }
  }

  // 2. Broadcast cross-tab via BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(msg);
    } catch {
      // BroadcastChannel fallback
    }
  }

  // 3. Broadcast cross-tab via Storage event for older tabs
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_ws_sync_event', JSON.stringify({ ...msg, _t: Date.now() }));
    } catch {
      // LocalStorage fallback
    }
  }

  // 4. Dispatch local DOM & JS events immediately so current page reacts instantly
  dispatchIncomingEvent(msg);
}
