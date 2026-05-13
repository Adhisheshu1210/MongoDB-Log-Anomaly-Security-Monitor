/**
 * Socket Event Handlers
 * Centralized socket.io event management
 */

import { SOCKET_EVENTS } from './constants.js';

/**
 * Socket event types and their handlers
 */
export const socketEventHandlers = {
  [SOCKET_EVENTS.LOG_NEW]: 'onNewLog',
  [SOCKET_EVENTS.ANOMALY_DETECTED]: 'onAnomalyDetected',
  [SOCKET_EVENTS.ALERT_NEW]: 'onNewAlert',
  [SOCKET_EVENTS.ALERT_RESOLVED]: 'onAlertResolved',
  [SOCKET_EVENTS.ALERT_ACKNOWLEDGED]: 'onAlertAcknowledged',
  [SOCKET_EVENTS.SYSTEM_UPDATE]: 'onSystemUpdate',
  [SOCKET_EVENTS.USER_ACTIVITY]: 'onUserActivity',
  [SOCKET_EVENTS.HEALTH_UPDATE]: 'onHealthUpdate',
};

/**
 * Emit new log event
 * @param {object} socket - Socket instance
 * @param {object} logData - Log data
 */
export const emitNewLog = (socket, logData) => {
  if (socket) {
    socket.emit(SOCKET_EVENTS.LOG_NEW, logData);
  }
};

/**
 * Emit anomaly detected event
 * @param {object} socket - Socket instance
 * @param {object} anomalyData - Anomaly data
 */
export const emitAnomalyDetected = (socket, anomalyData) => {
  if (socket) {
    socket.emit(SOCKET_EVENTS.ANOMALY_DETECTED, anomalyData);
  }
};

/**
 * Emit new alert event
 * @param {object} socket - Socket instance
 * @param {object} alertData - Alert data
 */
export const emitNewAlert = (socket, alertData) => {
  if (socket) {
    socket.emit(SOCKET_EVENTS.ALERT_NEW, alertData);
  }
};

/**
 * Emit alert resolved event
 * @param {object} socket - Socket instance
 * @param {string} alertId - Alert ID
 */
export const emitAlertResolved = (socket, alertId) => {
  if (socket) {
    socket.emit(SOCKET_EVENTS.ALERT_RESOLVED, { alertId });
  }
};

/**
 * Emit alert acknowledged event
 * @param {object} socket - Socket instance
 * @param {string} alertId - Alert ID
 */
export const emitAlertAcknowledged = (socket, alertId) => {
  if (socket) {
    socket.emit(SOCKET_EVENTS.ALERT_ACKNOWLEDGED, { alertId });
  }
};

/**
 * Emit system update event
 * @param {object} socket - Socket instance
 * @param {object} updateData - Update data
 */
export const emitSystemUpdate = (socket, updateData) => {
  if (socket) {
    socket.emit(SOCKET_EVENTS.SYSTEM_UPDATE, updateData);
  }
};

/**
 * Emit user activity event
 * @param {object} socket - Socket instance
 * @param {object} activityData - Activity data
 */
export const emitUserActivity = (socket, activityData) => {
  if (socket) {
    socket.emit(SOCKET_EVENTS.USER_ACTIVITY, activityData);
  }
};

/**
 * Emit health update event
 * @param {object} socket - Socket instance
 * @param {object} healthData - Health data
 */
export const emitHealthUpdate = (socket, healthData) => {
  if (socket) {
    socket.emit(SOCKET_EVENTS.HEALTH_UPDATE, healthData);
  }
};

export default {
  socketEventHandlers,
  emitNewLog,
  emitAnomalyDetected,
  emitNewAlert,
  emitAlertResolved,
  emitAlertAcknowledged,
  emitSystemUpdate,
  emitUserActivity,
  emitHealthUpdate,
};
