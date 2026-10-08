import type { Board, BoardElement, ElData, Member, User } from "./types";
import { authClient } from "./auth-client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const TOKEN_KEY = "canvas_token";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body && !(init.body instanceof FormData)) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) } });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.message ?? body.error ?? `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

interface AuthResponse {
  token: string;
  user: User;
}

export const api = {
  signup: (data: Record<string, unknown>) => request<AuthResponse>("/api/auth/signup", { method: "POST", body: json(data) }),
  login: (data: { email: string; password: string }) => request<AuthResponse>("/api/auth/login", { method: "POST", body: json(data) }),

  forgotPassword: async (email: string) => {
    const client = authClient as unknown as Record<string, ((args: unknown) => Promise<{ error?: { message?: string } }>) | undefined>;
    const fn = client.requestPasswordReset || client.forgetPassword;
    if (typeof fn === "function") {
      const res = await fn({ email, redirectTo: "/reset-password" });
      if (res?.error) {
        throw new ApiError(res.error.message || "Failed to request password reset", 400);
      }
      return { message: "If that email is registered, a reset link has been sent." };
    }
    return request<{ message: string }>("/api/auth/forgot-password", { method: "POST", body: json({ email }) });
  },

  resetPassword: async (token: string, password: string) => {
    const client = authClient as unknown as Record<string, ((args: unknown) => Promise<{ error?: { message?: string } }>) | undefined>;
    const fn = client.resetPassword;
    if (typeof fn === "function") {
      const res = await fn({ newPassword: password, token });
      if (res?.error) {
        throw new ApiError(res.error.message || "Invalid or expired token", 400);
      }
      return { message: "Password updated. You can now sign in." };
    }
    return request<{ message: string }>("/api/auth/reset-password", { method: "POST", body: json({ token, password }) });
  },

  boards: () => request<{ result: Board[] }>("/api/boards").then((r) => r.result),
  createBoard: (title: string) => request<{ result: Board }>("/api/boards", { method: "POST", body: json({ title }) }).then((r) => r.result),
  board: (id: string) => request<Board>(`/api/boards/${id}`),
  renameBoard: (id: string, title: string) => request<void>(`/api/boards/${id}`, { method: "PATCH", body: json({ title }) }),
  deleteBoard: (id: string) => request<void>(`/api/boards/${id}`, { method: "DELETE" }),

  createElement: (boardId: string, el: { type: string; x: number; y: number; data: ElData }) =>
    request<{ result: BoardElement }>(`/api/boards/${boardId}/elements`, { method: "POST", body: json(el) }).then((r) => r.result),
  updateElement: (id: string, patch: { x?: number; y?: number; data?: ElData }) =>
    request<{ result: BoardElement }>(`/api/elements/${id}`, { method: "PATCH", body: json(patch) }).then((r) => r.result),
  deleteElement: (id: string) => request<void>(`/api/elements/${id}`, { method: "DELETE" }),

  members: (boardId: string) => request<{ result: Member[] }>(`/api/boards/${boardId}/members`).then((r) => r.result),
  addMember: (boardId: string, email: string, role: string) =>
    request<unknown>(`/api/boards/${boardId}/members`, { method: "POST", body: json({ email, role }) }),
  removeMember: (boardId: string, userId: string) => request<void>(`/api/boards/${boardId}/members/${userId}`, { method: "DELETE" }),

  aiGenerate: (boardId: string, body: { mode: string; prompt: string; x: number; y: number }) =>
    request<{ result: BoardElement[] }>(`/api/boards/${boardId}/ai/generate`, { method: "POST", body: json(body) }).then((r) => r.result),

  upload: (boardId: string, file: File, x: number, y: number) => {
    const form = new FormData();
    form.append("image", file);
    form.append("x", String(x));
    form.append("y", String(y));
    return request<{ result: BoardElement }>(`/api/boards/${boardId}/uploads`, { method: "POST", body: form }).then((r) => r.result);
  },
};

export const assetUrl = (url?: string) => (!url ? "" : url.startsWith("http") ? url : `${API_URL}${url}`);
