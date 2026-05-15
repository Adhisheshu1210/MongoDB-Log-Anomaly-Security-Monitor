# Notifications API

In-app notifications are persisted in MongoDB and exposed for the alert page and notification panel.

## RBAC
- `alerts:read` - list notifications, fetch stats, mark read, mark all read
- `admin` - create manual system notifications via admin utility endpoint

## Endpoints
- `GET /api/notifications`
  - Returns recent notifications for the current role.
  - Query params: `page`, `limit`, `status`
- `GET /api/notifications/stats`
  - Returns unread count and breakdown by type/severity.
- `PATCH /api/notifications/:id/read`
  - Marks one notification as read.
- `PATCH /api/notifications/read-all`
  - Marks all notifications for the current audience as read.
- `POST /api/notifications/system`
  - Admin-only utility to create a system notification.

## Notification Sources
- Alert creation creates an in-app notification.
- Report generation creates a report notification.
- Report scheduling creates a report notification.
- Scheduled email delivery creates a system notification.
- Startup seeds the feed from the latest alerts and reports when the collection is empty.
