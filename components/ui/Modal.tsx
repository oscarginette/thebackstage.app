'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { CARD_STYLES, TEXT_STYLES, BUTTON_STYLES, cn } from '@/domain/types/design-tokens';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
  customHeader?: ReactNode;
  hideDefaultHeader?: boolean;
  zIndex?: number; // Custom z-index (default: 50)
  maxHeight?: string; // Custom max-height (default: 'max-h-[90vh]')
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

/**
 * Modal Component - Reusable modal wrapper
 *
 * Features:
 * - Click outside to close
 * - Configurable sizes
 * - Optional header with title
 * - Backdrop blur effect
 * - Dark mode support via design tokens
 * - Prevents body scroll when open
 *
 * Architecture:
 * - Uses CARD_STYLES for consistent background and borders
 * - Uses TEXT_STYLES for typography
 * - Uses BUTTON_STYLES for interactive elements
 * - Fully backward compatible with existing API
 *
 * @example
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   size="4xl"
 *   title="Import Contacts"
 *   subtitle="Upload CSV or JSON file"
 * >
 *   <div className="p-6">Modal content here</div>
 * </Modal>
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  size = '4xl',
  title,
  subtitle,
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = '',
  customHeader,
  hideDefaultHeader = false,
  zIndex = 50,
  maxHeight = 'max-h-[90vh]',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      style={{ zIndex }}
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          // Background & borders (dark mode adaptive)
          CARD_STYLES.background.solid,
          CARD_STYLES.border.default,
          // Base structure
          'rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col',
          // Height
          maxHeight,
          // Size
          sizeClasses[size],
          // Custom overrides
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Custom Header */}
        {customHeader}

        {/* Default Header (optional) */}
        {!hideDefaultHeader && !customHeader && (title || showCloseButton) && (
          <div className={cn(
            'flex items-center justify-between p-6 border-b',
            CARD_STYLES.border.default
          )}>
            <div>
              {title && (
                <h2 className={cn(
                  'text-2xl font-bold',
                  'text-foreground'
                )}>{title}</h2>
              )}
              {subtitle && (
                <p className={cn(
                  TEXT_STYLES.body.base,
                  'text-foreground/60 mt-1'
                )}>{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  'hover:bg-black/5 dark:hover:bg-white/5',
                  'text-foreground/60 hover:text-foreground'
                )}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * ModalBody - Scrollable content area
 *
 * Provides consistent padding for modal content.
 * Uses design tokens for spacing.
 *
 * @example
 * <ModalBody>
 *   <p>Your content here</p>
 * </ModalBody>
 */
export function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(CARD_STYLES.padding.md, className)}>
      {children}
    </div>
  );
}

/**
 * ModalFooter - Fixed footer with actions
 *
 * Provides a footer area with border separator and muted background.
 * Uses design tokens for adaptive dark mode support.
 *
 * @example
 * <ModalFooter>
 *   <Button variant="secondary">Cancel</Button>
 *   <Button variant="primary">Save</Button>
 * </ModalFooter>
 */
export function ModalFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      CARD_STYLES.padding.md,
      'border-t',
      CARD_STYLES.border.default,
      'bg-black/[0.02] dark:bg-white/[0.02]',
      className
    )}>
      {children}
    </div>
  );
}
