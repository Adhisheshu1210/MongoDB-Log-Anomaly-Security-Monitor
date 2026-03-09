/**
 * Notification Service
 * Handles sending alerts via email, Slack, and Telegram
 */

const nodemailer = require('nodemailer');
const axios = require('axios');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.settings = null;
  }

  // Initialize notification settings
  async initialize() {
    try {
      const notificationSettings = await Settings.findOne({ key: 'notificationSettings' });
      if (notificationSettings) {
        this.settings = notificationSettings.value;
        
        // Setup email transporter if configured
        if (this.settings.email?.enabled && this.settings.email.smtpHost) {
          this.transporter = nodemailer.createTransport({
            host: this.settings.email.smtpHost,
            port: this.settings.email.smtpPort,
            secure: false,
            auth: {
              user: this.settings.email.smtpUser,
              pass: this.settings.email.smtpPass
            }
          });
        }
      }
      logger.info('Notification service initialized');
    } catch (error) {
      logger.error('Failed to initialize notification service:', error.message);
    }
  }

  // Send email notification
  async sendEmail(alert) {
    if (!this.settings?.email?.enabled || !this.transporter) {
      logger.debug('Email notifications disabled or not configured');
      return { success: false, reason: 'not_configured' };
    }

    try {
      const mailOptions = {
        from: this.settings.email.smtpUser,
        to: this.settings.email.recipients.join(', '),
        subject: `[${alert.severity.toUpperCase()}] MongoDB Monitor: ${alert.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${this.getSeverityColor(alert.severity)};">MongoDB Log Monitor Alert</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Severity:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${alert.severity}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Category:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${alert.category}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Title:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${alert.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Message:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${alert.message}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Time:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(alert.createdAt).toISOString()}</td>
              </tr>
            </table>
            <p style="margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/alerts/${alert._id}" 
                 style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                View in Dashboard
              </a>
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email notification sent for alert: ${alert._id}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to send email notification:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send Slack notification
  async sendSlack(alert) {
    if (!this.settings?.slack?.enabled || !this.settings.slack.webhookUrl) {
      logger.debug('Slack notifications disabled or not configured');
      return { success: false, reason: 'not_configured' };
    }

    try {
      const payload = {
        attachments: [{
          color: this.getSeverityColor(alert.severity),
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `🚨 MongoDB Monitor Alert`,
                emoji: true
              }
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Severity:*\n${alert.severity.toUpperCase()}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Category:*\n${alert.category}`
                }
              ]
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${alert.title}*\n${alert.message}`
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Time: ${new Date(alert.createdAt).toLocaleString()}`
                }
              ]
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'View Alert'
                  },
                  url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/alerts/${alert._id}`
                }
              ]
            }
          ]
        }]
      };

      await axios.post(this.settings.slack.webhookUrl, payload);
      logger.info(`Slack notification sent for alert: ${alert._id}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to send Slack notification:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send Telegram notification
  async sendTelegram(alert) {
    if (!this.settings?.telegram?.enabled || !this.settings.telegram.botToken || !this.settings.telegram.chatId) {
      logger.debug('Telegram notifications disabled or not configured');
      return { success: false, reason: 'not_configured' };
    }

    try {
      const emoji = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🔵',
        info: '⚪'
      };

      const message = `
${emoji[alert.severity] || '⚪'} *MongoDB Monitor Alert*

*Severity:* ${alert.severity.toUpperCase()}
*Category:* ${alert.category}
*Title:* ${alert.title}
*Message:* ${alert.message}
*Time:* ${new Date(alert.createdAt).toLocaleString()}
      `.trim();

      const url = `https://api.telegram.org/bot${this.settings.telegram.botToken}/sendMessage`;
      await axios.post(url, {
        chat_id: this.settings.telegram.chatId,
        text: message,
        parse_mode: 'Markdown'
      });

      logger.info(`Telegram notification sent for alert: ${alert._id}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to send Telegram notification:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send all notifications
  async sendNotifications(alert) {
    const results = {
      email: await this.sendEmail(alert),
      slack: await this.sendSlack(alert),
      telegram: await this.sendTelegram(alert)
    };

    return results;
  }

  // Get color for severity level
  getSeverityColor(severity) {
    const colors = {
      critical: '#dc3545',
      high: '#fd7e14',
      medium: '#ffc107',
      low: '#17a2b8',
      info: '#6c757d'
    };
    return colors[severity] || '#6c757d';
  }
}

module.exports = new NotificationService();

