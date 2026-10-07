import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
    const port = Number(SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
    });
    return transporter;
}

export async function sendPasswordResetEmail(to, link) {
    const html = `<div style="font-family:Arial,sans-serif;max-width:480px">
  <h2>Reset your password</h2>
  <p>We received a request to reset your Blank Canvas password. This link is valid for 1 hour.</p>
  <p><a href="${link}" style="display:inline-block;padding:12px 22px;background:#166534;color:#fff;border-radius:8px;text-decoration:none">Reset password</a></p>
  <p style="color:#666;font-size:13px">If the button doesn't work, paste this into your browser:<br>${link}</p>
  <p style="color:#666;font-size:13px">If you didn't ask for this, you can ignore this email.</p>
</div>`;

    // 1. If RESEND_API_KEY is configured, use Resend HTTP API (recommended for Render free tier where SMTP is blocked)
    if (process.env.RESEND_API_KEY) {
        const configuredFrom = process.env.RESEND_FROM || process.env.MAIL_FROM || "";
        // Resend cannot send from public free email domains (gmail, yahoo, etc.) without DNS domain ownership verification.
        const isPublicDomain = /@(gmail|yahoo|hotmail|outlook)\.com/i.test(configuredFrom);
        const from = (!configuredFrom || isPublicDomain) ? "Blank Canvas <onboarding@resend.dev>" : configuredFrom;
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to: [to],
                subject: "Reset your Blank Canvas password",
                html,
                text: `We received a request to reset your password.\n\nOpen this link (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
            }),
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Resend API error (${res.status}): ${errBody}`);
        }
        console.log(`[mail] Password reset email sent via Resend API to ${to}`);
        return;
    }

    // 2. Otherwise use SMTP (Nodemailer)
    const t = getTransporter();
    if (!t) {
        console.log(`[mail] SMTP not configured. Password reset link for ${to}: ${link}`);
        return;
    }

    await t.sendMail({
        from: process.env.MAIL_FROM || `"Blank Canvas" <${process.env.SMTP_USER}>`,
        to,
        subject: "Reset your Blank Canvas password",
        text: `We received a request to reset your password.\n\nOpen this link (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
        html,
    });
    console.log(`[mail] Password reset email sent via SMTP to ${to}`);
}

