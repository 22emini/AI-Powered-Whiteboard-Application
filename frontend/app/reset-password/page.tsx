import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Syntheboard account.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResetPasswordForm />;
}
