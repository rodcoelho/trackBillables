import { getResend, EMAIL_FROM } from './client';
import { welcomeEmail, trialEndingEmail, paymentFailedEmail } from './templates';

export async function sendWelcomeEmail(to: string, userName?: string): Promise<void> {
  try {
    const { subject, html } = welcomeEmail(userName);
    await getResend().emails.send({ from: EMAIL_FROM, to, subject, html });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

export async function sendTrialEndingEmail(to: string, daysLeft: number): Promise<void> {
  try {
    const { subject, html } = trialEndingEmail(daysLeft);
    await getResend().emails.send({ from: EMAIL_FROM, to, subject, html });
  } catch (error) {
    console.error('Failed to send trial ending email:', error);
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
