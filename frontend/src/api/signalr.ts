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

/**
 * Khởi động tất cả SignalR connections. Gọi 1 lần sau khi user đăng nhập.
 */
export async function startAllConnections(): Promise<void> {
  const chat = getChatConnection();
  const notif = getNotificationConnection();
  const poke = getPokeConnection();

  const startIfNeeded = async (conn: signalR.HubConnection, name: string) => {
    if (conn.state === signalR.HubConnectionState.Disconnected) {
      try {
        await conn.start();
        console.log(`[SignalR] ${name} connected`);
      } catch (err) {
        console.error(`[SignalR] ${name} failed to connect:`, err);
        // Retry sau 5s
        setTimeout(() => startIfNeeded(conn, name), 5000);
      }
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
