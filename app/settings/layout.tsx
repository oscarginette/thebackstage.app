import { SettingsSidebar } from '@/components/settings/SettingsSidebar';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header - Visible only on mobile */}
      <div className="md:hidden border-b border-border/40 p-4 sticky top-0 bg-background/80 backdrop-blur-md z-20">
        <h1 className="text-xl font-serif text-foreground">Settings</h1>
        {/* Note: A mobile menu trigger would go here */}
      </div>

      <SettingsSidebar />
      
      <main className="flex-1 min-w-0 relative">
        {/* Brand Logo - Top Right */}
        <div className="absolute top-6 right-8 md:top-12 md:right-16 z-20 pointer-events-none">
          <div className="flex flex-col items-end">
            <span className="text-xl md:text-2xl font-serif text-foreground/40 italic">
              The Backstage
            </span>
            <div className="h-px w-12 bg-accent/20 mt-1" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 md:p-12 lg:p-16">
            {children}
        </div>
      </main>
      
      {/* Background blobs similar to dashboard */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[1000px] h-[600px] bg-accent/5 dark:bg-accent/[0.02] opacity-30 dark:opacity-100 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[800px] h-[500px] bg-blue-500/5 blur-[100px]" />
      </div>
    </div>
  );
}
