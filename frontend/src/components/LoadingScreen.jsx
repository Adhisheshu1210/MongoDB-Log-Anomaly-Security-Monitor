import React from 'react';
import { Activity } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
      <div className="text-center">
        <Activity className="w-16 h-16 text-cyber-accent mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-semibold text-white mb-2">MongoDB Log Monitor</h2>
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;

