
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Music, CheckCircle2, Instagram, Cloud } from 'lucide-react';

const SoundCloudIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    stroke="none"
  >
    <path d="M11.562 13.1c-.027 0-.053.003-.092.006V7.087c0-.18-.12-.343-.3-.384-.18-.041-.351.054-.42.22l-1.921 4.596c.036-.015.072-.03.111-.04.14-.04.281-.06.425-.06.273 0 .531.077.755.214.153.093.284.212.392.348zm10.155.808c-.732-2.712-3.23-4.575-6.024-4.575-.125 0-.251.004-.376.014C14.17 6.444 11.458 4.25 8.318 4.25c-3.791 0-6.864 3.111-6.864 6.95 0 .265.016.526.046.782C.646 12.653 0 13.514 0 14.5c0 1.258 1.052 2.278 2.348 2.278h19.222c1.341 0 2.43-1.072 2.43-2.394 0-.236-.035-.466-.1-.682l-.183.206z" />
  </svg>
);

interface SocialActionStepProps {
  title: string;
  description: string;
  buttonText: string;
  icon: 'soundcloud' | 'spotify' | 'instagram';
  onAction: (commentText?: string) => Promise<void>;
  isCompleted?: boolean;
  isLoading?: boolean;
  enableCommentInput?: boolean;
  children?: React.ReactNode; // Allow additional content (e.g., opt-in checkbox)
}

export function SocialActionStep({
  title,
  description,
  buttonText,
  icon,
  onAction,
  isCompleted = false,
  isLoading = false,
  enableCommentInput = false,
  children
}: SocialActionStepProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const handleAction = async () => {
    // Validate comment if enabled
    if (enableCommentInput) {
      if (commentText.trim().length === 0) {
        setCommentError('Please write a comment before connecting');
        return;
      }
      if (commentText.length > 300) {
        setCommentError('Comment must be less than 300 characters');
        return;
      }
      setCommentError(null);
    }

    setInternalLoading(true);
    try {
      await onAction(enableCommentInput ? commentText : undefined);
    } finally {
      // Don't reset loading state here since OAuth redirect will happen
      // setInternalLoading(false);
    }
  };

  const loading = isLoading || internalLoading;

  const getIconBgColor = () => {
    if (icon === 'soundcloud') return 'bg-[#ff5500]/10 text-[#ff5500]';
    if (icon === 'spotify') return 'bg-[#1DB954]/10 text-[#1DB954]';
    if (icon === 'instagram') return 'bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#833AB4] text-white';
    return '';
  };

  const getButtonColor = () => {
    if (isCompleted) return 'bg-green-500/10 text-green-600';
    if (icon === 'soundcloud') return 'bg-[#ff5500] text-white hover:brightness-110 active:scale-95';
    if (icon === 'spotify') return 'bg-[#1DB954] text-white hover:brightness-110 active:scale-95';
    if (icon === 'instagram') return 'bg-gradient-to-r from-[#FCAF45] via-[#E1306C] to-[#833AB4] text-white hover:brightness-110 active:scale-95';
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full text-center"
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${getIconBgColor()}`}>
        {isCompleted ? (
          <CheckCircle2 className="w-10 h-10" />
        ) : icon === 'instagram' ? (
          <Instagram className="w-10 h-10" />
        ) : (
          <Music className="w-10 h-10" />
        )}
      </div>

      <h2 className="text-xl font-black uppercase mb-2 tracking-tight">{title}</h2>
      <p className="text-sm text-foreground/60 mb-8">{description}</p>

      {/* Comment textarea */}
      {enableCommentInput && !isCompleted && (
        <div className="mb-6">
          <label className="block text-xs font-bold mb-2 uppercase tracking-tight text-left">
            Share a comment <span className="text-[#ff5500]">*</span>
          </label>
          <input
            type="text"
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              setCommentError(null);
            }}
            disabled={loading}
            placeholder="bomb"
            maxLength={300}
            aria-label="Comment on SoundCloud track"
            className="w-full px-4 py-3 bg-white border-2 border-black/5 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-[#ff5500] focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm h-11 shadow-sm"
          />
          {/* Character counter and error */}
          <div className="flex justify-between items-center mt-2 h-4">
             <span className="text-xs text-red-600">
              {commentError || ''}
            </span>
          </div>
        </div>
      )}

      {/* Additional content (e.g., opt-in checkbox) */}
      {children && (
        <div className="mb-6">
          {children}
        </div>
      )}

      <button
        onClick={handleAction}
        disabled={loading || isCompleted}
        className={`w-full py-3 rounded-lg font-black uppercase text-sm transition-all ${getButtonColor()} ${loading ? 'cursor-wait' : ''}`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Redirecting...</span>
          </div>
        ) : isCompleted ? (
          "Completed"
        ) : (
          <div className="flex items-center justify-center gap-2">
            {icon === 'soundcloud' && <SoundCloudIcon className="w-5 h-5 flex-shrink-0" />}
            {icon === 'instagram' && <Instagram className="w-5 h-5 flex-shrink-0" />}
            <span>{buttonText}</span>
          </div>
        )}
      </button>

      {description && (
        <p className="text-[10px] text-foreground/50 mt-8 leading-relaxed text-left">
          {description}
        </p>
      )}
    </motion.div>
  );
}
