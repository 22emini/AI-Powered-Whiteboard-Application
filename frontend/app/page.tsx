import Link from "next/link";
import {
  ArrowRight,
  Download,
  HelpCircle,
  ImageIcon,
  MousePointer2,
  Quote,
  Shapes,
  Sparkles,
  Star,
  Users,
  Video,
  WandSparkles,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const testimonials = [
  {
    q: "It replaced three tools for us. Brainstorming, diagramming and note-taking now live on one canvas — and the AI actually saves us hours.",
    n: "Ava Chen",
    r: "Product Lead, Northwind",
    i: "AC",
  },
  {
    q: "The real-time collaboration is buttery smooth. Our remote design reviews finally feel like we're in the same room.",
    n: "Marcus Reed",
    r: "Design Director, Loop",
    i: "MR",
  },
  {
    q: "I turn a rough prompt into a full outline in seconds, then clean it up by hand. It's the fastest thinking tool I've used.",
    n: "Priya Nair",
    r: "Founder, Studio Kite",
    i: "PN",
  },
];

const features = [
  {
    icon: Shapes,
    tag: "Canvas",
    t: "Infinite Whiteboard Tools",
    d: "Freehand drawing, text, sticky notes, geometric shapes, lines, and connected arrows all on one responsive infinite canvas.",
    accent: "coral",
  },
  {
    icon: Sparkles,
    tag: "AI Assistant",
    t: "AI Brainstorming & Flowcharts",
    d: "Turn rough ideas into walls of colorful sticky notes or structured step-by-step flowcharts and analytical data charts.",
    accent: "amber",
  },
  {
    icon: ImageIcon,
    tag: "GenAI Media",
    t: "AI Image Generation",
    d: "Generate custom illustrations, icons, and visuals straight onto your board with fast, free AI image synthesis.",
    accent: "fuchsia",
  },
  {
    icon: Users,
    tag: "Multiplayer",
    t: "Real-time Multiplayer Sync",
    d: "See teammates' live cursors, selections, and instant edits. Share boards securely with viewer or editor roles.",
    accent: "orange",
  },
  {
    icon: Video,
    tag: "Live Audio & Video",
    t: "Built-in Video & Voice Calls",
    d: "Start video and voice calls directly inside the board. No external Zoom links needed — talk while you sketch.",
    accent: "rose",
  },
  {
    icon: Download,
    tag: "Vector Export",
    t: "Crisp PNG & SVG Export",
    d: "Export your finished boards as high-resolution PNGs or scalable SVGs for documentation, pitch decks, and presentations.",
    accent: "gold",
  },
];

const faqs = [
  {
    q: "What is Syntheboard?",
    a: "Syntheboard is an AI-powered infinite whiteboard designed for teams, designers, developers, and educators. It combines real-time multiplayer sketching with AI sticky notes, flowchart generation, AI image creation, and built-in video calls.",
  },
  {
    q: "Is Syntheboard free to use?",
    a: "Yes! You can sign up and start whiteboarding immediately for free with no credit card required.",
  },
  {
    q: "How does the AI assistant work on the canvas?",
    a: "Click the AI Assistant icon in the canvas toolbar. You can generate brainstorming sticky notes, step-by-step process flowcharts, interactive data charts, or custom illustrations by typing a simple text prompt.",
  },
  {
    q: "Can I collaborate with my team in real-time?",
    a: "Yes, invite teammates by email to collaborate. You'll see their live colored cursors move across the canvas, real-time board updates via WebSockets, and you can even hop on a live video call together.",
  },
  {
    q: "Can I export my whiteboard diagrams?",
    a: "Yes, you can export your entire board or selected areas at any time as high-resolution PNG images or scalable SVG vector files.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://syntheboard.app/#webapp",
      name: "Syntheboard",
      url: "https://syntheboard.app",
      applicationCategory: "DesignApplication, BusinessApplication",
      operatingSystem: "All",
      browserRequirements: "Requires modern web browser with HTML5 and WebSockets support",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Infinite collaborative whiteboard powered by AI. Sketch, diagram, collaborate in real time with multiplayer cursors, built-in video calls, and instant AI sticky notes, flowcharts, charts, and image generation.",
      featureList: [
        "Infinite canvas with zero boundaries",
        "Multiplayer real-time collaboration with live cursors",
        "Built-in peer-to-peer video calls",
        "AI-assisted brainstorming (sticky notes, flowcharts, charts)",
        "Instant AI image generation onto whiteboard",
        "High-resolution PNG and vector SVG export",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://syntheboard.app/#faq",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container">
        <header>
          <nav className="nav" aria-label="Main navigation">
            <Logo />
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link href="/signin" className="btn btn-ghost btn-sm" id="nav-signin" aria-label="Sign in to your account">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm" id="nav-get-started" aria-label="Create a free account">
                Get started
              </Link>
            </div>
          </nav>
        </header>

        <main id="main-content">
          <section className="hero" aria-labelledby="hero-heading">
            <span className="badge">
              <WandSparkles size={14} /> Creative AI Whiteboard & Studio
            </span>
            <h1 id="hero-heading">
              Where scribbles bloom into<br />
              <span>ideas that think with you.</span>
            </h1>
            <p className="lead">
              Sketch, diagram, and brainstorm freely on an infinite creative canvas. Drop text, shapes, and sticky notes, draw by hand, and let AI expand your thoughts — all in real time with built-in video calls.
            </p>
            <div className="hero-cta">
              <Link href="/signup" className="btn btn-primary btn-lg" id="hero-start" aria-label="Start whiteboarding for free">
                <MousePointer2 size={16} /> Start whiteboarding free
              </Link>
              <Link href="/signin" className="btn btn-light btn-lg" id="hero-signin" aria-label="Sign in to your existing account">
                Sign in
              </Link>
            </div>

            {/* Creative Studio Interactive Whiteboard Preview */}
            <div className="demo" aria-hidden="true">
              <div className="demo-topbar">
                <div className="demo-board-title">
                  <span className="demo-live-dot" />
                  <span>Product Sprint 2026</span>
                </div>
                <div className="demo-team-tag">
                  <div className="demo-team-avatar">AC</div>
                  <div className="demo-team-avatar" style={{ background: "#ea580c", marginLeft: -8 }}>MR</div>
                  <span>2 collaborators</span>
                </div>
              </div>

              {/* Whiteboard Nodes */}
              <div className="s1">💡 Brainstorm ideas</div>
              <svg className="connector" width="60" height="24" viewBox="0 0 60 24" aria-hidden="true">
                <path d="M2 12 H48" stroke="#ff5247" strokeWidth="2.5" strokeDasharray="4 3" fill="none" />
                <path d="M42 6 L52 12 L42 18" stroke="#ff5247" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <div className="s2">⚡ Design & Wireframe</div>
              <svg className="connector-2" width="60" height="24" viewBox="0 0 60 24" aria-hidden="true">
                <path d="M2 12 H48" stroke="#ea580c" strokeWidth="2.5" strokeDasharray="4 3" fill="none" />
                <path d="M42 6 L52 12 L42 18" stroke="#ea580c" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <div className="s3">Ship to users 🚀</div>

              {/* Simulated Live Collaborator Cursors */}
              <div className="demo-cursor demo-cursor-1">
                <MousePointer2 size={16} color="#ff4338" fill="#ff4338" />
                <span className="demo-cursor-pill" style={{ background: "#ff4338" }}>Ava</span>
              </div>
              <div className="demo-cursor demo-cursor-2">
                <MousePointer2 size={16} color="#ea580c" fill="#ea580c" />
                <span className="demo-cursor-pill" style={{ background: "#ea580c" }}>Marcus</span>
              </div>
            </div>

            <div className="stats">
              <div><b>50k+</b><small>Boards created</small></div>
              <div><b>120+</b><small>Countries</small></div>
              <div><b>4.9/5</b><small>Average rating</small></div>
              <div><b>99.9%</b><small>Uptime</small></div>
            </div>
          </section>

          <section className="section" aria-labelledby="testimonials-heading">
            <span className="badge"><Star size={13} /> Loved by makers</span>
            <h2 id="testimonials-heading">Teams do their best thinking here</h2>
            <div className="grid3">
              {testimonials.map((t) => (
                <figure key={t.n} className="quote" style={{ margin: 0 }}>
                  <Quote size={20} aria-hidden="true" />
                  <p>{t.q}</p>
                  <figcaption className="person">
                    <span className="avatar" aria-hidden="true">{t.i}</span>
                    <div><b>{t.n}</b><small>{t.r}</small></div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section className="section" aria-labelledby="features-heading">
            <span className="badge"><WandSparkles size={13} /> Capabilities</span>
            <h2 id="features-heading">Everything you need to think visually</h2>
            <div className="grid3">
              {features.map((f) => (
                <article key={f.t} className={`feature feature-${f.accent}`}>
                  <div className="feature-header" aria-hidden="true">
                    <div className="ico"><f.icon size={19} /></div>
                    <span className="feature-tag">{f.tag}</span>
                  </div>
                  <h3>{f.t}</h3>
                  <p>{f.d}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section" aria-labelledby="faq-heading">
            <span className="badge"><HelpCircle size={13} /> Questions & Answers</span>
            <h2 id="faq-heading">Frequently asked questions</h2>
            <div className="faq-grid">
              {faqs.map((faq, i) => (
                <details key={faq.q} className="faq-item" open={i === 0}>
                  <summary>{faq.q}</summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="cta" aria-labelledby="cta-heading">
            <h2 id="cta-heading">Your next big idea is one ink stroke away.</h2>
            <p>Join thousands of teams thinking, drawing, and shipping faster. Free to start — no credit card required.</p>
            <div className="hero-cta">
              <Link href="/signup" className="btn btn-dark btn-lg" id="cta-start" aria-label="Start whiteboarding for free">
                Start for free <ArrowRight size={15} />
              </Link>
              <Link href="/signin" className="btn btn-text btn-lg" id="cta-signin" aria-label="Sign in to your account">
                Sign in
              </Link>
            </div>
          </section>
        </main>

        <footer className="footer" role="contentinfo">
          <Logo />
          <span>© 2026 Syntheboard. All rights reserved.</span>
        </footer>
      </div>
    </>
  );
}