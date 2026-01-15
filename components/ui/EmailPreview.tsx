'use client';

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
export default function EmailPreview({
  htmlContent,
  loading = false,
  height = 'h-full',
  sandbox = false,
  className = '',
}: EmailPreviewProps) {
  if (loading) {
    return <LoadingSpinner centered />;
  }

  return (
    <div className={`bg-card rounded-2xl shadow-lg overflow-hidden ${height} ${className}`}>
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full border-0"
        title="Email Preview"
        {...(sandbox && { sandbox: 'allow-same-origin' })}
      />
    </div>
  );
}
