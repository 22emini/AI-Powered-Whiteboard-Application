"use client";

import { useEffect, useRef } from "react";
import { assetUrl } from "@/lib/api";
import { chartInner } from "@/lib/chart";
import { sizeOf } from "@/lib/geometry";
import { colorOf, type BoardElement } from "@/lib/types";

interface Props {
  el: BoardElement;
  selected: boolean;
  editing: boolean;
  canEdit: boolean;
  onCommit: (text: string) => void;
}

export function ElementView({ el, selected, editing, canEdit, onCommit }: Props) {
  const { w, h } = sizeOf(el);
  const d = el.data;
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const field = el.type === "shape" ? "label" : "text";
  const value = (field === "label" ? d.label : d.text) ?? "";

  const editor = (
    <textarea
      ref={ref}
      defaultValue={value}
      onPointerDown={(e) => e.stopPropagation()}
      onBlur={(e) => onCommit(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) (e.target as HTMLTextAreaElement).blur();
      }}
    />
  );

  const common = { "data-eid": el.id, className: `el${selected ? " selected" : ""}` } as const;
  const pos = { left: el.x, top: el.y, width: w };

  if (el.type === "sticky") {
    const c = colorOf(d.color, "yellow");
    return (
      <div {...common} className={`el sticky${selected ? " selected" : ""}`} style={{ ...pos, height: h, background: c.bg, fontSize: d.size ?? 16, color: "#1f2937" }}>
        {editing ? editor : d.text}
        {selected && canEdit && !editing && <div className="handle" data-handle />}
      </div>
    );
  }

  if (el.type === "shape") {
    const c = colorOf(d.color, "white");
    const kind = d.shape ?? "rectangle";
    return (
      <div {...common} style={{ ...pos, height: h }}>
        <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }} data-eid={el.id}>
          {kind === "ellipse" ? (
            <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 1} ry={h / 2 - 1} fill={c.bg} stroke={c.fg} strokeWidth={2} />
          ) : kind === "diamond" ? (
            <polygon points={`${w / 2},1 ${w - 1},${h / 2} ${w / 2},${h - 1} 1,${h / 2}`} fill={c.bg} stroke={c.fg} strokeWidth={2} />
          ) : (
            <rect x={1} y={1} width={w - 2} height={h - 2} rx={10} fill={c.bg} stroke={c.fg} strokeWidth={2} />
          )}
        </svg>
        <div className="shape" style={{ position: "absolute", inset: 0, fontSize: d.size ?? 15, color: "#1f2937", pointerEvents: "none" }}>
          {editing ? <div style={{ width: "100%", height: "100%", pointerEvents: "auto" }}>{editor}</div> : d.label}
        </div>
        {selected && canEdit && !editing && <div className="handle" data-handle />}
      </div>
    );
  }

  if (el.type === "text") {
    return (
      <div {...common} className={`el textel${selected ? " selected" : ""}`} style={{ ...pos, minHeight: h, fontSize: d.size ?? 22, color: colorOf(d.color, "black").fg, fontWeight: 500 }}>
        {editing ? <div style={{ height: h }}>{editor}</div> : d.text}
        {selected && canEdit && !editing && <div className="handle" data-handle />}
      </div>
    );
  }

  if (el.type === "image") {
    return (
      <div {...common} style={{ ...pos, height: h }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetUrl(d.url)} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8, pointerEvents: "none" }} />
        {selected && canEdit && <div className="handle" data-handle />}
      </div>
    );
  }

  if (el.type === "chart") {
    return (
      <div {...common} style={{ ...pos, height: h }}>
        <svg width={w} height={h} style={{ pointerEvents: "none" }} dangerouslySetInnerHTML={{ __html: chartInner(d, w, h) }} />
      </div>
    );
  }
  return null;
}
