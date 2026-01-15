'use client';

import React from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface EmailPreviewProps {
  htmlContent: string;
  loading?: boolean;
  height?: string; // Tailwind class like 'h-full', 'h-[500px]'
  sandbox?: boolean; // Enable iframe sandbox attribute for security
  className?: string;
}

/**
 * EmailPreview
 *
 * Renders email HTML content safely in an iframe.
 * Used for previewing email campaigns in editor and history.
 *
 * Security: Use sandbox={true} for untrusted content (sent campaigns).
 *
 * @example
 * // Email editor (trusted content)
 * <EmailPreview htmlContent={html} height="h-full" />
 *
 * @example
 * // Campaign history (untrusted, needs sandbox)
 * <EmailPreview htmlContent={campaign.html} height="h-[500px]" sandbox={true} />
 */
function EmailPreview({
  htmlContent,
  loading = false,
  height = 'h-full',
  sandbox = false,
  className = '',
}: EmailPreviewProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const handleLoad = () => {
    if (height === 'auto' && iframeRef.current) {
      const iframe = iframeRef.current;
      if (iframe.contentWindow) {
        // Use a small timeout to ensure content is fully rendered
        setTimeout(() => {
          try {
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (doc && doc.body) {
              iframe.style.height = '0px'; // Reset to get accurate scrollHeight
              iframe.style.height = `${doc.body.scrollHeight}px`;
            }
          } catch (e) {
            console.warn('Could not resize iframe', e);
          }
        }, 100);
      }
    }
  };

  // Also update height when content changes
  React.useEffect(() => {
    handleLoad();
  }, [htmlContent, height]);

  if (loading) {
    return <LoadingSpinner centered />;
  }

  return (
    <div className={`bg-card rounded-2xl shadow-lg ${height === 'auto' ? 'max-w-[700px] mx-auto' : height} ${className}`}>
      <iframe
        ref={iframeRef}
        srcDoc={htmlContent}
        onLoad={handleLoad}
        className="w-full border-0 transition-opacity duration-150"
        title="Email Preview"
        style={{
          height: height === 'auto' ? 'auto' : '100%',
          minHeight: height === 'auto' ? '600px' : undefined,
          overflow: 'hidden',
        }}
        scrolling={height === 'auto' ? 'no' : 'auto'}
        {...(sandbox && { sandbox: 'allow-same-origin' })}
      />
    </div>
  );
}

/**
 * Memoized export to prevent unnecessary re-renders.
 * Implements performance optimization principle.
 */
export default React.memo(EmailPreview);
