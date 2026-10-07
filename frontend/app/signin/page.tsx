import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Blank Canvas account to access your whiteboards and collaborate with your team.",
};

export default function Page() {
  return <AuthForm mode="signin" />;
}
