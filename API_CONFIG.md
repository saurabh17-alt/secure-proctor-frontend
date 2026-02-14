# API Configuration Guide

This project uses centralized API configuration for easy environment management.

## 📁 Configuration Files

### 1. `/src/config/api.config.ts`

Central configuration for all API endpoints and WebSocket URLs.

```typescript
// API Base URL - automatically reads from .env
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// All endpoints centralized
export const API_ENDPOINTS = {
  violations: {
    save: `${API_BASE_URL}/api/violations/save`,
    listAll: `${API_BASE_URL}/api/violations/list-all`,
    // ...
  },
  websocket: {
    proctor: (examId, candidateId) =>
      `${WS_BASE_URL}/ws/proctor/${examId}/${candidateId}`,
  },
};
```

### 2. `/src/services/api.service.ts`

HTTP client with built-in features:

- ✅ Automatic token injection
- ✅ Request/response interceptors
- ✅ Error handling
- ✅ Timeout management
- ✅ Logging

## 🚀 Usage

### Making API Calls

**Before (hardcoded):**

```typescript
const response = await fetch("http://localhost:8000/api/violations/list-all");
const data = await response.json();
```

**After (centralized):**

```typescript
import { apiClient } from "@/services/api.service";
import { API_ENDPOINTS } from "@/config/api.config";

const data = await apiClient.get(API_ENDPOINTS.violations.listAll);
```

### GET Request

```typescript
import { apiClient } from "@/services/api.service";

const violations = await apiClient.get("/api/violations/list-all");
```

### POST Request

```typescript
const result = await apiClient.post("/api/violations/save", {
  exam_id: "exam_123",
  candidate_id: "candidate_abc",
  violation_type: "no_face",
  image: "base64...",
});
```

### With Authentication Token

```typescript
// Token is automatically added from localStorage['auth_token']
const data = await apiClient.get("/api/protected-endpoint");

// Skip auth if needed
const publicData = await apiClient.get("/api/public", { skipAuth: true });
```

### Using Image URLs

```typescript
import { API_ENDPOINTS } from '@/config/api.config';

<img src={API_ENDPOINTS.violations.image(violation.image_url)} />
```

### WebSocket Connections

```typescript
import { API_ENDPOINTS } from "@/config/api.config";

const wsUrl = API_ENDPOINTS.websocket.proctor(examId, candidateId);
const socket = new WebSocket(wsUrl);
```

## 🌍 Environment Configuration

### Local Development (.env)

```bash
VITE_API_URL=http://localhost:8000
```

### Production

```bash
VITE_API_URL=https://api.your-domain.com
```

### Change Environment

1. Create/edit `.env` file in `/frontend` folder
2. Restart Vite dev server: `npm run dev`

## 🔒 Authentication

Store auth token in localStorage:

```typescript
localStorage.setItem("auth_token", "your-token-here");
```

It will be automatically included in all API requests as:

```
Authorization: Bearer your-token-here
```

## 🛠️ Advanced Features

### Custom Timeout

```typescript
const data = await apiClient.get("/api/endpoint", {
  timeout: 60000, // 60 seconds
});
```

### Custom Headers

```typescript
const data = await apiClient.post("/api/endpoint", payload, {
  headers: {
    "X-Custom-Header": "value",
  },
});
```

### Error Handling

```typescript
try {
  const data = await apiClient.get("/api/endpoint");
} catch (error) {
  console.error("API Error:", error.message);
  // Error message is automatically extracted from response
}
```

## 📝 Migration Checklist

To migrate existing code:

1. ✅ Import API service and config

   ```typescript
   import { apiClient } from "@/services/api.service";
   import { API_ENDPOINTS } from "@/config/api.config";
   ```

2. ✅ Replace `fetch()` calls with `apiClient.get/post/put/delete()`

3. ✅ Use `API_ENDPOINTS` for URL construction

4. ✅ Remove manual error handling (apiClient handles it)

5. ✅ Remove manual header construction (apiClient adds auth automatically)

## 🎯 Benefits

✅ **Single Source of Truth** - Change API URL in one place  
✅ **Environment Support** - Easy dev/staging/prod switching  
✅ **Type Safety** - TypeScript support throughout  
✅ **Auto Token Injection** - No manual auth headers  
✅ **Error Handling** - Consistent error messages  
✅ **Logging** - Built-in request/response logging  
✅ **Timeout Management** - Prevent hanging requests

## 📚 Files Updated

- ✅ `ViolationsReport.tsx` - Uses apiClient
- ✅ `useAIProcessing.ts` - Uses apiClient
- ✅ `proctorSocket.ts` - Uses API_ENDPOINTS for WebSocket
- ✅ All image URLs - Use API_ENDPOINTS.violations.image()

## 🔍 Debugging

Check browser console for API logs:

```
🌐 GET http://localhost:8000/api/violations/list-all
🌐 POST http://localhost:8000/api/violations/save {...}
```

Check WebSocket connection:

```
🔌 Connecting to: ws://localhost:8000/ws/proctor/exam_123/candidate_abc
```
