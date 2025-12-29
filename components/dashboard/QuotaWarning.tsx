/**
 * QuotaWarning Component
 *
 * Displays warning banner when user approaches or exceeds quota limits.
 * Shows at 80%+ usage for contacts or emails.
 *
 * Clean Architecture: Presentation component with clear visual hierarchy.
 */

'use client';

import { AlertTriangle, Mail, Users, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PATHS } from '@/lib/paths';

interface QuotaWarningProps {
  contactsUsed: number;
  contactsLimit: number;
  emailsUsed: number;
  emailsLimit: number;
}

export default function QuotaWarning({
  contactsUsed,
  contactsLimit,
  emailsUsed,
  emailsLimit,
}: QuotaWarningProps) {
  // Calculate usage percentages
  const contactsPercentage = (contactsUsed / contactsLimit) * 100;
  const emailsPercentage = (emailsUsed / emailsLimit) * 100;

  // Determine if warning should be shown (80%+ usage)
  const showContactsWarning = contactsPercentage >= 80;
  const showEmailsWarning = emailsPercentage >= 80;

  // Determine if limit is exceeded
  const contactsExceeded = contactsUsed >= contactsLimit;
  const emailsExceeded = emailsUsed >= emailsLimit;

  // Don't show if no warnings
  if (!showContactsWarning && !showEmailsWarning) {
    return null;
  }

  // Determine severity level
  const isExceeded = contactsExceeded || emailsExceeded;
  
  // Dynamic Styles based on severity
  const containerClasses = isExceeded
    ? 'bg-red-50/50 border-red-100' // Critical state
    : 'bg-orange-50/50 border-orange-100'; // Warning state

  const iconContainerClasses = isExceeded
    ? 'bg-white text-red-600 shadow-sm ring-1 ring-red-100'
    : 'bg-white text-orange-600 shadow-sm ring-1 ring-orange-100';

  const titleColor = isExceeded ? 'text-red-900' : 'text-orange-900';
  const descriptionColor = isExceeded ? 'text-red-700' : 'text-orange-700';
  const progressTrackColor = 'bg-white';
  const progressFillColor = isExceeded ? 'bg-red-500' : 'bg-orange-500';
  
  // Labels
  const title = isExceeded ? 'Service Paused: Quota Limit Reached' : 'Approaching Plan Limits';
  const description = isExceeded 
    ? 'Your account has exceeded its usage limits. Please upgrade your plan immediately to restore full access to the platform.' 
    : 'You are nearing your usage limits. We recommend upgrading soon to ensure uninterrupted service.';

  return (
    <div className={`rounded-2xl border p-6 mb-8 backdrop-blur-sm transition-all ${containerClasses}`}>
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${iconContainerClasses}`}>
          {isExceeded ? <AlertCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className={`text-lg font-bold mb-1 ${titleColor}`}>
              {title}
            </h3>
            <p className={`text-sm leading-relaxed ${descriptionColor}`}>
              {description}
            </p>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contacts Usage */}
            {showContactsWarning && (
              <div className="bg-white/50 rounded-xl p-3 border border-black/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-1.5 rounded-lg ${isExceeded ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-neutral-700">Contacts</span>
                    <span className="text-xs font-mono font-medium text-neutral-500">
                      {contactsUsed.toLocaleString()} / {contactsLimit.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className={`w-full ${progressTrackColor} rounded-full h-2 overflow-hidden`}>
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${progressFillColor}`}
                    style={{ width: `${Math.min(contactsPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Emails Usage */}
            {showEmailsWarning && (
              <div className="bg-white/50 rounded-xl p-3 border border-black/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-1.5 rounded-lg ${isExceeded ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-neutral-700">Emails</span>
                    <span className="text-xs font-mono font-medium text-neutral-500">
                      {emailsUsed.toLocaleString()} / {emailsLimit.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className={`w-full ${progressTrackColor} rounded-full h-2 overflow-hidden`}>
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${progressFillColor}`}
                    style={{ width: `${Math.min(emailsPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex-shrink-0 self-start md:self-center">
          <Link
            href={PATHS.UPGRADE}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-neutral-900 hover:bg-neutral-800 transition-all hover:scale-105 shadow-xl shadow-black/10 whitespace-nowrap"
          >
            {isExceeded ? 'Restore Access' : 'Upgrade Plan'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
