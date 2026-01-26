import { useEffect, useState } from "react";
import {
  startMediaMonitor,
  checkMediaPermissions,
} from "../../proctoring/core/mediaMonitor";
import {
  initializeMediaStream,
  cleanupMediaStream,
} from "../../proctoring/core/streamManager";
import { MEDIA_PRESETS } from "../../proctoring/core/mediaConfig";

function emitEvent(type: string, data?: any) {
  console.log("PROCTOR EVENT:", type, data);
}

export default function Exam() {
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // ⚙️ CONFIGURE REQUIREMENTS HERE
  // MEDIA_PRESETS.CAMERA_ONLY - Only camera required
  // MEDIA_PRESETS.AUDIO_ONLY - Only microphone required
  // MEDIA_PRESETS.BOTH - Both camera and microphone required
  const requirements = MEDIA_PRESETS.BOTH;

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

        // Start monitoring (does NOT cleanup stream)
        stopMonitoring = startMediaMonitor(emitEvent);
      } catch (error) {
        console.error("Media initialization error:", error);
        setMediaError(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setIsInitializing(false);
      }
    };

    init();

    // Cleanup: stop monitoring AND cleanup stream when exam truly ends
    return () => {
      console.log("Exam ended → stopping monitoring + cleaning stream");
      stopMonitoring?.();
      cleanupMediaStream();
    };
  }, []);

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
