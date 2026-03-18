# SmartBite Scale

SmartBite Scale is an active prototype for meal tracking with two inputs:

- a connected food scale for live weight data
- a photo-based meal analysis flow powered by a server-side Gemini integration

The project is built as a mobile-first Next.js app and includes a Capacitor Android shell plus firmware for the Arduino-based scale prototype.

## Status

This repository is a working prototype, not a finished product.

What works today:

- meal photo analysis through a backend `/api/analyze` route
- server-only Gemini key handling
- profile-based calorie and macro targets
- local meal history stored in the browser
- demo mode for testing without hardware
- Bluetooth scale connection flow and debug tooling
- static export support for Capacitor builds

What is still in progress:

- production deployment and mobile distribution
- polished screenshots and product walkthrough assets
- hardening around hardware setup, testing, and edge cases
- backend hosting configuration for shared production use

## Demo Scope

The app currently focuses on the core prototype loop:

1. connect a scale or enter demo mode
2. capture or upload a meal photo
3. send the meal to the backend analysis route
4. return estimated calories, protein, carbs, fat, and confidence
5. view the result alongside daily targets and meal history

## Stack

- Next.js App Router
- React 19
- Tailwind CSS 4
- Framer Motion
- Capacitor Android
- Google Gemini via a server-side route
- Arduino Mega + HX711 firmware prototype

## Repository Layout

```text
app/                         Next.js routes and API handlers
components/                  UI components and mobile-first screens
hooks/                       Camera, Bluetooth, profile, and meal-analysis hooks
lib/                         Shared logic, AI helpers, nutrition, storage, i18n
public/                      Static app assets
android/                     Capacitor Android project
firmware/arduino-mega-hc06/  Arduino firmware prototype
```

## Local Setup

```bash
npm install
npm run dev
```

Create a `.env.local` file for local work. Use `.env.example` as the source of truth for required variables.

For local development, the current default flow is:

- run the Next.js app locally
- keep `NEXT_PUBLIC_API_BASE_URL` empty for same-origin requests
- keep Gemini credentials server-side only

## Environment Notes

Important:

- `GEMINI_API_KEY` must stay server-only
- `NEXT_PUBLIC_API_BASE_URL` is only for the frontend base URL
- `NEXT_OUTPUT_MODE=server` is used for hosted web/backend deployments
- `NEXT_OUTPUT_MODE=export` is used for static Capacitor builds

See `.env.example` for the current supported configuration.

## Screenshots

Recommended screenshot location:

```text
docs/screenshots/
```

Recommended filenames:

- `welcome-screen.png`
- `dashboard-screen.png`
- `capture-screen.png`
- `history-screen.png`
- `profile-screen.png`

Ready-to-paste markdown snippet:

```md
## Screenshots

<p align="center">
  <img src="docs/screenshots/welcome-screen.png" alt="Welcome screen" width="220" />
  <img src="docs/screenshots/dashboard-screen.png" alt="Dashboard screen" width="220" />
  <img src="docs/screenshots/capture-screen.png" alt="Capture screen" width="220" />
</p>

<p align="center">
  <img src="docs/screenshots/history-screen.png" alt="History screen" width="220" />
  <img src="docs/screenshots/profile-screen.png" alt="Profile screen" width="220" />
</p>
```

## Notes for Reviewers

- authentication is currently local-only and stored in browser storage
- the hardware integration is a prototype path, with a demo mode available when hardware is not connected
- nutrition estimates are guidance, not medical advice

## License

MIT
