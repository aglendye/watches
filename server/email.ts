// Sends the password-reset code through Gmail SMTP (an app password).
// Without SMTP settings outside production, the code is printed to the
// server console instead, so local development works with no email setup.
import nodemailer from 'nodemailer';

const APP_NAME = 'Watch Ratings';

export async function sendResetCode(to: string, code: string): Promise<void> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    if (process.env.VERCEL_ENV === 'production') {
      throw new Error('Email is not configured (SMTP_USER / SMTP_PASS).');
    }
    console.log(`[dev] Password reset code for ${to}: ${code}`);
    return;
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user, pass },
  });

  await transport.sendMail({
    from: `"${APP_NAME}" <${process.env.SMTP_FROM || user}>`,
    to,
    subject: `${code} is your ${APP_NAME} code`,
    text:
      `Your ${APP_NAME} password reset code is ${code}\n\n` +
      `Type it into the app to choose a new password. It expires in 15 minutes.\n` +
      `If you didn't ask for this, you can ignore this email.`,
    html:
      `<p>Your ${APP_NAME} password reset code is</p>` +
      `<p style="font-size:28px;font-weight:700;letter-spacing:6px;font-family:monospace">${code}</p>` +
      `<p>Type it into the app to choose a new password. It expires in 15 minutes.</p>` +
      `<p style="color:#666">If you didn't ask for this, you can ignore this email.</p>`,
  });
}
