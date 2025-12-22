
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Music, CheckCircle2 } from 'lucide-react';

interface SocialActionStepProps {
  title: string;
  description: string;
  buttonText: string;
  icon: 'soundcloud' | 'spotify';
  onAction: () => Promise<void>;
  isCompleted?: boolean;
}

export function SocialActionStep({ 
  title, 
  description, 
  buttonText, 
  icon, 
  onAction,
  isCompleted = false 
}: SocialActionStepProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      await onAction();
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
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
        icon === 'soundcloud' ? 'bg-[#ff5500]/10 text-[#ff5500]' : 'bg-[#1DB954]/10 text-[#1DB954]'
      }`}>
        {isCompleted ? (
          <CheckCircle2 className="w-10 h-10" />
        ) : (
          <Music className="w-10 h-10" />
        )}
      </div>

      <h2 className="text-xl font-black uppercase mb-2 tracking-tight">{title}</h2>
      <p className="text-sm text-foreground/60 mb-8">{description}</p>

      <button
        onClick={handleAction}
        disabled={loading || isCompleted}
        className={`w-full py-3 rounded-lg font-black uppercase text-sm transition-all ${
          isCompleted 
            ? 'bg-green-500/10 text-green-600' 
            : icon === 'soundcloud'
              ? 'bg-[#ff5500] text-white hover:brightness-110'
              : 'bg-[#1DB954] text-white hover:brightness-110'
        }`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : isCompleted ? (
          "Completed"
        ) : (
          buttonText
        )}
      </button>

      <p className="text-[10px] text-foreground/40 mt-8 leading-relaxed">
        This action helps the artist reach more listeners and supports their creative journey. Thank you for your support!
      </p>
    </motion.div>
  );
}
