import nodemailer from 'nodemailer';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const isSmtpConfigured = (): boolean => {
  return Boolean(
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_USER.trim() !== '' &&
    process.env.SMTP_USER !== 'your_email@gmail.com'
  );
};

const FROM = process.env.SMTP_FROM || 'Ranniti Team <noreply@ranniti.in>';
const LOGIN_URL = process.env.APP_LOGIN_URL || 'https://app.ranniti.in/login';

/**
 * Sends the welcome email to a newly created tenant admin user.
 * Includes their login URL, email address, and auto-generated password.
 */
export const sendWelcomeEmail = async (
  to: string,
  name: string,
  plainPassword: string,
  loginUrl: string = LOGIN_URL
): Promise<void> => {
  const firstName = name.trim().split(/\s+/)[0];
  const targetUrl = loginUrl || LOGIN_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin:0; padding:0;">
      <div style="max-width:560px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%); padding:36px 40px; text-align:center;">
          <h1 style="color:#fff; margin:0; font-size:22px; font-weight:700; letter-spacing:-0.5px;">Ranniti</h1>
          <p style="color:#c7d2fe; margin:6px 0 0; font-size:13px;">Constituency & Voter Management</p>
        </div>
        <div style="padding:36px 40px;">
          <h2 style="margin:0 0 8px; font-size:18px; color:#1e1b4b;">Welcome, ${firstName}! 👋</h2>
          <p style="color:#64748b; font-size:14px; line-height:1.6; margin:0 0 28px;">Your campaign workspace has been created on Ranniti. Use the credentials below to log in.</p>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:20px 24px; margin-bottom:28px;">
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <tr>
                <td style="padding:8px 0; color:#94a3b8; font-weight:600; width:110px;">🔗 Login URL</td>
                <td style="padding:8px 0; color:#4f46e5;">
                  <a href="${targetUrl}" style="color:#4f46e5; text-decoration:none; font-weight:600;">${targetUrl}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#94a3b8; font-weight:600;">📧 Email</td>
                <td style="padding:8px 0; color:#1e293b; font-weight:500;">${to}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#94a3b8; font-weight:600;">🔑 Password</td>
                <td style="padding:8px 0;">
                  <span style="background:#ede9fe; color:#4f46e5; font-family:monospace; font-size:15px; font-weight:700; padding:4px 10px; border-radius:6px; letter-spacing:0.5px;">${plainPassword}</span>
                </td>
              </tr>
            </table>
          </div>

          <div style="background:#fefce8; border:1px solid #fde68a; border-radius:8px; padding:14px 18px; margin-bottom:28px;">
            <p style="margin:0; font-size:13px; color:#92400e; line-height:1.5;">
              ⚠️ <strong>Your voter data is being prepared.</strong> You'll receive a second email when your assigned constituency data is ready to use.
            </p>
          </div>

          <p style="color:#94a3b8; font-size:12px; margin:0;">Please change your password after your first login from Settings → Account.</p>
        </div>
        <div style="background:#f8fafc; padding:20px 40px; text-align:center; border-top:1px solid #e2e8f0;">
          <p style="margin:0; font-size:12px; color:#94a3b8;">© ${new Date().getFullYear()} Ranniti. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!isSmtpConfigured()) {
    logger.info(`[Mailer] SMTP not configured (SMTP_USER/SMTP_PASS missing). Skipping welcome email to ${to}.`);
    return;
  }

  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: 'Welcome to Ranniti — Your Campaign Account is Ready',
      html,
    });
    logger.info(`[Mailer] Welcome email sent to ${to}`);
  } catch (err) {
    logger.error(`[Mailer] Failed to send welcome email to ${to}:`, err);
    // Non-blocking — do not throw; user creation should still succeed
  }
};

/**
 * Sends a "your voter data is ready" notification to a tenant admin
 * after background database provisioning completes.
 */
export const sendProvisioningReadyEmail = async (
  to: string,
  name: string,
  stats: { acCount: number; voterCount: number }
): Promise<void> => {
  const firstName = name.trim().split(/\s+/)[0];
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background:#f4f6f9; margin:0; padding:0;">
      <div style="max-width:560px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#059669 0%,#0d9488 100%); padding:36px 40px; text-align:center;">
          <h1 style="color:#fff; margin:0; font-size:22px; font-weight:700;">Ranniti</h1>
          <p style="color:#a7f3d0; margin:6px 0 0; font-size:13px;">Your Voter Data is Ready</p>
        </div>
        <div style="padding:36px 40px;">
          <h2 style="margin:0 0 8px; font-size:18px; color:#064e3b;">🎉 All set, ${firstName}!</h2>
          <p style="color:#64748b; font-size:14px; line-height:1.6; margin:0 0 28px;">Your campaign workspace has been fully loaded with voter data from your assigned constituencies.</p>

          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:20px 24px; margin-bottom:28px;">
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <tr>
                <td style="padding:8px 0; color:#6b7280;">✅ Assembly Constituencies</td>
                <td style="padding:8px 0; font-weight:700; color:#065f46; text-align:right;">${stats.acCount}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#6b7280;">✅ Voter Records Loaded</td>
                <td style="padding:8px 0; font-weight:700; color:#065f46; text-align:right;">${stats.voterCount.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#6b7280;">✅ Booth Data</td>
                <td style="padding:8px 0; font-weight:700; color:#065f46; text-align:right;">All Included</td>
              </tr>
            </table>
          </div>

          <div style="text-align:center;">
            <a href="${LOGIN_URL}" style="display:inline-block; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff; text-decoration:none; font-weight:700; font-size:14px; padding:14px 36px; border-radius:10px; letter-spacing:0.3px;">Login to Ranniti →</a>
          </div>
        </div>
        <div style="background:#f8fafc; padding:20px 40px; text-align:center; border-top:1px solid #e2e8f0;">
          <p style="margin:0; font-size:12px; color:#94a3b8;">© ${new Date().getFullYear()} Ranniti. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!isSmtpConfigured()) {
    logger.info(`[Mailer] SMTP not configured (SMTP_USER/SMTP_PASS missing). Skipping provisioning-ready email to ${to}.`);
    return;
  }

  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: `Ranniti — Your ${stats.voterCount.toLocaleString('en-IN')} Voter Records Are Ready`,
      html,
    });
    logger.info(`[Mailer] Provisioning-ready email sent to ${to}`);
  } catch (err) {
    logger.error(`[Mailer] Failed to send provisioning-ready email to ${to}:`, err);
  }
};
