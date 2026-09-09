// ─── Real-time WebSocket & Cross-Tab Client for Tarepet LMS ──────────────────
// Handles cross-device, cross-tab, and multi-portal live bidirectional synchronization
// with seamless BroadcastChannel and Storage-event fallbacks.
// ─────────────────────────────────────────────────────────────────────────────

import { getAccessToken } from './api-auth';

// Unique identifier per client browser session to filter self-originated reflection echoes
const CLIENT_INSTANCE_ID = 'cli_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36);

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
  origin_id?: string;
}

type WSEventListener = (event: WSEventMessage) => void;
type StatusListener = (status: WSConnectionStatus) => void;

let socket: WebSocket | null = null;
let currentStatus: WSConnectionStatus = 'disconnected';
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50; // Continuously reconnect across mobile/desktop sessions
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

function dispatchIncomingEvent(data: WSEventMessage, isLocalOrigin = false) {
  if (!data || data.type === 'PONG') return;

  // Prevent duplicate execution if this tab already dispatched this event locally
  if (!isLocalOrigin && data.origin_id && data.origin_id === CLIENT_INSTANCE_ID) {
    return;
  }

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

  const token = getAccessToken();
  let baseWsUrl = '';

  // 1. Explicit WS URL environment variable
  const explicitWsUrl = (import.meta as any).env?.VITE_WS_URL;
  if (explicitWsUrl) {
    baseWsUrl = explicitWsUrl;
  } else {
    const loc = window.location;

    // 2. Local development with Django Channels on port 8000
    if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
      const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      baseWsUrl = `${protocol}//${loc.hostname}:8000/ws/live/`;
    } else {
      // 3. In production: dynamically resolve to backend ASGI Daphne server
      const rawApiUrl = 
        (import.meta as any).env?.VITE_API_BASE_URL ||
        (import.meta as any).env?.VITE_API_URL || 
        'https://tarepet-backend-4iw6.onrender.com/api/v1';

      try {
        const urlObj = new URL(rawApiUrl);
        const wsProto = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
        baseWsUrl = `${wsProto}//${urlObj.host}/ws/live/`;
      } catch {
        baseWsUrl = 'wss://tarepet-backend-4iw6.onrender.com/ws/live/';
      }
    }
  }

  if (token) {
    try {
      const urlObj = new URL(baseWsUrl);
      urlObj.searchParams.set('token', token);
      return urlObj.toString();
    } catch {
      return `${baseWsUrl}?token=${token}`;
    }
  }

  return baseWsUrl;
}

export function initWebSocket(): () => void {
  if (typeof window === 'undefined') return () => {};

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return () => {};
  }

  const token = getAccessToken();
  if (!token) {
    // Unauthenticated: do not attempt unauthenticated WebSocket connection
    setStatus('disconnected');
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
        // TAR-027: Exponential backoff with full randomized jitter to prevent thundering herd
        const baseDelay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 30000);
        const jitter = Math.random() * (baseDelay * 0.5);
        const delay = Math.round(baseDelay * 0.5 + jitter);
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
  // TAR-034: Stamp origin_id to prevent feedback loops
  const msg: WSEventMessage = {
    type,
    payload,
    timestamp: Date.now(),
    origin_id: CLIENT_INSTANCE_ID,
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
  dispatchIncomingEvent(msg, true);
}

// Auto-wake on mobile screen unlock or network reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    reconnectAttempts = 0;
    initWebSocket();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        reconnectAttempts = 0;
        initWebSocket();
      }
    }
  });
}

