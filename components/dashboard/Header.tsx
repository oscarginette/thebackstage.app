import React from 'react';

export default function Header() {
  return (
    <div className="mb-12">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6 backdrop-blur-sm">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
        <span className="text-xs font-medium text-orange-500 tracking-wide uppercase">System Active</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400">
        SoundCloud Automation
      </h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
        Gestión inteligente de notificaciones y distribución de tracks.
      </p>
    </div>
  );
}
