/**
 * Report Scheduler Service
 * Periodically checks for scheduled reports and sends them via email.
 */

const Report = require('../models/Report');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const notificationFeedService = require('./notificationFeedService');

const DEFAULT_INTERVAL_MS = parseInt(process.env.REPORT_SCHEDULER_INTERVAL_MS || String(60 * 1000), 10); // 1 minute

const cadenceToMs = (cadence) => {
  if (!cadence) return 24 * 60 * 60 * 1000;
  const c = cadence.toLowerCase();
  if (c === 'daily') return 24 * 60 * 60 * 1000;
  if (c === 'weekly') return 7 * 24 * 60 * 60 * 1000;
  if (c === 'monthly') return 30 * 24 * 60 * 60 * 1000;
  if (c === 'hourly') return 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
};

class ReportScheduler {
  constructor() {
    this.timer = null;
    this.running = false;
  }

  async sendReportByEmail(report, recipients) {
    const smtpHost = process.env.EMAIL_HOST;
    const smtpPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const smtpUser = process.env.EMAIL_USER;
    const smtpPass = process.env.EMAIL_PASS;
    const from = process.env.EMAIL_FROM || smtpUser || 'no-reply@example.com';

    if (!smtpHost || !smtpUser || !smtpPass) {
      logger.warn('SMTP not configured; skipping scheduled email send');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass }
    });

    const recipientsList = Array.isArray(recipients) ? recipients.join(',') : String(recipients || '').split(',').map(r => r.trim()).filter(Boolean).join(',');
    const attachmentName = report.fileName || `${report.reportId}.${report.format === 'csv' ? 'csv' : 'json'}`;
    const attachmentContent = report.format === 'csv' ? (report.csvContent || '') : JSON.stringify(report.data || {}, null, 2);

    const info = await transporter.sendMail({
      from,
      to: recipientsList,
      subject: `Scheduled Report: ${report.title}`,
      text: `Attached is the scheduled report: ${report.title}`,
      attachments: [{ filename: attachmentName, content: attachmentContent }]
    });

    logger.info(`Scheduled report sent: ${info.messageId} -> ${recipientsList}`);
    return true;
  }

  async processDueReports() {
    if (this.running) return;
    this.running = true;

    try {
      const now = new Date();
      const due = await Report.find({ 'scheduledEmail.enabled': true, 'scheduledEmail.nextRunAt': { $lte: now } });

      if (!due || due.length === 0) {
        return;
      }

      for (const report of due) {
        try {
          const recipients = report.scheduledEmail.recipients || [];
          if (!recipients.length) {
            logger.warn(`Scheduled report ${report.reportId} has no recipients; skipping`);
            continue;
          }

          const sent = await this.sendReportByEmail(report, recipients).catch((e) => { logger.error('Scheduled send error', e.message); return false; });

          if (sent) {
            report.scheduledEmail.lastSentAt = new Date();
            // compute next run
            const ms = cadenceToMs(report.scheduledEmail.cadence || 'daily');
            report.scheduledEmail.nextRunAt = new Date(Date.now() + ms);
            // update status
            report.status = 'READY';
            await report.save();

            const notification = await notificationFeedService.createSystemNotification({
              title: 'Scheduled Report Ready',
              message: `Your scheduled report ${report.title} has been emailed.`,
              severity: 'info',
              actionUrl: `/reports/${report.reportId}`,
              meta: { reportId: report.reportId, recipients, cadence: report.scheduledEmail.cadence }
            });

            if (notification && global.__APP_IO__) {
              global.__APP_IO__.emit('notification:new', notification);
            }
          }
        } catch (err) {
          logger.error(`Failed to process scheduled report ${report.reportId}: ${err.message}`);
        }
      }
    } catch (err) {
      logger.error('Report scheduler loop error:', err.message);
    } finally {
      this.running = false;
    }
  }

  start(intervalMs = DEFAULT_INTERVAL_MS) {
    if (this.timer) return;
    this.timer = setInterval(() => this.processDueReports().catch((e) => logger.error(e.message)), intervalMs);
    logger.info(`Report scheduler started (interval=${intervalMs}ms)`);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    logger.info('Report scheduler stopped');
  }
}

module.exports = new ReportScheduler();
