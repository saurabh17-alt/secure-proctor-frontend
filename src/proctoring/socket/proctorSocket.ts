/**
 * WebSocket with Auto-Reconnect
 *
 * Features:
 * - Automatic reconnection
 * - Batch event flushing on connect
 * - No duplicate sends
 */

import {
  dequeueAll,
  hasQueuedEvents,
  getQueueSize,
} from "../events/eventQueue";
import { type ProctorEvent } from "../events/types";

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let currentSessionId: string | null = null;
let currentUserId: string | null = null;
let isConnected = false;
let isManualDisconnect = false;

// Callbacks
let onStateChangeCallback:
  | ((state: "connected" | "disconnected" | "reconnecting") => void)
  | null = null;
let onMessageCallback: ((data: any) => void) | null = null;

/**
 * Connect to proctor WebSocket
 */
export function connectSocket(sessionId: string, userId: string): void {
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    console.log("⚠️ Already connected or connecting");
    return;
  }

  currentSessionId = sessionId;
  currentUserId = userId;
  isManualDisconnect = false;

  // Determine WebSocket URL
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname;
  const port = import.meta.env.DEV ? "8000" : window.location.port;
  const url = `${protocol}//${host}:${port}/ws/proctor/${sessionId}/${userId}`;

  console.log(`🔌 Connecting to: ${url}`);

  try {
    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log("🟢 Proctor socket connected");
      isConnected = true;
      onStateChangeCallback?.("connected");

      // Flush queued events
      if (hasQueuedEvents()) {
        const events = dequeueAll();
        console.log(`📤 Flushing ${events.length} queued events...`);

        socket?.send(
          JSON.stringify({
            type: "BATCH_EVENTS",
            events,
          }),
        );

        console.log(`✅ Batch sent: ${events.length} events`);
      }
    };

    socket.onclose = () => {
      console.warn("🔴 Socket disconnected");
      isConnected = false;
      socket = null;
      onStateChangeCallback?.("disconnected");

      // Only reconnect if not manual disconnect
      if (!isManualDisconnect) {
        scheduleReconnect(sessionId, userId);
      }
    };

    socket.onerror = (error) => {
      console.error("❌ Socket error:", error);
      socket?.close();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageCallback?.(data);
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };
  } catch (error) {
    console.error("❌ Failed to create WebSocket:", error);
    scheduleReconnect(sessionId, userId);
  }
}

/**
 * Schedule reconnection
 */
function scheduleReconnect(sessionId: string, userId: string): void {
  if (reconnectTimer || isManualDisconnect) return;

  onStateChangeCallback?.("reconnecting");

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    console.log("🔄 Attempting to reconnect...");
    connectSocket(sessionId, userId);
  }, 2000);
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  isManualDisconnect = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    socket.close(1000, "Manual disconnect");
    socket = null;
  }

  isConnected = false;
  currentSessionId = null;
  currentUserId = null;
  onStateChangeCallback?.("disconnected");
  console.log("🔌 Socket disconnected");
}

/**
 * Send event (queues if socket not ready)
 */
export function sendEvent(event: ProctorEvent): void {
  if (socket?.readyState === WebSocket.OPEN) {
    try {
      socket.send(
        JSON.stringify({
          type: "EVENT",
          event,
        }),
      );
      console.log(`✅ Sent: ${event.type} [seq: ${event.sequence}]`);
    } catch (error) {
      console.error("❌ Failed to send event:", error);
    }
  } else {
    console.log(`📦 Socket not ready, event queued: ${event.type}`);
  }
}

/**
 * Get connection status
 */
export function isSocketConnected(): boolean {
  return isConnected && socket?.readyState === WebSocket.OPEN;
}

/**
 * Get current session ID
 */
export function getCurrentSession(): string | null {
  return currentSessionId;
}

/**
 * Get queued event count
 */
export function getQueuedCount(): number {
  return getQueueSize();
}

/**
 * Set state change callback
 */
export function onStateChange(
  callback: (state: "connected" | "disconnected" | "reconnecting") => void,
): void {
  onStateChangeCallback = callback;
}

/**
 * Set message callback
 */
export function onMessage(callback: (data: any) => void): void {
  onMessageCallback = callback;
}
