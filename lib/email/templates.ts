const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#4f46e5;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">TrackBillables</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;text-align:center;color:#71717a;font-size:13px;border-top:1px solid #e4e4e7;">
              TrackBillables &mdash; Simple time tracking for professionals
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function ctaButton(text: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:#4f46e5;border-radius:6px;padding:12px 24px;">
        <a href="${href}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

export function welcomeEmail(userName?: string): { subject: string; html: string } {
  const greeting = userName ? `Hi ${escapeHtml(userName)},` : 'Hi there,';
  return {
    subject: 'Welcome to TrackBillables!',
    html: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">${greeting}</h2>
      <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
        Welcome to TrackBillables! We're glad you signed up. You can start tracking your billable hours right away.
      </p>
      ${ctaButton('Go to Dashboard', `${APP_URL}/dashboard`)}
      <p style="margin:0;color:#71717a;font-size:14px;">
        If you have any questions, just reply to this email.
      </p>
    `),
  };
}

export function paymentFailedEmail(): { subject: string; html: string } {
  return {
    subject: 'Payment failed — action required',
    html: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">We couldn't process your payment</h2>
      <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
        Your most recent payment didn't go through. Please update your payment method to avoid any disruption to your service.
      </p>
      ${ctaButton('Update Payment Method', `${APP_URL}/billing`)}
      <p style="margin:0;color:#71717a;font-size:14px;">
        If you believe this is an error, please reply to this email and we'll help sort it out.
      </p>
    `),
  };
}
