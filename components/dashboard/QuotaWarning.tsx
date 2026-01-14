/**
 * QuotaWarning Component
 *
 * Displays positive, opportunity-focused banner when user approaches or exceeds quota limits.
 * Shows at 80%+ usage for contacts or emails with green styling and celebration messaging.
 * Calculates reach percentage to show what % of audience can receive emails.
 * ADMIN BYPASS: Admins never see quota warnings.
 *
 * Clean Architecture: Presentation component with clear visual hierarchy.
 * UX Strategy: Frames limits as growth opportunities, not errors.
 */

'use client';

import { Sparkles, Mail, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PATHS } from '@/lib/paths';
import { useSession } from 'next-auth/react';
import { SUBSCRIPTION_PLANS } from '@/domain/types/subscriptions';
import { USER_ROLES } from '@/domain/types/user-roles';

interface QuotaWarningProps {
  contactsUsed: number;
  contactsLimit: number;
  emailsUsed: number;
  emailsLimit: number;
  subscriptionPlan: string;
}

export default function QuotaWarning({
  contactsUsed,
  contactsLimit,
  emailsUsed,
  emailsLimit,
  subscriptionPlan,
}: QuotaWarningProps) {
  const { data: session } = useSession();

  // ADMIN BYPASS: Admins never see quota warnings
  const isAdmin = session?.user?.role === USER_ROLES.ADMIN;
  if (isAdmin) {
    return null;
  }

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

  // Calculate reach percentage (what % of audience can be reached)
  // If user has more contacts than email limit, they can't reach everyone
  const canReachPercent = contactsUsed > emailsLimit
    ? Math.round((emailsLimit / contactsUsed) * 100)
    : 100;

  // Only show reach percentage if contacts exceeded AND there's a restriction
  const showReachPercentage = contactsExceeded && contactsUsed > emailsLimit;

  // Calculate display percentage for contacts bar
  // If reach is restricted, show the restricted % (opportunity to reach)
  // Otherwise show the standard usage percentage
  const displayContactsPercentage = showReachPercentage 
    ? (100 - canReachPercent) 
    : Math.min(contactsPercentage, 100);

  // Determine severity level
  const isExceeded = contactsExceeded || emailsExceeded;

  // Dynamic Styles - Always green/positive (opportunity messaging)
  const containerClasses = 'bg-green-50/50 border-green-100';
  const iconContainerClasses = 'bg-white text-green-600 shadow-sm ring-1 ring-green-100';
  const titleColor = 'text-green-900';
  const descriptionColor = 'text-green-700';
  const progressTrackColor = 'bg-white';
  const progressFillColor = 'bg-green-500';
  
  // Labels - Positive, opportunity-focused messaging
  const getLabels = (): { title: string; description: React.ReactNode } => {
    // Both limits exceeded (100%)
    if (contactsExceeded && emailsExceeded) {
      return {
        title: '¡Máxima actividad alcanzada!',
        description: `Has alcanzado el límite de contactos (${contactsLimit.toLocaleString()}) y emails (${emailsLimit.toLocaleString()}). Upgrade para seguir creciendo sin restricciones.`
      };
    }

    // Contacts exceeded (100%)
    if (contactsExceeded) {
      return {
        title: `¡Superaste ${contactsLimit.toLocaleString()} contactos!`,
        description: showReachPercentage
          ? (
              <>
                Tu audiencia está en constante crecimiento. Actualmente solo el <strong className="font-bold">{canReachPercent}%</strong> de tus fans recibirán emails. Upgrade para llegar a tus <strong className="font-bold">{contactsUsed.toLocaleString()} contactos</strong>.
              </>
            )
          : `Tienes ${contactsUsed.toLocaleString()} de ${contactsLimit.toLocaleString()} contactos. Upgrade para desbloquear más capacidad y seguir creciendo sin límites.`
      };
    }

    // Emails exceeded (100%)
    if (emailsExceeded) {
      return {
        title: `¡Superaste ${emailsLimit.toLocaleString()} emails!`,
        description: `Has enviado ${emailsLimit.toLocaleString()} emails este mes. Upgrade para enviar más campañas y seguir conectando con tu audiencia.`
      };
    }

    // Both approaching limits (80%+)
    if (contactsPercentage >= 80 && emailsPercentage >= 80) {
      return {
        title: '¡Tu cuenta está muy activa!',
        description: 'Estás aprovechando al máximo tu plan actual. Upgrade para desbloquear más contactos y emails sin límites.'
      };
    }

    // Contacts approaching (80-99%)
    if (contactsPercentage >= 80) {
      return {
        title: '¡Tu audiencia está creciendo!',
        description: `Tienes ${contactsUsed.toLocaleString()} de ${contactsLimit.toLocaleString()} contactos. Upgrade para desbloquear más capacidad y seguir creciendo sin límites.`
      };
    }

    // Emails approaching (80-99%)
    return {
      title: 'Buen ritmo de envíos',
      description: `Has usado ${emailsUsed.toLocaleString()} de ${emailsLimit.toLocaleString()} emails este mes. Upgrade para enviar más campañas y llegar a más fans.`
    };
  };

  const { title, description } = getLabels();

  // CTA button - Always positive and aspirational
  const ctaButtonText = 'Desbloquear Más';

  return (
    <div className={`rounded-2xl border p-6 mb-8 backdrop-blur-sm transition-all ${containerClasses}`}>
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${iconContainerClasses}`}>
          <Sparkles className="w-6 h-6" />
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
                  <div className="p-1.5 rounded-lg bg-green-100 text-green-700">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-neutral-700">
                      {showReachPercentage ? 'Restricted Reach' : 'Audience'}
                    </span>
                    <span className="text-xs font-mono font-medium text-neutral-500">
                      {contactsUsed.toLocaleString()} / {contactsLimit.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className={`w-full ${progressTrackColor} rounded-full h-2 overflow-hidden`}>
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${progressFillColor}`}
                    style={{ width: `${displayContactsPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Emails Usage */}
            {showEmailsWarning && (
              <div className="bg-white/50 rounded-xl p-3 border border-black/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 rounded-lg bg-green-100 text-green-700">
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 transition-all hover:scale-105 shadow-xl shadow-black/10 whitespace-nowrap"
          >
            {ctaButtonText}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
