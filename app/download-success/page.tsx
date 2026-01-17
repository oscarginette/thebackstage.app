'use client';

import { useEffect, useState } from 'react';
import { PATHS } from '@/lib/paths';

/**
 * Download Success Page
 *
 * Shown after user clicks download button.
 * Auto-redirects to landing page after 10 seconds.
 */
export default function DownloadSuccessPage() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = PATHS.HOME;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-screen bg-[#FDFCF8] flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md mx-auto space-y-6">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto bg-[#FF5500] rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">
          Enjoy your track!
        </h1>

        {/* Message */}
        <p className="text-lg text-foreground/70">
          Check your downloads folder. Let the music play!
        </p>

        {/* Countdown */}
        <p className="text-sm text-foreground/50">
          Redirecting to home in {countdown} second{countdown !== 1 ? 's' : ''}...
        </p>

        {/* Manual Redirect Button */}
        <a
          href={PATHS.HOME}
          className="inline-block px-8 py-4 bg-foreground text-background rounded-lg font-black uppercase tracking-widest text-xs hover:brightness-110 active:scale-95 transition-all"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
