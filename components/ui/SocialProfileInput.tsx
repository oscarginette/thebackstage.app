/**
 * SocialProfileInput Component
 *
 * Reusable input for social profile URLs with automatic normalization.
 * Follows SOLID principles:
 * - SRP: Only handles social profile URL input
 * - OCP: Extensible for new platforms via SocialPlatform type
 * - DIP: Depends on normalizeSocialUrl abstraction, not implementation
 *
 * Features:
 * - Accepts username, handle (@username), or full URL
 * - Auto-normalizes to full HTTPS URL
 * - Platform-specific focus colors (Instagram, SoundCloud, Spotify)
 * - Validation feedback
 *
 * Usage:
 * ```tsx
 * <SocialProfileInput
 *   platform="instagram"
 *   value={instagramUrl}
 *   onChange={setInstagramUrl}
 *   label="Instagram"
 * />
 * ```
 */

'use client';

import { useState, useEffect, forwardRef } from 'react';
import { Input } from './Input';
import { normalizeSocialUrl, getSocialPlaceholder, getSocialHelperText, type SocialPlatform } from '@/lib/social-url-utils';

export interface SocialProfileInputProps {
  /** Social platform (instagram, soundcloud, spotify) */
  platform: SocialPlatform;
  /** Current value (can be username, handle, or full URL) */
  value: string;
  /** onChange handler - receives normalized URL or raw input */
  onChange: (value: string) => void;
  /** Optional label (defaults to capitalized platform name) */
  label?: string;
  /** Optional placeholder (defaults to platform-specific placeholder) */
  placeholder?: string;
  /** Optional helper text (defaults to platform-specific helper) */
  helperText?: string;
  /** Whether to auto-normalize on blur (default: true) */
  autoNormalize?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Get focus variant for platform (for Input component)
 */
function getFocusVariant(platform: SocialPlatform): 'instagram' | 'soundcloud' | 'spotify' | 'primary' {
  switch (platform) {
    case 'instagram':
      return 'instagram';
    case 'soundcloud':
      return 'soundcloud';
    case 'spotify':
      return 'spotify';
    default:
      return 'primary';
  }
}

export const SocialProfileInput = forwardRef<HTMLInputElement, SocialProfileInputProps>(
  function SocialProfileInput(
    {
      platform,
      value,
      onChange,
      label,
      placeholder,
      helperText,
      autoNormalize = true,
      className,
    },
    ref
  ) {
    const [localValue, setLocalValue] = useState(value);

    // Sync with external value changes
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      onChange(newValue); // Send raw value during typing
    };

    const handleBlur = () => {
      if (!autoNormalize || !localValue.trim()) {
        return;
      }

      // Attempt to normalize URL on blur
      const normalized = normalizeSocialUrl(localValue, platform);
      if (normalized && normalized !== localValue) {
        setLocalValue(normalized);
        onChange(normalized);
      }
    };

    const defaultLabel = label || platform.charAt(0).toUpperCase() + platform.slice(1);
    const defaultPlaceholder = placeholder || getSocialPlaceholder(platform);
    const defaultHelperText = helperText || getSocialHelperText(platform);

    return (
      <Input
        ref={ref}
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        label={defaultLabel}
        placeholder={defaultPlaceholder}
        helperText={defaultHelperText}
        focusVariant={getFocusVariant(platform)}
        className={className}
      />
    );
  }
);
