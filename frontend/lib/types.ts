export interface User {
  id: string;
  email: string;
  name?: string | null;
}

export interface Board {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  elements?: BoardElement[];
}

export interface ElData {
  text?: string;
  color?: string;
  size?: number;
  shape?: string;
  label?: string;
  width?: number;
  height?: number;
  fromElementId?: string;
  toElementId?: string;
  dx?: number;
  dy?: number;
  points?: [number, number][];
  url?: string;
  chartType?: "bar" | "line" | "pie";
  title?: string;
  labels?: string[];
  values?: number[];
}

export interface BoardElement {
  id: string;
  boardId: string;
  type: string;
  x: number;
  y: number;
  data: ElData;
}

export interface Member {
  boardId: string;
  userId: string;
  role: "viewer" | "editor";
  user: { id: string; email: string; name?: string | null };
}

export type Role = "owner" | "editor" | "viewer";

export const PALETTE: Record<string, { bg: string; fg: string }> = {
  yellow: { bg: "#fde68a", fg: "#d97706" },
  pink: { bg: "#fbcfe8", fg: "#db2777" },
  green: { bg: "#bbf7d0", fg: "#16a34a" },
  blue: { bg: "#bfdbfe", fg: "#2563eb" },
  orange: { bg: "#fed7aa", fg: "#ea580c" },
  purple: { bg: "#e9d5ff", fg: "#9333ea" },
  red: { bg: "#fecaca", fg: "#dc2626" },
  gray: { bg: "#e5e7eb", fg: "#4b5563" },
  white: { bg: "#ffffff", fg: "#1f2937" },
  black: { bg: "#d1d5db", fg: "#111827" },
};

export function colorOf(name: string | undefined, fallback = "white") {
  if (name && name.startsWith("#")) return { bg: name, fg: name };
  return PALETTE[name ?? ""] ?? PALETTE[fallback];
}
