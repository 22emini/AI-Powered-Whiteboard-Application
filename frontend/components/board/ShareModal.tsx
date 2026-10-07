"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { api } from "@/lib/api";
import type { Member } from "@/lib/types";

export function ShareModal({ boardId, isOwner, onClose }: { boardId: string; isOwner: boolean; onClose: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [error, setError] = useState("");

  const load = useCallback(() => api.members(boardId).then(setMembers).catch((e: Error) => setError(e.message)), [boardId]);
  useEffect(() => { load(); }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.addMember(boardId, email.trim(), role);
      setEmail("");
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(userId: string) {
    try {
      await api.removeMember(boardId, userId);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Modal title="Share board" onClose={onClose}>
      {error && <div className="error-box" role="alert">{error}</div>}
      {isOwner ? (
        <form onSubmit={add} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input id="share-email" className="input" type="email" required placeholder="teammate@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select className="input" style={{ width: 110 }} value={role} onChange={(e) => setRole(e.target.value)} id="share-role">
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button className="btn btn-primary" id="share-add">Add</button>
        </form>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Only the board owner can manage sharing.</p>
      )}
      {members.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Not shared with anyone yet.</p>}
      {members.map((m) => (
        <div key={m.userId} className="member">
          <div>
            <b>{m.user.name || m.user.email}</b>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>{m.user.email} · {m.role}</div>
          </div>
          {isOwner && <button className="icon-btn" onClick={() => remove(m.userId)} aria-label="Remove"><Trash2 size={14} /></button>}
        </div>
      ))}
    </Modal>
  );
}
