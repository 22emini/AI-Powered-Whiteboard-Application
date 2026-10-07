import type { BoardElement } from "./types";

export interface Rect { x: number; y: number; w: number; h: number }

export function sizeOf(el: BoardElement): { w: number; h: number } {
  const d = el.data;
  switch (el.type) {
    case "sticky": return { w: d.width ?? 190, h: d.height ?? 150 };
    case "shape": return { w: d.width ?? 160, h: d.height ?? 90 };
    case "text": return { w: d.width ?? 220, h: d.height ?? Math.max(30, (d.size ?? 22) * 1.4 * Math.max(1, (d.text ?? "").split("\n").length)) };
    case "image": return { w: d.width ?? 280, h: d.height ?? (d.width ?? 280) * 0.75 };
    case "chart": return { w: d.width ?? 380, h: d.height ?? 250 };
    default: return { w: 0, h: 0 };
  }
}

export const isBox = (el: BoardElement) => ["sticky", "shape", "text", "image", "chart"].includes(el.type);

export function rectOf(el: BoardElement): Rect {
  const { w, h } = sizeOf(el);
  return { x: el.x, y: el.y, w, h };
}

/** Point where a ray from the rect center toward (tx,ty) leaves the rect. */
export function clipToRect(r: Rect, tx: number, ty: number): [number, number] {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  const sx = dx === 0 ? Infinity : r.w / 2 / Math.abs(dx);
  const sy = dy === 0 ? Infinity : r.h / 2 / Math.abs(dy);
  const s = Math.min(sx, sy);
  return [cx + dx * s, cy + dy * s];
}

/** Resolve start/end points of an arrow or line in world coordinates. */
export function lineEnds(el: BoardElement, all: Map<string, BoardElement>): [number, number, number, number] | null {
  const d = el.data;
  const from = d.fromElementId ? all.get(d.fromElementId) : undefined;
  const to = d.toElementId ? all.get(d.toElementId) : undefined;
  if (from && to) {
    const a = rectOf(from);
    const b = rectOf(to);
    const [x1, y1] = clipToRect(a, b.x + b.w / 2, b.y + b.h / 2);
    const [x2, y2] = clipToRect(b, a.x + a.w / 2, a.y + a.h / 2);
    return [x1, y1, x2, y2];
  }
  if (d.dx !== undefined || d.dy !== undefined) return [el.x, el.y, el.x + (d.dx ?? 0), el.y + (d.dy ?? 0)];
  if (from) {
    const a = rectOf(from);
    return [a.x + a.w / 2, a.y + a.h / 2, a.x + a.w / 2 + 120, a.y + a.h / 2];
  }
  return null;
}

export function bounds(els: BoardElement[]): Rect | null {
  if (!els.length) return null;
  const map = new Map(els.map((e) => [e.id, e]));
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  const add = (x: number, y: number) => { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); };
  for (const e of els) {
    if (isBox(e)) { const r = rectOf(e); add(r.x, r.y); add(r.x + r.w, r.y + r.h); }
    else if (e.type === "stroke") (e.data.points ?? []).forEach(([px, py]) => add(e.x + px, e.y + py));
    else { const l = lineEnds(e, map); if (l) { add(l[0], l[1]); add(l[2], l[3]); } }
  }
  return x1 === Infinity ? null : { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}
