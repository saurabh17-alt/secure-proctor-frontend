import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  startMediaMonitor,
  checkMediaPermissions,
} from "../../proctoring/core/mediaMonitor";
import {
  initializeMediaStream,
  cleanupMediaStream,
} from "../../proctoring/core/streamManager";
import { MEDIA_PRESETS } from "../../proctoring/core/mediaConfig";
import {
  emitProctorEvent,
  resetSequence,
} from "../../proctoring/events/eventEmitter";
import {
  connectSocket,
  disconnectSocket,
  onStateChange,
  onMessage,
} from "../../proctoring/socket/proctorSocket";
import { getQueueSize } from "../../proctoring/events/eventQueue";
import { useAIProcessing } from "../../hooks/useAIProcessing";

export default function Exam() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionState, setConnectionState] =
    useState<string>("disconnected");
  const [queuedEvents, setQueuedEvents] = useState<number>(0);
  const [isTestActive, setIsTestActive] = useState(true);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cleanupCompleteRef = useRef(false);

  // Generate stable candidateId that doesn't change on re-render
  const candidateId = useMemo(
    () => "candidate_" + Math.random().toString(36).substr(2, 9),
    [],
  );
  const sessionId = examId || "default_exam";

  // ⚙️ AI Processing Hook
  const aiProcessing = useAIProcessing({
    examId: sessionId,
    candidateId,
    enabled: isTestActive && !isShuttingDown, // Disable when shutting down
  });

  // ⚙️ CONFIGURE REQUIREMENTS HERE
  // MEDIA_PRESETS.CAMERA_ONLY - Only camera required
  // MEDIA_PRESETS.AUDIO_ONLY - Only microphone required
  // MEDIA_PRESETS.BOTH - Both camera and microphone required
  const requirements = MEDIA_PRESETS.BOTH;

  // Handle proctor events from media monitor
  const handleProctorEvent = (type: string, payload: any) => {
    // Don't emit events if test is not active or shutting down
    if (!isTestActive || isShuttingDown) {
      return; // Silent skip during shutdown
    }

    console.log("📡 PROCTOR EVENT:", type, payload);

    // Emit event using the new system
    emitProctorEvent(sessionId, candidateId, type, payload);
  };

  // Stop test handler with complete cleanup
  const handleStopTest = () => {
    if (isShuttingDown || cleanupCompleteRef.current) {
      return;
    }

    setIsShuttingDown(true);

    // Emit test end event FIRST (while everything still works)
    try {
      emitProctorEvent(sessionId, candidateId, "test_ended", {
        reason: "user_action",
        timestamp: Date.now(),
        queued_events: queuedEvents,
      });
    } catch (error) {
      // Silent error during shutdown
    }

    // Immediately cleanup media to stop camera/mic
    cleanupMediaStream();

    // Disconnect socket immediately to prevent reconnection
    disconnectSocket();

    // Mark as inactive (triggers useEffect cleanups)
    setIsTestActive(false);

    // Navigate after a brief delay
    setTimeout(() => {
      cleanupCompleteRef.current = true;
      navigate("/join-exam");
    }, 500);
  };

  // WebSocket connection setup
  useEffect(() => {
    if (!examId || !isTestActive) return;

    console.log("🚀 ===== STARTING PROCTORING SESSION =====");
    console.log(`📋 Exam ID: ${examId}`);
    console.log(`👤 Candidate ID: ${candidateId}`);
    console.log(`🕐 Started at: ${new Date().toLocaleTimeString()}`);

    // Reset sequence for new session
    resetSequence();

    // Set up callbacks
    onStateChange((state) => {
      setConnectionState(state);
      console.log(`📡 WebSocket connection state changed: ${state}`);
    });

    onMessage((data) => {
      console.log("📨 Message from server:", data);
    });

    // Connect to WebSocket
    console.log("🔌 Connecting to WebSocket...");
    connectSocket(sessionId, candidateId);

    // Update queue count periodically
    const queueInterval = setInterval(() => {
      setQueuedEvents(getQueueSize());
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (isTestActive && !isShuttingDown) {
        clearInterval(queueInterval);
        disconnectSocket();
      }
    };
  }, [examId, sessionId, candidateId, isTestActive, isShuttingDown]);

  // Media monitoring setup
  useEffect(() => {
    if (!isTestActive || isShuttingDown) return;

    console.log("📹 ===== INITIALIZING MEDIA =====");
    console.log("📋 Requirements:", requirements);

    let stopMonitoring: (() => void) | null = null;

    // Initialize once and start monitoring
    const init = async () => {
      try {
        console.log("🔍 Checking media permissions...");
        // Check permissions first (once, not in loop)
        const permissions = await checkMediaPermissions();
        console.log("✅ Permissions status:", permissions);

        console.log("🎥 Initializing media stream...");
        // Initialize stream with requirements
        const { stream, errors } = await initializeMediaStream(requirements);

        // Build error message for REQUIRED devices only
        const errorMessages: string[] = [];
        if (requirements.camera && errors.camera) {
          errorMessages.push(`Camera: ${errors.camera}`);
          console.error("❌ Camera error:", errors.camera);
        }
        if (requirements.microphone && errors.microphone) {
          errorMessages.push(`Microphone: ${errors.microphone}`);
          console.error("❌ Microphone error:", errors.microphone);
        }

        if (!stream || errorMessages.length > 0) {
          setMediaError(
            errorMessages.join(" | ") ||
              "Failed to access required media devices",
          );
          setIsInitializing(false);
          return;
        }

        console.log("✅ Media stream initialized successfully");
        console.log("✅ Media stream initialized successfully");

        // Connect video element to AI processing
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current
            .play()
            .catch((err) => console.error("❌ Video play error:", err));
          aiProcessing.setVideoElement(videoRef.current);
          console.log("✅ Video element connected to AI processing");
        }

        setIsInitializing(false);

        console.log("👁️ Starting media monitor...");
        // Start monitoring with event handler
        stopMonitoring = startMediaMonitor(handleProctorEvent);
        console.log("✅ Media monitoring active");
      } catch (error) {
        console.error("❌ Media initialization error:", error);
        setMediaError(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setIsInitializing(false);
      }
    };

    init();

    // Monitor tab visibility (tab switching) - with debouncing
    let tabBlurTimer: ReturnType<typeof setTimeout> | null = null;
    const handleVisibilityChange = () => {
      if (isShuttingDown) return; // Ignore during shutdown

      if (document.hidden) {
        // Debounce: wait 500ms before emitting
        // Prevents spam from rapid tab switching
        if (tabBlurTimer) clearTimeout(tabBlurTimer);
        tabBlurTimer = setTimeout(() => {
          if (isShuttingDown) return; // Double-check before emitting
          console.warn("⚠️ Tab blur detected (debounced)");
          emitProctorEvent(sessionId, candidateId, "tab_blur", {
            blurred: true,
            timestamp: Date.now(),
          });
        }, 500);
      } else {
        // Tab returned - cancel pending event
        if (tabBlurTimer) {
          clearTimeout(tabBlurTimer);
          tabBlurTimer = null;
        }
      }
    };

    // Monitor fullscreen exit
    const handleFullscreenChange = () => {
      if (isShuttingDown) return; // Ignore during shutdown

      if (!document.fullscreenElement) {
        console.warn("⚠️ Fullscreen exit detected");
        emitProctorEvent(sessionId, candidateId, "fullscreen_exit", {
          exited: true,
          reason: "user_action",
        });
      }
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Cleanup: stop monitoring AND cleanup stream when test ends
    return () => {
      // Clear any pending timers
      if (tabBlurTimer) {
        clearTimeout(tabBlurTimer);
        tabBlurTimer = null;
      }

      // Stop monitoring FIRST (this sets isActive=false in monitor)
      if (stopMonitoring) {
        stopMonitoring();
        stopMonitoring = null;
      }

      // Small delay to ensure interval is fully stopped before cleaning stream
      setTimeout(() => {
        cleanupMediaStream();
      }, 100);

      // Remove event listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [examId, candidateId, isTestActive, isShuttingDown]);

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
      {/* Connection Status Bar */}
      <div
        className={`fixed top-0 left-0 right-0 p-2 text-center text-sm font-medium z-50 ${
          connectionState === "connected"
            ? "bg-green-500 text-white"
            : connectionState === "reconnecting"
              ? "bg-yellow-500 text-white"
              : "bg-red-500 text-white"
        }`}
      >
        {connectionState === "connected" && "🟢 Connected"}
        {connectionState === "reconnecting" && "🟡 Reconnecting..."}
        {connectionState === "disconnected" && "🔴 Disconnected"}
        {queuedEvents > 0 && ` • ${queuedEvents} events queued`}
        {aiProcessing.connected && " • 🤖 AI Active"}
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Exam In Progress</h1>
            <p className="text-gray-600">
              Camera & microphone are being monitored with AI proctoring.
            </p>
          </div>
          <button
            onClick={handleStopTest}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-semibold"
          >
            🛑 Stop Test
          </button>
        </div>

        {/* Hidden video element for AI processing */}
        <video
          ref={videoRef}
          style={{ display: "none" }}
          autoPlay
          playsInline
          muted
        />

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">
            ✓ Media monitoring active
          </p>
          <p className="text-sm text-green-600 mt-1">
            Stream initialized and monitoring without re-requesting permissions
          </p>
          <p className="text-sm text-green-600 mt-1">
            ✓ Events buffered locally (survives disconnection)
          </p>
          <p className="text-sm text-green-600 mt-1">
            ✓ Auto-reconnect with event flushing enabled
          </p>
          <p className="text-sm text-green-600 mt-1">
            {aiProcessing.connected
              ? "✓ AI proctoring connected (2 FPS)"
              : "⏳ AI proctoring connecting..."}
          </p>
        </div>

        {/* AI Face Count Display */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-medium mb-2">
            🤖 AI Face Detection Status
          </p>
          <div className="text-sm text-blue-700">
            <p>
              Detected Faces:{" "}
              <span className="font-mono font-bold text-lg">
                {aiProcessing.lastFaceCount}
              </span>
            </p>
            <p className="text-xs mt-1 text-blue-600">
              {aiProcessing.lastFaceCount === 0 && "⚠️ No face detected"}
              {aiProcessing.lastFaceCount === 1 && "✓ Single face detected"}
              {aiProcessing.lastFaceCount > 1 && "⚠️ Multiple faces detected"}
            </p>
          </div>
        </div>

        {/* AI Violations Display */}
        {aiProcessing.violationAlerts.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium mb-2">
              ⚠️ AI Violations Detected
            </p>
            <div className="text-sm text-red-700 space-y-2">
              {aiProcessing.violationAlerts.slice(-3).map((v, idx) => (
                <div key={idx} className="border-l-2 border-red-400 pl-2">
                  <p className="font-semibold">
                    {v.type.replace(/_/g, " ").toUpperCase()}
                  </p>
                  <p className="text-xs">{v.message}</p>
                  <p className="text-xs text-gray-600">
                    {new Date(v.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">
          (Open DevTools → Console to see proctoring events)
        </p>

        {/* Connection Details */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Connection Status</h3>
          <div className="space-y-1 text-sm text-blue-700">
            <p>
              State:{" "}
              <span className="font-mono font-semibold">{connectionState}</span>
            </p>
            <p>
              Queued Events:{" "}
              <span className="font-mono font-semibold">{queuedEvents}</span>
            </p>
            <p>
              Session: <span className="font-mono text-xs">{sessionId}</span>
            </p>
          </div>
        </div>

        {/* Phase 2 Features */}
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-medium text-purple-800 mb-2">
            🎯 Phase 2: Event Buffering Active
          </h3>
          <ul className="space-y-1 text-sm text-purple-700">
            <li>✅ Offline event queuing (max 500 events)</li>
            <li>✅ Auto-reconnect with exponential backoff</li>
            <li>✅ Batch flush on reconnect</li>
            <li>✅ Event deduplication (UUID)</li>
            <li>✅ Sequence tracking for gap detection</li>
            <li>✅ No event loss on network drops</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
