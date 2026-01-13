/**
 * SettingsPageHeader Component
 *
 * Unified header for all Settings pages.
 * Provides consistent title, description, and optional action buttons.
 *
 * Architecture:
 * - Single Responsibility: Only renders page header
 * - Open/Closed: Extensible via actions slot
 * - Dependency Inversion: Uses design tokens
 *
 * Features:
 * - Consistent typography and spacing
 * - Optional action buttons (right-aligned on desktop)
 * - Responsive layout (stacks on mobile)
 * - Dark mode support via design tokens
 *
 * Usage:
 * ```tsx
 * <SettingsPageHeader
 *   title="My Profile"
 *   description="Manage your personal information"
 * />
 *
 * // With actions
 * <SettingsPageHeader
 *   title="Email Signature"
 *   description="Customize your email signature"
 *   actions={
 *     <>
 *       <Button variant="secondary" size="sm">Preview</Button>
 *       <Button variant="primary" size="sm">Save</Button>
 *     </>
 *   }
 * />
 * ```
 */

'use client';

import { ReactNode } from 'react';
import { TEXT_STYLES } from '@/domain/types/design-tokens';

export interface SettingsPageHeaderProps {
  /**
   * Page title (displayed in serif font)
   */
  title: string;

  /**
   * Page description/subtitle (displayed below title)
   */
  description: string;

  /**
   * Optional action buttons (displayed on the right side)
   * Typically used for Save, Preview, Add, etc.
   */
  actions?: ReactNode;
}

/**
 * SettingsPageHeader
 *
 * Renders a consistent header across all Settings pages.
 * Eliminates duplicated header code (6 different variations → 1 component).
 */
export function SettingsPageHeader({
  title,
  description,
  actions,
}: SettingsPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title & Description */}
      <div>
        <h2 className={`${TEXT_STYLES.heading.h1} mb-2`}>
          {title}
        </h2>
        <p className={TEXT_STYLES.body.subtle}>
          {description}
        </p>
      </div>

      {/* Action Buttons (optional) */}
      {actions && (
        <div className="flex items-center gap-3 self-start">
          {actions}
        </div>
      )}
    </div>
  );
}
