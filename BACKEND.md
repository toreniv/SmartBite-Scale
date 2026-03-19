### Local web development (already works, no backend needed)
Terminal 1: npm run dev
Browser: http://localhost:3000
Note: NEXT_PUBLIC_API_BASE_URL must be empty for this mode

### Full stack local (backend + frontend)
Terminal 1: cd backend && npm install && npm run dev
Terminal 2: npm run dev
Set in .env.local: NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
Frontend requests should target /api/analyze-meal

### Android Emulator
cd backend && npm run dev
Set in .env.local: NEXT_PUBLIC_API_BASE_URL=http://10.0.2.2:3001
npm run build && npx cap sync android && npx cap open android
Note: 10.0.2.2 maps to your host machine's localhost inside the Android emulator

### Physical Android device (USB or same WiFi)

Find your machine's local IP:
- Windows: run `ipconfig` and look for IPv4 Address (e.g. 192.168.1.x)

Set in .env.local:
NEXT_OUTPUT_MODE=export
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.x:3001
ALLOW_MOCK_ANALYSIS_FALLBACK=false

Then:
npm run build
npx cap sync android

Open Android Studio, select your physical device, click Run.
The device and computer must be on the same WiFi network.
For USB debugging: enable Developer Options and USB Debugging on the device.

### Provider fallback order
- Gemini vision is the primary provider
- OpenAI vision is the fallback provider
- Mock analysis is the last resort and is only used when ALLOW_MOCK_ANALYSIS_FALLBACK=true

If ALLOW_MOCK_ANALYSIS_FALLBACK=false and no real API key is configured, the app returns an error instead of fake success.
