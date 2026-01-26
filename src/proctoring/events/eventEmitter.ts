/**
 * Event Emitter (Single Entry Point)
 *
 * ALL systems use this:
 * - Media monitor
 * - Tab check
 * - Fullscreen
 * - Network status
 */

import { enqueueEvent } from "./eventQueue";
import { sendEvent } from "../socket/proctorSocket";
import { type ProctorEvent } from "./types";

let sequence = 0;

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
 * Emit proctor event
 * This is the ONLY function to use for emitting events
 */
export function emitProctorEvent(
  sessionId: string,
  userId: string,
  type: string,
  payload: Record<string, any>,
): void {
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
