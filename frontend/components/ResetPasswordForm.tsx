"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Eye, EyeOff, Home } from "lucide-react";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";

function Inner() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
              <div className="password-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="confirm">Confirm password</label>
              <div className="password-wrap">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  required
                  className="input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  title={showConfirm ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
