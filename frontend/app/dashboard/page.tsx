"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { LayoutDashboard, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Modal } from "@/components/Modal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Board } from "@/lib/types";

export default function DashboardPage() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Board | null>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!user) return router.replace("/signin");
    api.boards().then(setBoards).catch((e: Error) => {
      if ((e as { status?: number }).status === 401) {
        logout();
        router.replace("/signin");
      } else setError(e.message);
    });
  }, [ready, user, router, logout]);

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const b = await api.createBoard(title.trim() || "Untitled board");
      router.push(`/board/${b.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function rename(e: FormEvent) {
    e.preventDefault();
    if (!renaming) return;
    try {
      await api.renameBoard(renaming.id, title.trim() || renaming.title);
      setBoards((bs) => bs?.map((b) => (b.id === renaming.id ? { ...b, title: title.trim() || b.title } : b)) ?? null);
      setRenaming(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(b: Board) {
    if (!confirm(`Delete "${b.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteBoard(b.id);
      setBoards((bs) => bs?.filter((x) => x.id !== b.id) ?? null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!ready || !user) return null;

  return (
    <main>
      <header className="dash-top">
        <div className="container">
          <Logo href="/dashboard" />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{user.name || user.email}</span>
            <button className="btn btn-light btn-sm" onClick={() => { logout(); router.replace("/"); }} id="logout-btn"><LogOut size={14} /> Sign out</button>
          </div>
        </div>
      </header>
      <div className="container">
        <div className="dash-head">
          <div>
            <h1>Your boards</h1>
            <p>Create a new whiteboard or pick up where you left off.</p>
          </div>
          <button className="btn btn-primary" id="new-board-btn" onClick={() => { setTitle(""); setCreating(true); }}><Plus size={16} /> New board</button>
        </div>
        {error && <div className="error-box" role="alert">{error}</div>}
        {boards && boards.length === 0 && (
          <div className="card empty">
            <LayoutDashboard size={32} style={{ margin: "0 auto 10px", color: "var(--green-500)" }} />
            <h3 style={{ color: "var(--ink)", marginBottom: 6 }}>No boards yet</h3>
            Create your first board to start sketching ideas.
          </div>
        )}
        <div className="boards">
          {boards?.map((b) => (
            <div key={b.id} className="card board-card">
              <Link href={`/board/${b.id}`} id={`board-${b.id}`}>
                <div className="board-thumb"><Pencil size={28} /></div>
                <div className="board-body">
                  <h3>{b.title}</h3>
                  <div className="board-meta">
                    {b.ownerId !== user.id && <span className="pill">Shared</span>}
                    <span>Updated {new Date(b.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
              {b.ownerId === user.id && (
                <div className="card-actions">
                  <button className="icon-btn" aria-label="Rename" onClick={() => { setTitle(b.title); setRenaming(b); }}><Pencil size={14} /></button>
                  <button className="icon-btn" aria-label="Delete" onClick={() => remove(b)}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {creating && (
        <Modal title="New board" onClose={() => setCreating(false)}>
          <form onSubmit={create}>
            <div className="field">
              <label htmlFor="board-title">Board name</label>
              <input id="board-title" autoFocus className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sprint planning" />
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} id="create-board-submit">Create board</button>
          </form>
        </Modal>
      )}
      {renaming && (
        <Modal title="Rename board" onClose={() => setRenaming(null)}>
          <form onSubmit={rename}>
            <div className="field">
              <label htmlFor="rename-title">Board name</label>
              <input id="rename-title" autoFocus className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }}>Save</button>
          </form>
        </Modal>
      )}
    </main>
  );
}
