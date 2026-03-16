"use client";

import { useState, type FormEvent } from "react";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";
import { signIn, signUp } from "@/lib/localAuth";

type AuthMode = "login" | "signup";

function AuthFormCard({
  mode,
  setMode,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  error,
  submitting,
  onSubmit,
}: {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string;
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isSignUp = mode === "signup";

  return (
    <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92))] shadow-[0_24px_60px_rgba(37,99,235,0.14)]">
      <div className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
        SmartBite Scale
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {isSignUp
          ? "Save your profile locally and keep your SmartBite experience personal on this device."
          : "Sign in to continue with your saved profile, goals, and meal history on this device."}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-[22px] bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-[18px] px-4 py-2.5 text-sm font-semibold transition ${
            !isSignUp ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-[18px] px-4 py-2.5 text-sm font-semibold transition ${
            isSignUp ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
          }`}
        >
          Sign Up
        </button>
      </div>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        {isSignUp ? (
          <Field label="Name">
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="pl-11"
              />
            </div>
          </Field>
        ) : null}

        <Field label="Email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="pl-11"
            />
          </div>
        </Field>

        <Field label="Password">
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="pl-11"
            />
          </div>
        </Field>

        {error ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <Button
          type="submit"
          fullWidth
          disabled={submitting}
          className="h-12 rounded-[22px] bg-[linear-gradient(135deg,#2563eb,#4f46e5)]"
        >
          {submitting ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}

export function AuthScreen({
  onAuth,
  embedded = false,
}: {
  onAuth: () => void;
  embedded?: boolean;
}) {
  const { dir } = useLanguage();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSignUp = mode === "signup";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isSignUp) {
        signUp(name, email, password);
      } else {
        signIn(email, password);
      }

      onAuth();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const formCard = (
    <AuthFormCard
      mode={mode}
      setMode={(nextMode) => {
        setMode(nextMode);
        setError("");
      }}
      name={name}
      setName={setName}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      error={error}
      submitting={submitting}
      onSubmit={handleSubmit}
    />
  );

  if (embedded) {
    return <div dir={dir}>{formCard}</div>;
  }

  return (
    <main
      dir={dir}
      className="min-h-[100dvh] bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_100%)] px-5 py-6"
    >
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-[430px] flex-col justify-center">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        {formCard}
      </div>
    </main>
  );
}
