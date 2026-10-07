"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Home } from "lucide-react";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
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
        <h1>Forgot your password?</h1>
        {sent ? (
          <>
            <p className="sub">If an account exists for <b>{email}</b>, we&apos;ve sent a reset link. It&apos;s valid for 1 hour. Check your spam folder too.</p>
            <Link href="/signin" className="btn btn-primary btn-lg" style={{ width: "100%" }} id="back-to-signin">Back to sign in</Link>
          </>
        ) : (
          <>
            <p className="sub">Enter your email and we&apos;ll send you a link to reset it.</p>
            {error && <div className="error-box" role="alert">{error}</div>}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={busy} id="forgot-submit">
              {busy ? <span className="spinner" /> : "Send reset link"}
            </button>
            <p className="auth-foot">Remembered it? <Link href="/signin">Sign in</Link></p>
          </>
        )}
      </form>
    </main>
  );
}
