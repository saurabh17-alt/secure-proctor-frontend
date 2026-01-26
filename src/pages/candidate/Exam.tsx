import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  startMediaMonitor,
  checkMediaPermissions,
} from "../../proctoring/core/mediaMonitor";
import {
  initializeMediaStream,
  cleanupMediaStream,
} from "../../proctoring/core/streamManager";
import { MEDIA_PRESETS } from "../../proctoring/core/mediaConfig";

// Type for proctor events matching backend schema
type ProctorEventType =
  | "camera_status"
  | "mic_status"
  | "tab_blur"
  | "fullscreen_exit"
  | "stream_lost";

type SeverityLevel = "info" | "warning" | "critical";

interface ProctorEvent {
  examId: string;
  candidateId: string;
  type: ProctorEventType;
  payload: Record<string, any>;
  severity: SeverityLevel;
  timestamp: number;
}

export default function Exam() {
  const { examId } = useParams<{ examId: string }>();
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // TODO: Get candidateId from auth context or query params
  const candidateId = "candidate_" + Math.random().toString(36).substr(2, 9);

  // ⚙️ CONFIGURE REQUIREMENTS HERE
  // MEDIA_PRESETS.CAMERA_ONLY - Only camera required
  // MEDIA_PRESETS.AUDIO_ONLY - Only microphone required
  // MEDIA_PRESETS.BOTH - Both camera and microphone required
  const requirements = MEDIA_PRESETS.BOTH;

  // Send proctor event to backend API
  const sendProctorEvent = async (
    event: Omit<ProctorEvent, "examId" | "candidateId">,
  ) => {
    try {
      const response = await fetch("/api/proctor/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: examId || "default_exam",
          candidateId,
          ...event,
        }),
      });

      if (!response.ok) {
        console.error("Failed to send proctor event:", response.status);
      } else {
        const result = await response.json();
        console.log(
          "✅ Event sent:",
          event.type,
          "→ Event ID:",
          result.event_id,
        );
      }
    } catch (error) {
      console.error("❌ Error sending proctor event:", error);
    }
  };

  // Handle proctor events from media monitor
  const handleProctorEvent = (type: string, payload: any) => {
    console.log("PROCTOR EVENT:", type, payload);

    // Determine severity based on payload
    let severity: SeverityLevel = "info";
    if (payload.status === "off" || payload.lost || payload.exited) {
      severity = "critical";
    } else if (payload.blurred || payload.duration) {
      severity = "warning";
    }

    // Send to backend
    sendProctorEvent({
      type: type as ProctorEventType,
      payload,
      severity,
      timestamp: Date.now(),
    });
  };

  useEffect(() => {
    console.log("Exam started → proctoring ON");
    console.log("Requirements:", requirements);

    let stopMonitoring: (() => void) | null = null;

    // Initialize once and start monitoring
    const init = async () => {
      try {
        // Check permissions first (once, not in loop)
        const permissions = await checkMediaPermissions();
        console.log("Permissions:", permissions);

        // Initialize stream with requirements
        const { stream, errors } = await initializeMediaStream(requirements);

        // Build error message for REQUIRED devices only
        const errorMessages: string[] = [];
        if (requirements.camera && errors.camera) {
          errorMessages.push(`Camera: ${errors.camera}`);
        }
        if (requirements.microphone && errors.microphone) {
          errorMessages.push(`Microphone: ${errors.microphone}`);
        }

        if (!stream || errorMessages.length > 0) {
          setMediaError(
            errorMessages.join(" | ") ||
              "Failed to access required media devices",
          );
          setIsInitializing(false);
          return;
        }

        console.log("Media stream initialized successfully");
        setIsInitializing(false);

        // Start monitoring with event handler
        stopMonitoring = startMediaMonitor(handleProctorEvent);
      } catch (error) {
        console.error("Media initialization error:", error);
        setMediaError(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setIsInitializing(false);
      }
    };

    init();

    // Monitor tab visibility (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.warn("⚠️ Tab blur detected");
        sendProctorEvent({
          type: "tab_blur",
          payload: {
            blurred: true,
            timestamp: Date.now(),
          },
          severity: "warning",
          timestamp: Date.now(),
        });
      }
    };

    // Monitor fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        console.warn("⚠️ Fullscreen exit detected");
        sendProctorEvent({
          type: "fullscreen_exit",
          payload: {
            exited: true,
            reason: "user_action",
          },
          severity: "critical",
          timestamp: Date.now(),
        });
      }
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Cleanup: stop monitoring AND cleanup stream when exam truly ends
    return () => {
      console.log("Exam ended → stopping monitoring + cleaning stream");
      stopMonitoring?.();
      cleanupMediaStream();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [examId, candidateId]);

  if (isInitializing) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing camera and microphone...</p>
        </div>
      </div>
    );
  }

  if (mediaError) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Media Access Error
          </h2>
          <p className="text-red-600">{mediaError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Exam In Progress</h1>
      <p className="text-gray-600">Camera & microphone are being monitored.</p>

      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 font-medium">✓ Media monitoring active</p>
        <p className="text-sm text-green-600 mt-1">
          Stream initialized and monitoring without re-requesting permissions
        </p>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        (Open DevTools → Console to see proctoring events)
      </p>
    </div>
  );
}
