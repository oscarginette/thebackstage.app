/**
 * DashboardFooter Component
 *
 * Footer for dashboard pages with links to public site and other resources.
 * Positioned at the bottom of the dashboard layout.
 */

export function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="text-center sm:text-left">
            &copy; {currentYear} TheBackstage. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://thebackstage.app/?public=true"
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Public Site
            </a>
            <a
              href="https://thebackstage.app/pricing"
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pricing
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
