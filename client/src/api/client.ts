const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('talenthub_token');
}

export function setToken(token: string): void {
  localStorage.setItem('talenthub_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('talenthub_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.reason || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// WebSocket real-time subscription
type RealtimeCallback = (event: { type: string; payload: any; timestamp: string }) => void;
const listeners: Set<RealtimeCallback> = new Set();
let ws: WebSocket | null = null;
let reconnectTimer: any = null;

export function initRealtime() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  try {
    ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        listeners.forEach((fn) => fn(parsed));
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    ws.onclose = () => {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(initRealtime, 3000);
    };

    ws.onerror = (e) => {
      console.warn('WebSocket error, retrying in 3s...', e);
    };
  } catch (err) {
    console.warn('WebSocket init error:', err);
  }
}

export function subscribeRealtime(callback: RealtimeCallback): () => void {
  listeners.add(callback);
  initRealtime();
  return () => {
    listeners.delete(callback);
  };
}

// Offer letter helpers
export async function downloadOfferLetterFile(storageKey: string, fileName?: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/offers/document/${encodeURIComponent(storageKey)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to download offer letter: ${res.statusText} ${errText}`);
  }

  const blob = await res.blob();
  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || storageKey;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 30000);
}

export async function getOfferLetterBlobUrl(storageKey: string): Promise<string> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/offers/document/${encodeURIComponent(storageKey)}?inline=true`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to view offer letter: ${res.statusText} ${errText}`);
  }

  const blob = await res.blob();
  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  return window.URL.createObjectURL(pdfBlob);
}

