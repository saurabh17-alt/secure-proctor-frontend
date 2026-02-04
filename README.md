# Secure Proctor - Frontend

Production-ready online proctoring system built with React, TypeScript, and Vite. Features browser-based MediaPipe face detection with offline support.

---

## 🚀 Tech Stack

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7.2.4
- **Styling:** Tailwind CSS 4.1.18
- **Routing:** React Router DOM 7.13.0
- **State Management:** Zustand 5.0.10
- **HTTP Client:** Axios 1.13.3
- **Face Detection:** MediaPipe Tasks Vision (browser-based)
- **Media:** MediaStream API (Webcam & Microphone)
- **Node:** 18+

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   └── routes.tsx               # Application routing
│   │
│   ├── pages/
│   │   ├── candidate/              # Candidate pages
│   │   │   ├── JoinExam.tsx        # Exam entry
│   │   │   ├── SystemCheck.tsx     # Camera/mic verification
│   │   │   ├── Exam.tsx            # Main exam page
│   │   │   └── TestExam.tsx        # Test page with AI detection
│   │   │
│   │   └── admin/                  # Admin pages
│   │       ├── Dashboard.tsx       # Admin monitoring dashboard
│   │       └── ViolationsReport.tsx # Violations report with images
│   │
│   ├── components/
│   │   └── layout/
│   │       ├── CandidateLayout.tsx # Candidate layout wrapper
│   │       └── AdminLayout.tsx     # Admin layout wrapper
│   │
│   ├── hooks/
│   │   ├── useSystemCheck.ts       # System verification hook
│   │   ├── useAIProcessing.ts      # MediaPipe face detection
│   │   └── useViolationManager.ts  # Violation & cooling period manager
│   │
│   ├── proctoring/
│   │   ├── core/
│   │   │   ├── mediaConfig.ts      # Media requirements config
│   │   │   ├── streamManager.ts    # Global stream lifecycle
│   │   │   └── mediaMonitor.ts     # Real-time media monitoring
│   │   ├── events/
│   │   │   ├── eventEmitter.ts     # Event emission
│   │   │   ├── eventQueue.ts       # Event buffering
│   │   │   └── types.ts            # Type definitions
│   │   └── socket/
│   │       └── proctorSocket.ts    # WebSocket communication
│   │
│   └── types/
│       └── mediapipe.d.ts          # MediaPipe type declarations
│
├── public/
│   └── mediapipe/                  # MediaPipe offline files
│       ├── vision_bundle.mjs       # MediaPipe library
│       ├── wasm/                   # WASM runtime files
│       └── models/                 # Face detection model
│
└── download_mediapipe.ps1          # Download script for offline use
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles + Tailwind
│
├── public/                         # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```powershell
cd frontend

# Install dependencies
npm install

# Download MediaPipe files for offline use (recommended)
.\download_mediapipe.ps1

# Start development server
npm run dev
```

### Development Server

```powershell
npm run dev
```

Access at: http://localhost:5173

---

## 🤖 MediaPipe Face Detection (Offline Support)

### Download MediaPipe Files

For offline/restricted networks, download MediaPipe files locally:

```powershell
.\download_mediapipe.ps1
```

Files are saved to `public/mediapipe/` (~12 MB total):

- `vision_bundle.mjs` - MediaPipe library
- `wasm/*.wasm` - WebAssembly runtime
- `models/blaze_face_short_range.tflite` - Face detection model

**Configuration:**  
Already set in `src/hooks/useAIProcessing.ts`:

```typescript
const USE_LOCAL_FILES = true; // Use local files (offline mode)
```

**Verification:**  
Check browser console for:

```
📦 Loading from local files...
✅ MediaPipe FaceDetector loaded successfully
```

---

## 🎨 Pages & Routes

### Candidate Routes

#### `/join-exam/:examId`

Exam entry point where candidates:

- Enter their name
- Enter exam ID
- Start exam

#### `/system-check/:examId`

System verification page that checks:

- Camera permission & functionality
- Microphone permission & functionality
- Browser compatibility
- Network connectivity

After passing, navigates to exam page.

#### `/exam/:examId`

Main exam page with AI proctoring:

- Live camera feed (top-right corner)
- Real-time AI detection status
- Head pose tracking display (yaw/pitch angles)
- Exam content area
- Automatic violation detection

**Features:**

- No camera blinking (stream initialized once)
- Real-time face detection
- Head pose monitoring
- Object detection (phone, book)
- Event logging to backend

### Admin Routes

#### `/admin/dashboard/:examId`

Admin monitoring dashboard:

- List of active candidates
- Real-time event feed
- Violation alerts
- Connection status for each candidate

**Features:**

- WebSocket connection to backend
- Real-time event streaming
- Candidate connection/disconnection tracking
- Violation severity indicators

---

## 🎥 Media Management

### Configuration (`proctoring/core/mediaConfig.ts`)

```typescript
export const MEDIA_REQUIREMENTS = {
  camera: true, // Camera required
  microphone: false, // Microphone optional
  screen: false, // Screen share not required
};
```

### Stream Manager (`proctoring/core/streamManager.ts`)

**Global Stream Lifecycle:**

- Initializes stream once at exam start
- Reuses stream throughout exam
- Cleans up only on exam end
- No camera blinking

**Usage:**

```typescript
import {
  initMediaStream,
  cleanupMediaStream,
  getStream,
} from "@/proctoring/core/streamManager";

// Initialize (call once in Exam.tsx)
const stream = await initMediaStream();

// Get existing stream
const currentStream = getStream();

// Cleanup (call in useEffect cleanup)
cleanupMediaStream();
```

### Media Monitor (`proctoring/core/mediaMonitor.ts`)

**Real-Time Monitoring:**

- Monitors camera and mic status every 1.5s
- Detects device disconnection
- Detects stream track ending
- Emits clean events (one per state change)
- No duplicate events
- Safari compatible (no permission queries in loop)

**Usage:**

```typescript
import {
  startMediaMonitoring,
  stopMediaMonitoring,
} from "@/proctoring/core/mediaMonitor";

// Start monitoring
startMediaMonitoring({
  stream,
  requiredDevices: ["camera", "microphone"],
  onEvent: (event) => {
    console.log("Media event:", event);
    // Send to backend
  },
});

// Stop monitoring (does NOT kill stream)
stopMediaMonitoring();
```

**Events Emitted:**

```typescript
// Camera status
{
  status: "on" | "off",
  device: "camera",
  timestamp: 1706234567890
}

// Microphone status
{
  status: "on" | "off",
  device: "microphone",
  timestamp: 1706234567890
}
```

---

## 🤖 AI Proctoring Integration

### Frame Capture & Sending

In `Exam.tsx`:

```typescript
// Capture frame from video element
const captureFrame = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(videoRef.current, 0, 0, 640, 480);
  return canvas.toDataURL("image/jpeg", 0.8); // Base64 JPEG
};

// Send to backend via WebSocket (every 333ms = 3 FPS)
useEffect(() => {
  const interval = setInterval(() => {
    const frame = captureFrame();
    websocket.send(
      JSON.stringify({
        action: "ai_frame",
        session_id: sessionId,
        frame: frame,
      }),
    );
  }, 333);

  return () => clearInterval(interval);
}, []);
```

### Receiving AI Violations

```typescript
websocket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "ai_violation") {
    // Display violation to candidate
    setViolations((prev) => [...prev, data.violation]);

    // Show alert if critical
    if (data.violation.level === "critical") {
      alert(`Violation: ${data.violation.type}`);
    }
  }
};
```

### Display AI Status

```tsx
{
  /* AI Detection Status */
}
<div className="ai-status">
  <div>Face: {faceStatus}</div>
  <div>
    Head Pose: yaw={yaw.toFixed(1)}° pitch={pitch.toFixed(1)}°
  </div>
  <div>Violations: {violations.length}</div>
</div>;
```

---

## 🔌 API Integration

### REST API (`axios`)

#### Send Event

```typescript
import axios from "axios";

const sendEvent = async (event: ProctorEvent) => {
  try {
    const response = await axios.post(
      "http://localhost:8000/api/proctor/events",
      {
        examId: "exam123",
        candidateId: "user456",
        type: "camera_off",
        severity: "critical",
        payload: { device: "camera", status: "off" },
        timestamp: Date.now(),
      },
    );

    console.log("Event sent:", response.data);
  } catch (error) {
    console.error("Failed to send event:", error);
  }
};
```

#### Get Events

```typescript
const getEvents = async (examId: string) => {
  try {
    const response = await axios.get(
      `http://localhost:8000/api/proctor/events?exam_id=${examId}&limit=50`,
    );

    return response.data; // Array of events
  } catch (error) {
    console.error("Failed to fetch events:", error);
  }
};
```

### WebSocket

#### Connect

```typescript
const connectWebSocket = (examId: string, candidateId: string) => {
  const ws = new WebSocket(
    `ws://localhost:8000/ws/proctor/${examId}/${candidateId}`,
  );

  ws.onopen = () => {
    console.log("WebSocket connected");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Received:", data);
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected");
    // Implement reconnection logic
  };

  return ws;
};
```

#### Send Event

```typescript
ws.send(
  JSON.stringify({
    action: "event",
    event_id: `evt_${Date.now()}`,
    session_id: sessionId,
    user_id: candidateId,
    type: "tab_switch",
    payload: { url: window.location.href },
    timestamp: Date.now(),
    sequence: eventSequence++,
  }),
);
```

#### Send AI Frame

```typescript
ws.send(
  JSON.stringify({
    action: "ai_frame",
    session_id: sessionId,
    frame: base64ImageData, // data:image/jpeg;base64,...
  }),
);
```

---

## 🧪 Testing

### Manual Testing

#### 1. Test System Check

1. Go to http://localhost:5173/system-check/exam123
2. Allow camera permission
3. Allow microphone permission
4. Verify camera preview shows
5. Verify microphone level indicator works
6. Click "Start Exam"

#### 2. Test Exam Page (AI Proctoring)

1. Go to http://localhost:5173/exam/exam123
2. **No Face Test:**
   - Move out of camera view
   - Expected: "No face detected" after ~2 seconds
3. **Multiple Faces Test:**
   - Have another person enter view
   - Expected: "Multiple faces detected" after ~2.5 seconds
4. **Looking Away Test:**
   - Turn head 30-40° left or right
   - Expected: "Looking away" after ~5 seconds
   - Check head pose angles displayed on screen
5. **Object Detection Test:**
   - Hold phone in view: Expected detection in ~1.3 seconds
   - Hold book in view: Expected detection in ~1.5 seconds

#### 3. Test Admin Dashboard

1. Go to http://localhost:5173/admin/dashboard/exam123
2. Open candidate exam in another window
3. Verify events appear in admin dashboard in real-time
4. Trigger violations and verify they show up

### Network Testing

#### Test Offline Buffering

1. Start exam
2. Disconnect network (disable WiFi)
3. Trigger events (camera off, tab switch)
4. Reconnect network
5. Verify buffered events sent to backend

---

## 📊 Event Types Handled

### Media Events

- `camera_on` - Camera enabled
- `camera_off` - Camera disabled
- `mic_on` - Microphone enabled
- `mic_off` - Microphone disabled
- `stream_error` - Media stream error

### Behavioral Events

- `tab_switch` - Switched browser tab
- `window_blur` - Left exam window
- `fullscreen_exit` - Exited fullscreen mode
- `copy_paste` - Copy/paste detected (if implemented)

### AI Violations (from backend)

- `ai_no_face` - No face detected
- `ai_multiple_faces` - Multiple faces detected
- `ai_looking_away` - Head turned away
- `ai_phone_detected` - Phone visible
- `ai_book_detected` - Book/paper visible

---

## 🎨 Styling

### Tailwind CSS

**Configuration** (`tailwind.config.js`):

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
    },
  },
  plugins: [],
};
```

**Usage:**

```tsx
<div className="bg-white p-4 rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900">Exam Title</h1>
  <button className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600">
    Start Exam
  </button>
</div>
```

### Custom Styles

Global styles in `index.css`:

```css
/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 4px;
}
```

---

## 🔍 Process Flow

### Exam Start Flow

```
1. Candidate → /join-exam/:examId
   ↓
2. Enter name + exam ID
   ↓
3. Click "Start" → Navigate to /system-check/:examId
   ↓
4. System Check:
   - Request camera permission
   - Request microphone permission
   - Test camera feed
   - Test microphone level
   ↓
5. Click "Start Exam" → Navigate to /exam/:examId
   ↓
6. Exam Page:
   - Initialize global media stream
   - Start media monitoring
   - Connect WebSocket
   - Start AI frame capture (3 FPS)
   - Display exam content
```

### AI Detection Flow

```
Exam.tsx → captureFrame() (every 333ms)
    ↓
Base64 JPEG (640x480)
    ↓
WebSocket.send({action: "ai_frame", frame: "data:image/..."})
    ↓
Backend receives frame
    ↓
AI Processing:
├─ Face Detection (MediaPipe)
├─ Head Pose (MediaPipe)
└─ Object Detection (YOLOv8)
    ↓
Violations detected → Signal Aggregator
    ↓
WebSocket.send({type: "ai_violation", violation: {...}})
    ↓
Frontend receives violation
    ↓
Display to candidate + Log to backend
```

### Event Logging Flow

```
User Action (camera off, tab switch, etc.)
    ↓
Create Event Object
    ↓
Check WebSocket Connection
    ↓
├─ Connected → Send immediately
└─ Disconnected → Buffer locally
    ↓
On Reconnect → Send buffered events in batch
    ↓
Backend stores in database
    ↓
Backend broadcasts to admin dashboard
```

---

## 🛠️ Troubleshooting

### Camera Not Working

1. Check browser permissions (chrome://settings/content/camera)
2. Verify camera is not used by another app
3. Check console for errors
4. Try different browser

### WebSocket Connection Failed

1. Verify backend is running (http://localhost:8000/health)
2. Check WebSocket URL format
3. Check CORS settings in backend
4. Check browser console for errors

### AI Detection Not Working

1. Verify backend AI models loaded (check backend logs)
2. Verify frames being sent (check network tab, WebSocket frames)
3. Check frame size (should be 640x480)
4. Verify base64 encoding is correct

### Build Errors

```bash
# Clear cache
rm -rf node_modules
rm package-lock.json

# Reinstall
npm install

# Rebuild
npm run build
```

---

## 🚀 Production Build

### Build

```bash
npm run build
```

Output: `dist/` directory

### Preview

```bash
npm run preview
```

### Deploy

Deploy `dist/` folder to:

- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting

**Environment Variables:**

```env
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com
```

**Usage in code:**

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
```

---

## 📚 Key Features

✅ **No Camera Blinking** - Stream initialized once and reused  
✅ **Safari Compatible** - No permission queries in monitoring loop  
✅ **Clean Events** - One event per state change  
✅ **Production Safe** - Stream cleanup only on exam end  
✅ **Flexible Requirements** - Easy configuration per exam type  
✅ **Real-Time AI** - 3 FPS frame processing with immediate feedback  
✅ **Event Buffering** - No data loss during network issues  
✅ **Automatic Reconnection** - Exponential backoff strategy  
✅ **TypeScript** - Full type safety  
✅ **Modern Stack** - React 19 + Vite + Tailwind

---

## 📝 License

MIT License
