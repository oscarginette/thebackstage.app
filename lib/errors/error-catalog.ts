/**
 * Error Catalog - SSOT (Single Source of Truth)
 *
 * Centralized error definitions following SOLID principles.
 * All application errors are defined here with:
 * - Unique error codes
 * - HTTP status codes
 * - Translatable message keys
 * - User-friendly descriptions
 * - Technical details for debugging
 *
 * SOLID Principles:
 * - SRP: Each error type has one responsibility
 * - OCP: Easy to extend with new error types
 * - LSP: All errors follow the same contract
 * - ISP: Minimal error interface
 * - DIP: Application depends on error codes, not implementations
 */

export const ERROR_CODES = {
  // Authentication Errors (1xxx)
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',

  // Authorization Errors (2xxx)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_ACCESS_DENIED: 'RESOURCE_ACCESS_DENIED',

  // Resource Errors (3xxx)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CAMPAIGN_NOT_FOUND: 'CAMPAIGN_NOT_FOUND',
  CONTACT_NOT_FOUND: 'CONTACT_NOT_FOUND',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  GATE_NOT_FOUND: 'GATE_NOT_FOUND',

  // Validation Errors (4xxx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  FIELD_TOO_LONG: 'FIELD_TOO_LONG',
  FIELD_TOO_SHORT: 'FIELD_TOO_SHORT',

  // Business Logic Errors (5xxx)
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  CONFLICT: 'CONFLICT',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',

  // Database Errors (6xxx)
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  DATABASE_QUERY_FAILED: 'DATABASE_QUERY_FAILED',
  DATABASE_CONSTRAINT_VIOLATION: 'DATABASE_CONSTRAINT_VIOLATION',

  // External Service Errors (7xxx)
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  EMAIL_PROVIDER_ERROR: 'EMAIL_PROVIDER_ERROR',
  BREVO_API_ERROR: 'BREVO_API_ERROR',
  SOUNDCLOUD_API_ERROR: 'SOUNDCLOUD_API_ERROR',
  SPOTIFY_API_ERROR: 'SPOTIFY_API_ERROR',

  // Internal Errors (8xxx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',

  // Settings Specific Errors (9xxx)
  SETTINGS_LOAD_FAILED: 'SETTINGS_LOAD_FAILED',
  SETTINGS_UPDATE_FAILED: 'SETTINGS_UPDATE_FAILED',
  SETTINGS_INVALID_DATA: 'SETTINGS_INVALID_DATA',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Error Catalog Entry
 * Defines metadata for each error type
 */
export interface ErrorCatalogEntry {
  code: ErrorCode;
  httpStatus: number;
  messageKey: string; // i18n key for user message
  category: 'auth' | 'authorization' | 'resource' | 'validation' | 'business' | 'database' | 'external' | 'internal' | 'settings';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userFriendly: boolean; // Whether to show technical details to user
  retryable: boolean; // Whether user should retry
}

/**
 * Error Catalog - SSOT for all application errors
 * Maps error codes to their metadata
 */
export const ERROR_CATALOG: Record<ErrorCode, ErrorCatalogEntry> = {
  // Authentication Errors
  [ERROR_CODES.AUTH_REQUIRED]: {
    code: ERROR_CODES.AUTH_REQUIRED,
    httpStatus: 401,
    messageKey: 'errors.auth.required',
    category: 'auth',
    severity: 'medium',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: {
    code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
    httpStatus: 401,
    messageKey: 'errors.auth.invalidCredentials',
    category: 'auth',
    severity: 'low',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.AUTH_SESSION_EXPIRED]: {
    code: ERROR_CODES.AUTH_SESSION_EXPIRED,
    httpStatus: 401,
    messageKey: 'errors.auth.sessionExpired',
    category: 'auth',
    severity: 'low',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.AUTH_TOKEN_INVALID]: {
    code: ERROR_CODES.AUTH_TOKEN_INVALID,
    httpStatus: 401,
    messageKey: 'errors.auth.tokenInvalid',
    category: 'auth',
    severity: 'medium',
    userFriendly: true,
    retryable: false,
  },

  // Authorization Errors
  [ERROR_CODES.FORBIDDEN]: {
    code: ERROR_CODES.FORBIDDEN,
    httpStatus: 403,
    messageKey: 'errors.authorization.forbidden',
    category: 'authorization',
    severity: 'medium',
    userFriendly: true,
    retryable: false,
  },
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: {
    code: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
    httpStatus: 403,
    messageKey: 'errors.authorization.insufficientPermissions',
    category: 'authorization',
    severity: 'medium',
    userFriendly: true,
    retryable: false,
  },
  [ERROR_CODES.RESOURCE_ACCESS_DENIED]: {
    code: ERROR_CODES.RESOURCE_ACCESS_DENIED,
    httpStatus: 403,
    messageKey: 'errors.authorization.resourceAccessDenied',
    category: 'authorization',
    severity: 'medium',
    userFriendly: true,
    retryable: false,
  },

  // Resource Errors
  [ERROR_CODES.NOT_FOUND]: {
    code: ERROR_CODES.NOT_FOUND,
    httpStatus: 404,
    messageKey: 'errors.resource.notFound',
    category: 'resource',
    severity: 'low',
    userFriendly: true,
    retryable: false,
  },
  [ERROR_CODES.USER_NOT_FOUND]: {
    code: ERROR_CODES.USER_NOT_FOUND,
    httpStatus: 404,
    messageKey: 'errors.resource.userNotFound',
    category: 'resource',
    severity: 'medium',
    userFriendly: true,
    retryable: false,
  },
  [ERROR_CODES.CAMPAIGN_NOT_FOUND]: {
    code: ERROR_CODES.CAMPAIGN_NOT_FOUND,
    httpStatus: 404,
    messageKey: 'errors.resource.campaignNotFound',
    category: 'resource',
    severity: 'low',
    userFriendly: true,
    retryable: false,
  },
  [ERROR_CODES.CONTACT_NOT_FOUND]: {
    code: ERROR_CODES.CONTACT_NOT_FOUND,
    httpStatus: 404,
    messageKey: 'errors.resource.contactNotFound',
    category: 'resource',
    severity: 'low',
    userFriendly: true,
    retryable: false,
  },
  [ERROR_CODES.TEMPLATE_NOT_FOUND]: {
    code: ERROR_CODES.TEMPLATE_NOT_FOUND,
    httpStatus: 404,
    messageKey: 'errors.resource.templateNotFound',
    category: 'resource',
    severity: 'low',
    userFriendly: true,
    retryable: false,
  },
  [ERROR_CODES.GATE_NOT_FOUND]: {
    code: ERROR_CODES.GATE_NOT_FOUND,
    httpStatus: 404,
    messageKey: 'errors.resource.gateNotFound',
    category: 'resource',
    severity: 'low',
    userFriendly: true,
    retryable: false,
  },

  // Validation Errors
  [ERROR_CODES.VALIDATION_ERROR]: {
    code: ERROR_CODES.VALIDATION_ERROR,
    httpStatus: 400,
    messageKey: 'errors.validation.generic',
    category: 'validation',
    severity: 'low',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.INVALID_EMAIL]: {
    code: ERROR_CODES.INVALID_EMAIL,
    httpStatus: 400,
    messageKey: 'errors.validation.invalidEmail',
    category: 'validation',
    severity: 'low',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.INVALID_INPUT]: {
    code: ERROR_CODES.INVALID_INPUT,
    httpStatus: 400,
    messageKey: 'errors.validation.invalidInput',
    category: 'validation',
    severity: 'low',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: {
    code: ERROR_CODES.MISSING_REQUIRED_FIELD,
    httpStatus: 400,
    messageKey: 'errors.validation.missingRequiredField',
    category: 'validation',
    severity: 'low',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.FIELD_TOO_LONG]: {
    code: ERROR_CODES.FIELD_TOO_LONG,
    httpStatus: 400,
    messageKey: 'errors.validation.fieldTooLong',
    category: 'validation',
    severity: 'low',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.FIELD_TOO_SHORT]: {
    code: ERROR_CODES.FIELD_TOO_SHORT,
    httpStatus: 400,
    messageKey: 'errors.validation.fieldTooShort',
    category: 'validation',
    severity: 'low',
    userFriendly: true,
    retryable: true,
  },

  // Business Logic Errors
  [ERROR_CODES.QUOTA_EXCEEDED]: {
    code: ERROR_CODES.QUOTA_EXCEEDED,
    httpStatus: 429,
    messageKey: 'errors.business.quotaExceeded',
    category: 'business',
    severity: 'medium',
    userFriendly: true,
    retryable: false,
  },
  [ERROR_CODES.DUPLICATE_RESOURCE]: {
    code: ERROR_CODES.DUPLICATE_RESOURCE,
    httpStatus: 409,
    messageKey: 'errors.business.duplicateResource',
    category: 'business',
    severity: 'low',
    userFriendly: true,
    retryable: false,
  },
  [ERROR_CODES.CONFLICT]: {
    code: ERROR_CODES.CONFLICT,
    httpStatus: 409,
    messageKey: 'errors.business.conflict',
    category: 'business',
    severity: 'medium',
    userFriendly: true,
    retryable: false,
  },
  [ERROR_CODES.OPERATION_NOT_ALLOWED]: {
    code: ERROR_CODES.OPERATION_NOT_ALLOWED,
    httpStatus: 403,
    messageKey: 'errors.business.operationNotAllowed',
    category: 'business',
    severity: 'medium',
    userFriendly: true,
    retryable: false,
  },

  // Database Errors
  [ERROR_CODES.DATABASE_ERROR]: {
    code: ERROR_CODES.DATABASE_ERROR,
    httpStatus: 500,
    messageKey: 'errors.database.generic',
    category: 'database',
    severity: 'critical',
    userFriendly: false,
    retryable: true,
  },
  [ERROR_CODES.DATABASE_CONNECTION_FAILED]: {
    code: ERROR_CODES.DATABASE_CONNECTION_FAILED,
    httpStatus: 503,
    messageKey: 'errors.database.connectionFailed',
    category: 'database',
    severity: 'critical',
    userFriendly: false,
    retryable: true,
  },
  [ERROR_CODES.DATABASE_QUERY_FAILED]: {
    code: ERROR_CODES.DATABASE_QUERY_FAILED,
    httpStatus: 500,
    messageKey: 'errors.database.queryFailed',
    category: 'database',
    severity: 'high',
    userFriendly: false,
    retryable: true,
  },
  [ERROR_CODES.DATABASE_CONSTRAINT_VIOLATION]: {
    code: ERROR_CODES.DATABASE_CONSTRAINT_VIOLATION,
    httpStatus: 400,
    messageKey: 'errors.database.constraintViolation',
    category: 'database',
    severity: 'medium',
    userFriendly: false,
    retryable: false,
  },

  // External Service Errors
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: {
    code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    httpStatus: 502,
    messageKey: 'errors.external.generic',
    category: 'external',
    severity: 'high',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.EMAIL_PROVIDER_ERROR]: {
    code: ERROR_CODES.EMAIL_PROVIDER_ERROR,
    httpStatus: 502,
    messageKey: 'errors.external.emailProvider',
    category: 'external',
    severity: 'high',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.BREVO_API_ERROR]: {
    code: ERROR_CODES.BREVO_API_ERROR,
    httpStatus: 502,
    messageKey: 'errors.external.brevoApi',
    category: 'external',
    severity: 'high',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.SOUNDCLOUD_API_ERROR]: {
    code: ERROR_CODES.SOUNDCLOUD_API_ERROR,
    httpStatus: 502,
    messageKey: 'errors.external.soundcloudApi',
    category: 'external',
    severity: 'medium',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.SPOTIFY_API_ERROR]: {
    code: ERROR_CODES.SPOTIFY_API_ERROR,
    httpStatus: 502,
    messageKey: 'errors.external.spotifyApi',
    category: 'external',
    severity: 'medium',
    userFriendly: true,
    retryable: true,
  },

  // Internal Errors
  [ERROR_CODES.INTERNAL_ERROR]: {
    code: ERROR_CODES.INTERNAL_ERROR,
    httpStatus: 500,
    messageKey: 'errors.internal.generic',
    category: 'internal',
    severity: 'critical',
    userFriendly: false,
    retryable: true,
  },
  [ERROR_CODES.CONFIGURATION_ERROR]: {
    code: ERROR_CODES.CONFIGURATION_ERROR,
    httpStatus: 500,
    messageKey: 'errors.internal.configuration',
    category: 'internal',
    severity: 'critical',
    userFriendly: false,
    retryable: false,
  },
  [ERROR_CODES.UNEXPECTED_ERROR]: {
    code: ERROR_CODES.UNEXPECTED_ERROR,
    httpStatus: 500,
    messageKey: 'errors.internal.unexpected',
    category: 'internal',
    severity: 'critical',
    userFriendly: false,
    retryable: true,
  },

  // Settings Specific Errors
  [ERROR_CODES.SETTINGS_LOAD_FAILED]: {
    code: ERROR_CODES.SETTINGS_LOAD_FAILED,
    httpStatus: 500,
    messageKey: 'errors.settings.loadFailed',
    category: 'settings',
    severity: 'high',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.SETTINGS_UPDATE_FAILED]: {
    code: ERROR_CODES.SETTINGS_UPDATE_FAILED,
    httpStatus: 500,
    messageKey: 'errors.settings.updateFailed',
    category: 'settings',
    severity: 'medium',
    userFriendly: true,
    retryable: true,
  },
  [ERROR_CODES.SETTINGS_INVALID_DATA]: {
    code: ERROR_CODES.SETTINGS_INVALID_DATA,
    httpStatus: 400,
    messageKey: 'errors.settings.invalidData',
    category: 'settings',
    severity: 'low',
    userFriendly: true,
    retryable: true,
  },
};

/**
 * Get error catalog entry by code
 */
export function getErrorCatalogEntry(code: ErrorCode): ErrorCatalogEntry {
  return ERROR_CATALOG[code];
}

/**
 * Check if error code exists in catalog
 */
export function isKnownErrorCode(code: string): code is ErrorCode {
  return code in ERROR_CATALOG;
}
