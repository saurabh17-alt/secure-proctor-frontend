# MediaPipe Offline Setup

This guide shows how to use MediaPipe face detection without CDN access (for environments that block external APIs like Google CDN).

## Setup Steps

### 1. Download MediaPipe Files

Run the download script from the frontend directory:

```powershell
cd frontend
.\download_mediapipe.ps1
```

This will download:

- `public/mediapipe/vision_bundle.mjs` - MediaPipe vision library
- `public/mediapipe/wasm/*.wasm` - WebAssembly runtime files
- `public/mediapipe/models/blaze_face_short_range.tflite` - Face detection model

### 2. Files Structure

After download, your `frontend/public/` folder should look like:

```
frontend/public/
└── mediapipe/
    ├── vision_bundle.mjs
    ├── wasm/
    │   ├── vision_wasm_internal.js
    │   ├── vision_wasm_internal.wasm
    │   └── ... (other WASM files)
    └── models/
        └── blaze_face_short_range.tflite
```

### 3. Configuration

In `frontend/src/hooks/useAIProcessing.ts`, set:

```typescript
const USE_LOCAL_FILES = true; // Use local files (offline mode)
// OR
const USE_LOCAL_FILES = false; // Use CDN (online mode)
```

### 4. Verification

Start the frontend:

```powershell
cd frontend
npm run dev
```

Open browser console and look for:

```
📦 Loading from local files...
📦 MediaPipe module loaded: ...
✅ MediaPipe FaceDetector loaded successfully
```

## Switching Between Local and CDN

**Local Files (Offline):**

- Set `USE_LOCAL_FILES = true`
- Works without internet
- Faster loading (no CDN latency)
- Files served from your own server

**CDN (Online):**

- Set `USE_LOCAL_FILES = false`
- Always uses latest MediaPipe version
- No manual updates needed
- Requires internet access

## File Sizes

Approximate sizes:

- vision_bundle.mjs: ~500 KB
- WASM files: ~8-10 MB total
- Face model: ~1 MB

**Total: ~11-12 MB**

## Updating MediaPipe

To update to a newer version:

1. Delete the old files:

   ```powershell
   Remove-Item -Recurse -Force frontend\public\mediapipe
   ```

2. Run the download script again:
   ```powershell
   cd frontend
   .\download_mediapipe.ps1
   ```

## Troubleshooting

### Issue: Files not loading

**Check 1:** Verify files exist

```powershell
ls frontend\public\mediapipe\
```

**Check 2:** Check browser console for 404 errors

- If you see 404 errors, files weren't downloaded correctly
- Re-run the download script

**Check 3:** Verify Vite is serving public folder

- Public folder files should be accessible at `/mediapipe/...`
- Try accessing: http://localhost:5173/mediapipe/vision_bundle.mjs

### Issue: CORS errors

If you see CORS errors with local files:

1. Ensure Vite dev server is running (not opening HTML directly)
2. Files should be served from same origin (localhost:5173)
3. Check vite.config.ts doesn't block `.mjs` files

### Issue: WASM files not found

If you see errors like "Cannot find vision_wasm_internal.wasm":

1. Check the wasm folder has all files
2. Verify the wasmPath is correct: `/mediapipe/wasm`
3. Try accessing: http://localhost:5173/mediapipe/wasm/vision_wasm_internal.wasm

## Production Deployment

For production builds:

1. **Download files** before building:

   ```powershell
   .\download_mediapipe.ps1
   npm run build
   ```

2. **Verify** files are included in `dist/` folder:

   ```powershell
   ls dist\mediapipe\
   ```

3. **Ensure** your web server serves static files correctly:
   - Files should be accessible at `https://yourdomain.com/mediapipe/...`
   - MIME types should be correct (.mjs = application/javascript, .wasm = application/wasm)

## Benefits of Local Files

✅ **Works offline** - No internet required  
✅ **No CDN dependency** - Google CDN blocks won't affect you  
✅ **Faster loading** - No CDN latency  
✅ **Version control** - Exact version you tested with  
✅ **Corporate networks** - Works behind firewalls that block CDNs

## When to Use Each Approach

**Use Local Files:**

- Production deployments
- Corporate/restricted networks
- Air-gapped systems
- When Google services are blocked
- Offline exam environments

**Use CDN:**

- Development only
- Always online environments
- When you want automatic updates
- Quick prototyping
