/**
 * Notifications Routes
 * In-app notification feed for alert page and notification panel.
 */

const express = require('express');
const router = express.Router();
const { protect, checkPermission, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const notificationFeedService = require('../services/notificationFeedService');

logger.info('Notifications routes module loaded');

router.get('/', protect, checkPermission('alerts:read'), async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const status = req.query.status;
    const audience = req.user?.role || 'admin';

    const result = await notificationFeedService.listNotifications({
      audience,
      status,
      limit,
      skip: (page - 1) * limit
    });

    return res.json({
      success: true,
      data: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      },
      unreadCount: result.unread
    });
  } catch (error) {
    logger.error(`Fetch notifications error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
});

router.get('/stats', protect, checkPermission('alerts:read'), async (req, res) => {
  try {
    const audience = req.user?.role || 'admin';
    const stats = await notificationFeedService.getNotificationStats(audience);
    return res.json({ success: true, data: stats });
  } catch (error) {
    logger.error(`Notification stats error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch notification stats', error: error.message });
  }
});

router.patch('/:id/read', protect, checkPermission('alerts:read'), async (req, res) => {
  try {
    const notification = await notificationFeedService.markAsRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return res.json({ success: true, data: notification });
  } catch (error) {
    logger.error(`Mark notification read error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to update notification', error: error.message });
  }
});

router.patch('/read-all', protect, checkPermission('alerts:read'), async (req, res) => {
  try {
    const audience = req.user?.role || 'admin';
    const result = await notificationFeedService.markAllRead(audience);
    return res.json({ success: true, data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount } });
  } catch (error) {
    logger.error(`Mark all notifications read error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to mark notifications read', error: error.message });
  }
});

// Admin utility: create system notification manually
router.post('/system', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, message, severity, actionUrl } = req.body || {};
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'title and message are required' });
    }
    const notification = await notificationFeedService.createSystemNotification({ title, message, severity, actionUrl });
    if (notification) {
      const io = req.app.get('io');
      io?.emit('notification:new', notification);
    }
    return res.status(201).json({ success: true, data: notification });
  } catch (error) {
    logger.error(`Create system notification error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to create notification', error: error.message });
  }
});

module.exports = router;