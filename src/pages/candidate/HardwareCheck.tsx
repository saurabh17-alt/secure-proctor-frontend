import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: string;
}

interface HardwareCheckState {
  camera: {
    granted: boolean;
    devices: DeviceInfo[];
    selectedDevice: string;
    testing: boolean;
    error: string | null;
  };
  microphone: {
    granted: boolean;
    devices: DeviceInfo[];
    selectedDevice: string;
    testing: boolean;
    error: string | null;
  };
  speaker: {
    granted: boolean;
    devices: DeviceInfo[];
    selectedDevice: string;
    testing: boolean;
    error: string | null;
  };
  internetSpeed: {
    download: number | null;
    upload: number | null;
    latency: number | null;
    status: "good" | "fair" | "poor" | null;
  };
}

export default function HardwareCheck() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("examId") || "demo";

  const [state, setState] = useState<HardwareCheckState>({
    camera: {
      granted: false,
      devices: [],
      selectedDevice: "",
      testing: false,
      error: null,
    },
    microphone: {
      granted: false,
      devices: [],
      selectedDevice: "",
      testing: false,
      error: null,
    },
    speaker: {
      granted: false,
      devices: [],
      selectedDevice: "default",
      testing: false,
      error: null,
    },
    internetSpeed: {
      download: null,
      upload: null,
      latency: null,
      status: null,
    },
  });

  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isAllReady, setIsAllReady] = useState(false);

  // Check internet speed
  const checkInternetSpeed = async () => {
    console.log("🌐 Checking internet speed...");
    try {
      const startTime = performance.now();
      // Use backend API for latency check to avoid CORS issues
      const response = await fetch("http://localhost:8000/", {
        cache: "no-store",
      });
      const endTime = performance.now();
      const latency = endTime - startTime;

      let status: "good" | "fair" | "poor" = "good";
      if (latency > 200) status = "poor";
      else if (latency > 100) status = "fair";

      setState((prev) => ({
        ...prev,
        internetSpeed: {
          download: Math.random() * 50 + 50, // Simulated for now
          upload: Math.random() * 20 + 20,
          latency: Math.round(latency),
          status,
        },
      }));

      console.log(`✅ Internet speed check complete - Latency: ${latency}ms`);
    } catch (error) {
      console.error("❌ Internet speed check failed:", error);
      setState((prev) => ({
        ...prev,
        internetSpeed: {
          download: null,
          upload: null,
          latency: null,
          status: "poor",
        },
      }));
    }
  };

  // Request camera permission and list devices
  const requestCameraPermission = async () => {
    console.log("📹 Requesting camera permission...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setVideoStream(stream);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((d) => d.kind === "videoinput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
          kind: d.kind,
        }));

      console.log(
        `✅ Camera permission granted - Found ${videoDevices.length} camera(s)`,
      );

      setState((prev) => ({
        ...prev,
        camera: {
          granted: true,
          devices: videoDevices,
          selectedDevice: videoDevices[0]?.deviceId || "",
          testing: false,
          error: null,
        },
      }));
    } catch (error: any) {
      console.error("❌ Camera permission denied:", error);
      setState((prev) => ({
        ...prev,
        camera: {
          ...prev.camera,
          granted: false,
          error: error.message || "Camera access denied",
        },
      }));
    }
  };

  // Request microphone permission and list devices
  const requestMicrophonePermission = async () => {
    console.log("🎤 Requesting microphone permission...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      stream.getTracks().forEach((track) => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
          kind: d.kind,
        }));

      console.log(
        `✅ Microphone permission granted - Found ${audioDevices.length} microphone(s)`,
      );

      setState((prev) => ({
        ...prev,
        microphone: {
          granted: true,
          devices: audioDevices,
          selectedDevice: audioDevices[0]?.deviceId || "",
          testing: false,
          error: null,
        },
      }));
    } catch (error: any) {
      console.error("❌ Microphone permission denied:", error);
      setState((prev) => ({
        ...prev,
        microphone: {
          ...prev.microphone,
          granted: false,
          error: error.message || "Microphone access denied",
        },
      }));
    }
  };

  // Request speaker/audio output access
  const requestSpeakerPermission = async () => {
    console.log("🔊 Checking speaker...");
    try {
      // Check if browser supports audio output devices
      if ("enumerateDevices" in navigator.mediaDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputDevices = devices
          .filter((d) => d.kind === "audiooutput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Speaker ${d.deviceId.slice(0, 8)}`,
            kind: d.kind,
          }));

        console.log(`✅ Found ${audioOutputDevices.length} speaker(s)`);

        setState((prev) => ({
          ...prev,
          speaker: {
            granted: true,
            devices: audioOutputDevices,
            selectedDevice: audioOutputDevices[0]?.deviceId || "default",
            testing: false,
            error: null,
          },
        }));
      } else {
        setState((prev) => ({
          ...prev,
          speaker: {
            granted: true,
            devices: [],
            selectedDevice: "default",
            testing: false,
            error: null,
          },
        }));
      }
    } catch (error: any) {
      console.error("❌ Speaker check failed:", error);
      setState((prev) => ({
        ...prev,
        speaker: {
          ...prev.speaker,
          granted: false,
          error: error.message || "Speaker check failed",
        },
      }));
    }
  };

  // Test speaker with a beep sound
  const testSpeaker = () => {
    console.log("🔊 Testing speaker...");
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 440; // A4 note
    gainNode.gain.value = 0.3;

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      console.log("✅ Speaker test complete");
    }, 500);
  };

  // Change camera device
  const changeCameraDevice = async (deviceId: string) => {
    console.log(`📹 Switching to camera: ${deviceId}`);
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      setVideoStream(stream);

      setState((prev) => ({
        ...prev,
        camera: { ...prev.camera, selectedDevice: deviceId },
      }));

      console.log("✅ Camera switched successfully");
    } catch (error) {
      console.error("❌ Failed to switch camera:", error);
    }
  };

  // Initialize on mount
  useEffect(() => {
    console.log("🚀 Hardware check page loaded");
    console.log(`📋 Exam ID: ${examId}`);

    checkInternetSpeed();
    requestCameraPermission();
    requestMicrophonePermission();
    requestSpeakerPermission();

    return () => {
      // Cleanup video stream
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Check if all permissions are granted
  useEffect(() => {
    const allReady =
      state.camera.granted &&
      state.microphone.granted &&
      state.speaker.granted &&
      state.internetSpeed.status !== null;

    setIsAllReady(allReady);

    if (allReady) {
      console.log("✅ All hardware checks passed - Ready to start test");
    }
  }, [state]);

  // Start actual test
  const startTest = () => {
    console.log("🎯 Starting actual test...");
    console.log(`📋 Exam ID: ${examId}`);
    console.log(`📹 Camera: ${state.camera.selectedDevice}`);
    console.log(`🎤 Microphone: ${state.microphone.selectedDevice}`);
    console.log(`🔊 Speaker: ${state.speaker.selectedDevice}`);

    // Clean up video stream before navigation
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
    }

    navigate(`/exam/${examId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Hardware Check
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Please ensure all devices are working properly before starting the
            test
          </p>

          {/* Internet Speed Check */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              🌐 Internet Connection
            </h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              {state.internetSpeed.status ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span
                      className={`font-semibold ${
                        state.internetSpeed.status === "good"
                          ? "text-green-600"
                          : state.internetSpeed.status === "fair"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {state.internetSpeed.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latency:</span>
                    <span>{state.internetSpeed.latency}ms</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Checking...</p>
              )}
            </div>
          </div>

          {/* Camera Check */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">📹 Camera</h2>
            <div className="border rounded-lg p-4">
              {state.camera.granted ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-semibold">
                      ✓ Permission Granted
                    </span>
                    <span className="text-sm text-gray-600">
                      {state.camera.devices.length} camera(s) found
                    </span>
                  </div>

                  {/* Camera preview */}
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      autoPlay
                      playsInline
                      muted
                      ref={(video) => {
                        if (video && videoStream) {
                          video.srcObject = videoStream;
                        }
                      }}
                      className="w-full h-64 object-cover"
                    />
                  </div>

                  {/* Camera selector */}
                  {state.camera.devices.length > 1 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Camera:
                      </label>
                      <select
                        value={state.camera.selectedDevice}
                        onChange={(e) => changeCameraDevice(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        {state.camera.devices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <button
                    onClick={requestCameraPermission}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Grant Camera Permission
                  </button>
                  {state.camera.error && (
                    <p className="text-red-600 text-sm mt-2">
                      {state.camera.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Microphone Check */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">🎤 Microphone</h2>
            <div className="border rounded-lg p-4">
              {state.microphone.granted ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-semibold">
                      ✓ Permission Granted
                    </span>
                    <span className="text-sm text-gray-600">
                      {state.microphone.devices.length} microphone(s) found
                    </span>
                  </div>

                  {/* Microphone selector */}
                  {state.microphone.devices.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Microphone:
                      </label>
                      <select
                        value={state.microphone.selectedDevice}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            microphone: {
                              ...prev.microphone,
                              selectedDevice: e.target.value,
                            },
                          }))
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        {state.microphone.devices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <button
                    onClick={requestMicrophonePermission}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Grant Microphone Permission
                  </button>
                  {state.microphone.error && (
                    <p className="text-red-600 text-sm mt-2">
                      {state.microphone.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Speaker Check */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">🔊 Speaker</h2>
            <div className="border rounded-lg p-4">
              {state.speaker.granted ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-semibold">
                      ✓ Available
                    </span>
                    {state.speaker.devices.length > 0 && (
                      <span className="text-sm text-gray-600">
                        {state.speaker.devices.length} speaker(s) found
                      </span>
                    )}
                  </div>

                  <button
                    onClick={testSpeaker}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Test Speaker (Play Sound)
                  </button>

                  {/* Speaker selector (if available) */}
                  {state.speaker.devices.length > 1 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Speaker:
                      </label>
                      <select
                        value={state.speaker.selectedDevice}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            speaker: {
                              ...prev.speaker,
                              selectedDevice: e.target.value,
                            },
                          }))
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        {state.speaker.devices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <button
                    onClick={requestSpeakerPermission}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Check Speaker
                  </button>
                  {state.speaker.error && (
                    <p className="text-red-600 text-sm mt-2">
                      {state.speaker.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Start Test Button */}
          <div className="mt-8">
            {isAllReady ? (
              <button
                onClick={startTest}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-green-700 transition"
              >
                ✓ Start Actual Test
              </button>
            ) : (
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  Please complete all hardware checks before starting the test
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
