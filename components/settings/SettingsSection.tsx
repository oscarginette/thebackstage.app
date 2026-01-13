/**
 * SettingsSection Component
 *
 * Unified section container for Settings pages.
 * Wraps content in a card with consistent styling.
 *
 * Architecture:
 * - Single Responsibility: Only renders section container
 * - Open/Closed: Uses Card from design system (extensible)
 * - Dependency Inversion: Depends on Card abstraction
 *
 * Features:
 * - Uses Card component from design system
 * - Optional section title
 * - Optional section description
 * - Consistent max-width (2xl) for readability
 * - Dark mode support via Card component
 *
 * Usage:
 * ```tsx
 * <SettingsSection>
 *   <Input label="Name" />
 *   <Input label="Email" />
 * </SettingsSection>
 *
 * // With title
 * <SettingsSection
 *   title="Profile Information"
 *   description="Update your personal details"
 * >
 *   <Input label="Name" />
 * </SettingsSection>
 *
 * // Custom max-width
 * <SettingsSection maxWidth="4xl">
 *   Wide content here
 * </SettingsSection>
 * ```
 */

'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { TEXT_STYLES } from '@/domain/types/design-tokens';

export interface SettingsSectionProps {
  /**
   * Section content
   */
  children: ReactNode;

  /**
   * Optional section title (displayed at top of card)
   */
  title?: string;

  /**
   * Optional section description (displayed below title)
   */
  description?: string;

  /**
   * Maximum width constraint
   * @default '2xl'
   */
  maxWidth?: 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * SettingsSection
 *
 * Renders a consistent card/section across all Settings pages.
 * Eliminates duplicated section wrapper code.
 *
 * Uses Card component from design system, ensuring:
 * - Consistent background (bg-white/90 dark:bg-[#0A0A0A])
 * - Consistent border (border-black/5 dark:border-white/10)
 * - Consistent padding (p-6)
 * - Consistent border-radius (rounded-2xl)
 */
export function SettingsSection({
  children,
  title,
  description,
  maxWidth = 'full',
  className,
}: SettingsSectionProps) {
  const maxWidthClass = maxWidth === 'full' ? '' : `max-w-${maxWidth}`;

  return (
    <Card
      variant="default"
      padding="md"
      className={`${maxWidthClass} ${className || ''}`}
    >
      {/* Optional Title & Description */}
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className={`${TEXT_STYLES.heading.h2} mb-1`}>
              {title}
            </h3>
          )}
          {description && (
            <p className={TEXT_STYLES.body.subtle}>
              {description}
            </p>
          )}
        </div>
      )}

      {/* Section Content */}
      {children}
    </Card>
  );
}
