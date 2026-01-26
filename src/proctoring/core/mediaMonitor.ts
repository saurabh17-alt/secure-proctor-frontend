import { getGlobalStream, getCurrentRequirements } from "./streamManager";

/**
 * Production-ready media monitor
 * - Only monitors and reports on REQUIRED devices
 * - No permission queries in interval
 * - Single event per state change
 * - No stream cleanup (handled separately)
 */
export function startMediaMonitor(emitEvent: Function) {
  let lastCameraStatus: boolean | null = null;
  let lastMicStatus: boolean | null = null;

  const checkMediaStatus = () => {
    const stream = getGlobalStream();
    const requirements = getCurrentRequirements();

    // Only fail if stream is null AND media is required
    if (!stream && (requirements.camera || requirements.microphone)) {
      emitEvent("stream_lost", {
        error: "Required media stream not initialized",
        severity: "critical",
      });
      return;
    }

    // If no media required and no stream, nothing to monitor
    if (!stream) {
      return;
    }

    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    // Current status
    const cameraOn =
      videoTracks.length > 0 &&
      videoTracks[0]?.readyState === "live" &&
      videoTracks[0]?.enabled;

    const micOn =
      audioTracks.length > 0 &&
      audioTracks[0]?.readyState === "live" &&
      audioTracks[0]?.enabled;

    // Only emit for REQUIRED devices when status CHANGES (or first check)
    if (requirements.camera && cameraOn !== lastCameraStatus) {
      emitEvent("camera_status", {
        status: cameraOn ? "on" : "off",
        device: "camera",
        required: true,
        timestamp: Date.now(),
      });
      lastCameraStatus = cameraOn;
    }

    if (requirements.microphone && micOn !== lastMicStatus) {
      emitEvent("mic_status", {
        status: micOn ? "on" : "off",
        device: "microphone",
        required: true,
        timestamp: Date.now(),
      });
      lastMicStatus = micOn;
    }
  };

  // Start monitoring
  const interval = setInterval(checkMediaStatus, 1500);

  // Initial check
  checkMediaStatus();

  // Cleanup: ONLY stop interval, NOT the stream
  return () => {
    clearInterval(interval);
  };
}

/**
 * Check permissions once (not in loop)
 * Call this before starting exam
 */
export async function checkMediaPermissions(): Promise<{
  camera: PermissionState;
  microphone: PermissionState;
}> {
  const result = {
    camera: "granted" as PermissionState,
    microphone: "granted" as PermissionState,
  };

  try {
    const cameraPermission = await navigator.permissions.query({
      name: "camera" as PermissionName,
    });
    result.camera = cameraPermission.state;
  } catch {
    // Safari doesn't support this
    result.camera = "granted"; // Assume granted if can't check
  }

  try {
    const micPermission = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    result.microphone = micPermission.state;
  } catch {
    result.microphone = "granted";
  }

  return result;
}
