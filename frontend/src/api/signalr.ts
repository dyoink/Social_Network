import * as signalR from '@microsoft/signalr';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5204';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

// ─── Chat Hub ──────────────────────────────────────────────────────────────────

let chatConnection: signalR.HubConnection | null = null;

export function getChatConnection(): signalR.HubConnection {
  if (!chatConnection) {
    chatConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/chat`, {
        accessTokenFactory: () => getToken() ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return chatConnection;
}

// ─── Notification Hub ──────────────────────────────────────────────────────────

let notifConnection: signalR.HubConnection | null = null;

export function getNotificationConnection(): signalR.HubConnection {
  if (!notifConnection) {
    notifConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/notifications`, {
        accessTokenFactory: () => getToken() ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return notifConnection;
}

// ─── Poke Hub ──────────────────────────────────────────────────────────────────

let pokeConnection: signalR.HubConnection | null = null;

export function getPokeConnection(): signalR.HubConnection {
  if (!pokeConnection) {
    pokeConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/poke`, {
        accessTokenFactory: () => getToken() ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return pokeConnection;
}

// ─── Connection Lifecycle ──────────────────────────────────────────────────────

const reconnectedListeners = new Set<(connectionId?: string) => void>();

const setupLogging = (conn: signalR.HubConnection, name: string) => {
  conn.onreconnecting((err) => {
    console.warn(`[SignalR] ${name} reconnecting...`, err);
  });
  conn.onreconnected((connectionId) => {
    console.log(`[SignalR] ${name} reconnected. ID: ${connectionId}`);
    if (name === 'ChatHub') {
      reconnectedListeners.forEach(listener => listener(connectionId));
    }
  });
  conn.onclose((err) => {
    console.error(`[SignalR] ${name} connection closed.`, err);
  });
};

/**
 * Đăng ký listener cho sự kiện reconnected của ChatHub.
 * Trả về hàm để unregister.
 */
export function addChatReconnectedListener(listener: (connectionId?: string) => void): () => void {
  reconnectedListeners.add(listener);
  return () => {
    reconnectedListeners.delete(listener);
  };
}

/**
 * Khởi động tất cả SignalR connections. Gọi 1 lần sau khi user đăng nhập.
 */
export async function startAllConnections(): Promise<void> {
  const chat = getChatConnection();
  const notif = getNotificationConnection();
  const poke = getPokeConnection();

  setupLogging(chat, 'ChatHub');
  setupLogging(notif, 'NotificationHub');
  setupLogging(poke, 'PokeHub');

  const startIfNeeded = async (conn: signalR.HubConnection, name: string) => {
    if (conn.state === signalR.HubConnectionState.Disconnected) {
      try {
        await conn.start();
        console.log(`[SignalR] ${name} connected. ID: ${conn.connectionId}`);
      } catch (err) {
        console.error(`[SignalR] ${name} failed to connect:`, err);
        // Retry sau 5s nếu vẫn disconnected
        setTimeout(() => startIfNeeded(conn, name), 5000);
      }
    } else {
      console.log(`[SignalR] ${name} is already ${conn.state}`);
    }
  };

  await Promise.all([
    startIfNeeded(chat, 'ChatHub'),
    startIfNeeded(notif, 'NotificationHub'),
    startIfNeeded(poke, 'PokeHub'),
  ]);
}

/**
 * Dừng tất cả connections. Gọi khi user đăng xuất.
 */
export async function stopAllConnections(): Promise<void> {
  const stops: Promise<void>[] = [];
  if (chatConnection && chatConnection.state !== signalR.HubConnectionState.Disconnected) {
    stops.push(chatConnection.stop());
  }
  if (notifConnection && notifConnection.state !== signalR.HubConnectionState.Disconnected) {
    stops.push(notifConnection.stop());
  }
  if (pokeConnection && pokeConnection.state !== signalR.HubConnectionState.Disconnected) {
    stops.push(pokeConnection.stop());
  }
  await Promise.all(stops);
  chatConnection = null;
  notifConnection = null;
  pokeConnection = null;
}
