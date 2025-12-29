/**
 * API Client Layer
 *
 * Provides type-safe API communication with automatic error handling.
 * Abstracts the successResponse wrapper from frontend components.
 *
 * Clean Architecture: Presentation layer abstraction
 * SOLID: Single Responsibility (handles API communication only)
 */

import { SuccessResponse, ErrorResponse } from './api-response';

/**
 * Custom API Error class for structured error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic GET request with automatic unwrapping
 *
 * @param url - API endpoint
 * @returns Unwrapped data (T)
 * @throws ApiError on non-2xx responses
 *
 * @example
 * const { contacts, stats } = await apiGet<GetContactsWithStatsResult>('/api/contacts');
 */
export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const response: SuccessResponse<T> | ErrorResponse = await res.json();

  if (!res.ok || !response.success) {
    const errorResponse = response as ErrorResponse;
    throw new ApiError(
      errorResponse.error,
      errorResponse.code,
      res.status,
      errorResponse.details
    );
  }

  return (response as SuccessResponse<T>).data;
}

/**
 * Generic POST request with automatic unwrapping
 *
 * @param url - API endpoint
 * @param body - Request payload
 * @returns Unwrapped data (T)
 * @throws ApiError on non-2xx responses
 *
 * @example
 * const result = await apiPost<ImportResult>('/api/contacts/import', { contacts });
 */
export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const response: SuccessResponse<T> | ErrorResponse = await res.json();

  if (!res.ok || !response.success) {
    const errorResponse = response as ErrorResponse;
    throw new ApiError(
      errorResponse.error,
      errorResponse.code,
      res.status,
      errorResponse.details
    );
  }

  return (response as SuccessResponse<T>).data;
}

/**
 * Generic PATCH request with automatic unwrapping
 */
export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const response: SuccessResponse<T> | ErrorResponse = await res.json();

  if (!res.ok || !response.success) {
    const errorResponse = response as ErrorResponse;
    throw new ApiError(
      errorResponse.error,
      errorResponse.code,
      res.status,
      errorResponse.details
    );
  }

  return (response as SuccessResponse<T>).data;
}

/**
 * Generic DELETE request with automatic unwrapping
 */
export async function apiDelete<T = void>(url: string): Promise<T | void> {
  const res = await fetch(url, {
    method: 'DELETE'
  });

  // 204 No Content
  if (res.status === 204) {
    return;
  }

  const response: SuccessResponse<T> | ErrorResponse = await res.json();

  if (!res.ok || !response.success) {
    const errorResponse = response as ErrorResponse;
    throw new ApiError(
      errorResponse.error,
      errorResponse.code,
      res.status,
      errorResponse.details
    );
  }

  return (response as SuccessResponse<T>).data;
}

/**
 * Helper to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
