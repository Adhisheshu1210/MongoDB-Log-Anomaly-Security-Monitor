const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const notificationService = require('../services/notification');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');

// Helper: build SMTP transporter from env if available
function buildTransporterFromEnv() {
  // Prefer SMTP_* vars, fall back to EMAIL_* vars for compatibility
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : (process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : null);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  if (!host || !port || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  });
}

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Persist to DB (best-effort)
    let saved = null;
    try {
      saved = await Contact.createFrom({ name, email, message });
    } catch (dbErr) {
      logger.warn('Failed to save contact message to DB:', dbErr.message);
    }

    // Send notification email to the configured admin address (ENV override)
    const recipient = process.env.EMAIL_USER || process.env.ADMIN_CONTACT_EMAIL || 'angothuadhisheshu@gmail.com';
    const mailBody = `
      <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Message:</strong></p>
      <div style="white-space:pre-wrap;border-left:2px solid #eee;padding-left:8px">${message}</div>
      <p style="margin-top:12px;font-size:12px;color:#666">Contact ID: ${saved?._id || 'n/a'}</p>
    `;

    // Try to use explicit SMTP settings from environment
    try {
      const transporter = buildTransporterFromEnv();
      if (transporter) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@mongodb-monitor.local',
          to: recipient,
          subject: 'Website Contact Form Submission',
          html: mailBody
        });
        logger.info(`Contact form emailed to ${recipient} via SMTP env settings`);
      } else {
        // Fall back to project notification service (uses Settings or will no-op)
        await notificationService.sendEmail({
          severity: 'info',
          category: 'contact',
          title: 'Website Contact Form Submission',
          message: `From: ${name} <${email}>\n\n${message}`,
          createdAt: new Date(),
          _id: saved?._id || null
        });
        logger.info('Contact form forwarded to notification service');
      }
    } catch (notifyErr) {
      logger.warn('Notification send failed for contact form:', notifyErr.message);
    }

    return res.json({ success: true, data: { id: saved?._id || null } });
  } catch (error) {
    logger.error('Contact endpoint error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
