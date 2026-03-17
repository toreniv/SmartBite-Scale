# SmartBite Scale 🍽️⚖️

> AI-powered nutrition tracking through your smart food scale.

SmartBite Scale is a mobile-first web app that combines a Bluetooth smart
scale with AI meal analysis to give you instant, accurate nutritional data
from a single photo of your food.

---

## ✨ Features

- **Live weight tracking** — Real-time readings from a Bluetooth HX711-based scale
- **AI meal analysis** — Snap a photo, get calories, protein, carbs, and fat instantly
- **Gemini-powered** — Uses Google Gemini 1.5 Flash for fast and accurate food recognition
- **Meal history** — Full log of every scanned meal with detailed nutritional breakdown
- **Daily goals** — Personalized calorie and macro targets based on your health profile
- **Demo mode** — Try the full app without a physical scale
- **Multilingual** — English and Hebrew support
- **PWA-ready** — Works as an installable app on iOS and Android

---

## 📱 Screenshots

> Coming soon

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Google Gemini API key (free) → [aistudio.google.com](https://aistudio.google.com)

### Installation

```bash
git clone https://github.com/toreniv/SmartBite-Scale.git
cd SmartBite-Scale
npm install
```

### Environment Setup

Create a `.env.local` file in the root:

```env
# Get your free key at https://aistudio.google.com
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Tech Stack

| Layer      | Technology                 |
| ---------- | -------------------------- |
| Framework  | Next.js 14 (static export) |
| UI         | React + Tailwind CSS       |
| Animations | Framer Motion              |
| AI         | Google Gemini 1.5 Flash    |
| Bluetooth  | Web Bluetooth API          |
| Hardware   | ESP32 + HX711 load cell    |
| Storage    | localStorage               |
| Mobile     | Capacitor (iOS / Android)  |


---

## 🔧 Hardware

The physical scale is built with:
- **ESP32** microcontroller with Bluetooth LE
- **HX711** 24-bit ADC for precise weight measurement
- Custom 3D-printed tray housing

> Hardware schematics and firmware coming soon.

---

## 📂 Project Structure

```
SmartBite-Scale/
├── app/                  # Next.js app router
├── components/
│   ├── cards/            # UI cards (scale status, meal analysis, history)
│   ├── screens/          # Full screens (Home, Capture, History, Profile)
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks (Bluetooth, meal analysis)
├── lib/
│   ├── ai/               # Gemini integration + mock fallback
│   └── types.ts          # Shared TypeScript types
└── public/               # Static assets and icons
```

---

## 📄 License

MIT © Niv Toren

---

## 🙏 Acknowledgements

- [Google Gemini](https://deepmind.google/technologies/gemini/) for AI meal analysis
- [Lucide Icons](https://lucide.dev) for the icon set
- [Framer Motion](https://www.framer.com/motion/) for animations
```

***
