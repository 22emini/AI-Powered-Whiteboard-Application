import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blankcanvas.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Blank Canvas — AI-Powered Infinite Collaborative Whiteboard",
    template: "%s | Blank Canvas",
  },
  description:
    "Sketch, diagram, and brainstorm on an infinite canvas. Real-time multiplayer collaboration, AI-powered sticky notes, flowcharts, charts, image generation, and built-in video calls.",
  keywords: [
    "whiteboard",
    "online whiteboard",
    "AI whiteboard",
    "collaborative whiteboard",
    "infinite canvas",
    "brainstorming app",
    "diagramming tool",
    "flowchart maker",
    "team collaboration",
    "Pollinations AI image whiteboard",
  ],
  authors: [{ name: "Blank Canvas Team" }],
  creator: "Blank Canvas",
  publisher: "Blank Canvas",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Blank Canvas",
    title: "Blank Canvas — AI-Powered Infinite Collaborative Whiteboard",
    description:
      "Sketch, diagram, and brainstorm on an infinite canvas with real-time collaboration, AI brainstorming, flowcharts, charts, image generation, and video calls.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blank Canvas — AI-Powered Infinite Collaborative Whiteboard",
    description:
      "Sketch, diagram, and brainstorm on an infinite canvas with AI expansion and real-time collaboration.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${space.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
