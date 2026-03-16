import type { User } from "@/lib/types";

const USERS_KEY = "smartbite:auth:users";
const SESSION_KEY = "smartbite:auth:session";

type StoredUser = User & {
  password: string;
};

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function writeSession(user: User | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function signUp(name: string, email: string, password: string): User {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = password.trim();

  if (!trimmedName || !normalizedEmail || !trimmedPassword) {
    throw new Error("Please fill in all fields.");
  }

  const users = readUsers();
  const existingUser = users.find((user) => user.email === normalizedEmail);

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const user: User = {
    id: createId(),
    name: trimmedName,
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
  };

  writeUsers([...users, { ...user, password: trimmedPassword }]);
  writeSession(user);
  return user;
}

export function signIn(email: string, password: string): User {
  const normalizedEmail = normalizeEmail(email);
  const users = readUsers();
  const user = users.find((entry) => entry.email === normalizedEmail);

  if (!user) {
    throw new Error("No account was found for this email.");
  }

  if (user.password !== password.trim()) {
    throw new Error("Incorrect password.");
  }

  const sessionUser: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };

  writeSession(sessionUser);
  return sessionUser;
}

export function signOut() {
  writeSession(null);
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
