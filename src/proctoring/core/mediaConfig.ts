/**
 * Media requirements configuration
 */
export interface MediaRequirements {
  camera: boolean; // Is camera required?
  microphone: boolean; // Is microphone required?
}

/**
 * Default: Both camera and microphone required
 */
export const DEFAULT_REQUIREMENTS: MediaRequirements = {
  camera: true,
  microphone: true,
};

/**
 * Preset configurations for common scenarios
 */
export const MEDIA_PRESETS = {
  CAMERA_ONLY: { camera: true, microphone: false },
  AUDIO_ONLY: { camera: false, microphone: true },
  BOTH: { camera: true, microphone: true },
  CAMERA_PREFERRED: { camera: true, microphone: false }, // Camera required, audio optional
  AUDIO_PREFERRED: { camera: false, microphone: true }, // Audio required, camera optional
};
