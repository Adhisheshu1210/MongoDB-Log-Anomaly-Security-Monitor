/**
 * Notification Feed Service
 * Builds in-app notifications from alerts, reports, and system events.
 */

const Notification = require('../models/Notification');
const Report = require('../models/Report');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

const toSeverity = (value) => String(value || 'info').toLowerCase();

const buildActionUrl = (type, id) => {
  if (type === 'alert') return `/alerts/${id}`;
  if (type === 'report') return `/reports/${id}`;
  return '/';
};

const createNotification = async ({
  type,
  title,
  message,
  severity = 'info',
  icon = 'Bell',
  actionUrl,
  referenceType = '',
  referenceId = '',
  source = 'system',
  audience = ['admin'],
  meta = {}
}) => {
  try {
    const doc = await Notification.create({
      type,
      title,
      message,
      severity: toSeverity(severity),
      icon,
      actionUrl: actionUrl || buildActionUrl(type, referenceId),
      referenceType,
      referenceId,
      source,
      audience,
      meta
    });
    return doc;
  } catch (error) {
    logger.error(`Create notification error: ${error.message}`);
    return null;
  }
};

const createAlertNotification = async (alert, source = 'alert') => {
  if (!alert) return null;
  return createNotification({
    type: 'alert',
    title: 'New Alert',
    message: alert.title || 'A new alert was created',
    severity: alert.severity || 'info',
    icon: 'Bell',
    actionUrl: buildActionUrl('alert', alert._id),
    referenceType: 'alert',
    referenceId: String(alert._id),
    source,
    audience: ['admin', 'user', 'viewer'],
    meta: { category: alert.category, status: alert.status }
  });
};

const createReportNotification = async (report, source = 'report') => {
  if (!report) return null;
  return createNotification({
    type: 'report',
    title: report.status === 'SCHEDULED' ? 'Report Scheduled' : 'Report Ready',
    message: report.status === 'SCHEDULED'
      ? `Your report ${report.title} is scheduled.`
      : `Your scheduled report ${report.title} is ready`,
    severity: 'info',
    icon: 'FileText',
    actionUrl: buildActionUrl('report', report.reportId || report._id),
    referenceType: 'report',
    referenceId: String(report.reportId || report._id),
    source,
    audience: ['admin', 'user', 'viewer'],
    meta: { reportType: report.reportType, status: report.status }
  });
};

const createSystemNotification = async ({ title, message, severity = 'info', actionUrl = '/', meta = {} }) => {
  return createNotification({
    type: 'system',
    title,
    message,
    severity,
    icon: 'Settings',
    actionUrl,
    source: 'system',
    audience: ['admin', 'user', 'viewer'],
    meta
  });
};

const syncLatestNotifications = async () => {
  const existingCount = await Notification.countDocuments();
  if (existingCount > 0) return;

  const [latestAlerts, latestReports] = await Promise.all([
    Alert.find().sort({ createdAt: -1 }).limit(5).lean(),
    Report.find().sort({ createdAt: -1 }).limit(5).lean()
  ]);

  for (const alert of latestAlerts.reverse()) {
    await createAlertNotification(alert, 'seed');
  }

  for (const report of latestReports.reverse()) {
    await createReportNotification(report, 'seed');
  }
};

const listNotifications = async ({ audience = 'admin', status, limit = 20, skip = 0 } = {}) => {
  const query = { audience: { $in: [audience, 'all'] } };
  if (status) query.status = status;

  const [items, total, unread] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ ...query, status: 'new' })
  ]);

  return { items, total, unread };
};

const markAsRead = async (notificationId) => {
  return Notification.findByIdAndUpdate(
    notificationId,
    { $set: { status: 'read', readAt: new Date() } },
    { new: true }
  ).lean();
};

const markAllRead = async (audience = 'admin') => {
  return Notification.updateMany(
    { audience, status: 'new' },
    { $set: { status: 'read', readAt: new Date() } }
  );
};

const getNotificationStats = async (audience = 'admin') => {
  const [byType, bySeverity, total, unread] = await Promise.all([
    Notification.aggregate([{ $match: { audience } }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
    Notification.aggregate([{ $match: { audience } }, { $group: { _id: '$severity', count: { $sum: 1 } } }]),
    Notification.countDocuments({ audience }),
    Notification.countDocuments({ audience, status: 'new' })
  ]);

  return {
    total,
    unread,
    byType: byType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

module.exports = {
  createNotification,
  createAlertNotification,
  createReportNotification,
  createSystemNotification,
  syncLatestNotifications,
  listNotifications,
  markAsRead,
  markAllRead,
  getNotificationStats
};