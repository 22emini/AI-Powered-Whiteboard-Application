"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { api } from "@/lib/api";
import type { BoardElement } from "@/lib/types";

const MODES = [
  { id: "sticky_notes", label: "Sticky notes", chips: ["Ideas for a product launch", "Pros and cons of remote work", "Team retrospective topics"] },
  { id: "flowchart", label: "Flowchart", chips: ["User signup flow", "Bug triage process", "Order fulfillment steps"] },
  { id: "chart", label: "Chart", chips: ["Quarterly revenue for a startup", "Market share of smartphone brands", "Weekly study hours"] },
  { id: "image", label: "Image", chips: ["Futuristic robot drawing on a whiteboard", "Minimalist icon of an idea lightbulb", "Cute cat coding at night, vector style", "3D cloud computing architecture icon"] },
];

export function AIPanel({ boardId, center, onCreated, onClose }: {
  boardId: string;
  center: () => { x: number; y: number };
  onCreated: (els: BoardElement[]) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState("sticky_notes");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const current = MODES.find((m) => m.id === mode)!;

  async function run() {
    if (!prompt.trim()) return setError("Describe what you want to generate.");
    setBusy(true);
    setError("");
    try {
      const c = center();
      const els = await api.aiGenerate(boardId, { mode, prompt: prompt.trim(), x: Math.round(c.x), y: Math.round(c.y) });
      onCreated(els);
      setPrompt("");
      onClose();
    } catch (e) {
      const err = e as Error & { status?: number };
      setError(err.status === 503 ? "AI isn't configured yet: add GEMINI_API_KEY to the backend .env and restart." : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="glass side-panel" aria-label="AI assistant">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 16 }}><Sparkles size={16} color="var(--green-700)" /> AI assistant</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close panel"><X size={14} /></button>
      </div>
      <div className="seg">
        {MODES.map((m) => (
          <button key={m.id} className={mode === m.id ? "on" : ""} onClick={() => setMode(m.id)} id={`ai-mode-${m.id}`}>{m.label}</button>
        ))}
      </div>
      <textarea id="ai-prompt" className="input" rows={4} placeholder="Describe what to generate…" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <div className="chips">
        {current.chips.map((c) => <button key={c} className="chip" onClick={() => setPrompt(c)}>{c}</button>)}
      </div>
      {error && <div className="error-box" role="alert">{error}</div>}
      <button className="btn btn-primary" style={{ width: "100%" }} onClick={run} disabled={busy} id="ai-generate">
        {busy ? <span className="spinner" /> : <><Sparkles size={15} /> Generate</>}
      </button>
    </aside>
  );
}
