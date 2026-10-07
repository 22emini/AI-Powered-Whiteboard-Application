"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import type { ElData } from "@/lib/types";

export function ChartModal({ onCreate, onClose }: { onCreate: (d: ElData) => void; onClose: () => void }) {
  const [type, setType] = useState<"bar" | "line" | "pie">("bar");
  const [title, setTitle] = useState("Sales by quarter");
  const [rows, setRows] = useState("Q1, 120\nQ2, 180\nQ3, 150\nQ4, 220");

  function submit() {
    const labels: string[] = [];
    const values: number[] = [];
    for (const line of rows.split("\n")) {
      const [l, v] = line.split(",");
      const num = Number(v);
      if (l?.trim() && Number.isFinite(num)) { labels.push(l.trim()); values.push(num); }
    }
    if (!labels.length) return;
    onCreate({ chartType: type, title, labels, values, width: 380, height: 250 });
  }

  return (
    <Modal title="Insert chart" onClose={onClose}>
      <div className="seg">
        {(["bar", "line", "pie"] as const).map((t) => <button key={t} className={type === t ? "on" : ""} onClick={() => setType(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      <div className="field"><label htmlFor="chart-title">Title</label><input id="chart-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label htmlFor="chart-rows">Data (label, value per line)</label><textarea id="chart-rows" className="input" rows={5} value={rows} onChange={(e) => setRows(e.target.value)} /></div>
      <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit} id="chart-insert">Insert chart</button>
    </Modal>
  );
}
