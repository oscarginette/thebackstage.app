/**
 * QuotaWarning Component
 *
 * Displays warning banner when user approaches or exceeds quota limits.
 * Shows at 80%+ usage for contacts or emails.
 *
 * Clean Architecture: Presentation component with clear visual hierarchy.
 */

'use client';

import { AlertTriangle, TrendingUp, Mail, Users } from 'lucide-react';
import Link from 'next/link';

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
  const isNearLimit = contactsPercentage >= 90 || emailsPercentage >= 90;

  return (
    <div
      className={`rounded-2xl border-2 p-6 mb-8 backdrop-blur-xl ${
        isExceeded
          ? 'bg-red-50/80 border-red-300'
          : isNearLimit
          ? 'bg-orange-50/80 border-orange-300'
          : 'bg-amber-50/80 border-amber-300'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            isExceeded
              ? 'bg-red-100'
              : isNearLimit
              ? 'bg-orange-100'
              : 'bg-amber-100'
          }`}
        >
          <AlertTriangle
            className={`w-6 h-6 ${
              isExceeded
                ? 'text-red-600'
                : isNearLimit
                ? 'text-orange-600'
                : 'text-amber-600'
            }`}
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3
            className={`text-lg font-bold mb-2 ${
              isExceeded
                ? 'text-red-900'
                : isNearLimit
                ? 'text-orange-900'
                : 'text-amber-900'
            }`}
          >
            {isExceeded
              ? 'Quota Limit Reached'
              : isNearLimit
              ? 'Approaching Quota Limit'
              : 'Quota Warning'}
          </h3>

          <p
            className={`text-sm mb-4 ${
              isExceeded
                ? 'text-red-800'
                : isNearLimit
                ? 'text-orange-800'
                : 'text-amber-800'
            }`}
          >
            {isExceeded
              ? 'You have reached your plan limits. Upgrade to continue using all features.'
              : 'You are approaching your plan limits. Consider upgrading to avoid service interruption.'}
          </p>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Contacts Usage */}
            {showContactsWarning && (
              <div className="flex items-center gap-3">
                <Users
                  className={`w-5 h-5 ${
                    contactsExceeded
                      ? 'text-red-600'
                      : isNearLimit
                      ? 'text-orange-600'
                      : 'text-amber-600'
                  }`}
                />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span
                      className={`font-medium ${
                        contactsExceeded
                          ? 'text-red-900'
                          : isNearLimit
                          ? 'text-orange-900'
                          : 'text-amber-900'
                      }`}
                    >
                      Contacts
                    </span>
                    <span
                      className={`font-bold ${
                        contactsExceeded
                          ? 'text-red-700'
                          : isNearLimit
                          ? 'text-orange-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {contactsUsed.toLocaleString()} / {contactsLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        contactsExceeded
                          ? 'bg-red-600'
                          : isNearLimit
                          ? 'bg-orange-600'
                          : 'bg-amber-600'
                      }`}
                      style={{ width: `${Math.min(contactsPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Emails Usage */}
            {showEmailsWarning && (
              <div className="flex items-center gap-3">
                <Mail
                  className={`w-5 h-5 ${
                    emailsExceeded
                      ? 'text-red-600'
                      : isNearLimit
                      ? 'text-orange-600'
                      : 'text-amber-600'
                  }`}
                />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span
                      className={`font-medium ${
                        emailsExceeded
                          ? 'text-red-900'
                          : isNearLimit
                          ? 'text-orange-900'
                          : 'text-amber-900'
                      }`}
                    >
                      Emails/Month
                    </span>
                    <span
                      className={`font-bold ${
                        emailsExceeded
                          ? 'text-red-700'
                          : isNearLimit
                          ? 'text-orange-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {emailsUsed.toLocaleString()} / {emailsLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        emailsExceeded
                          ? 'bg-red-600'
                          : isNearLimit
                          ? 'bg-orange-600'
                          : 'bg-amber-600'
                      }`}
                      style={{ width: `${Math.min(emailsPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Link
            href="/pricing"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg ${
              isExceeded
                ? 'bg-red-600 hover:bg-red-700'
                : isNearLimit
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Upgrade Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
