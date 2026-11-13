/*
 * Transactional email — SERVER ONLY. Two ways to send, picked by env vars:
 *
 *  1. Gmail (no domain setup):
 *       GMAIL_USER          the Gmail address, e.g. evowellnutritonx@gmail.com
 *       GMAIL_APP_PASSWORD  16-letter app password (Google Account → Security →
 *                           2-Step Verification → App passwords)
 *     Free, roughly 500 emails a day.
 *
 *  2. Resend with your own domain (preferred once evowellnutrition.com is verified):
 *       RESEND_API_KEY  re_…
 *       EMAIL_FROM      e.g. "Evowell <login@evowellnutrition.com>"
 *     Used only when BOTH are set, so an unverified key can't break sign-in.
 *
 * With neither, emailOn() is false and sign-in shows the code on screen.
 */

import nodemailer from "nodemailer";
import { business } from "@/lib/business";

const resendOn = () => !!process.env.RESEND_API_KEY?.trim() && !!process.env.EMAIL_FROM?.trim();
const gmailOn = () => !!process.env.GMAIL_USER?.trim() && !!process.env.GMAIL_APP_PASSWORD?.trim();

export const emailOn = () => resendOn() || gmailOn();

const g = globalThis as unknown as { __evoMail?: nodemailer.Transporter };
const gmail = () =>
  (g.__evoMail ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: process.env.GMAIL_USER!.trim(), pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s/g, "") },
  }));

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function send(to: string, subject: string, html: string, text: string) {
  if (resendOn()) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM!.trim(), to: [to], subject, html, text, ...(business.email ? { reply_to: business.email } : {}) }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(`Resend ${res.status}: ${j.message ?? "send failed"}`);
    }
    return;
  }
  await gmail().sendMail({
    from: { name: "Evowell", address: process.env.GMAIL_USER!.trim() },
    to,
    subject,
    html,
    text,
    ...(business.email ? { replyTo: business.email } : {}),
  });
}

export async function sendSignInCode(to: string, code: string, opts: { name?: string; signup: boolean; minutes: number }) {
  const first = opts.name?.trim().split(" ")[0];
  const hello = first ? `Hi ${esc(first)},` : "Hi,";
  const what = opts.signup ? "finish creating your Evowell account" : "sign in to Evowell";
  const subject = `${code} is your Evowell code`;
  const text = `${first ? `Hi ${first},` : "Hi,"}\n\nYour code to ${what} is: ${code}\n\nIt expires in ${opts.minutes} minutes. If you didn't ask for it, you can ignore this email.\n\n— Evowell`;
  const html = `<!doctype html><html><body style="margin:0;background:#F4F5F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0A0A0A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F1;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#ffffff;border-radius:24px;overflow:hidden">
<tr><td style="background:#0E1A13;padding:22px 28px;color:#FAFAF8;font-size:22px;font-weight:600;letter-spacing:-0.5px">evowell</td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 12px;font-size:16px">${hello}</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#3d3b37">Use this code to ${what}:</p>
<p style="margin:0 0 20px;font-size:34px;font-weight:700;letter-spacing:10px;font-family:'SF Mono',Menlo,Consolas,monospace;color:#0E7A37;background:#E6F4EA;border-radius:16px;padding:16px 0;text-align:center">${code}</p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#6B6862">It expires in ${opts.minutes} minutes. If you didn't ask for it, you can ignore this email — no one can sign in without the code.</p>
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #eeeeea;font-size:12px;color:#9a978f">${esc(business.brand)}${business.address ? ` · ${esc(business.address)}` : ""}</td></tr>
</table></td></tr></table></body></html>`;
  await send(to, subject, html, text);
}
