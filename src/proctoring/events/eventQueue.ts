/**
 * Event Queue (Offline Safe)
 *
 * Keeps events during:
 * - Socket down
 * - Network loss
 * - Page freeze
 */

import { type ProctorEvent } from "./types";

const MAX_QUEUE_SIZE = 500;
let queue: ProctorEvent[] = [];

/**
 * Add event to queue
 */
export function enqueueEvent(event: ProctorEvent): void {
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift(); // drop oldest (safe fallback)
    console.warn("⚠️ Event queue full, dropping oldest event");
  }
  queue.push(event);
  console.log(
    `📦 Queued event: ${event.type} [seq: ${event.sequence}] (${queue.length} in queue)`,
  );
}

/**
 * Get all queued events and clear queue
 */
export function dequeueAll(): ProctorEvent[] {
  const events = [...queue];
  queue = [];
  return events;
}

/**
 * Check if queue has events
 */
export function hasQueuedEvents(): boolean {
  return queue.length > 0;
}

/**
 * Get current queue size
 */
export function getQueueSize(): number {
  return queue.length;
}

/**
 * Clear all queued events (use with caution)
 */
export function clearQueue(): void {
  queue = [];
  console.log("🗑️ Event queue cleared");
}
