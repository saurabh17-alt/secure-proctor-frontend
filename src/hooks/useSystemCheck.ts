export interface SystemCheckResult {
  camera: boolean;
  microphone: boolean;
  speaker: boolean;
  browser: boolean;
}

export async function checkCamera(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

export async function checkMicrophone(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

export function checkBrowser(): boolean {
  return !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
}

export async function runSystemCheck(): Promise<SystemCheckResult> {
  const [camera, microphone] = await Promise.all([
    checkCamera(),
    checkMicrophone(),
  ]);

  return {
    camera,
    microphone,
    speaker: true, // phase-1 placeholder
    browser: checkBrowser(),
  };
}
