# Media Requirements Configuration

## 📋 Overview

The proctoring system now supports flexible media requirements. You can configure whether camera, microphone, or both are required for an exam.

## 🎯 Use Cases

### 1️⃣ Camera Only (No Audio Required)

**Example:** Written exam with visual monitoring only

```typescript
import { MEDIA_PRESETS } from "../../proctoring/core/mediaConfig";

const requirements = MEDIA_PRESETS.CAMERA_ONLY;
// { camera: true, microphone: false }
```

**Behavior:**

- ✅ Camera MUST be available or exam fails
- ⊘ Microphone not requested
- ✅ No errors if microphone is off/denied

---

### 2️⃣ Audio Only (No Camera Required)

**Example:** Oral exam or voice interview

```typescript
const requirements = MEDIA_PRESETS.AUDIO_ONLY;
// { camera: false, microphone: true }
```

**Behavior:**

- ⊘ Camera not requested
- ✅ Microphone MUST be available or exam fails
- ✅ No errors if camera is off/denied

---

### 3️⃣ Both Required (Full Proctoring)

**Example:** High-stakes certification exam

```typescript
const requirements = MEDIA_PRESETS.BOTH;
// { camera: true, microphone: true }
```

**Behavior:**

- ✅ Camera MUST be available
- ✅ Microphone MUST be available
- ❌ Exam fails if either is unavailable

---

## 🔧 Implementation

### In Exam Component

```typescript
// Change this line to configure requirements:
const requirements = MEDIA_PRESETS.BOTH; // or CAMERA_ONLY or AUDIO_ONLY

// Initialize with requirements
const { stream, errors } = await initializeMediaStream(requirements);

// Only shows errors for REQUIRED devices
if (requirements.camera && errors.camera) {
  console.error("Camera error:", errors.camera);
}
if (requirements.microphone && errors.microphone) {
  console.error("Microphone error:", errors.microphone);
}
```

---

## 🎨 Custom Configuration

You can also create custom configurations:

```typescript
const customRequirements = {
  camera: true, // Required
  microphone: false, // Optional
};

await initializeMediaStream(customRequirements);
```

---

## 📊 Monitoring Behavior

The monitor only tracks and reports on **REQUIRED** devices:

```typescript
// If CAMERA_ONLY:
✅ Emits: camera_status { status: "on"|"off", required: true }
⊘ Does NOT emit: mic_status

// If AUDIO_ONLY:
⊘ Does NOT emit: camera_status
✅ Emits: mic_status { status: "on"|"off", required: true }

// If BOTH:
✅ Emits: camera_status { status: "on"|"off", required: true }
✅ Emits: mic_status { status: "on"|"off", required: true }
```

---

## ✅ Production Benefits

1. **No False Positives** - Only shows errors for required devices
2. **Flexible Requirements** - Easy to configure per exam type
3. **Better UX** - Students not blocked by unnecessary device requirements
4. **Clean Logs** - Only relevant events are logged
5. **Independent Devices** - Camera and mic don't block each other

---

## 🚀 Quick Start

**Step 1:** Open `Exam.tsx`

**Step 2:** Change this line:

```typescript
const requirements = MEDIA_PRESETS.BOTH; // Change to CAMERA_ONLY or AUDIO_ONLY
```

**Step 3:** Done! The system automatically:

- Requests only required devices
- Shows errors only for required devices
- Monitors only required devices

---

## 📝 Error Messages

```typescript
// Camera required but failed
"Camera: Permission denied";

// Microphone required but failed
"Microphone: NotFoundError";

// Both required but both failed
"Camera: Permission denied | Microphone: NotFoundError";
```
