import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join Syntheboard free. An infinite collaborative whiteboard powered by AI for sketching, diagrams, flowcharts, and video calls.",
};

export default function Page() {
  return <AuthForm mode="signup" />;
}
