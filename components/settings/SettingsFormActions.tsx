/**
 * SettingsFormActions Component
 *
 * Unified form action buttons for Settings pages.
 * Handles save button with loading state and success message.
 *
 * Architecture:
 * - Single Responsibility: Only renders form actions
 * - Open/Closed: Extensible via additional buttons
 * - Dependency Inversion: Uses Button from design system
 *
 * Features:
 * - Primary save button with loading state
 * - Animated success message
 * - Uses Button component from design system
 * - i18n support via useTranslations
 * - Framer Motion animations
 *
 * Usage:
 * ```tsx
 * const [isSaving, setIsSaving] = useState(false);
 * const [showSuccess, setShowSuccess] = useState(false);
 *
 * <SettingsFormActions
 *   isSaving={isSaving}
 *   showSuccess={showSuccess}
 *   onSave={handleSave}
 * />
 *
 * // With custom save text
 * <SettingsFormActions
 *   isSaving={isSaving}
 *   showSuccess={showSuccess}
 *   onSave={handleSave}
 *   saveText="Update Profile"
 *   savingText="Updating..."
 *   savedText="Profile Updated"
 * />
 *
 * // With additional buttons
 * <SettingsFormActions
 *   isSaving={isSaving}
 *   showSuccess={showSuccess}
 *   onSave={handleSave}
 * >
 *   <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
 * </SettingsFormActions>
 * ```
 */

'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslations } from '@/lib/i18n/context';

export interface SettingsFormActionsProps {
  /**
   * Whether the save operation is in progress
   */
  isSaving: boolean;

  /**
   * Whether to show success message
   * Typically set to true after successful save, then false after timeout
   */
  showSuccess: boolean;

  /**
   * Save button click handler
   * Should handle form submission and set isSaving state
   */
  onSave?: () => void;

  /**
   * Custom save button text
   * @default Translation for "save"
   */
  saveText?: string;

  /**
   * Custom saving button text
   * @default Translation for "saving"
   */
  savingText?: string;

  /**
   * Custom success message text
   * @default Translation for "saved"
   */
  savedText?: string;

  /**
   * Additional action buttons (rendered before save button)
   * Example: Cancel, Reset, etc.
   */
  children?: ReactNode;

  /**
   * Button type (button or submit)
   * @default 'submit'
   */
  type?: 'button' | 'submit';
}

/**
 * SettingsFormActions
 *
 * Renders consistent form actions across all Settings pages.
 * Eliminates duplicated save button + success message code.
 */
export function SettingsFormActions({
  isSaving,
  showSuccess,
  onSave,
  saveText,
  savingText,
  savedText,
  children,
  type = 'submit',
}: SettingsFormActionsProps) {
  const t = useTranslations('settings');

  // Use custom text or fallback to translations
  const buttonSaveText = saveText || t('save');
  const buttonSavingText = savingText || t('saving');
  const buttonSavedText = savedText || t('saved');

  return (
    <div className="flex items-center gap-4">
      {/* Additional Action Buttons (optional) */}
      {children}

      {/* Save Button */}
      <Button
        type={type}
        variant="primary"
        size="md"
        loading={isSaving}
        disabled={isSaving}
        onClick={onSave}
      >
        <AnimatePresence mode="wait">
          {isSaving ? (
            <motion.span
              key="saving"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {buttonSavingText}
            </motion.span>
          ) : (
            <motion.span
              key="save"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <Save className="w-3 h-3" />
              {buttonSaveText}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 rounded-lg border border-emerald-100 dark:border-emerald-500/20 text-xs"
          >
            <CheckCircle2 className="w-3 h-3" />
            {buttonSavedText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
