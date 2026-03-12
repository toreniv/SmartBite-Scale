"use client";

import { ArrowRight, Bluetooth, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function WelcomeScreen({
  onConnect,
  onContinue,
}: {
  onConnect: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col justify-between px-5 pb-7 pt-8">
      <div className="rounded-[34px] border border-white/70 bg-white/70 p-6 shadow-[0_24px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
          Smart nutrition
        </div>
        <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950">
          SmartBite Scale
        </h1>
        <p className="mt-4 max-w-xs text-base leading-7 text-slate-600">
          Estimate calories and macros with a food image, live scale weight, and simple daily guidance.
        </p>

        <div className="mt-8 rounded-[28px] bg-[linear-gradient(145deg,#eff6ff,#dbeafe)] p-5">
          <div className="text-sm font-medium text-slate-500">What you get</div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            <li>Live BLE weight tracking with stabilized serving detection</li>
            <li>AI-ready meal analysis with OpenAI first and Gemini fallback</li>
            <li>Calorie targets, BMI, BMR, TDEE, and lightweight nutrition insights</li>
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        <Button fullWidth onClick={onConnect}>
          <Bluetooth className="mr-2 h-4 w-4" />
          Connect your scale
        </Button>
        <Button variant="secondary" fullWidth onClick={onContinue}>
          Continue without scale
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <div className="flex items-center justify-center gap-1 text-sm text-slate-500">
          Made with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> by SmartBite
        </div>
      </div>
    </div>
  );
}
