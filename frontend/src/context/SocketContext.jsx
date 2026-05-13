/**
 * SocketContext - Manages WebSocket connections
 * Handles real-time updates via Socket.IO
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL, SOCKET_EVENTS } from '../utils/constants';

export const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connected, setConnected] = useState(false); // Legacy alias
  const [lastEvent, setLastEvent] = useState(null);
  const eventHandlers = useRef({});

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    // If VITE_SOCKET_URL is set, use it; otherwise use API base URL.
    // (Socket.IO client needs the server origin, not the /api path)
    const socketUrl = SOCKET_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      // Important: match how the backend Socket.IO is mounted (default: /socket.io)
      path: '/socket.io',
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
      // Helps diagnose handshake/transport issues
      upgrade: false,
    });

    newSocket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected');
      setIsConnected(true);
      setConnected(true);
    });

    newSocket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log('Socket disconnected');
      setIsConnected(false);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setConnected(false);
    });

    // Register handlers for all standard events
    Object.values(SOCKET_EVENTS).forEach((event) => {
      if (event !== SOCKET_EVENTS.CONNECT && event !== SOCKET_EVENTS.DISCONNECT) {
        newSocket.on(event, (data) => {
          setLastEvent({ event, data, timestamp: new Date() });
          
          // Call registered handlers
          if (eventHandlers.current[event]) {
            eventHandlers.current[event].forEach((handler) => {
              try {
                handler(data);
              } catch (err) {
                console.error(`Error in handler for ${event}:`, err);
              }
            });
          }
        });
      }
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const on = useCallback((event, handler) => {
    if (!eventHandlers.current[event]) {
      eventHandlers.current[event] = [];
    }
    eventHandlers.current[event].push(handler);

    return () => {
      eventHandlers.current[event] = eventHandlers.current[event].filter(
        (h) => h !== handler
      );
    };
  }, []);

  const off = useCallback((event, handler) => {
    if (eventHandlers.current[event]) {
      eventHandlers.current[event] = eventHandlers.current[event].filter(
        (h) => h !== handler
      );
    }
  }, []);

  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  }, [socket, isConnected]);

  const subscribe = (channel) => {
    if (socket) {
      socket.emit('subscribe', { channel });
    }
  };

  const unsubscribe = (channel) => {
    if (socket) {
      socket.emit('unsubscribe', { channel });
    }
  };

  const value = {
    socket,
    isConnected,
    connected, // Legacy
    lastEvent,
    on,
    off,
    emit,
    subscribe,
    unsubscribe,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

