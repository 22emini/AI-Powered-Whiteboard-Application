import type { ElData } from "./types";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316"];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Returns inner SVG markup (no <svg> wrapper) for a chart of size w x h. */
export function chartInner(d: ElData, w: number, h: number): string {
  const labels = d.labels ?? [];
  const values = d.values ?? [];
  const n = Math.min(labels.length, values.length);
  let out = `<rect width="${w}" height="${h}" rx="12" fill="#fff" stroke="#e7e8ef"/>`;
  out += `<text x="${w / 2}" y="26" text-anchor="middle" font-size="15" font-weight="600" fill="#14161a" font-family="sans-serif">${esc(d.title ?? "")}</text>`;
  if (!n) return out;
  const max = Math.max(...values, 1);

  if (d.chartType === "pie") {
    const total = values.reduce((a, b) => a + Math.max(0, b), 0) || 1;
    const cx = w * 0.34, cy = h / 2 + 12, r = Math.min(w * 0.28, h / 2 - 34);
    let a0 = -Math.PI / 2;
    values.slice(0, n).forEach((v, i) => {
      const a1 = a0 + (Math.max(0, v) / total) * Math.PI * 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const p = (a: number) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
      out += n === 1
        ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${COLORS[0]}"/>`
        : `<path d="M${cx} ${cy} L${p(a0)} A${r} ${r} 0 ${large} 1 ${p(a1)} Z" fill="${COLORS[i % COLORS.length]}"/>`;
      a0 = a1;
      out += `<rect x="${w * 0.66}" y="${52 + i * 20}" width="10" height="10" rx="2" fill="${COLORS[i % COLORS.length]}"/>`;
      out += `<text x="${w * 0.66 + 16}" y="${61 + i * 20}" font-size="11" fill="#444" font-family="sans-serif">${esc(labels[i])} (${v})</text>`;
    });
    return out;
  }

  const l = 36, r = 16, t = 44, b = 34;
  const cw = w - l - r, ch = h - t - b;
  for (let g = 0; g <= 4; g++) {
    const y = t + ch - (ch * g) / 4;
    out += `<line x1="${l}" x2="${w - r}" y1="${y}" y2="${y}" stroke="#eceef4"/>`;
    out += `<text x="${l - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="#888" font-family="sans-serif">${Math.round((max * g) / 4)}</text>`;
  }
  const step = cw / n;
  if (d.chartType === "line") {
    const pts = values.slice(0, n).map((v, i) => `${l + step * i + step / 2},${t + ch - (v / max) * ch}`);
    out += `<polyline points="${pts.join(" ")}" fill="none" stroke="${COLORS[0]}" stroke-width="2.5" stroke-linejoin="round"/>`;
    pts.forEach((p) => { const [px, py] = p.split(","); out += `<circle cx="${px}" cy="${py}" r="4" fill="#fff" stroke="${COLORS[0]}" stroke-width="2"/>`; });
  } else {
    values.slice(0, n).forEach((v, i) => {
      const bh = (Math.max(0, v) / max) * ch;
      out += `<rect x="${l + step * i + step * 0.18}" y="${t + ch - bh}" width="${step * 0.64}" height="${bh}" rx="4" fill="${COLORS[i % COLORS.length]}"/>`;
    });
  }
  labels.slice(0, n).forEach((lb, i) => {
    out += `<text x="${l + step * i + step / 2}" y="${h - 14}" text-anchor="middle" font-size="10" fill="#555" font-family="sans-serif">${esc(lb.length > 10 ? lb.slice(0, 9) + "…" : lb)}</text>`;
  });
  return out;
}
