"use client";

import { useState } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";

/** Embedded Jitsi Meet call — one room per board, so everyone on the board joins the same call. */
export function VideoCall({ boardId, displayName, onClose }: { boardId: string; displayName: string; onClose: () => void }) {
  const [big, setBig] = useState(false);
  const room = `BlankCanvas-${boardId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const hash = [
    `userInfo.displayName=${JSON.stringify(displayName)}`,
    "config.prejoinPageEnabled=false",
    "config.disableDeepLinking=true",
    "interfaceConfig.MOBILE_APP_PROMO=false",
  ].join("&");

  return (
    <div
      data-ui
      className="glass"
      id="video-call"
      style={{
        position: "fixed", left: 16, bottom: 16, zIndex: 40, overflow: "hidden", display: "flex", flexDirection: "column",
        width: big ? "min(900px, calc(100vw - 32px))" : 380, height: big ? "min(620px, calc(100vh - 100px))" : 290,
        padding: 0, transition: "width .25s ease, height .25s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", fontSize: 13, fontWeight: 600 }}>
        <span>Video call</span>
        <span style={{ display: "flex", gap: 4 }}>
          <button className="icon-btn" aria-label={big ? "Shrink" : "Enlarge"} onClick={() => setBig(!big)} id="video-size">
            {big ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button className="icon-btn" aria-label="Leave call" onClick={onClose} id="video-close"><X size={14} /></button>
        </span>
      </div>
      <iframe
        title="Board video call"
        src={`https://meet.jit.si/${room}#${hash}`}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        style={{ flex: 1, border: 0, width: "100%", background: "#111" }}
      />
    </div>
  );
}
