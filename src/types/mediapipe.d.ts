// Type declarations for MediaPipe CDN imports
declare module "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest" {
  export const FaceDetector: any;
  export const FilesetResolver: any;
}

// Type declarations for local MediaPipe files
declare module "/mediapipe/vision_bundle.mjs" {
  export const FaceDetector: any;
  export const FilesetResolver: any;
}
