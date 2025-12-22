
'use client';

import { Play, Music } from 'lucide-react';
import { motion } from 'framer-motion';

interface DownloadGateHeroProps {
  title: string;
  artistName: string;
  artworkUrl?: string | null;
}

export function DownloadGateHero({ title, artistName, artworkUrl }: DownloadGateHeroProps) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-card border border-border rounded-2xl shadow-xl overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-64 h-64 flex-shrink-0"
      >
        {artworkUrl ? (
          <img 
            src={artworkUrl} 
            alt={title} 
            className="w-full h-full object-cover rounded-xl shadow-2xl z-10 relative"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center rounded-xl z-10 relative">
            <Music className="w-24 h-24 text-foreground/20" />
          </div>
        )}
        
        <button className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-xl transition-all group z-20">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-black fill-current ml-1" />
          </div>
        </button>
      </motion.div>

      <div className="flex flex-col text-center md:text-left z-10">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold mb-2 tracking-tight"
        >
          {title}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-foreground/60 mb-6"
        >
          {artistName}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center justify-center md:justify-start gap-2 py-2 px-4 bg-accent/10 text-accent rounded-full text-sm font-medium w-fit mx-auto md:mx-0"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          Free Download
        </motion.div>
      </div>
    </div>
  );
}
