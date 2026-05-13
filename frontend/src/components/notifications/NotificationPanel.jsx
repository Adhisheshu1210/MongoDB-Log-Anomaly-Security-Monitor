/**
 * Notification Panel Component
 */

import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { lastEvent } = useSocket();

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {isOpen && (
        <div className="w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Events</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-700 rounded">
              <X size={16} />
            </button>
          </div>
          {lastEvent ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <div className="p-2 bg-slate-700 rounded text-sm">
                <p className="font-mono text-xs text-blue-400">{lastEvent.event}</p>
                <p className="text-slate-300 mt-1">{JSON.stringify(lastEvent.data).substring(0, 100)}...</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No events yet</p>
          )}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition"
      >
        <Bell size={20} />
      </button>
    </div>
  );
};

export default NotificationPanel;
