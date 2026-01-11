import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Error Code */}
        <h1 className="text-9xl font-bold text-primary mb-4">404</h1>

        {/* Message */}
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Page not found
        </h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Navigation Options */}
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Go to Home
          </Link>

          <Link
            href="/dashboard"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/login"
            className="px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-secondary/50 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
