'use client';

import DownloadGatesList from '@/components/dashboard/DownloadGatesList';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function DownloadGatesPage() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1c1c1c] selection:bg-[#FF5500] selection:text-white overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-aurora-light"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 sm:py-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#FF5500] transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver al Dashboard</span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="pb-10">
          <DownloadGatesList />
        </div>
      </div>
    </div>
  );
}
