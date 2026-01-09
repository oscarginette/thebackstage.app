'use client';

import CreateGateForm from '@/components/dashboard/CreateGateForm';
import QuotaGuard from '@/components/QuotaGuard';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PATHS } from '@/lib/paths';

export default function NewDownloadGatePage() {
  return (
    <QuotaGuard>
      <div className="min-h-screen bg-background text-foreground selection:bg-accent/10 selection:text-accent overflow-hidden">
        {/* Aurora Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-aurora-light dark:bg-aurora-dark"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 sm:py-8">

          {/* Navigation Breadcrumb */}
          <div className="mb-8">
            <Link
              href={PATHS.DASHBOARD.ROOT}
              className="flex items-center gap-2 text-sm font-medium text-foreground/50 hover:text-accent transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Volver al Dashboard</span>
            </Link>
          </div>

          {/* Main Content */}
          <div className="pb-32">
            <CreateGateForm />
          </div>
        </div>
      </div>
    </QuotaGuard>
  );
}
