"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const { user, ready, login, signup } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "", job: "", age: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isUp = mode === "signup";

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (isUp && f.password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      if (isUp) {
        const body: Record<string, unknown> = { email: f.email, password: f.password };
        if (f.name) body.name = f.name;
        if (f.age) body.age = f.age;
        if (f.phone) body.phone = f.phone;
        if (f.job) body.job = f.job;
        await signup(body);
      } else {
        await login(f.email, f.password);
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <Link href="/" className="btn btn-light btn-sm auth-home" id="auth-home">
        <Home size={15} /> Home
      </Link>
      <form className="auth-card" onSubmit={submit}>
        <Logo />
        <h1>{isUp ? "Create your account" : "Welcome back"}</h1>
        <p className="sub">{isUp ? "Start whiteboarding in seconds. Free forever." : "Sign in to continue to your boards."}</p>
        {error && <div className="error-box" role="alert">{error}</div>}
        {isUp && (
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" className="input" value={f.name} onChange={set("name")} placeholder="Ada Lovelace" />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required className="input" value={f.email} onChange={set("email")} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required className="input" value={f.password} onChange={set("password")} placeholder={isUp ? "At least 8 characters" : "Your password"} />
        </div>
        {!isUp && <p className="auth-foot" style={{ textAlign: "right", margin: "-4px 0 14px" }}><Link href="/forgot-password" id="forgot-link">Forgot password?</Link></p>}
        {isUp && (
          <>
            <div className="row2">
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" className="input" value={f.phone} onChange={set("phone")} placeholder="08012345678" />
              </div>
              <div className="field">
                <label htmlFor="age">Age</label>
                <input id="age" className="input" value={f.age} onChange={set("age")} placeholder="25" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="job">Job</label>
              <input id="job" className="input" value={f.job} onChange={set("job")} placeholder="Designer" />
            </div>
          </>
        )}
        <button className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={busy} id="auth-submit">
          {busy ? <span className="spinner" /> : isUp ? "Create account" : "Sign in"}
        </button>
        <p className="auth-foot">
          {isUp ? <>Already have an account? <Link href="/signin">Sign in</Link></> : <>New to Syntheboard? <Link href="/signup">Create an account</Link></>}
        </p>
      </form>
    </main>
  );
}
