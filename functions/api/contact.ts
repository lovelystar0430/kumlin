/**
 * POST /api/contact — Cloudflare Pages Function replacing Webflow's form backend.
 *
 * Flow: origin check → honeypot → validation → Turnstile verification → email via Resend.
 * Responds with JSON when the request comes from the enhanced form (Accept: application/json),
 * otherwise with a minimal HTML page so it still works as a plain form post.
 *
 * Environment (Pages → Settings → Variables and Secrets; locally in .dev.vars):
 *   TURNSTILE_SECRET_KEY  Turnstile secret for the site key in PUBLIC_TURNSTILE_SITE_KEY
 *   RESEND_API_KEY        Resend API key (sending domain must be verified in Resend)
 *   CONTACT_TO_EMAIL      Recipient(s), comma-separated
 *   CONTACT_FROM_EMAIL    Sender, e.g. "Kumlin webbplats <webb@kumlin.no>"
 */

interface Env {
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
}

interface Submission {
  name: string;
  phone: string;
  email: string;
  message: string;
}

const LIMITS = { name: 256, phone: 256, email: 256, message: 5000 } as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const wantsJson = request.headers.get('Accept')?.includes('application/json') ?? false;
  const reply = (status: number, ok: boolean) => (wantsJson ? Response.json({ ok }, { status }) : htmlResponse(status, ok));

  // Reject cross-site posts. Browsers always send Origin on POST.
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return reply(403, false);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(400, false);
  }

  // Honeypot filled in → almost certainly a bot. Pretend success so it doesn't retry.
  if (String(form.get('company') ?? '').trim() !== '') return reply(200, true);

  const submission = parseSubmission(form);
  if (!submission) return reply(400, false);

  const token = String(form.get('cf-turnstile-response') ?? '');
  const ip = request.headers.get('CF-Connecting-IP') ?? undefined;
  if (!(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip))) return reply(403, false);

  try {
    await sendEmail(env, submission);
  } catch (error) {
    console.error('Contact form email failed', error);
    return reply(502, false);
  }

  return reply(200, true);
};

function parseSubmission(form: FormData): Submission | null {
  const field = (key: keyof Submission) => String(form.get(key) ?? '').trim();
  const submission: Submission = {
    name: field('name'),
    phone: field('phone'),
    email: field('email'),
    message: field('message'),
  };

  for (const key of Object.keys(LIMITS) as (keyof Submission)[]) {
    const value = submission[key];
    if (value === '' || value.length > LIMITS[key]) return null;
  }
  if (!EMAIL_PATTERN.test(submission.email)) return null;

  // Single-line fields end up in the subject line.
  submission.name = submission.name.replace(/[\r\n]+/g, ' ');
  submission.phone = submission.phone.replace(/[\r\n]+/g, ' ');
  return submission;
}

async function verifyTurnstile(secret: string, token: string, ip?: string): Promise<boolean> {
  if (!secret || !token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  if (!response.ok) return false;
  const result = (await response.json()) as { success: boolean };
  return result.success;
}

async function sendEmail(env: Env, s: Submission): Promise<void> {
  const text = [`Namn: ${s.name}`, `Telefon: ${s.phone}`, `E-post: ${s.email}`, '', s.message].join('\n');
  const html = `
    <p><strong>Namn:</strong> ${escapeHtml(s.name)}<br>
    <strong>Telefon:</strong> ${escapeHtml(s.phone)}<br>
    <strong>E-post:</strong> ${escapeHtml(s.email)}</p>
    <p style="white-space:pre-wrap">${escapeHtml(s.message)}</p>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: env.CONTACT_TO_EMAIL.split(',').map((address) => address.trim()),
      reply_to: s.email,
      subject: `Kontaktformulär kumlin.no: ${s.name}`,
      text,
      html,
    }),
  });

  if (!response.ok) throw new Error(`Resend responded ${response.status}: ${await response.text()}`);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Fallback for form posts without JavaScript. */
function htmlResponse(status: number, ok: boolean): Response {
  const message = ok
    ? 'Takk! Innsendingen din er mottatt!'
    : 'Ups! Noe gikk galt under innsending av skjemaet. Ring +46 760 224 191 eller mejla elin@fuktdimensionering.se.';
  const html = `<!doctype html><html lang="sv"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Kontakt | Kumlin</title>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.5">
<p>${message}</p><p><a href="/kontakt">Tillbaka</a></p></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
