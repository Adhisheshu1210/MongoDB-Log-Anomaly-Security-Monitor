/**
 * Reports Routes
 * Generate, store, list, and download saved reports.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const { protect, checkPermission } = require('../middleware/auth');
const Report = require('../models/Report');
const logger = require('../utils/logger');
const { generateReportPayload, REPORT_TYPE_LABELS } = require('../services/reportService');
const nodemailer = require('nodemailer');
const notificationFeedService = require('../services/notificationFeedService');

const getReportByIdentifier = (identifier) => {
  const query = { reportId: identifier };

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.$or = [{ reportId: identifier }, { _id: identifier }];
  }

  return Report.findOne(query);
};

const buildReportId = () => {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 17);
  const nonce = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `REP-${timestamp}-${nonce}`;
};

const buildFileName = ({ title, format, dateRange }) => {
  const safeTitle = String(title || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const safeRange = String(dateRange?.key || 'range');
  return `${safeTitle}-${safeRange}.${format === 'csv' ? 'csv' : 'json'}`;
};

router.post('/generate', protect, checkPermission('generate_reports'), async (req, res) => {
  try {
    const {
      reportType = 'security_incident_summary',
      format = 'json',
      rangeKey,
      dataset,
      title,
      notes
    } = req.body || {};

    const payload = await generateReportPayload({ reportType, rangeKey, dataset });
    const reportId = buildReportId();
    const fileName = buildFileName({
      title: title || payload.reportTitle,
      format,
      dateRange: payload.dateRange
    });
    const data = format === 'csv' ? payload.csvContent : payload.reportData;
    const fileSizeBytes = Buffer.byteLength(typeof data === 'string' ? data : JSON.stringify(data), 'utf8');

    let report;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        report = await Report.create({
          reportId: attempt === 0 ? reportId : buildReportId(),
          title: title || payload.reportTitle,
          reportType: payload.reportType,
          format,
          status: 'READY',
          dateRange: payload.dateRange,
          summary: payload.summary,
          data: payload.reportData,
          csvContent: payload.csvContent,
          fileSizeBytes,
          fileName,
          createdBy: req.user?._id,
          metadata: {
            notes: notes || '',
            generatedBy: req.user?.username || 'system'
          }
        });
        break;
      } catch (createError) {
        if (createError.code !== 11000 || attempt === 2) {
          throw createError;
        }
      }
    }

    try {
      const notification = await notificationFeedService.createReportNotification(report, 'report');
      if (notification) {
        const io = req.app.get('io');
        io?.emit('notification:new', notification);
      }
    } catch (feedError) {
      logger.error('In-app report notification error:', feedError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Report generated and saved',
      data: {
        report,
        downloadUrl: `/api/reports/${report.reportId}/download?format=${report.format}`
      }
    });

    // keep notification logic below the response for readability? no-op
  } catch (error) {
    logger.error('Generate saved report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/', protect, checkPermission('report:view'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const query = {};

    if (req.query.reportType) {
      query.reportType = req.query.reportType;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const [reports, total, latest] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('reportId title reportType format status dateRange summary fileSizeBytes downloadCount createdAt updatedAt scheduledEmail')
        .lean(),
      Report.countDocuments(query),
      Report.findOne(query).sort({ createdAt: -1 }).lean()
    ]);

    return res.json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      latest: latest
        ? {
            reportId: latest.reportId,
            title: latest.title,
            reportType: latest.reportType,
            summary: latest.summary,
            dateRange: latest.dateRange
          }
        : null
    });
  } catch (error) {
    logger.error('List reports error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/summary', protect, checkPermission('report:view'), async (req, res) => {
  try {
    const [totalReports, readyReports, scheduledReports, latest, storageAgg] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'READY' }),
      Report.countDocuments({ 'scheduledEmail.enabled': true }),
      Report.findOne().sort({ createdAt: -1 }).lean(),
      Report.aggregate([{ $group: { _id: null, totalBytes: { $sum: '$fileSizeBytes' }, count: { $sum: 1 } } }])
    ]);

    const totalStorageBytes = (storageAgg && storageAgg[0] && storageAgg[0].totalBytes) ? storageAgg[0].totalBytes : 0;
    const storageSavingsBytes = totalStorageBytes; // Placeholder: same as stored bytes for UI "Storage Savings"

    return res.json({
      success: true,
      data: {
        totalReports,
        readyReports,
        scheduledReports,
        totalStorageBytes,
        storageSavingsBytes,
        latest: latest
          ? {
              reportId: latest.reportId,
              title: latest.title,
              reportType: latest.reportType,
              summary: latest.summary,
              dateRange: latest.dateRange,
              createdAt: latest.createdAt
            }
          : null
      }
    });
  } catch (error) {
    logger.error('Report summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch report summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Archives time-series for Generated Archives graph
router.get('/archives', protect, checkPermission('report:view'), async (req, res) => {
  try {
    const days = Math.max(7, Math.min(90, parseInt(req.query.days, 10) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const agg = await Report.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, bytes: { $sum: '$fileSizeBytes' } } },
      { $sort: { '_id': 1 } }
    ]);

    const series = agg.map((row) => ({ date: row._id, count: row.count, bytes: row.bytes }));

    return res.json({ success: true, data: { days, series } });
  } catch (error) {
    logger.error('Archives aggregation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch archives', error: error.message });
  }
});

router.get('/:reportId', protect, checkPermission('report:view'), async (req, res) => {
  try {
    const report = await getReportByIdentifier(req.params.reportId).lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Get report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/:reportId/download', protect, checkPermission('report:view'), async (req, res) => {
  try {
    const format = String(req.query.format || 'json').toLowerCase();
    const report = await getReportByIdentifier(req.params.reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.downloadCount += 1;
    await report.save();

    if (format === 'csv' || report.format === 'csv') {
      const csvContent = report.csvContent || '';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${report.fileName || `${report.reportId}.csv`}`);
      return res.send(csvContent);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${report.fileName || `${report.reportId}.json`}`);
    return res.json({
      success: true,
      data: report.data,
      meta: {
        reportId: report.reportId,
        title: report.title,
        reportType: report.reportType,
        dateRange: report.dateRange,
        summary: report.summary
      }
    });
  } catch (error) {
    logger.error('Download report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to download report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/:reportId/schedule', protect, checkPermission('generate_reports'), async (req, res) => {
  try {
    const { recipients = [], cadence = 'monthly' } = req.body || {};
    const report = await getReportByIdentifier(req.params.reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.scheduledEmail.enabled = true;
    report.scheduledEmail.recipients = Array.isArray(recipients) ? recipients : String(recipients).split(',').map((item) => item.trim()).filter(Boolean);
    report.scheduledEmail.cadence = cadence;
    report.scheduledEmail.nextRunAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await report.save();

    try {
      const notification = await notificationFeedService.createReportNotification(report, 'report');
      if (notification) {
        const io = req.app.get('io');
        io?.emit('notification:new', notification);
      }
    } catch (feedError) {
      logger.error('In-app schedule notification error:', feedError.message);
    }

    return res.json({
      success: true,
      message: 'Report schedule saved',
      data: {
        reportId: report.reportId,
        scheduledEmail: report.scheduledEmail
      }
    });
  } catch (error) {
    logger.error('Schedule report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to schedule report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send a saved report by email immediately
router.post('/:reportId/send', protect, checkPermission('generate_reports'), async (req, res) => {
  try {
    const { recipients = [], subject, message } = req.body || {};
    const report = await getReportByIdentifier(req.params.reportId);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const smtpHost = process.env.EMAIL_HOST;
    const smtpPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const smtpUser = process.env.EMAIL_USER;
    const smtpPass = process.env.EMAIL_PASS;
    const from = process.env.EMAIL_FROM || smtpUser || 'no-reply@example.com';

    if (!smtpHost || !smtpUser || !smtpPass) {
      logger.warn('SMTP settings not configured; cannot send email');
      return res.status(500).json({ success: false, message: 'SMTP not configured on server' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const recipientsList = Array.isArray(recipients) ? recipients.join(',') : String(recipients || '').split(',').map(r => r.trim()).filter(Boolean).join(',');

    const attachmentName = report.fileName || `${report.reportId}.${report.format === 'csv' ? 'csv' : 'json'}`;
    const attachmentContent = report.format === 'csv' ? (report.csvContent || '') : JSON.stringify(report.data || {}, null, 2);

    const info = await transporter.sendMail({
      from,
      to: recipientsList,
      subject: subject || `Security Report: ${report.title}`,
      text: message || `Attached is the generated report: ${report.title}`,
      attachments: [
        {
          filename: attachmentName,
          content: attachmentContent
        }
      ]
    });

    try {
      const notification = await notificationFeedService.createSystemNotification({
        title: 'Report Email Sent',
        message: `Report ${report.title} was emailed to ${recipientsList}`,
        severity: 'info',
        actionUrl: `/reports/${report.reportId}`,
        meta: { reportId: report.reportId, recipients: recipientsList, messageId: info.messageId }
      });
      if (notification) {
        const io = req.app.get('io');
        io?.emit('notification:new', notification);
      }
    } catch (feedError) {
      logger.error('In-app send notification error:', feedError.message);
    }

    logger.info(`Report email sent: ${info.messageId} -> ${recipientsList}`);

    return res.json({ success: true, message: 'Report emailed', data: { messageId: info.messageId } });
  } catch (error) {
    logger.error('Send report email error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send report', error: error.message });
  }
});

module.exports = router;