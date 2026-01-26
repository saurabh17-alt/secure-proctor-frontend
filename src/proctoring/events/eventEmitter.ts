/**
 * Event Emitter (Single Entry Point)
 *
 * ALL systems use this:
 * - Media monitor
 * - Tab check
 * - Fullscreen
 * - Network status
 *
 * Features:
 * - Throttling: Prevents event spam (max 1 per type per interval)
 * - Deduplication: UUID-based
 * - Queuing: Survives disconnections
 */

import { enqueueEvent } from "./eventQueue";
import { sendEvent } from "../socket/proctorSocket";
import { type ProctorEvent } from "./types";

let sequence = 0;

// Throttling configuration (milliseconds)
const THROTTLE_INTERVALS: Record<string, number> = {
  camera_status: 1000, // Max 1 per second
  mic_status: 1000, // Max 1 per second
  tab_blur: 2000, // Max 1 per 2 seconds (debounced)
  fullscreen_exit: 1000, // Max 1 per second
  stream_lost: 5000, // Max 1 per 5 seconds
};

// Track last emission time per event type
const lastEmitTime: Record<string, number> = {};

/**
 * Generate UUID v4
 * Simple implementation without external dependency
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if event should be throttled
 */
function shouldThrottle(type: string): boolean {
  const throttleMs = THROTTLE_INTERVALS[type] || 0;
  if (throttleMs === 0) return false;

  const lastTime = lastEmitTime[type];
  const now = Date.now();

  if (!lastTime || now - lastTime >= throttleMs) {
    lastEmitTime[type] = now;
    return false;
  }

  console.debug(`⏱️ Throttled: ${type} (${now - lastTime}ms since last)`);
  return true;
}

/**
 * Emit proctor event with throttling
 * This is the ONLY function to use for emitting events
 */
export function emitProctorEvent(
  sessionId: string,
  userId: string,
  type: string,
  payload: Record<string, any>,
): void {
  // Check throttling
  if (shouldThrottle(type)) {
    return; // Skip this event
  }

  const event: ProctorEvent = {
    event_id: generateUUID(),
    session_id: sessionId,
    user_id: userId,
    type,
    payload,
    timestamp: Date.now(),
    sequence: ++sequence,
  };

  // Always queue first (ensures no loss)
  enqueueEvent(event);

  // Try to send immediately if socket is open
  sendEvent(event);

  console.log(`🎯 Emitted: ${type} [seq: ${event.sequence}]`, payload);
}

/**
 * Reset sequence counter (use when starting new session)
 */
export function resetSequence(): void {
  sequence = 0;
  console.log("🔄 Sequence counter reset");
}

/**
 * Get current sequence number
 */
export function getCurrentSequence(): number {
  return sequence;
}
