import { useEffect, useState, useMemo } from "react";
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

interface LogEntry {
  timestamp: string;
  type: "info" | "warning" | "error" | "violation";
  message: string;
}

export default function TestExam() {
  const { examId } = useParams<{ examId: string }>();
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionState, setConnectionState] =
    useState<string>("disconnected");
  const [queuedEvents, setQueuedEvents] = useState<number>(0);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Generate stable candidateId
  const candidateId = useMemo(
    () => "test_candidate_" + Math.random().toString(36).substr(2, 9),
    [],
  );
  const sessionId = examId || "test_exam";

  const requirements = MEDIA_PRESETS.BOTH;

  // Add log entry
  const addLog = (type: LogEntry["type"], message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, type, message }]);
  };

  // Handle proctor events from media monitor
  const handleProctorEvent = (type: string, payload: any) => {
    addLog("info", `PROCTOR EVENT: ${type} - ${JSON.stringify(payload)}`);
    emitProctorEvent(sessionId, candidateId, type, payload);
  };

  // WebSocket connection setup
  useEffect(() => {
    if (!examId || !isTestRunning) return;

    addLog("info", "🔌 Initializing WebSocket connection...");

    resetSequence();

    onStateChange((state) => {
      setConnectionState(state);
      addLog("info", `📡 Connection state: ${state}`);
    });

    onMessage((data) => {
      addLog("info", `📨 Message from server: ${JSON.stringify(data)}`);

      // Handle violation messages
      if (data.type === "violation_warning") {
        addLog("warning", `⚠️ WARNING: ${data.message}`);
      } else if (data.type === "violation_critical") {
        addLog("error", `🔴 CRITICAL: ${data.message}`);
      } else if (data.type === "exam_terminated") {
        addLog("violation", `🚨 EXAM TERMINATED: ${data.message}`);
      }
    });

    connectSocket(sessionId, candidateId);

    const queueInterval = setInterval(() => {
      setQueuedEvents(getQueueSize());
    }, 1000);

    return () => {
      clearInterval(queueInterval);
      disconnectSocket();
      addLog("info", "🔌 WebSocket disconnected");
    };
  }, [examId, sessionId, candidateId, isTestRunning]);

  // Media monitoring setup
  useEffect(() => {
    if (!isTestRunning) return;

    addLog("info", "📹 Starting media monitoring...");

    let stopMonitoring: (() => void) | null = null;

    const init = async () => {
      try {
        const permissions = await checkMediaPermissions();
        addLog("info", `Permissions: ${JSON.stringify(permissions)}`);

        const { stream, errors } = await initializeMediaStream(requirements);

        const errorMessages: string[] = [];
        if (requirements.camera && errors.camera) {
          errorMessages.push(`Camera: ${errors.camera}`);
        }
        if (requirements.microphone && errors.microphone) {
          errorMessages.push(`Microphone: ${errors.microphone}`);
        }

        if (!stream || errorMessages.length > 0) {
          const errorMsg =
            errorMessages.join(" | ") ||
            "Failed to access required media devices";
          setMediaError(errorMsg);
          addLog("violation", `🚨 PERMISSION DENIED: ${errorMsg}`);

          // Emit violation events for denied permissions
          if (errors.camera) {
            addLog(
              "error",
              "📹 Camera permission denied - sending violation event",
            );
            emitProctorEvent(sessionId, candidateId, "camera_status", {
              status: "off",
              reason: "permission_denied",
              timestamp: Date.now(),
            });
          }
          if (errors.microphone) {
            addLog(
              "error",
              "🎤 Microphone permission denied - sending violation event",
            );
            emitProctorEvent(sessionId, candidateId, "mic_status", {
              status: "off",
              reason: "permission_denied",
              timestamp: Date.now(),
            });
          }

          setIsInitializing(false);
          // Don't return - let test continue to show violations
        } else {
          addLog("info", "✅ Media stream initialized successfully");
          setIsInitializing(false);
          stopMonitoring = startMediaMonitor(handleProctorEvent);
        }
      } catch (error) {
        const errorMsg = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
        addLog("error", errorMsg);
        setMediaError(errorMsg);
        setIsInitializing(false);
      }
    };

    init();

    // Tab visibility monitoring with debouncing
    let tabBlurTimer: ReturnType<typeof setTimeout> | null = null;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Debounce: wait 500ms to avoid rapid-fire events
        if (tabBlurTimer) clearTimeout(tabBlurTimer);
        tabBlurTimer = setTimeout(() => {
          addLog("warning", "⚠️ Tab blur detected (debounced)");
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

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addLog("error", "⚠️ Fullscreen exit detected");
        emitProctorEvent(sessionId, candidateId, "fullscreen_exit", {
          exited: true,
          reason: "user_action",
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      addLog("info", "Exam ended → stopping monitoring + cleaning stream");
      if (tabBlurTimer) clearTimeout(tabBlurTimer);
      stopMonitoring?.();
      cleanupMediaStream();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isTestRunning]);

  const startTest = () => {
    setLogs([]);
    setIsTestRunning(true);
    addLog("info", "🚀 Test started");
  };

  const stopTest = () => {
    setIsTestRunning(false);
    disconnectSocket();
    cleanupMediaStream();
    addLog("info", "⏹️ Test stopped");
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (!isTestRunning) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Proctoring Test Page</h1>
          <p className="text-gray-600 mb-8">
            Test the proctoring system with on-screen logs and controls.
          </p>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Information</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Exam ID:</span>{" "}
                <span className="font-mono">{sessionId}</span>
              </p>
              <p>
                <span className="font-medium">Candidate ID:</span>{" "}
                <span className="font-mono">{candidateId}</span>
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              What This Tests:
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✅ WebSocket connection and reconnection</li>
              <li>✅ Event buffering during disconnection</li>
              <li>
                ✅ Violation detection (camera, mic, tab blur, fullscreen)
              </li>
              <li>✅ Real-time warnings and termination</li>
              <li>✅ All logs displayed on screen</li>
            </ul>
          </div>

          <button
            onClick={startTest}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition"
          >
            🚀 Start Test
          </button>
        </div>
      </div>
    );
  }

  if (isInitializing && !mediaError) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing camera and microphone...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
      </div>

      <div className="pt-12 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Control Buttons */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={stopTest}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              ⏹️ Stop Test
            </button>
            <button
              onClick={clearLogs}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
            >
              🗑️ Clear Logs
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Exam Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">
                  Test Exam In Progress
                </h2>
                <p className="text-gray-600 mb-4">
                  Camera & microphone are being monitored.
                </p>

                {mediaError && (
                  <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
                    <p className="text-red-800 font-bold">
                      ⚠️ MEDIA PERMISSION DENIED
                    </p>
                    <p className="text-sm text-red-700 mt-1">{mediaError}</p>
                    <p className="text-sm text-red-600 mt-2">
                      This will trigger violations! Backend will detect
                      camera/mic as "off" and send warnings/termination.
                    </p>
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    ✓ Media monitoring active
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Stream initialized and monitoring
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Events buffered locally (survives disconnection)
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Auto-reconnect with event flushing enabled
                  </p>
                </div>
              </div>

              {/* Connection Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-3">Connection Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">State:</span>
                    <span className="font-mono font-semibold">
                      {connectionState}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Queued Events:</span>
                    <span className="font-mono font-semibold">
                      {queuedEvents}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session:</span>
                    <span className="font-mono text-xs">{sessionId}</span>
                  </div>
                </div>
              </div>

              {/* Test Instructions */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-semibold text-purple-900 mb-2">
                  🧪 Test Violations:
                </h3>
                <ul className="space-y-2 text-sm text-purple-800">
                  <li>📹 Cover camera for 3s → Warning</li>
                  <li>📹 Keep camera off 30s → Terminate</li>
                  <li>🎤 Mute mic for 5s → Warning</li>
                  <li>🔄 Switch tabs 4 times → Violation</li>
                  <li>📱 Exit fullscreen → Instant terminate</li>
                </ul>
              </div>
            </div>

            {/* Right Side - Logs */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold">📝 Live Logs ({logs.length})</h3>
              </div>
              <div className="h-[600px] overflow-y-auto p-4 font-mono text-xs space-y-1 bg-gray-900 text-gray-100">
                {logs.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    No logs yet. Test is running...
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        log.type === "error"
                          ? "bg-red-900/30 text-red-300"
                          : log.type === "warning"
                            ? "bg-yellow-900/30 text-yellow-300"
                            : log.type === "violation"
                              ? "bg-purple-900/30 text-purple-300"
                              : "bg-blue-900/30 text-blue-300"
                      }`}
                    >
                      <span className="text-gray-500">[{log.timestamp}]</span>{" "}
                      {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
