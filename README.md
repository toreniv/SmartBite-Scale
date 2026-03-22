# SmartBite Scale ⚖️🍽️

> A full-stack IoT nutrition tracking prototype — AI meal analysis,
> custom Bluetooth hardware, and a mobile-first React app, all wired together.

<p align="center">
  <img src="docs/screenshots/dashboard-screen.png" alt="Dashboard" width="220" />
  <img src="docs/screenshots/capture-screen.png" alt="Capture" width="220" />
  <img src="docs/screenshots/history-screen.png" alt="History" width="220" />
</p>

---

## Screenshots

<p align="center">
  <img src="images/First_screen.jpg" alt="Connect your scale" width="200" />
  <img src="images/Home_screen.jpg" alt="Home — live weight and meal result" width="200" />
  <img src="images/Capture_screen.jpg" alt="Capture — photo meal analysis" width="200" />
  <img src="images/Profile_screen.jpg" alt="Profile — health goals and account" width="200" />
</p>

<p align="center">
  <sub>From left: Scale connection · Live dashboard · Meal capture · Profile & goals</sub>
</p>
 
 ---


## What is this?

SmartBite Scale is an end-to-end prototype that combines a **custom-built
Bluetooth food scale** with **AI-powered meal recognition** to give instant
nutritional estimates from a single photo — anchored to a real measured weight.

The project spans three layers:

| Layer | Technology |
|---|---|
| Mobile app | Next.js 15 + React 19 + Tailwind CSS + Framer Motion |
| AI backend | Google Gemini 1.5 Flash, server-side only, with OpenAI fallback |
| Hardware | Arduino Mega + HX711 load cell + HC-06 Bluetooth Classic |

---

## Why I built this

Most nutrition apps ask you to search a database and guess your portion size.
SmartBite removes both steps: the scale weighs the food, the camera identifies
it, and the AI combines both signals into a single macro estimate — no manual
input required.

---

## Technical highlights

- **Server-side AI key handling** — Gemini API key never reaches the client.
  All analysis goes through a Next.js API route with an OpenAI fallback chain.

- **Custom BLE/Bluetooth Classic protocol** — Arduino firmware streams
  `WEIGHT:123.45` over HC-06 RFCOMM. The Android app parses this in a
  dedicated hook with reconnect logic and a live debug console.

- **Dual build target** — `NEXT_OUTPUT_MODE=server` for hosted web,
  `NEXT_OUTPUT_MODE=export` for static Capacitor Android builds, controlled
  by a single environment variable.

- **Demo mode** — full app experience without hardware. Weight values are
  clearly marked as estimated, not measured. No silent faking.

- **Profile-based targets** — calorie and macro goals calculated from age,
  weight, height, activity level, and goal type.

- **Bilingual** — full English and Hebrew UI.

---

## Current status

This is an **active prototype**, not a production product.

**Working end-to-end today:**
- Photo capture → server-side Gemini analysis → macro result display
- Android Bluetooth Classic connect/disconnect/stream/tare flow
- Local meal history with per-entry detail view
- Profile-based daily nutrition targets
- Demo mode with consistent weight values across screens
- Android Capacitor shell with static export build

**In progress:**
- Production deployment and backend hosting
- `CALIBRATE:<float>` firmware command
- PWA / iOS distribution
- Polished onboarding and screenshots

---

## Architecture

```
┌─────────────────────────────────┐
│        Mobile App (Next.js)     │
│  React UI + Framer Motion       │
│  Capacitor Android shell        │
└────────────┬────────────────────┘
             │ /api/analyze-meal
┌────────────▼────────────────────┐
│      Next.js API Route          │
│  Gemini 1.5 Flash (primary)     │
│  OpenAI Vision (fallback)       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│      Arduino Mega Firmware      │
│  HX711 load cell → grams        │
│  HC-06 Bluetooth Classic        │
│  Serial protocol: WEIGHT / TARE │
└────────────┬────────────────────┘
             │ Bluetooth RFCOMM
┌────────────▼────────────────────┐
│   Android Bluetooth Hook        │
│   useBluetoothScale.ts          │
└─────────────────────────────────┘
```

---

## Repository layout

```
app/                          Next.js App Router + API routes
components/
  cards/                      Scale status, meal result, history cards
  screens/                    Home, Capture, History, Profile screens
  ui/                         Reusable components
hooks/                        Bluetooth, camera, meal analysis, profile
lib/
  ai/                         Gemini + OpenAI integration, mock fallback
  nutrition/                  Macro calculation helpers
  storage/                    Local history and profile persistence
  i18n/                       English / Hebrew translations
public/                       Static assets and icons
android/                      Capacitor Android project
firmware/
  arduino-mega-hc06/          Arduino Mega firmware (HX711 + HC-06)
docs/
  screenshots/                App screenshots for README
```

---

## Getting started

### Prerequisites

- Node.js 18+
- A Gemini API key (free) — [aistudio.google.com](https://aistudio.google.com)
- Android Studio (for mobile builds)
- Arduino IDE (for firmware, optional)

### Install and run

```bash
git clone https://github.com/torenniv/SmartBite-Scale.git
cd SmartBite-Scale
npm install
cp .env.example .env.local   # fill in your Gemini key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — demo mode works
immediately, no hardware needed.

### Environment

```env
# Server-only — never expose to client
GEMINI_API_KEY=your_key_here

# Build target: "server" for web hosting, "export" for Capacitor
NEXT_OUTPUT_MODE=server

# Frontend base URL — leave empty for local dev
NEXT_PUBLIC_API_BASE_URL=
```

### Android build

```bash
npm run build
npx cap sync android
npx cap open android
```

---

## Bluetooth protocol reference

The app communicates with the Arduino over HC-06 RFCOMM
(UUID `00001101-0000-1000-8000-00805F9B34FB`, baud `9600`).

**Arduino → App:**
```
WEIGHT:123.45   live weight in grams
STATUS:READY    scale initialized
TARE_DONE       tare completed
PONG            response to PING
```

**App → Arduino:**
```
TARE            zero the scale
STREAM_ON       start weight stream
STREAM_OFF      stop weight stream
PING            connection check
```

---

## Known limitations

- Web Bluetooth / Bluetooth Classic support requires Chrome on Android
- AI macro accuracy depends heavily on image quality and meal complexity
- `CALIBRATE:<float>` firmware command is not yet implemented
- No cloud sync — all data is stored locally in the browser
- Authentication is local-only (localStorage)

---

## License

MIT © [Niv Toren](https://github.com/torenniv)
```

