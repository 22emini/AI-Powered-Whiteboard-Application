import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password — Blank Canvas" };

export default function Page() {
  return <ResetPasswordForm />;
}
