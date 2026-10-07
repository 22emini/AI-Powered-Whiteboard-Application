import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password — Blank Canvas" };

export default function Page() {
  return <ForgotPasswordForm />;
}
