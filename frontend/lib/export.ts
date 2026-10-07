import { assetUrl } from "./api";
import { chartInner } from "./chart";
import { bounds, lineEnds, rectOf, sizeOf } from "./geometry";
import { colorOf, type BoardElement } from "./types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function wrap(text: string, width: number, size: number): string[] {
  const maxChars = Math.max(4, Math.floor(width / (size * 0.55)));
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let cur = "";
    for (const word of para.split(" ")) {
      if ((cur + " " + word).trim().length > maxChars && cur) { lines.push(cur); cur = word; }
      else cur = (cur + " " + word).trim();
    }
    lines.push(cur);
  }
  return lines;
}

function textBlock(text: string, x: number, y: number, w: number, size: number, fill: string, anchor: "start" | "middle", h?: number) {
  const lines = wrap(text, w, size);
  const lh = size * 1.35;
  const startY = h !== undefined ? y + (h - lines.length * lh) / 2 + size : y + size;
  const tx = anchor === "middle" ? x + w / 2 : x;
  return lines.map((l, i) => `<text x="${tx}" y="${startY + i * lh}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-family="sans-serif">${esc(l)}</text>`).join("");
}

async function toDataUrl(url: string): Promise<string> {
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

export async function buildSvg(els: BoardElement[]): Promise<{ svg: string; w: number; h: number }> {
  const b = bounds(els) ?? { x: 0, y: 0, w: 400, h: 300 };
  const pad = 40;
  const ox = b.x - pad, oy = b.y - pad;
  const w = Math.ceil(b.w + pad * 2), h = Math.ceil(b.h + pad * 2);
  const map = new Map(els.map((e) => [e.id, e]));
  let body = "";

  for (const e of els.filter((x) => ["sticky", "shape", "text", "image", "chart"].includes(x.type))) {
    const { w: bw, h: bh } = sizeOf(e);
    const c = colorOf(e.data.color, e.type === "sticky" ? "yellow" : "white");
    if (e.type === "sticky") {
      body += `<rect x="${e.x}" y="${e.y}" width="${bw}" height="${bh}" rx="6" fill="${c.bg}"/>`;
      body += textBlock(e.data.text ?? "", e.x + 14, e.y + 14, bw - 28, e.data.size ?? 16, "#1f2937", "start");
    } else if (e.type === "shape") {
      const s = e.data.shape ?? "rectangle";
      const style = `fill="${c.bg}" stroke="${c.fg}" stroke-width="2"`;
      if (s === "ellipse") body += `<ellipse cx="${e.x + bw / 2}" cy="${e.y + bh / 2}" rx="${bw / 2}" ry="${bh / 2}" ${style}/>`;
      else if (s === "diamond") body += `<polygon points="${e.x + bw / 2},${e.y} ${e.x + bw},${e.y + bh / 2} ${e.x + bw / 2},${e.y + bh} ${e.x},${e.y + bh / 2}" ${style}/>`;
      else body += `<rect x="${e.x}" y="${e.y}" width="${bw}" height="${bh}" rx="10" ${style}/>`;
      if (e.data.label) body += textBlock(e.data.label, e.x + 8, e.y, bw - 16, e.data.size ?? 15, "#1f2937", "middle", bh);
    } else if (e.type === "text") {
      body += textBlock(e.data.text ?? "", e.x, e.y, bw, e.data.size ?? 22, colorOf(e.data.color, "black").fg, "start");
    } else if (e.type === "image") {
      const href = await toDataUrl(assetUrl(e.data.url));
      body += `<image href="${href}" x="${e.x}" y="${e.y}" width="${bw}" height="${bh}" preserveAspectRatio="xMidYMid meet"/>`;
    } else {
      body += `<g transform="translate(${e.x},${e.y})">${chartInner(e.data, bw, bh)}</g>`;
    }
  }

  for (const e of els) {
    if (e.type === "stroke") {
      const pts = (e.data.points ?? []).map(([px, py]) => `${e.x + px},${e.y + py}`).join(" ");
      body += `<polyline points="${pts}" fill="none" stroke="${colorOf(e.data.color, "black").fg}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else if (e.type === "arrow" || e.type === "line") {
      const l = lineEnds(e, map);
      if (!l) continue;
      const col = colorOf(e.data.color, "red").fg;
      body += `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}" stroke="${col}" stroke-width="2.5" stroke-linecap="round"/>`;
      if (e.type === "arrow") {
        const a = Math.atan2(l[3] - l[1], l[2] - l[0]);
        const p = (da: number) => `${l[2] - 12 * Math.cos(a + da)},${l[3] - 12 * Math.sin(a + da)}`;
        body += `<polygon points="${l[2]},${l[3]} ${p(0.45)} ${p(-0.45)}" fill="${col}"/>`;
      }
      if (e.data.label) body += `<text x="${(l[0] + l[2]) / 2}" y="${(l[1] + l[3]) / 2 - 6}" font-size="12" text-anchor="middle" fill="#333" font-family="sans-serif">${esc(e.data.label)}</text>`;
    }
  }
  void rectOf;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${ox} ${oy} ${w} ${h}"><rect x="${ox}" y="${oy}" width="${w}" height="${h}" fill="#ffffff"/>${body}</svg>`;
  return { svg, w, h };
}

function download(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
}

export async function exportSvg(els: BoardElement[], name: string) {
  const { svg } = await buildSvg(els);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  download(url, `${name}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function exportPng(els: BoardElement[], name: string) {
  const { svg, w, h } = await buildSvg(els);
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("Export failed")); img.src = url; });
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(url);
  download(canvas.toDataURL("image/png"), `${name}.png`);
}
