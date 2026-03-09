/**
 * WebSocket Service
 * Handles real-time communication with clients
 */

const logger = require('../utils/logger');

const setupWebSocket = (io) => {
  // Track connected clients
  const clients = new Map();

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle client authentication
    socket.on('authenticate', (data) => {
      const { token } = data;
      if (token) {
        // In production, verify JWT token here
        clients.set(socket.id, { authenticated: true, token });
        socket.emit('authenticated', { success: true });
        logger.info(`Client authenticated: ${socket.id}`);
      }
    });

    // Handle subscription to specific events
    socket.on('subscribe', (data) => {
      const { channel } = data;
      if (channel) {
        socket.join(channel);
        logger.info(`Client ${socket.id} subscribed to ${channel}`);
      }
    });

    // Handle unsubscription
    socket.on('unsubscribe', (data) => {
      const { channel } = data;
      if (channel) {
        socket.leave(channel);
        logger.info(`Client ${socket.id} unsubscribed from ${channel}`);
      }
    });

    // Handle ping for heartbeat
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      clients.delete(socket.id);
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error.message);
    });
  });

  // Middleware for authentication check
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      // In production, verify JWT here
      next();
    } else {
      // Allow unauthenticated connections for demo
      next();
    }
  });

  logger.info('WebSocket service initialized');
  
  return io;
};

// Broadcast to all connected clients
const broadcast = (io, event, data) => {
  io.emit(event, data);
};

// Send to specific room
const sendToRoom = (io, room, event, data) => {
  io.to(room).emit(event, data);
};

// Send to specific client
const sendToClient = (io, socketId, event, data) => {
  io.to(socketId).emit(event, data);
};

module.exports = { setupWebSocket, broadcast, sendToRoom, sendToClient };

