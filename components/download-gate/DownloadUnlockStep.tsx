
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Loader2, PartyPopper } from 'lucide-react';

interface DownloadUnlockStepProps {
  onDownload: () => Promise<void>;
  fileName?: string;
}

export function DownloadUnlockStep({ onDownload, fileName = 'track.zip' }: DownloadUnlockStepProps) {
  const [loading, setLoading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await onDownload();
      setIsDownloaded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full text-center"
    >
      <AnimatePresence mode="wait">
        {!isDownloaded ? (
          <motion.div
            key="unlock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <Download className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black uppercase mb-2 tracking-tight">Gate Unlocked!</h2>
            <p className="text-sm text-foreground/60 mb-8">Your support means everything. Click below to download your track.</p>
            
            <button
              onClick={handleDownload}
              disabled={loading}
              className="w-full bg-[#ff3300] text-white py-4 rounded-lg font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-accent/20"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              ) : (
                "Download Now"
              )}
            </button>
            <p className="mt-4 text-[10px] text-foreground/40 font-mono tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis">File: {fileName}</p>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <PartyPopper className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black uppercase mb-2 tracking-tight">Enjoy your track!</h2>
            <p className="text-sm text-foreground/60 mb-6">Check your downloads folder. Let the music play!</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs uppercase font-black text-accent tracking-widest hover:underline"
            >
              Start over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
