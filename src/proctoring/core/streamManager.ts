import { type MediaRequirements, DEFAULT_REQUIREMENTS } from "./mediaConfig";

// Global stream to avoid re-requesting permissions
let globalStream: MediaStream | null = null;
let currentRequirements: MediaRequirements = DEFAULT_REQUIREMENTS;

/**
 * Initialize media stream with configurable requirements
 * Requests camera and microphone SEPARATELY so one can work even if the other fails
 * Only fails if a REQUIRED device is unavailable
 */
export async function initializeMediaStream(
  requirements: MediaRequirements = DEFAULT_REQUIREMENTS,
): Promise<{
  stream: MediaStream | null;
  errors: { camera?: string; microphone?: string };
}> {
  currentRequirements = requirements;

  if (globalStream) {
    // Check if existing stream is still active
    const videoTracks = globalStream.getVideoTracks();
    const audioTracks = globalStream.getAudioTracks();

    const isVideoActive = videoTracks.some(
      (track) => track.readyState === "live",
    );
    const isAudioActive = audioTracks.some(
      (track) => track.readyState === "live",
    );

    // Return existing stream if at least one required device is active
    if (isVideoActive || isAudioActive) {
      return { stream: globalStream, errors: {} };
    }

    // Clean up dead stream
    globalStream.getTracks().forEach((track) => track.stop());
    globalStream = null;
  }

  const errors: { camera?: string; microphone?: string } = {};
  const combinedStream = new MediaStream();

  // Request camera if needed (required or optional)
  if (requirements.camera) {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      videoStream.getVideoTracks().forEach((track) => {
        combinedStream.addTrack(track);
      });
      console.log("✓ Camera initialized (required)");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Camera access denied";
      errors.camera = errorMsg;
      console.error("✗ Camera failed (required):", errorMsg);
    }
  } else {
    console.log("⊘ Camera not required, skipping");
  }

  // Request microphone if needed (required or optional)
  if (requirements.microphone) {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      audioStream.getAudioTracks().forEach((track) => {
        combinedStream.addTrack(track);
      });
      console.log("✓ Microphone initialized (required)");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Microphone access denied";
      errors.microphone = errorMsg;
      console.error("✗ Microphone failed (required):", errorMsg);
    }
  } else {
    console.log("⊘ Microphone not required, skipping");
  }

  // Check if required devices are available
  const hasCamera = combinedStream.getVideoTracks().length > 0;
  const hasMicrophone = combinedStream.getAudioTracks().length > 0;

  if (requirements.camera && !hasCamera) {
    console.error("✗ Required camera not available");
    return { stream: null, errors };
  }

  if (requirements.microphone && !hasMicrophone) {
    console.error("✗ Required microphone not available");
    return { stream: null, errors };
  }

  // Must have at least one track
  if (combinedStream.getTracks().length === 0) {
    console.error("✗ No media tracks available");
    return {
      stream: null,
      errors: {
        camera: "No devices available",
        microphone: "No devices available",
      },
    };
  }

  globalStream = combinedStream;
  return { stream: globalStream, errors };
}

/**
 * Get current requirements
 */
export function getCurrentRequirements(): MediaRequirements {
  return currentRequirements;
}

/**
 * Get the current global stream
 */
export function getGlobalStream(): MediaStream | null {
  return globalStream;
}

/**
 * Clean up and stop all media tracks
 */
export function cleanupMediaStream() {
  if (globalStream) {
    globalStream.getTracks().forEach((track) => track.stop());
    globalStream = null;
  }
}

/**
 * Check if stream is active
 */
export function isStreamActive(): boolean {
  if (!globalStream) return false;

  const videoTracks = globalStream.getVideoTracks();
  const audioTracks = globalStream.getAudioTracks();

  const isVideoActive = videoTracks.some(
    (track) => track.readyState === "live",
  );
  const isAudioActive = audioTracks.some(
    (track) => track.readyState === "live",
  );

  return isVideoActive && isAudioActive;
}
