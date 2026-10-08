"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authClient } from "./auth-client";
import { tokenStore } from "./api";
import type { User } from "./types";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);
const USER_KEY = "canvas_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (raw && tokenStore.get()) {
      try {
        return JSON.parse(raw) as User;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(USER_KEY);
    authClient
      .getSession()
      .then(({ data }) => {
        if (data?.user) {
          const u: User = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
          };
          setUser(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
          const sessionData = data as unknown as { session?: { token?: string }; token?: string };
          const token = sessionData?.session?.token || sessionData?.token;
          if (token) tokenStore.set(token);
        } else if (!raw) {
          setUser(null);
          tokenStore.clear();
        }
        setReady(true);
      })
      .catch(() => {
        setReady(true);
      });
  }, []);

  const finish = useCallback((token: string | undefined, u: User) => {
    if (token) tokenStore.set(token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (res.error) {
        throw new Error(res.error.message || "Invalid email or password");
      }
      const data = res.data;
      const sessionData = data as unknown as { session?: { token?: string }; token?: string };
      const token = sessionData?.session?.token || sessionData?.token;
      const u: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      };
      finish(token, u);
    },
    [finish]
  );

  const signup = useCallback(
    async (data: Record<string, unknown>) => {
      const email = String(data.email || "").trim();
      const password = String(data.password || "");
      const name = String(data.name || email.split("@")[0]);
      const phone = data.phone ? String(data.phone) : undefined;
      const age = data.age ? String(data.age) : undefined;
      const job = data.job ? String(data.job) : undefined;

      const res = await authClient.signUp.email({
        email,
        password,
        name,
        phone,
        age,
        job,
      });
      if (res.error) {
        throw new Error(res.error.message || "Could not create account");
      }
      const resData = res.data;
      const sessionData = resData as unknown as { session?: { token?: string }; token?: string };
      const token = sessionData?.session?.token || sessionData?.token;
      const u: User = {
        id: resData.user.id,
        email: resData.user.email,
        name: resData.user.name,
      };
      finish(token, u);
    },
    [finish]
  );

  const logout = useCallback(async () => {
    try {
      await authClient.signOut();
    } catch {
      /* ignore */
    }
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
