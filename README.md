# Secure Proctor - Frontend

A production-ready online proctoring system built with React, TypeScript, and Vite.

## 🚀 Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **Media:** MediaStream API (Camera & Microphone)

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   └── routes.tsx                    # Application routing configuration
│   │
│   ├── pages/
│   │   ├── candidate/
│   │   │   ├── JoinExam.tsx             # Exam entry point for candidates
│   │   │   ├── SystemCheck.tsx          # System verification page
│   │   │   ├── Exam.tsx                 # Main exam page with proctoring
│   │   │   └── TestExam.tsx             # ⭐ Test page with on-screen logs
│   │   │
│   │   └── admin/
│   │       └── Dashboard.tsx            # Admin dashboard
│   │
│   ├── components/
│   │   └── layout/
│   │       ├── CandidateLayout.tsx      # Layout wrapper for candidates
│   │       └── AdminLayout.tsx          # Layout wrapper for admins
│   │
│   ├── proctoring/
│   │   └── core/
│   │       ├── mediaConfig.ts           # Media requirements configuration
│   │       ├── streamManager.ts         # Global stream lifecycle management
│   │       └── mediaMonitor.ts          # Production-ready media monitoring
│   │
│   ├── hooks/
│   │   └── useSystemCheck.ts            # System check custom hook
│   │
│   ├── App.tsx                          # Main app component
│   ├── main.tsx                         # Application entry point
│   └── index.css                        # Global styles with Tailwind
│
├── public/                               # Static assets
├── MEDIA_REQUIREMENTS.md                 # Documentation for media configuration
└── package.json                          # Dependencies and scripts
```

## ✨ Features Implemented

### 1. Proctoring System (Production-Ready)

#### **Media Stream Management**

- ✅ Global stream to prevent camera blinking
- ✅ Separate camera and microphone requests (independent failure handling)
- ✅ Configurable requirements (camera only, audio only, or both)
- ✅ Stream reuse and proper cleanup
- ✅ No re-requesting permissions during monitoring

#### **Media Monitoring**

- ✅ Real-time camera and microphone status tracking
- ✅ Only monitors required devices
- ✅ No permission queries in monitoring loop (Safari compatible)
- ✅ Single event per state change (no duplicate events)
- ✅ Accurate initial state detection
- ✅ Independent device monitoring (one failing doesn't affect the other)

#### **Key Improvements Over Standard Implementations**

1. **No Camera Blinking:** Stream initialized once and reused
2. **Safari Compatible:** No permission queries in interval loop
3. **Clean Events:** One event per state change with timestamps
4. **Production Safe:** Stream cleanup only on exam end, not on component re-render
5. **Flexible Requirements:** Easy configuration per exam type
6. **Error Clarity:** Specific error messages for each device

### 2. Event Buffering & Reconnection (Phase 2)

- ✅ **Client-side event buffering** - Events stored locally during disconnection
- ✅ **Automatic reconnection** - Exponential backoff strategy
- ✅ **Batch submission** - Buffered events sent on reconnect
- ✅ **No event loss** - All events preserved during network issues
- ✅ **Connection status UI** - Visual indicators for connection state

### 3. Test Page (Phase 3) ⭐

- ✅ **TestExam.tsx** - Dedicated testing page at `/test-exam/:examId`
- ✅ **Start/Stop controls** - Manual test control buttons
- ✅ **On-screen logs** - Live color-coded event display (info/warning/error/violation)
- ✅ **Permission denial testing** - Visual warnings when camera/mic blocked
- ✅ **Real-time violation display** - Shows backend violation warnings/termination
- ✅ **Scrollable log panel** - 600px height with auto-scroll to latest

### 4. Routing System

- ✅ React Router setup with layouts
- ✅ Candidate routes: `/join-exam`, `/system-check`, `/exam/:examId`, `/test-exam/:examId`
- ✅ Admin routes: `/admin`
- ✅ Layout components with headers and footers
- ✅ Dynamic exam IDs for multiple exams

#### **Available Routes**

| Route                | Description                    | Parameters                        |
| -------------------- | ------------------------------ | --------------------------------- |
| `/join-exam`         | Exam entry point               | None                              |
| `/system-check`      | Pre-exam system check          | None                              |
| `/exam/:examId`      | Main exam page with proctoring | `examId` - Unique exam identifier |
| `/test-exam/:examId` | Test page with on-screen logs  | `examId` - Unique exam identifier |
| `/admin`             | Admin dashboard                | None                              |

**Example URLs:**

- http://localhost:5173/exam/exam_123
- http://localhost:5173/test-exam/test_exam_123
- http://localhost:5173/exam/midterm_2026
- http://localhost:5173/exam/final_exam

### 5. Backend Integration

- ✅ API integration for proctor events
- ✅ Vite proxy configuration (no CORS issues)
- ✅ Type-safe event schemas matching backend
- ✅ Real-time event sending to backend API
- ✅ Tab blur detection and reporting
- ✅ Fullscreen exit detection and reporting

#### **Proctor Events Sent to Backend**

The frontend automatically sends these events to the backend:

1. **Camera Status** (`camera_status`)
   - Triggered when camera turns on/off
   - Severity: `critical` if off, `info` if on

2. **Microphone Status** (`mic_status`)
   - Triggered when microphone turns on/off
   - Severity: `critical` if off, `info` if on

3. **Tab Blur** (`tab_blur`)
   - Triggered when candidate switches tabs
   - Severity: `warning`

4. **Fullscreen Exit** (`fullscreen_exit`)
   - Triggered when candidate exits fullscreen
   - Severity: `critical`

5. **Stream Lost** (`stream_lost`)
   - Triggered when media stream disconnects
   - Severity: `critical`

**Event Payload Example:**

```typescript
{
  examId: "exam_123",
  candidateId: "candidate_abc123",
  type: "camera_status",
  payload: { enabled: true, deviceId: "camera_001" },
  severity: "info",
  timestamp: 1769433337465
}
```

### 4. UI/UX

- ✅ Tailwind CSS fully configured
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling with user-friendly messages
- ✅ Retry functionality for media errors

## 🎯 Media Requirements Configuration

The system supports three media requirement modes:

### **CAMERA_ONLY**

```typescript
const requirements = MEDIA_PRESETS.CAMERA_ONLY;
```

- Camera required, microphone optional
- Use for: Written exams with visual monitoring

### **AUDIO_ONLY**

```typescript
const requirements = MEDIA_PRESETS.AUDIO_ONLY;
```

- Microphone required, camera optional
- Use for: Oral exams or voice interviews

### **BOTH**

```typescript
const requirements = MEDIA_PRESETS.BOTH;
```

- Both camera and microphone required
- Use for: High-stakes certification exams

**Configuration Location:** [`src/pages/candidate/Exam.tsx`](src/pages/candidate/Exam.tsx#L24)

See [MEDIA_REQUIREMENTS.md](MEDIA_REQUIREMENTS.md) for detailed documentation.

## 🔧 Setup & Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see [backend/README.md](../backend/README.md))

### Install Dependencies

```bash
cd frontend
npm install
```

### Configure Backend Connection

The frontend uses Vite proxy to connect to the backend. Configuration is in [`vite.config.ts`](vite.config.ts):

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
    '/ws': {
      target: 'ws://localhost:8000',
      ws: true,
      changeOrigin: true,
    },
  },
}
```

**Make sure your backend is running on port 8000!**

### Run Development Server

```bash
npm run dev
```

**Frontend will run at:** http://localhost:5173

### Test the Application

1. **Start Backend** (in separate terminal):

   ```bash
   cd ../backend
   uvicorn app.main:app --reload
   ```

2. **Access Exam Page:**
   - Navigate to: http://localhost:5173/exam/exam_123
   - Allow camera and microphone permissions
   - Check browser console for: `✅ Event sent: camera_status → Event ID: 1`

3. **Test Event Detection:**
   - Switch tabs → `tab_blur` event sent
   - Exit fullscreen → `fullscreen_exit` event sent
   - Disable camera → `camera_status` with severity `critical`

4. **Verify in Backend:**
   - Check backend terminal for: `INFO: Event ingested: camera_status...`
   - Or visit: http://localhost:8000/docs (Swagger UI)
   - Query events: `GET /api/proctor/events?exam_id=exam_123`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📊 Event System

The proctoring system automatically sends events to the backend API at `/api/proctor/events`.

### Events Emitted and Sent to Backend

**Camera Status Change:**

```typescript
{
  examId: "exam_123",
  candidateId: "candidate_abc123",
  type: "camera_status",
  payload: {
    status: "on" | "off",
    device: "camera",
    required: true,
    timestamp: 1769433337465
  },
  severity: "info" | "critical",
  timestamp: 1769433337465
}
```

**Microphone Status Change:**

```typescript
{
  examId: "exam_123",
  candidateId: "candidate_abc123",
  type: "mic_status",
  payload: {
    status: "on" | "off",
    device: "microphone",
    required: true,
    timestamp: 1769433337465
  },
  severity: "info" | "critical",
  timestamp: 1769433337465
}
```

**Tab Blur (Candidate Switched Tabs):**

```typescript
{
  examId: "exam_123",
  candidateId: "candidate_abc123",
  type: "tab_blur",
  payload: {
    blurred: true,
    timestamp: 1769433337465
  },
  severity: "warning",
  timestamp: 1769433337465
}
```

**Fullscreen Exit:**

```typescript
{
  examId: "exam_123",
  candidateId: "candidate_abc123",
  type: "fullscreen_exit",
  payload: {
    exited: true,
    reason: "user_action"
  },
  severity: "critical",
  timestamp: 1769433337465
}
```

**Stream Lost:**

```typescript
{
  examId: "exam_123",
  candidateId: "candidate_abc123",
  type: "stream_lost",
  payload: {
    error: "Required media stream not initialized",
    severity: "critical"
  },
  severity: "critical",
  timestamp: 1769433337465
}
```

### Backend Response

When an event is successfully sent, the backend returns:

```json
{
  "status": "ok",
  "event_id": 1,
  "server_timestamp": 1769433340123
}
```

### Viewing Events

**Option 1: Browser Console**

- Open DevTools → Console
- Look for: `✅ Event sent: camera_status → Event ID: 1`

**Option 2: Backend Logs**

- Check terminal running uvicorn
- Look for: `INFO: Event ingested: camera_status from candidate_xxx (latency: 50ms)`

**Option 3: Backend API**

- Visit: http://localhost:8000/docs
- Use `GET /api/proctor/events` endpoint
- Filter by `exam_id` to see all events for an exam

## 🛠️ Key Files

### Core Proctoring Files

| File                                                       | Purpose                                      |
| ---------------------------------------------------------- | -------------------------------------------- |
| [`mediaConfig.ts`](src/proctoring/core/mediaConfig.ts)     | Configuration presets for media requirements |
| [`streamManager.ts`](src/proctoring/core/streamManager.ts) | Global stream initialization and lifecycle   |
| [`mediaMonitor.ts`](src/proctoring/core/mediaMonitor.ts)   | Real-time media status monitoring            |

### Page Components

| File                                                     | Purpose                               |
| -------------------------------------------------------- | ------------------------------------- |
| [`JoinExam.tsx`](src/pages/candidate/JoinExam.tsx)       | Exam entry page for candidates        |
| [`SystemCheck.tsx`](src/pages/candidate/SystemCheck.tsx) | Pre-exam system verification          |
| [`Exam.tsx`](src/pages/candidate/Exam.tsx)               | Main exam page with active proctoring |
| [`Dashboard.tsx`](src/pages/admin/Dashboard.tsx)         | Admin dashboard for monitoring        |

## 🎨 Styling

- **Framework:** Tailwind CSS v4
- **Configuration:** [`tailwind.config.js`](tailwind.config.js)
- **PostCSS:** [@tailwindcss/postcss](postcss.config.mjs)
- **Global Styles:** [`src/index.css`](src/index.css)

## 🔐 Production Checklist

- [x] No permission queries in monitoring loop
- [x] Single event per state change
- [x] Stream cleanup only on exam end
- [x] Safari compatibility
- [x] React strict mode safe
- [x] No camera blinking
- [x] Clean, minimal events
- [x] Timestamp for all events
- [x] Proper error handling
- [x] Independent camera/microphone
- [x] Configurable requirements
- [x] Accurate initial state detection

## 📝 Development Notes

### Media Stream Best Practices

1. Initialize stream once with `initializeMediaStream()`
2. Reuse global stream with `getGlobalStream()`
3. Monitor without re-requesting permissions
4. Cleanup only when exam truly ends
5. Handle camera and microphone independently

### Common Issues Solved

- ✅ Camera blinking during monitoring
- ✅ Safari permission query errors
- ✅ Duplicate event emissions
- ✅ Stream dying on component re-render
- ✅ One device failure blocking the other
- ✅ False positives for optional devices

## 🚦 Current Status

**✅ Completed:**

- Frontend project setup (React + TypeScript + Vite + Tailwind)
- Production-ready proctoring system
- Flexible media requirements configuration
- Routing and layout structure with dynamic exam IDs
- Backend API integration with proctor events
- Real-time event detection and reporting:
  - Camera/microphone status monitoring
  - Tab blur detection
  - Fullscreen exit detection
- Vite proxy configuration (no CORS issues)
- Type-safe event schemas
- Error handling and loading states
- Basic candidate and admin pages

**🚧 Next Steps:**

- WebSocket integration for real-time admin monitoring
- Video streaming with WebRTC
- Admin dashboard with live event feed
- Authentication and authorization
- Session management
- Recording and playback functionality

## 🧪 Testing Guide

### Quick Test Flow

1. **Start Backend:**

   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Start Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Exam:**
   - Open: http://localhost:5173/exam/test_exam_123
   - Allow camera/mic permissions
   - Open browser DevTools → Console

4. **Test Events:**
   - ✅ See initial `camera_status` and `mic_status` events
   - ✅ Switch tabs → `tab_blur` event
   - ✅ Enter/exit fullscreen → `fullscreen_exit` event
   - ✅ Disable camera → `camera_status` with severity `critical`

5. **Verify Backend:**
   - Check backend logs for: `INFO: Event ingested...`
   - Or query: http://localhost:8000/api/proctor/events?exam_id=test_exam_123

### Troubleshooting

**Events not sending?**

- Verify backend is running on port 8000
- Check Network tab in DevTools for 404/403 errors
- Ensure Vite proxy is configured correctly

**Camera/Mic not working?**

- Allow browser permissions when prompted
- Try Chrome (recommended for best compatibility)
- Check if devices are available and not in use

**Route not found?**

- Make sure you're using `/exam/:examId` format
- Example: `/exam/exam_123` not `/exam/`

## 📚 Additional Documentation

- [Media Requirements Guide](MEDIA_REQUIREMENTS.md) - Detailed configuration guide
- [Production Ready Notes](../PRODUCTION_READY.md) - Production improvements made

## 🤝 Contributing

When making changes:

1. Update this README if adding new features
2. Document configuration options in MEDIA_REQUIREMENTS.md
3. Follow TypeScript strict mode
4. Test with Safari, Chrome, and Edge
5. Ensure camera/mic work independently

---

**Version:** 1.0.0  
**Last Updated:** January 26, 2026  
**Status:** Production-Ready Frontend
