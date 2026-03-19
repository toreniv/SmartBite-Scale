### Local web development (already works, no backend needed)
Terminal 1: npm run dev
Browser: http://localhost:3000
Note: NEXT_PUBLIC_API_BASE_URL must be empty for this mode

### Full stack local (backend + frontend)
Terminal 1: cd backend && npm install && npm run dev
Terminal 2: npm run dev
Set in .env.local: NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

### Android Emulator
cd backend && npm run dev
Set in .env.local: NEXT_PUBLIC_API_BASE_URL=http://10.0.2.2:3001
npm run build && npx cap sync && npx cap open android
Note: 10.0.2.2 maps to your host machine's localhost inside the Android emulator

### Physical Android device
Option A — ngrok tunnel:
  ngrok http 3001
  Copy the https URL (e.g. https://abc123.ngrok.io)
  Set NEXT_PUBLIC_API_BASE_URL=https://abc123.ngrok.io
  npm run build && npx cap sync && npx cap open android

Option B — Local network:
  Find your machine's local IP (e.g. 192.168.1.x)
  Set NEXT_PUBLIC_API_BASE_URL=http://192.168.1.x:3001
  Phone and computer must be on the same WiFi network
