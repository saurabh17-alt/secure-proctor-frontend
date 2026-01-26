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
│   │   │   └── Exam.tsx                 # Main exam page with proctoring
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

### 2. Routing System

- ✅ React Router setup with layouts
- ✅ Candidate routes: `/`, `/system-check`, `/exam`
- ✅ Admin routes: `/admin`
- ✅ Layout components with headers and footers

### 3. UI/UX

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

### Install Dependencies

```bash
cd frontend
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📊 Event System

The proctoring system emits events for monitoring:

### Events Emitted

```typescript
// Camera status change
{
  status: "on" | "off",
  device: "camera",
  required: true,
  timestamp: 1706234567890
}

// Microphone status change
{
  status: "on" | "off",
  device: "microphone",
  required: true,
  timestamp: 1706234567890
}

// Stream lost (only if required media fails)
{
  error: "Required media stream not initialized",
  severity: "critical"
}
```

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
- Routing and layout structure
- Basic candidate and admin pages
- Error handling and loading states

**🚧 Next Steps (Backend):**

- Backend API setup
- WebSocket for real-time monitoring
- Database for exam data
- Admin panel integration
- Recording and storage system

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
