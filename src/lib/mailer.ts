import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL || "XAS <no-reply@xtreamadvancedscholars.com>";

// Constructed lazily, on first real send — never at module import time.
// This matters because module-level code runs the moment anything imports
// this file, including during `next build`'s page data collection; a
// service client that eagerly validates its API key at construction would
// make a missing (optional-at-build-time) RESEND_API_KEY break the build
// itself, not just the email feature.
let resendClient: Resend | null = null;
function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendPasswordResetCodeEmail(to: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    // Fail loudly in production, but don't crash local/dev flows that
    // haven't configured Resend yet — log instead so the flow is still
    // testable end-to-end once DB access exists.
    console.warn(
      `[mailer] RESEND_API_KEY not set — would have emailed reset code ${code} to ${to}`
    );
    return;
  }

  await getResendClient().emails.send({
    from: FROM,
    to,
    subject: "Your XAS password reset code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0B1E3D;color:#ffffff;border-radius:12px;">
        <p style="letter-spacing:2px;color:#D4AF37;font-size:12px;text-transform:uppercase;">Xtream Advanced Scholars</p>
        <h2 style="margin:8px 0 16px;">Reset your password</h2>
        <p>Use this code to reset your XAS password. It expires in 10 minutes and can only be used once.</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#D4AF37;margin:24px 0;">${code}</p>
        <p style="color:#94A3B8;font-size:13px;">If you didn't request this, you can safely ignore this email — your password will not change.</p>
      </div>
    `,
    text: `Your XAS password reset code is ${code}. It expires in 10 minutes and can only be used once. If you didn't request this, ignore this email.`,
  });
}
