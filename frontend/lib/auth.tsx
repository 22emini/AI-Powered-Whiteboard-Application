"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore } from "./api";
import type { User } from "./types";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const USER_KEY = "canvas_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (raw && tokenStore.get()) {
      try {
        setUser(JSON.parse(raw) as User);
      } catch {
        /* ignore corrupt value */
      }
    }
    setReady(true);
  }, []);

  const finish = useCallback((token: string, u: User) => {
    tokenStore.set(token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.login({ email, password });
    finish(r.token, r.user);
  }, [finish]);

  const signup = useCallback(async (data: Record<string, unknown>) => {
    const r = await api.signup(data);
    finish(r.token, r.user);
  }, [finish]);

  const logout = useCallback(() => {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, ready, login, signup, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
