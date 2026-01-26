/**
 * Canonical Event Contract
 * Used everywhere: frontend → backend → DB
 */

export type ProctorEvent = {
  event_id: string; // UUID (deduplication)
  session_id: string; // Exam session
  user_id: string; // Candidate ID
  type: string; // camera_status, tab_blur, fullscreen_exit
  payload: Record<string, any>;
  timestamp: number; // Date.now()
  sequence: number; // Monotonic per session
};

export type ProctorEventType =
  | "camera_status"
  | "mic_status"
  | "tab_blur"
  | "fullscreen_exit"
  | "stream_lost"
  | "network_interruption";
