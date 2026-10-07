"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Home } from "lucide-react";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";

function Inner() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.replace("/signin"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <Link href="/" className="btn btn-light btn-sm auth-home" id="auth-home"><Home size={15} /> Home</Link>
      <form className="auth-card" onSubmit={submit}>
        <Logo />
        <h1>Set a new password</h1>
        {!token ? (
          <>
            <div className="error-box" role="alert">This reset link is missing its token.</div>
            <Link href="/forgot-password" className="btn btn-primary btn-lg" style={{ width: "100%" }}>Request a new link</Link>
          </>
        ) : done ? (
          <>
            <p className="sub">Password updated! Redirecting you to sign in…</p>
            <Link href="/signin" className="btn btn-primary btn-lg" style={{ width: "100%" }} id="go-signin">Sign in now</Link>
          </>
        ) : (
          <>
            <p className="sub">Choose a new password for your account.</p>
            {error && <div className="error-box" role="alert">{error}</div>}
            <div className="field">
              <label htmlFor="password">New password</label>
              <input id="password" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <div className="field">
              <label htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" required className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" />
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={busy} id="reset-submit">
              {busy ? <span className="spinner" /> : "Update password"}
            </button>
            <p className="auth-foot">Link expired? <Link href="/forgot-password">Request a new one</Link></p>
          </>
        )}
      </form>
    </main>
  );
}

export function ResetPasswordForm() {
  return <Suspense><Inner /></Suspense>;
}
