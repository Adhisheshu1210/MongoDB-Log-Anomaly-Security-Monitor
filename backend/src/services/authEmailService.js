const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class AuthEmailService {
  constructor() {
    this.transporter = null;
  }

  getConfig() {
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10);
    const user = process.env.EMAIL_USER || process.env.SMTP_USER || '';
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
    const from = process.env.EMAIL_FROM || user;
    const service = /gmail/i.test(host) ? 'gmail' : undefined;

    return { host, port, user, pass, from, service };
  }

  ensureTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const config = this.getConfig();

    if (!config.user || !config.pass) {
      throw new Error('Email service is not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env');
    }

    this.transporter = nodemailer.createTransport({
      service: config.service,
      host: config.service ? undefined : config.host,
      port: config.service ? undefined : config.port,
      secure: config.service ? undefined : config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    return this.transporter;
  }

  async sendVerificationCode({ email, username, code, expiresInMinutes = 10 }) {
    try {
      const { from } = this.getConfig();
      const transporter = this.ensureTransporter();

      await transporter.sendMail({
        from,
        to: email,
        subject: 'Verify your MongoDB Log Anomaly & Security Monitor account',
        html: this.buildTemplate({
          title: 'Verify your account',
          heading: 'Account verification code',
          username,
          code,
          expiresInMinutes,
          message: 'Use this code to verify your new account and activate dashboard access.'
        })
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to send verification email:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetCode({ email, username, code, expiresInMinutes = 10 }) {
    try {
      const { from } = this.getConfig();
      const transporter = this.ensureTransporter();

      await transporter.sendMail({
        from,
        to: email,
        subject: 'Reset your MongoDB Log Anomaly & Security Monitor password',
        html: this.buildTemplate({
          title: 'Reset your password',
          heading: 'Password reset code',
          username,
          code,
          expiresInMinutes,
          message: 'Use this code to reset your password. If you did not request it, you can ignore this message.'
        })
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to send reset email:', error.message);
      return { success: false, error: error.message };
    }
  }

  buildTemplate({ title, heading, username, code, expiresInMinutes, message }) {
    return `
      <div style="background:#0a0e17;color:#e5e7eb;font-family:Arial,sans-serif;padding:32px">
        <div style="max-width:640px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:20px;padding:32px;box-shadow:0 0 40px rgba(0,255,136,0.08)">
          <p style="margin:0 0 8px;color:#00ff88;font-size:12px;letter-spacing:.12em;text-transform:uppercase">${title}</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#ffffff">${heading}</h1>
          <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px">Hello ${username || 'there'},</p>
          <p style="margin:0 0 24px;color:#cbd5e1;font-size:15px;line-height:1.7">${message}</p>
          <div style="background:linear-gradient(135deg,rgba(0,255,136,.12),rgba(0,170,255,.12));border:1px solid rgba(0,255,136,.35);border-radius:16px;padding:24px;text-align:center;letter-spacing:.35em;font-size:34px;font-weight:700;color:#ffffff">
            ${code}
          </div>
          <p style="margin:16px 0 0;color:#94a3b8;font-size:13px">This code expires in ${expiresInMinutes} minutes.</p>
        </div>
      </div>
    `;
  }
}

module.exports = new AuthEmailService();
