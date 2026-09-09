// Admin phone OTP design note: the OTP itself is generated, hashed, and
// verified entirely by our own code (src/lib/password.ts's
// generateNumericCode/hashCode/verifyCode, stored in VerificationToken
// with purpose "ADMIN_PHONE_OTP") — the same pattern already used for
// password-reset codes. Twilio's job here is purely SMS *delivery*, via
// its plain Messages API, not its separate "Verify" product — this keeps
// one consistent, testable, hashed-at-rest code path regardless of which
// SMS provider is configured, mirroring how Resend is only ever used to
// deliver a code XAS itself generated, never to generate one itself.

// Typed loosely (not against the twilio package's own type exports)
// deliberately: this was written without the ability to run `tsc` against
// the real installed package to confirm its exact type shape, and the
// surface used here (`.messages.create({ to, from, body })`) is small and
// stable enough that a minimal structural type is safer than guessing at
// an exact import path for the package's own types.
type MinimalTwilioClient = {
  messages: { create: (args: { to: string; from: string; body: string }) => Promise<unknown> };
};

let twilioClient: MinimalTwilioClient | null = null;

async function getTwilioClient(): Promise<MinimalTwilioClient | null> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  if (!twilioClient) {
    // Lazy import + lazy construction, same reasoning as mailer.ts: never
    // touch this at module load time, only on first actual send.
    const twilioModule = (await import("twilio")) as unknown as {
      default: (accountSid: string, authToken: string) => MinimalTwilioClient;
    };
    twilioClient = twilioModule.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

export async function sendAdminOtpSms(toPhoneNumber: string, code: string): Promise<void> {
  const client = await getTwilioClient();
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!client || !from) {
    console.warn(
      `[sms] Twilio not configured — would have sent admin OTP ${code} to ${toPhoneNumber}`
    );
    return;
  }

  await client.messages.create({
    to: toPhoneNumber,
    from,
    body: `Your XAS admin verification code is ${code}. It expires in 10 minutes.`,
  });
}
