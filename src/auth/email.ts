/**
 * Transactional email via Brevo (project's email provider). Used for account
 * verification and password reset. Env-guarded: with no API key it no-ops (dev).
 *
 * GUARDRAIL G4/G5: never log full email addresses or the API key. Recipient is
 * redacted in logs; the key lives only in env.
 */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
}

function redact(email: string): string {
  return email.replace(/^(.).*(@.*)$/, '$1***$2');
}

export async function sendEmail({ to, subject, html }: OutboundEmail): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(`[email] Brevo not configured — skipped send to ${redact(to)}`);
    return;
  }

  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: from, name: 'NaijaXch' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Brevo send failed (${res.status}) for ${redact(to)}`);
  }
}

const DISCLAIMER =
  'NaijaXch provides automated, general information — not personalised advice. NGX data is delayed/end-of-day.';

export function verificationEmail(verifyUrl: string): { subject: string; html: string } {
  return {
    subject: 'Verify your NaijaXch email',
    html: `<p>Welcome to NaijaXch.</p>
<p>Confirm your email to finish setting up your account:</p>
<p><a href="${verifyUrl}">Verify email</a></p>
<p style="color:#64748b;font-size:12px">${DISCLAIMER}</p>`,
  };
}

export function passwordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'Reset your NaijaXch password',
    html: `<p>We received a request to reset your NaijaXch password.</p>
<p><a href="${resetUrl}">Reset password</a> — this link expires in 1 hour.</p>
<p>If you didn't request this, you can ignore this email.</p>
<p style="color:#64748b;font-size:12px">${DISCLAIMER}</p>`,
  };
}
