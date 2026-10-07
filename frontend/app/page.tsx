import Link from "next/link";
import { ArrowRight, Download, MousePointer2, Quote, Shapes, Sparkles, Star, Users, Video, WandSparkles } from "lucide-react";
import { Logo } from "@/components/Logo";

const testimonials = [
  { q: "It replaced three tools for us. Brainstorming, diagramming and note-taking now live on one canvas — and the AI actually saves us hours.", n: "Ava Chen", r: "Product Lead, Northwind", i: "AC" },
  { q: "The real-time collaboration is buttery smooth. Our remote design reviews finally feel like we're in the same room.", n: "Marcus Reed", r: "Design Director, Loop", i: "MR" },
  { q: "I turn a rough prompt into a full outline in seconds, then clean it up by hand. It's the fastest thinking tool I've used.", n: "Priya Nair", r: "Founder, Studio Kite", i: "PN" },
];

const features = [
  { icon: Shapes, t: "Every tool you need", d: "Text, sticky notes, shapes, lines, arrows, freehand drawing and bullet lists on one infinite canvas." },
  { icon: Sparkles, t: "AI brainstorming", d: "Turn a prompt into a wall of sticky notes or a structured outline. Summarize a busy board in a click." },
  { icon: Users, t: "Real-time collaboration", d: "See teammates' cursors and edits live. Share a board with editors and viewers." },
  { icon: Video, t: "Built-in video calls", d: "Hop on a video call right inside the board. No extra app, no meeting links — just click Call and talk while you draw." },
  { icon: Download, t: "Export anywhere", d: "Download your whiteboard as a crisp PNG or a scalable SVG to drop into docs and decks." },
];

export default function Home() {
  return (
    <main>
      <div className="container">
        <nav className="nav">
          <Logo />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/signin" className="btn btn-ghost btn-sm" id="nav-signin">Sign in</Link>
            <Link href="/signup" className="btn btn-primary btn-sm" id="nav-get-started">Get started</Link>
          </div>
        </nav>

        <section className="hero">
          <span className="badge"><WandSparkles size={13} /> AI-powered whiteboard notes</span>
          <h1>Where scribbles bloom into<br /><span>ideas that think with you.</span></h1>
          <p className="lead">Sketch, diagram and brainstorm freely. Drop text, shapes and sticky notes, draw by hand, and let AI expand your ideas — all in real time, with built-in video calls.</p>
          <div className="hero-cta">
            <Link href="/signup" className="btn btn-primary btn-lg" id="hero-start"><MousePointer2 size={16} /> Start whiteboarding</Link>
            <Link href="/signin" className="btn btn-light btn-lg" id="hero-signin">Sign in</Link>
          </div>
          <div className="demo" aria-hidden>
            <div className="s1">💡 Brainstorm ideas</div>
            <div className="s2">Plan</div>
            <svg width="90" height="24" viewBox="0 0 90 24" style={{ left: "57%" }}>
              <path d="M2 12 H78" stroke="#dc2626" strokeWidth="2" fill="none" />
              <path d="M70 5 L82 12 L70 19" stroke="#dc2626" strokeWidth="2" fill="none" />
            </svg>
            <div className="s3">Ship 🚀</div>
          </div>
          <div className="stats">
            <div><b>50k+</b><small>Boards created</small></div>
            <div><b>120+</b><small>Countries</small></div>
            <div><b>4.9/5</b><small>Average rating</small></div>
            <div><b>99.9%</b><small>Uptime</small></div>
          </div>
        </section>

        <section className="section">
          <span className="badge"><Star size={12} /> Loved by makers</span>
          <h2>Teams do their best thinking here</h2>
          <div className="grid3">
            {testimonials.map((t) => (
              <figure key={t.n} className="card quote" style={{ margin: 0 }}>
                <Quote size={18} />
                <p>{t.q}</p>
                <div className="person">
                  <span className="avatar">{t.i}</span>
                  <div><b>{t.n}</b><small>{t.r}</small></div>
                </div>
              </figure>
            ))}
          </div>
        </section>

        <section className="section">
          <span className="badge"><WandSparkles size={12} /> How it works</span>
          <div className="grid2">
            {features.map((f) => (
              <article key={f.t} className="card feature">
                <div className="ico"><f.icon size={17} /></div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta">
          <h2>Your next big idea is one ink stroke away.</h2>
          <p>Join thousands of teams thinking, drawing and shipping faster. Free to start — no credit card required.</p>
          <div className="hero-cta">
            <Link href="/signup" className="btn btn-dark btn-lg" id="cta-start">Start for free <ArrowRight size={15} /></Link>
            <Link href="/signin" className="btn btn-ghost btn-text btn-lg" id="cta-signin">Sign in</Link>
          </div>
        </section>

        <footer className="footer">
          <Logo />
          <span>© Blank Canvas. All rights reserved.</span>
        </footer>
      </div>
    </main>
  );
}