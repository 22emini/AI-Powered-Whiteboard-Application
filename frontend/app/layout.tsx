import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Blank Canvas — AI-powered infinite whiteboard",
  description: "Sketch, diagram and brainstorm on an infinite canvas. Real-time collaboration and AI that expands your ideas.",
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
