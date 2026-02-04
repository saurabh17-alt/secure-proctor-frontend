/**
 * AI Video Processing Hook - Simplified
 *
 * Detects ONLY:
 * - No face detected
 * - Multiple faces detected
 *
 * Uses MediaPipe FaceDetector locally in browser
 * Sends image ONLY when violation occurs (not every second)
 * Starts 60-second cooling period after each violation
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useViolationManager } from "./useViolationManager";
import type { ViolationAlert } from "./useViolationManager";

interface AIProcessingConfig {
  examId: string;
  candidateId: string;
  enabled: boolean;
  checkInterval?: number; // How often to check (default: 1000ms = 1 second)
  onViolationDetected?: (alert: ViolationAlert) => void;
}

interface FaceDetectionResult {
  faceCount: number;
  detected: boolean;
}

export function useAIProcessing(config: AIProcessingConfig) {
  const [detectionReady, setDetectionReady] = useState(false);
  const [lastFaceCount, setLastFaceCount] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const faceDetectorRef = useRef<any>(null);

  // Use violation manager for cooling periods
  const {
    alerts: violationAlerts,
    coolingPeriod,
    addViolation,
    isInCoolingPeriod,
  } = useViolationManager();

  const checkInterval = config.checkInterval || 1000; // 1 second

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      canvasRef.current = canvas;
    }
  }, []);

  // Load MediaPipe FaceDetector
  useEffect(() => {
    if (!config.enabled) return;

    const loadFaceDetector = async () => {
      try {
        console.log("🔄 Loading MediaPipe FaceDetector...");

        // Try to use local files first (for offline/blocked CDN scenarios)
        const USE_LOCAL_FILES = true; // Set to false to use CDN

        let vision: any;
        let wasmPath: string;
        let modelPath: string;

        if (USE_LOCAL_FILES) {
          console.log("📦 Loading from local files...");

          // Load via script tag since Vite doesn't allow imports from /public
          const script = document.createElement("script");
          script.type = "module";
          script.textContent = `
            import * as mediapipeVision from "/mediapipe/vision_bundle.mjs";
            window.MediaPipeVision = mediapipeVision;
          `;
          document.head.appendChild(script);

          // Wait for script to load
          await new Promise((resolve) => {
            const checkLoaded = setInterval(() => {
              if ((window as any).MediaPipeVision) {
                clearInterval(checkLoaded);
                resolve(true);
              }
            }, 100);
          });

          vision = (window as any).MediaPipeVision;
          wasmPath = "/mediapipe/wasm";
          modelPath = "/mediapipe/models/blaze_face_short_range.tflite";
        } else {
          console.log("📦 Loading from CDN...");
          // @ts-ignore
          vision =
            await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest");
          wasmPath =
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
          modelPath =
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
        }

        console.log("📦 MediaPipe module loaded:", vision);

        if (!vision.FaceDetector || !vision.FilesetResolver) {
          throw new Error(
            "FaceDetector or FilesetResolver not found in MediaPipe module",
          );
        }

        console.log("🔧 Creating FilesetResolver...");
        const filesetResolver =
          await vision.FilesetResolver.forVisionTasks(wasmPath);

        console.log("🔧 Creating FaceDetector...");
        const faceDetector = await vision.FaceDetector.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath: modelPath,
            },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.5,
          },
        );

        faceDetectorRef.current = faceDetector;
        setDetectionReady(true);
        console.log("✅ MediaPipe FaceDetector loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load FaceDetector:", error);
        console.error(
          "Error details:",
          error instanceof Error ? error.message : error,
        );
        // Set detection as not ready
        setDetectionReady(false);
      }
    };

    loadFaceDetector();
  }, [config.enabled]);

  // Capture current frame as base64 image
  const captureCurrentFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return null;
    }

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Return as base64 JPEG
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  // Detect faces in current frame
  const detectFaces = useCallback((): FaceDetectionResult => {
    if (!videoRef.current || !faceDetectorRef.current) {
      console.debug("⏸️ Detection skipped: video or detector not ready");
      return { faceCount: 0, detected: false };
    }

    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.debug("⏸️ Detection skipped: video not ready");
      return { faceCount: 0, detected: false };
    }

    try {
      // Detect faces
      const detections = faceDetectorRef.current.detectForVideo(
        video,
        Date.now(),
      );
      const faceCount = detections.detections?.length || 0;

      console.log(`👤 Detected ${faceCount} face(s)`);

      return {
        faceCount,
        detected: true,
      };
    } catch (error) {
      console.error("❌ Face detection error:", error);
      return { faceCount: 0, detected: false };
    }
  }, []);

  // Send violation to backend
  const sendViolationToBackend = useCallback(
    async (alert: ViolationAlert) => {
      if (!alert.image) return;

      try {
        const response = await fetch(
          `http://localhost:8000/api/violations/save`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              exam_id: config.examId,
              candidate_id: config.candidateId,
              violation_type: alert.type,
              message: alert.message,
              timestamp: alert.timestamp,
              image: alert.image,
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Violation saved:", data);
        } else {
          console.error("❌ Failed to save violation:", response.status);
        }
      } catch (error) {
        console.error("❌ Error sending violation to backend:", error);
      }
    },
    [config.examId, config.candidateId],
  );

  // Check for violations
  const checkForViolations = useCallback(() => {
    console.debug("🔍 checkForViolations called");

    // Skip if in cooling period
    if (isInCoolingPeriod) {
      console.debug("⏸️ Skipped: In cooling period");
      return;
    }

    // Skip if detection not ready
    if (!detectionReady) {
      console.debug("⏸️ Skipped: Detection not ready");
      return;
    }

    // Detect faces
    console.debug("🎯 About to call detectFaces()");
    const result = detectFaces();
    console.debug("🎯 detectFaces() result:", result);

    if (!result.detected) {
      console.debug("⏸️ Skipped: Face detection failed");
      return;
    }

    setLastFaceCount(result.faceCount);
    console.debug("📊 Face count:", result.faceCount);

    // Check for violations
    console.debug("📸 About to capture frame");
    const capturedImage = captureCurrentFrame();
    console.debug("📸 Captured image:", capturedImage ? "SUCCESS" : "FAILED");

    // NO FACE DETECTED
    if (result.faceCount === 0) {
      console.log("🚨 NO FACE DETECTED - About to add violation");
      const alert = addViolation(
        "no_face",
        "⚠️ No face detected in frame",
        capturedImage || undefined,
      );
      config.onViolationDetected?.(alert);
      console.log("📤 Sending NO FACE violation to backend...");
      sendViolationToBackend(alert);
      console.log("✅ NO FACE violation sent successfully");
    }
    // MULTIPLE FACES DETECTED
    else if (result.faceCount > 1) {
      console.log(
        `🚨 MULTIPLE FACES DETECTED (${result.faceCount}) - About to add violation`,
      );
      const alert = addViolation(
        "multiple_faces",
        `⚠️ Multiple faces detected (${result.faceCount} faces)`,
        capturedImage || undefined,
      );
      config.onViolationDetected?.(alert);
      console.log("📤 Sending MULTIPLE FACES violation to backend...");
      sendViolationToBackend(alert);
      console.log(
        `✅ MULTIPLE FACES violation sent successfully (${result.faceCount} faces)`,
      );
    }
  }, [
    isInCoolingPeriod,
    detectionReady,
    detectFaces,
    captureCurrentFrame,
    addViolation,
    sendViolationToBackend,
    config,
  ]);

  // Start/stop checking
  useEffect(() => {
    if (!config.enabled || !detectionReady) {
      return;
    }

    console.log(
      `🎯 Starting face detection (checking every ${checkInterval}ms)`,
    );

    // Start interval
    intervalRef.current = window.setInterval(checkForViolations, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [config.enabled, detectionReady, checkInterval, checkForViolations]);

  // Set video element reference
  const setVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    if (video) {
      console.log("📹 Video element connected for AI processing");
      console.log("📹 Video ready state:", video.readyState);
      console.log(
        "📹 Video dimensions:",
        video.videoWidth,
        "x",
        video.videoHeight,
      );
    }
  }, []);

  return {
    connected: detectionReady,
    lastFaceCount,
    violationAlerts,
    coolingPeriod,
    isInCoolingPeriod,
    setVideoElement,
  };
}
