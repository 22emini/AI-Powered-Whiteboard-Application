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
    });
    return transporter;
}

export async function sendPasswordResetEmail(to, link) {
    const t = getTransporter();
    if (!t) {
        // No SMTP configured: print the link so it still works in local development
        console.log(`[mail] SMTP not configured. Password reset link for ${to}: ${link}`);
        return;
    }
    await t.sendMail({
        from: process.env.MAIL_FROM || `"Blank Canvas" <${process.env.SMTP_USER}>`,
        to,
        subject: "Reset your Blank Canvas password",
        text: `We received a request to reset your password.\n\nOpen this link (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:480px">
  <h2>Reset your password</h2>
  <p>We received a request to reset your Blank Canvas password. This link is valid for 1 hour.</p>
  <p><a href="${link}" style="display:inline-block;padding:12px 22px;background:#166534;color:#fff;border-radius:8px;text-decoration:none">Reset password</a></p>
  <p style="color:#666;font-size:13px">If the button doesn't work, paste this into your browser:<br>${link}</p>
  <p style="color:#666;font-size:13px">If you didn't ask for this, you can ignore this email.</p>
</div>`,
    });
}
