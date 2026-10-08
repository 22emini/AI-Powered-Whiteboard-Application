"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowUpRight, ChartColumn, Circle, Copy, Diamond, Download, Hand, Image as ImageIcon, Minus,
  MousePointer2, Pencil, Plus, Share2, Smile, Sparkles, SquareIcon, StickyNote, Trash2, Type, Video,
} from "lucide-react";
import type { Socket } from "socket.io-client";
import { api, assetUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { connectSocket } from "@/lib/socket";
import { exportPng, exportSvg } from "@/lib/export";
import { bounds, isBox, lineEnds, sizeOf } from "@/lib/geometry";
import { PALETTE, colorOf, type Board, type BoardElement, type ElData, type Member, type Role } from "@/lib/types";
import { ElementView } from "./ElementView";
import { ShareModal } from "./ShareModal";
import { AIPanel } from "./AIPanel";
import { ChartModal } from "./ChartModal";
import { VideoCall } from "./VideoCall";

type Tool = "select" | "hand" | "sticky" | "text" | "rectangle" | "ellipse" | "diamond" | "arrow" | "line" | "pen" | "emoji";
interface View { x: number; y: number; z: number }
interface Pt { x: number; y: number }

type Drag =
  | { kind: "pan"; sx: number; sy: number; vx: number; vy: number }
  | { kind: "move"; id: string; start: Pt; ox: number; oy: number; moved: boolean }
  | { kind: "resize"; id: string; start: Pt; w: number; h: number; ratio: number; changed: boolean }
  | { kind: "draw"; tool: Tool; start: Pt; cur: Pt }
  | { kind: "pen"; pts: Pt[] };

const TOOLS: { id: Tool; icon: typeof Hand; label: string; key: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select", key: "V" },
  { id: "hand", icon: Hand, label: "Pan", key: "H" },
  { id: "sticky", icon: StickyNote, label: "Sticky note", key: "S" },
  { id: "text", icon: Type, label: "Text", key: "T" },
  { id: "rectangle", icon: SquareIcon, label: "Rectangle", key: "R" },
  { id: "ellipse", icon: Circle, label: "Ellipse", key: "O" },
  { id: "diamond", icon: Diamond, label: "Diamond", key: "D" },
  { id: "arrow", icon: ArrowUpRight, label: "Arrow", key: "A" },
  { id: "line", icon: Minus, label: "Line", key: "L" },
  { id: "pen", icon: Pencil, label: "Pen", key: "P" },
];

const EMOJIS = ["😀", "😂", "😍", "🤔", "👍", "👏", "🎉", "🔥", "💡", "✅", "❌", "⭐", "❤️", "🚀", "📌", "⚠️", "🎯", "📈", "💬", "🧠", "🛠️", "📅", "💰", "🏆"];
const cursorColor = (id: string) => `hsl(${[...id].reduce((a, c) => a + c.charCodeAt(0) * 7, 0) % 360} 70% 45%)`;

export function BoardEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = use(params);
  const { user, ready } = useAuth();
  const router = useRouter();

  const [board, setBoard] = useState<Board | null>(null);
  const [loadError, setLoadError] = useState("");
  const [els, setEls] = useState<BoardElement[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [view, setView] = useState<View>({ x: 0, y: 0, z: 1 });
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [drag, setDragState] = useState<Drag | null>(null);
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number; t: number }>>({});
  const [online, setOnline] = useState<string[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [connected, setConnected] = useState(false);
  const [panel, setPanel] = useState<"" | "share" | "ai" | "chart" | "emoji" | "export">("");
  const [emoji, setEmoji] = useState("🎉");
  const [toast, setToast] = useState("");
  const [call, setCall] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const spaceRef = useRef(false);
  const lastEmit = useRef(0);
  const live = useRef({ view, els, selected, canEdit: false, tool });

  const isOwner = !!user && !!board && board.ownerId === user.id;
  const effectiveRole = role ?? (isOwner ? "owner" : null);
  const canEdit = effectiveRole !== null && effectiveRole !== "viewer";
  useEffect(() => { live.current = { view, els, selected, canEdit, tool }; });

  const setDrag = (d: Drag | null) => { dragRef.current = d; setDragState(d); };
  const flash = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(""), 2600); }, []);

  const elMap = useMemo(() => new Map(els.map((e) => [e.id, e])), [els]);

  /* ---------- element state helpers ---------- */
  const upsert = useCallback((el: BoardElement) => {
    setEls((prev) => (prev.some((e) => e.id === el.id) ? prev.map((e) => (e.id === el.id ? el : e)) : [...prev, el]));
  }, []);

  const create = useCallback(async (type: string, x: number, y: number, data: ElData) => {
    try {
      const el = await api.createElement(boardId, { type, x, y, data });
      upsert(el);
      return el;
    } catch (e) {
      flash((e as Error).message);
      return null;
    }
  }, [boardId, upsert, flash]);

  const saveData = useCallback((id: string, partial: ElData) => {
    const cur = live.current.els.find((e) => e.id === id);
    if (!cur) return;
    const data = { ...cur.data, ...partial };
    setEls((prev) => prev.map((e) => (e.id === id ? { ...e, data } : e)));
    api.updateElement(id, { data }).catch((e: Error) => flash(e.message));
  }, [flash]);

  const remove = useCallback((id: string) => {
    setEls((prev) => prev.filter((e) => e.id !== id));
    setSelected((s) => (s === id ? null : s));
    api.deleteElement(id).catch((e: Error) => flash(e.message));
  }, [flash]);

  /* ---------- load board ---------- */
  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace("/signin"); return; }
    api.board(boardId).then((b) => {
      setBoard(b);
      const list = b.elements ?? [];
      setEls(list);
      const box = bounds(list);
      const el = wrapRef.current;
      const W = window.innerWidth, H = window.innerHeight;
      void el;
      if (box) {
        const z = Math.min(1, (W - 240) / (box.w + 80), (H - 240) / (box.h + 80));
        setView({ z, x: W / 2 - (box.x + box.w / 2) * z, y: H / 2 - (box.y + box.h / 2) * z });
      } else setView({ x: W / 2 - 200, y: H / 2 - 150, z: 1 });
    }).catch((e: Error & { status?: number }) => setLoadError(e.status === 404 ? "Board not found, or you don't have access." : e.message));
    api.members(boardId).then(setMembers).catch(() => undefined);
  }, [ready, user, boardId, router]);

  /* ---------- realtime ---------- */
  useEffect(() => {
    if (!board) return;
    const s = connectSocket();
    socketRef.current = s;
    const join = () => {
      s.emit("board:join", boardId, (ack: { ok: boolean; role?: Role; message?: string }) => {
        if (ack?.ok && ack.role) setRole(ack.role);
        else if (ack && !ack.ok) setLoadError(ack.message ?? "Could not join board");
      });
      setConnected(true);
    };
    s.on("connect", join);
    s.on("disconnect", () => setConnected(false));
    s.on("element:created", (el: BoardElement) => upsert(el));
    s.on("elements:created", (list: BoardElement[]) => list.forEach(upsert));
    s.on("element:updated", (el: BoardElement) => {
      const d = dragRef.current;
      if (d && "id" in d && d.id === el.id) return;
      upsert(el);
    });
    s.on("element:deleted", ({ id }: { id: string }) => {
      setEls((prev) => prev.filter((e) => e.id !== id));
      setSelected((cur) => (cur === id ? null : cur));
    });
    s.on("user:joined", ({ userId }: { userId: string }) => setOnline((o) => (o.includes(userId) ? o : [...o, userId])));
    s.on("user:left", ({ userId }: { userId: string }) => {
      setOnline((o) => o.filter((x) => x !== userId));
      setCursors((c) => { const n = { ...c }; delete n[userId]; return n; });
    });
    s.on("cursor:move", ({ userId, x, y }: { userId: string; x: number; y: number }) => {
      setCursors((c) => ({ ...c, [userId]: { x, y, t: Date.now() } }));
      setOnline((o) => (o.includes(userId) ? o : [...o, userId]));
    });
    const prune = setInterval(() => setCursors((c) => {
      const now = Date.now();
      const n: typeof c = {};
      for (const [k, v] of Object.entries(c)) if (now - v.t < 8000) n[k] = v;
      return Object.keys(n).length === Object.keys(c).length ? c : n;
    }), 3000);
    return () => {
      clearInterval(prune);
      s.emit("board:leave", boardId);
      s.disconnect();
    };
  }, [board, boardId, upsert]);


  /* ---------- zoom / wheel ---------- */
  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setView((v) => {
      const z = Math.min(4, Math.max(0.1, v.z * factor));
      const k = z / v.z;
      return { z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
      else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [board, zoomAt]);

  const toWorld = (cx: number, cy: number): Pt => ({ x: (cx - view.x) / view.z, y: (cy - view.y) / view.z });
  const centerWorld = () => toWorld(window.innerWidth / 2, window.innerHeight / 2);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
      const L = live.current;
      if (e.code === "Space") { spaceRef.current = true; e.preventDefault(); return; }
      if (e.key === "Escape") { setSelected(null); setTool("select"); setPanel(""); return; }
      if (!L.canEdit) return;
      if ((e.key === "Delete" || e.key === "Backspace") && L.selected) { remove(L.selected); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && L.selected) { e.preventDefault(); duplicate(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const hit = TOOLS.find((x) => x.key.toLowerCase() === e.key.toLowerCase());
      if (hit) setTool(hit.id);
    };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") spaceRef.current = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remove]);

  /* ---------- pointer interaction ---------- */
  const topBoxAt = (p: Pt, excludeId?: string) => {
    for (let i = els.length - 1; i >= 0; i--) {
      const e = els[i];
      if (!isBox(e) || e.id === excludeId || e.type === "chart") continue;
      const { w, h } = sizeOf(e);
      if (p.x >= e.x && p.x <= e.x + w && p.y >= e.y && p.y <= e.y + h) return e;
    }
    return null;
  };

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("[data-ui]")) return;
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
    if (editing) (document.activeElement as HTMLElement | null)?.blur();
    setPanel((p) => (p === "emoji" || p === "export" ? "" : p));
    wrapRef.current?.setPointerCapture(e.pointerId);
    const p = toWorld(e.clientX, e.clientY);
    const target = e.target as Element;
    const startPan = () => setDrag({ kind: "pan", sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y });

    if (e.button === 1 || spaceRef.current || tool === "hand") return startPan();

    const handle = target.closest("[data-handle]");
    const hitEl = target.closest("[data-eid]");
    const hitId = hitEl?.getAttribute("data-eid") ?? null;

    if (tool === "select" || !canEdit) {
      if (handle && selected && canEdit) {
        const el = elMap.get(selected);
        if (el) {
          const { w, h } = sizeOf(el);
          return setDrag({ kind: "resize", id: el.id, start: p, w, h, ratio: h / (w || 1), changed: false });
        }
      }
      if (hitId) {
        setSelected(hitId);
        const el = elMap.get(hitId);
        const locked = el && (el.type === "arrow" || el.type === "line") && el.data.fromElementId && el.data.toElementId;
        if (el && canEdit && !locked) setDrag({ kind: "move", id: hitId, start: p, ox: el.x, oy: el.y, moved: false });
        return;
      }
      setSelected(null);
      return startPan();
    }

    setSelected(null);
    if (tool === "sticky") {
      create("sticky", p.x - 95, p.y - 75, { text: "", color: "yellow" }).then((el) => { if (el) { setSelected(el.id); setEditing(el.id); } });
      setTool("select");
    } else if (tool === "text") {
      create("text", p.x, p.y, { text: "", size: 24, color: "black" }).then((el) => { if (el) { setSelected(el.id); setEditing(el.id); } });
      setTool("select");
    } else if (tool === "emoji") {
      create("text", p.x - 30, p.y - 30, { text: emoji, size: 56, color: "black" }).then((el) => el && setSelected(el.id));
      setTool("select");
    } else if (tool === "pen") {
      setDrag({ kind: "pen", pts: [p] });
    } else {
      setDrag({ kind: "draw", tool, start: p, cur: p });
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const now = Date.now();
    if (now - lastEmit.current > 50) {
      lastEmit.current = now;
      const w = toWorld(e.clientX, e.clientY);
      socketRef.current?.emit("cursor:move", { boardId, x: w.x, y: w.y });
    }
    const d = dragRef.current;
    if (!d) return;
    const p = toWorld(e.clientX, e.clientY);
    if (d.kind === "pan") {
      setView((v) => ({ ...v, x: d.vx + e.clientX - d.sx, y: d.vy + e.clientY - d.sy }));
    } else if (d.kind === "move") {
      const nx = d.ox + p.x - d.start.x, ny = d.oy + p.y - d.start.y;
      if (!d.moved && Math.hypot(p.x - d.start.x, p.y - d.start.y) < 3) return;
      d.moved = true;
      setEls((prev) => prev.map((x) => (x.id === d.id ? { ...x, x: nx, y: ny } : x)));
    } else if (d.kind === "resize") {
      const el = elMap.get(d.id);
      if (!el) return;
      const w = Math.max(60, d.w + p.x - d.start.x);
      const h = el.type === "image" ? w * d.ratio : Math.max(40, d.h + p.y - d.start.y);
      d.changed = true;
      setEls((prev) => prev.map((x) => (x.id === d.id ? { ...x, data: { ...x.data, width: w, ...(el.type === "text" ? {} : { height: h }) } } : x)));
    } else if (d.kind === "draw") {
      setDrag({ ...d, cur: p });
    } else if (d.kind === "pen") {
      d.pts.push(p);
      setDragState({ ...d });
    }
  }

  async function onPointerUp(e: React.PointerEvent) {
    const d = dragRef.current;
    wrapRef.current?.releasePointerCapture(e.pointerId);
    if (!d) return;
    setDrag(null);

    if (d.kind === "move" && d.moved) {
      const el = live.current.els.find((x) => x.id === d.id);
      if (el) api.updateElement(el.id, { x: el.x, y: el.y }).catch((err: Error) => flash(err.message));
    } else if (d.kind === "resize" && d.changed) {
      const el = live.current.els.find((x) => x.id === d.id);
      if (el) api.updateElement(el.id, { data: el.data }).catch((err: Error) => flash(err.message));
    } else if (d.kind === "draw") {
      const { start, cur, tool: t } = d;
      const dist = Math.hypot(cur.x - start.x, cur.y - start.y);
      if (t === "arrow" || t === "line") {
        if (dist < 10) return;
        const from = topBoxAt(start);
        const to = topBoxAt(cur, from?.id);
        const color = "red";
        const data: ElData = from && to ? { fromElementId: from.id, toElementId: to.id, color } : { dx: cur.x - start.x, dy: cur.y - start.y, color };
        const el = await create(t, from && to ? from.x : start.x, from && to ? from.y : start.y, data);
        if (el) { setSelected(el.id); setTool("select"); }
      } else {
        const small = dist < 10;
        const x = small ? start.x : Math.min(start.x, cur.x), y = small ? start.y : Math.min(start.y, cur.y);
        const width = small ? 160 : Math.max(40, Math.abs(cur.x - start.x)), height = small ? 100 : Math.max(30, Math.abs(cur.y - start.y));
        const el = await create("shape", x, y, { shape: t, label: "", width, height, color: "white" });
        if (el) { setSelected(el.id); setTool("select"); }
      }
    } else if (d.kind === "pen" && d.pts.length > 1) {
      const minX = Math.min(...d.pts.map((p) => p.x)), minY = Math.min(...d.pts.map((p) => p.y));
      const points = d.pts.filter((_, i) => i % 2 === 0 || i === d.pts.length - 1).map((p) => [Math.round(p.x - minX), Math.round(p.y - minY)] as [number, number]);
      create("stroke", minX, minY, { points, color: "black" });
    }
  }

  function onDoubleClick(e: React.MouseEvent) {
    if (!canEdit) return;
    const id = (e.target as Element).closest("[data-eid]")?.getAttribute("data-eid");
    const el = id ? elMap.get(id) : null;
    if (el && ["sticky", "shape", "text"].includes(el.type)) { setSelected(el.id); setEditing(el.id); }
  }

  function commitEdit(id: string, text: string) {
    setEditing(null);
    const el = live.current.els.find((x) => x.id === id);
    if (!el) return;
    if (el.type === "text" && !text.trim()) return remove(id);
    const field = el.type === "shape" ? "label" : "text";
    if ((el.data[field] ?? "") !== text) saveData(id, { [field]: text });
  }

  async function duplicate() {
    const el = live.current.els.find((x) => x.id === live.current.selected);
    if (!el) return;
    const copy = await create(el.type, el.x + 24, el.y + 24, { ...el.data, fromElementId: undefined, toElementId: undefined, ...(el.data.fromElementId ? { dx: 120, dy: 0 } : {}) });
    if (copy) setSelected(copy.id);
  }

  async function onUpload(file: File) {
    const c = centerWorld();
    try {
      const el = await api.upload(boardId, file, c.x - 140, c.y - 100);
      upsert(el);
      setSelected(el.id);
      const img = new window.Image();
      img.onload = () => {
        const width = Math.min(320, img.naturalWidth);
        const height = Math.round((width * img.naturalHeight) / img.naturalWidth);
        const data = { ...el.data, width, height };
        setEls((prev) => prev.map((x) => (x.id === el.id ? { ...x, data } : x)));
        api.updateElement(el.id, { data }).catch(() => undefined);
      };
      img.src = assetUrl(el.data.url);
    } catch (e) {
      flash((e as Error).message);
    }
  }

  /* ---------- derived ---------- */
  const sel = selected ? elMap.get(selected) : null;
  const nameOf = (uid: string) => {
    if (board && uid === board.ownerId) return "Owner";
    const m = members.find((x) => x.userId === uid);
    return m ? m.user.name || m.user.email.split("@")[0] : "Collaborator";
  };
  const boxes = els.filter((e) => isBox(e));
  const lines = els.filter((e) => ["arrow", "line", "stroke"].includes(e.type));

  if (loadError) {
    return (
      <main className="auth-wrap"><div className="auth-card" style={{ textAlign: "center" }}>
        <h1>Can&apos;t open this board</h1>
        <p className="sub">{loadError}</p>
        <Link href="/dashboard" className="btn btn-primary">Back to dashboard</Link>
      </div></main>
    );
  }
  if (!board) return <div className="editor" style={{ display: "grid", placeItems: "center" }}><span className="spinner" style={{ borderColor: "#ccc", borderTopColor: "var(--green-800)", width: 28, height: 28 }} /></div>;

  const cursorStyle = tool === "hand" ? "grab" : tool === "select" ? "default" : "crosshair";
  const renderLine = (e: BoardElement) => {
    const isSel = e.id === selected;
    if (e.type === "stroke") {
      const pts = (e.data.points ?? []).map(([px, py]) => `${e.x + px},${e.y + py}`).join(" ");
      return (
        <g key={e.id}>
          {isSel && <polyline points={pts} fill="none" stroke="#93c5fd" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />}
          <polyline points={pts} fill="none" stroke={colorOf(e.data.color, "black").fg} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          <polyline data-eid={e.id} points={pts} fill="none" stroke="transparent" strokeWidth={14} pointerEvents="stroke" />
        </g>
      );
    }
    const l = lineEnds(e, elMap);
    if (!l) return null;
    const [x1, y1, x2, y2] = l;
    const col = colorOf(e.data.color, "red").fg;
    const a = Math.atan2(y2 - y1, x2 - x1);
    const hp = (da: number) => `${x2 - 13 * Math.cos(a + da)},${y2 - 13 * Math.sin(a + da)}`;
    return (
      <g key={e.id}>
        {isSel && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#93c5fd" strokeWidth={9} strokeLinecap="round" />}
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={2.5} strokeLinecap="round" />
        {e.type === "arrow" && <polygon points={`${x2},${y2} ${hp(0.45)} ${hp(-0.45)}`} fill={col} />}
        {e.data.label && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} fontSize={12} textAnchor="middle" fill="#333" style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 4 }}>{e.data.label}</text>}
        <line data-eid={e.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={16} pointerEvents="stroke" />
      </g>
    );
  };

  return (
    <div className="editor">
      <div
        ref={wrapRef}
        className="viewport"
        id="board-canvas"
        style={{
          cursor: cursorStyle,
          backgroundImage: "radial-gradient(#cfd2de 1.3px, transparent 1.3px)",
          backgroundSize: `${24 * view.z}px ${24 * view.z}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <div className="world" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}>
          {boxes.map((e) => (
            <ElementView key={e.id} el={e} selected={e.id === selected} editing={e.id === editing} canEdit={canEdit} onCommit={(t) => commitEdit(e.id, t)} />
          ))}
          <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
            {lines.map(renderLine)}
            {drag?.kind === "draw" && (drag.tool === "arrow" || drag.tool === "line") && (
              <line x1={drag.start.x} y1={drag.start.y} x2={drag.cur.x} y2={drag.cur.y} stroke="#dc2626" strokeWidth={2.5} strokeDasharray="6 4" />
            )}
            {drag?.kind === "draw" && !(drag.tool === "arrow" || drag.tool === "line") && (
              <rect x={Math.min(drag.start.x, drag.cur.x)} y={Math.min(drag.start.y, drag.cur.y)} width={Math.abs(drag.cur.x - drag.start.x)} height={Math.abs(drag.cur.y - drag.start.y)} fill="rgba(59,130,246,.08)" stroke="#3b82f6" strokeDasharray="5 4" />
            )}
            {drag?.kind === "pen" && <polyline points={drag.pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#111827" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
        </div>

        {Object.entries(cursors).map(([uid, c]) => (
          <div key={uid} className="cursor-tag" style={{ transform: `translate(${c.x * view.z + view.x}px, ${c.y * view.z + view.y}px)` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={cursorColor(uid)} stroke="#fff" strokeWidth="1.5"><path d="M3 2l7 19 3-8 8-3z" /></svg>
            <span style={{ background: cursorColor(uid) }}>{nameOf(uid)}</span>
          </div>
        ))}
      </div>

      {/* top bar */}
      <div className="topbar" data-ui>
        <div className="glass tb-left">
          <Link href="/dashboard" className="icon-btn" aria-label="Back to dashboard" id="back-btn"><ArrowLeft size={16} /></Link>
          <h1 className="tb-title">{board.title}</h1>
          <span className={`status-dot ${connected ? "on" : ""}`} title={connected ? "Live" : "Connecting…"} />
          {effectiveRole === "viewer" && <span className="pill">View only</span>}
        </div>
        <div className="glass tb-right" style={{ position: "relative" }}>
          <div className="avatars">
            {online.slice(0, 4).map((uid) => (
              <span key={uid} className="avatar" style={{ background: cursorColor(uid) }} title={nameOf(uid)}>{nameOf(uid)[0]}</span>
            ))}
          </div>
          <button className={`btn btn-sm ${call ? "btn-primary" : "btn-light"}`} onClick={() => setCall(!call)} id="video-btn"><Video size={14} /> {call ? "Leave call" : "Call"}</button>
          <button className="btn btn-light btn-sm" onClick={() => setPanel(panel === "export" ? "" : "export")} id="export-btn"><Download size={14} /> Export</button>
          {canEdit && <button className="btn btn-light btn-sm" onClick={() => setPanel(panel === "ai" ? "" : "ai")} id="ai-btn"><Sparkles size={14} /> AI</button>}
          <button className="btn btn-primary btn-sm" onClick={() => setPanel("share")} id="share-btn"><Share2 size={14} /> Share</button>
          {panel === "export" && (
            <div className="glass" style={{ position: "absolute", top: 52, right: 0, padding: 6, display: "flex", flexDirection: "column", minWidth: 150 }}>
              <button className="btn btn-ghost btn-sm" style={{ justifyContent: "flex-start" }} id="export-png" onClick={() => { setPanel(""); exportPng(els, board.title).catch((e: Error) => flash(e.message)); }}>Download PNG</button>
              <button className="btn btn-ghost btn-sm" style={{ justifyContent: "flex-start" }} id="export-svg" onClick={() => { setPanel(""); exportSvg(els, board.title); }}>Download SVG</button>
            </div>
          )}
        </div>
      </div>

      {/* toolbar */}
      {canEdit && (
        <div className="glass toolbar" data-ui>
          {TOOLS.map((t) => (
            <button key={t.id} className={`tool ${tool === t.id ? "active" : ""}`} onClick={() => setTool(t.id)} id={`tool-${t.id}`} aria-label={t.label}>
              <t.icon size={18} /><span className="tip">{t.label} · {t.key}</span>
            </button>
          ))}
          <div className="sep" />
          <div style={{ position: "relative" }}>
            <button className={`tool ${tool === "emoji" ? "active" : ""}`} onClick={() => { setTool("emoji"); setPanel(panel === "emoji" ? "" : "emoji"); }} id="tool-emoji" aria-label="Emoji"><Smile size={18} /><span className="tip">Emoji</span></button>
            {panel === "emoji" && (
              <div className="glass" style={{ position: "absolute", left: 50, top: -60, padding: 10, width: 270 }}>
                <div className="emoji-grid">
                  {EMOJIS.map((m) => <button key={m} onClick={() => { setEmoji(m); setPanel(""); }}>{m}</button>)}
                </div>
              </div>
            )}
          </div>
          <button className="tool" onClick={() => fileRef.current?.click()} id="tool-image" aria-label="Image"><ImageIcon size={18} /><span className="tip">Upload image</span></button>
          <button className="tool" onClick={() => setPanel("chart")} id="tool-chart" aria-label="Chart"><ChartColumn size={18} /><span className="tip">Chart</span></button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
        </div>
      )}

      {/* properties */}
      {sel && canEdit && !editing && (
        <div className="glass props" data-ui>
          {sel.type !== "image" && sel.type !== "chart" && (
            <>
              {Object.keys(PALETTE).map((c) => (
                <span key={c} className={`swatch ${sel.data.color === c ? "on" : ""}`} style={{ background: PALETTE[c].bg, boxShadow: undefined, outline: `2px solid ${PALETTE[c].fg}33` }} onClick={() => saveData(sel.id, { color: c })} title={c} />
              ))}
              <span className="vsep" />
            </>
          )}
          {["sticky", "text", "shape"].includes(sel.type) && (
            <>
              <button className="icon-btn" onClick={() => saveData(sel.id, { size: Math.max(10, (sel.data.size ?? (sel.type === "text" ? 22 : sel.type === "sticky" ? 16 : 15)) - 2) })} aria-label="Smaller text"><Minus size={14} /></button>
              <Type size={14} />
              <button className="icon-btn" onClick={() => saveData(sel.id, { size: Math.min(120, (sel.data.size ?? (sel.type === "text" ? 22 : sel.type === "sticky" ? 16 : 15)) + 2) })} aria-label="Larger text"><Plus size={14} /></button>
              <span className="vsep" />
            </>
          )}
          <button className="icon-btn" onClick={duplicate} aria-label="Duplicate" id="prop-duplicate"><Copy size={14} /></button>
          <button className="icon-btn" onClick={() => remove(sel.id)} aria-label="Delete" id="prop-delete"><Trash2 size={14} color="var(--danger)" /></button>
        </div>
      )}

      {/* zoom */}
      <div className="glass zoombar" data-ui>
        <button className="icon-btn" onClick={() => zoomAt(1 / 1.2, window.innerWidth / 2, window.innerHeight / 2)} aria-label="Zoom out"><Minus size={14} /></button>
        <span>{Math.round(view.z * 100)}%</span>
        <button className="icon-btn" onClick={() => zoomAt(1.2, window.innerWidth / 2, window.innerHeight / 2)} aria-label="Zoom in"><Plus size={14} /></button>
      </div>

      {panel === "ai" && canEdit && (
        <div data-ui>
          <AIPanel boardId={boardId} center={() => { const c = centerWorld(); return { x: c.x - 250, y: c.y - 150 }; }} onCreated={(list) => { list.forEach(upsert); flash(`Added ${list.length} item${list.length === 1 ? "" : "s"}`); }} onClose={() => setPanel("")} />
        </div>
      )}
      {panel === "share" && <ShareModal boardId={boardId} isOwner={isOwner} onClose={() => setPanel("")} />}
      {panel === "chart" && (
        <ChartModal onClose={() => setPanel("")} onCreate={async (d) => {
          setPanel("");
          const c = centerWorld();
          const el = await create("chart", c.x - 190, c.y - 125, d);
          if (el) setSelected(el.id);
        }} />
      )}
      {call && <VideoCall boardId={boardId} displayName={user?.name || user?.email || "Guest"} onClose={() => setCall(false)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
