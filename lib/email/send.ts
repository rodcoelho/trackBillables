import { getResend, EMAIL_FROM } from './client';
import { welcomeEmail, paymentFailedEmail, verificationCodeEmail } from './templates';

export async function sendWelcomeEmail(to: string, userName?: string): Promise<void> {
  try {
    const { subject, html } = welcomeEmail(userName);
    await getResend().emails.send({ from: EMAIL_FROM, to, subject, html });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

export async function sendVerificationCodeEmail(to: string, code: string): Promise<void> {
  try {
    const { subject, html } = verificationCodeEmail(code);
    await getResend().emails.send({ from: EMAIL_FROM, to, subject, html });
  } catch (error) {
    console.error('Failed to send verification code email:', error);
  }
}

export async function sendPaymentFailedEmail(to: string): Promise<void> {
  try {
    const { subject, html } = paymentFailedEmail();
    await getResend().emails.send({ from: EMAIL_FROM, to, subject, html });
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
  }
}
