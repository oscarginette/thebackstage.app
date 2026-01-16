/**
 * Input Component
 *
 * Unified input field component with label, helper text, and error states.
 * Follows Clean Architecture + SOLID principles.
 *
 * Features:
 * - Platform-specific focus colors (primary, SoundCloud, Spotify, Brevo)
 * - Label and helper text support
 * - Error state with error message
 * - Disabled state
 * - Auto dark mode support via CSS variables
 * - Type-safe with full TypeScript support
 *
 * Architecture:
 * - Single Responsibility: Handles only input rendering and state display
 * - Open/Closed: Easy to extend with new focus variants without modification
 * - Dependency Inversion: Depends on design tokens abstraction
 *
 * Usage:
 * ```tsx
 * <Input
 *   label="Email"
 *   helperText="We'll never share your email"
 *   error={errors.email}
 *   focusVariant="spotify"
 *   {...register('email')}
 * />
 * ```
 */

'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { INPUT_STYLES, TEXT_STYLES, cn } from '@/domain/types/design-tokens';

/**
 * Focus variant types for platform-specific branding
 */
export type InputFocusVariant = 'primary' | 'soundcloud' | 'spotify' | 'brevo' | 'instagram';

/**
 * Input component props
 * Extends native HTML input attributes with custom props
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Input label displayed above the field
   */
  label?: string;

  /**
   * Helper text displayed below the field
   * Overridden by error message when error is present
   */
  helperText?: string;

  /**
   * Error message to display
   * When present, input shows error state and displays this message
   */
  error?: string;

  /**
   * Focus ring color variant
   * @default 'primary'
   */
  focusVariant?: InputFocusVariant;

  /**
   * Full width container (default: true)
   * Set to false for inline usage
   */
  fullWidth?: boolean;
}

/**
 * Input Component
 *
 * @example
 * // Basic usage
 * <Input label="Name" placeholder="Enter your name" />
 *
 * @example
 * // With helper text
 * <Input
 *   label="Email"
 *   helperText="We'll never share your email"
 * />
 *
 * @example
 * // With error state
 * <Input
 *   label="Password"
 *   error="Password must be at least 8 characters"
 * />
 *
 * @example
 * // Platform-specific focus color
 * <Input
 *   label="Spotify URL"
 *   focusVariant="spotify"
 *   placeholder="https://open.spotify.com/..."
 * />
 *
 * @example
 * // With React Hook Form
 * <Input
 *   label="Email"
 *   error={errors.email?.message}
 *   {...register('email')}
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      focusVariant = 'primary',
      fullWidth = true,
      disabled,
      className,
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID for accessibility if not provided
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    // Determine focus color based on variant
    const focusColor = INPUT_STYLES.focusColors[focusVariant];

    return (
      <div className={cn(fullWidth && 'w-full', 'space-y-1.5')}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className={TEXT_STYLES.label.default}>
            {label}
          </label>
        )}

        {/* Input field */}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          className={cn(
            // Base styles
            INPUT_STYLES.base,
            INPUT_STYLES.appearance,
            INPUT_STYLES.text,

            // Focus styles (only when not disabled)
            !disabled && INPUT_STYLES.focus,
            !disabled && focusColor,

            // Error state (overrides focus color)
            error &&
              !disabled &&
              'border-red-500/40 focus:ring-red-500/20 focus:border-red-500/60',

            // Disabled state
            disabled && INPUT_STYLES.disabled,

            // Custom className override
            className
          )}
          {...props}
        />

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className={cn(TEXT_STYLES.body.subtle, 'text-red-600 dark:text-red-400')}
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Helper text (only shown when no error) */}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className={TEXT_STYLES.body.subtle}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
