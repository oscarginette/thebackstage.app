/**
 * useEmailContentValidation Hook
 *
 * Provides real-time validation feedback for email content.
 * Follows Interface Segregation Principle - provides exactly what UI needs.
 *
 * Usage:
 * ```tsx
 * const { isValid, errors, fieldHasError, getFieldErrors, saveButtonTooltip } =
 *   useEmailContentValidation({ subject, greeting, message, signature });
 *
 * <button disabled={!isValid} title={saveButtonTooltip}>
 *   Save Draft
 * </button>
 * ```
 */

'use client';

import { useMemo } from 'react';
import { ValidateEmailContentUseCase } from '@/domain/services/ValidateEmailContentUseCase';
import { ValidationError } from '@/domain/value-objects/EmailContentValidation';

export interface EmailContentValidationInput {
  subject: string;
  greeting: string;
  message: string;
  signature: string;
}

export interface UseEmailContentValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  summary: string;
  saveButtonTooltip: string;
  fieldHasError: (field: 'subject' | 'greeting' | 'message' | 'signature') => boolean;
  getFieldErrors: (field: 'subject' | 'greeting' | 'message' | 'signature') => ValidationError[];
  getFieldErrorMessages: (field: 'subject' | 'greeting' | 'message' | 'signature') => string[];
}

/**
 * Hook for real-time email content validation
 *
 * Re-validates whenever content changes.
 * Uses useMemo to avoid unnecessary re-computation.
 */
export function useEmailContentValidation(
  content: EmailContentValidationInput
): UseEmailContentValidationResult {
  const useCase = useMemo(() => new ValidateEmailContentUseCase(), []);

  const validationResult = useMemo(() => {
    return useCase.execute(content);
  }, [content.subject, content.greeting, content.message, content.signature, useCase]);

  const fieldHasError = useMemo(() => {
    return (field: 'subject' | 'greeting' | 'message' | 'signature') => {
      return validationResult.errors.some(error => error.field === field);
    };
  }, [validationResult.errors]);

  const getFieldErrors = useMemo(() => {
    return (field: 'subject' | 'greeting' | 'message' | 'signature') => {
      return validationResult.errors.filter(error => error.field === field);
    };
  }, [validationResult.errors]);

  const getFieldErrorMessages = useMemo(() => {
    return (field: 'subject' | 'greeting' | 'message' | 'signature') => {
      return validationResult.errors
        .filter(error => error.field === field)
        .map(error => error.message);
    };
  }, [validationResult.errors]);

  return {
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    summary: validationResult.summary,
    saveButtonTooltip: validationResult.saveButtonTooltip,
    fieldHasError,
    getFieldErrors,
    getFieldErrorMessages
  };
}
