/**
 * AI Video Processing Hook
 *
 * Captures video frames and sends to backend AI processing pipeline:
 * - Face detection (no face, multiple faces)
 * - Head pose estimation (looking away)
 * - Real-time violation detection
 */

import { useEffect, useRef, useState, useCallback } from "react";

interface AIProcessingConfig {
  examId: string;
  candidateId: string;
  enabled: boolean;
  fps?: number; // Frames per second to send (default: 2)
}

interface AIResult {
  processed: boolean;
  face_signal?: string;
  pose_signal?: string;
  object_signals?: string[];
  debug?: {
    face_count: number;
    yaw: number;
    pitch: number;
    pose_severity: string;
    forbidden_objects: number;
  };
}

interface AIViolation {
  type: string;
  level: "warning" | "critical";
  duration: number;
  confidence: number;
  timestamp: number;
}

export function useAIProcessing(config: AIProcessingConfig) {
  const [connected, setConnected] = useState(false);
  const [lastResult, setLastResult] = useState<AIResult | null>(null);
  const [violations, setViolations] = useState<AIViolation[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  const fps = config.fps || 2;
  const frameInterval = 1000 / fps;

  // Initialize canvas for frame capture
  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      canvasRef.current = canvas;
    }
  }, []);

  // Capture and send frame
  const captureFrame = useCallback(() => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to JPEG base64
    const frameData = canvas.toDataURL("image/jpeg", 0.8);

    // Send to backend
    try {
      wsRef.current.send(
        JSON.stringify({
          type: "FRAME",
          data: frameData,
          timestamp: Date.now(),
        }),
      );
    } catch (err) {
      console.error("[AI] Failed to send frame:", err);
    }
  }, []);

  // Connect to AI WebSocket
  const connectAIWebSocket = useCallback(() => {
    if (!config.enabled) return;

    const wsUrl = `ws://localhost:8000/ws/proctor/ai/${config.examId}/${config.candidateId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[AI] WebSocket connected");
      setConnected(true);

      // Start frame capture loop
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = window.setInterval(captureFrame, frameInterval);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "ai_result") {
          setLastResult({
            processed: message.processed,
            face_signal: message.face_signal,
            pose_signal: message.pose_signal,
            object_signals: message.object_signals || [],
            debug: message.debug,
          });
        } else if (message.type === "ai_violation") {
          const violation: AIViolation = message.violation;
          setViolations((prev) => [...prev, violation]);
          console.warn("[AI] Violation detected:", violation);
        } else if (message.type === "ai_connected") {
          console.log("[AI] Backend confirmed connection:", message);
        }
      } catch (err) {
        console.error("[AI] Failed to parse message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("[AI] WebSocket error:", error);
      setConnected(false);
    };

    ws.onclose = () => {
      console.log("[AI] WebSocket closed");
      setConnected(false);

      // Stop frame capture
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Reconnect after 2 seconds
      setTimeout(() => {
        if (config.enabled) {
          connectAIWebSocket();
        }
      }, 2000);
    };

    wsRef.current = ws;
  }, [
    config.enabled,
    config.examId,
    config.candidateId,
    captureFrame,
    frameInterval,
  ]);

  // Initialize AI processing
  useEffect(() => {
    if (config.enabled) {
      connectAIWebSocket();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [config.enabled, connectAIWebSocket]);

  // Set video element reference
  const setVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
  }, []);

  return {
    connected,
    lastResult,
    violations,
    setVideoElement,
  };
}
