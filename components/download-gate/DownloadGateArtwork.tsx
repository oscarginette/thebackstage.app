
'use client';

import { Play, Music } from 'lucide-react';
import { motion } from 'framer-motion';

interface DownloadGateArtworkProps {
  title: string;
  artworkUrl?: string | null;
}

export function DownloadGateArtwork({ title, artworkUrl }: DownloadGateArtworkProps) {
  return (
    <div className="relative w-full aspect-square max-w-[500px] group shadow-[0_40px_100px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-transform duration-700 hover:scale-[1.02]">
      {artworkUrl ? (
        <img 
          src={artworkUrl} 
          alt={title} 
          className="w-full h-full object-cover z-10 relative"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center z-10 relative">
          <Music className="w-32 h-32 text-foreground/10" />
        </div>
      )}
      
      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <motion.button 
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          className="w-20 h-20 bg-accent text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,85,0,0.5)] transition-all duration-300"
        >
          <Play className="w-10 h-10 fill-current ml-1" />
        </motion.button>
      </div>

      {/* Subtle Glow */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent z-15 pointer-events-none" />
    </div>
  );
}
