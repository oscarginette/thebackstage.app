'use client';

/**
 * Signup Page
 *
 * User registration interface for multi-tenant email system.
 * Creates new user account and automatically logs them in.
 *
 * Features:
 * - Email/password registration
 * - Real-time validation feedback
 * - Password strength indicator with visual feedback
 * - Password confirmation matching
 * - Client-side validation
 * - Automatic login after signup
 * - Specific, actionable error messages
 */

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PATHS, buildUrl } from '@/lib/paths';

// Password strength validation result
interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Real-time validation states
  const [emailError, setEmailError] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({ valid: false, errors: [] });
  const [passwordMatchError, setPasswordMatchError] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // Email validation (real-time)
  useEffect(() => {
    if (!email) {
      setEmailError('');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
    } else if (email.length > 255) {
      setEmailError('Email must not exceed 255 characters');
    } else {
      setEmailError('');
    }
  }, [email]);

  // Password strength validation (real-time)
  useEffect(() => {
    if (!password) {
      setPasswordValidation({ valid: false, errors: [] });
      return;
    }

    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (password.length > 128) {
      errors.push('Must not exceed 128 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('At least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('At least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('At least one number');
    }

    setPasswordValidation({
      valid: errors.length === 0,
      errors,
    });
  }, [password]);

  // Password confirmation matching (real-time)
  useEffect(() => {
    if (!passwordConfirm) {
      setPasswordMatchError('');
      return;
    }

    if (password !== passwordConfirm) {
      setPasswordMatchError('Passwords do not match');
    } else {
      setPasswordMatchError('');
    }
  }, [password, passwordConfirm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Final validation before submission
      if (!email) {
        setError('Please enter your email address');
        setIsLoading(false);
        return;
      }

      if (emailError) {
        setError(emailError);
        setIsLoading(false);
        return;
      }

      if (!password) {
        setError('Please enter a password');
        setIsLoading(false);
        return;
      }

      if (!passwordValidation.valid) {
        setError('Please fix the password requirements listed below');
        setIsLoading(false);
        return;
      }

      if (!passwordConfirm) {
        setError('Please confirm your password');
        setIsLoading(false);
        return;
      }

      if (password !== passwordConfirm) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      // Call signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          passwordConfirm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Provide specific error messages
        if (response.status === 409) {
          setError('This email is already registered. Please sign in instead.');
        } else if (data.error) {
          setError(data.error);
        } else {
          setError('Failed to create account. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Auto-login after successful signup
      try {
        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          // Account created but login failed - redirect to login page
          console.warn('Auto-login failed after signup:', signInResult.error);
          setIsLoading(false);
          router.push(buildUrl(PATHS.LOGIN, { message: 'Account created successfully! Please sign in.' }));
          return;
        }

        // Success - redirect to dashboard
        router.push(PATHS.DASHBOARD.ROOT);
        router.refresh();
      } catch (signInError) {
        // Auto-login failed catastrophically
        console.error('Auto-login error after signup:', signInError);
        setIsLoading(false);
        router.push(buildUrl(PATHS.LOGIN, { message: 'Account created successfully! Please sign in.' }));
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Calculate password strength percentage for visual indicator
  const getPasswordStrength = (): number => {
    if (!password) return 0;
    const requirements = 5; // Total requirements
    const met = requirements - passwordValidation.errors.length;
    return (met / requirements) * 100;
  };

  const getPasswordStrengthColor = (): string => {
    const strength = getPasswordStrength();
    if (strength === 100) return 'bg-green-500';
    if (strength >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPasswordStrengthLabel = (): string => {
    const strength = getPasswordStrength();
    if (strength === 100) return 'Strong';
    if (strength >= 60) return 'Medium';
    if (strength > 0) return 'Weak';
    return '';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href={PATHS.LOGIN}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        {/* Signup Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  emailError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="you@example.com"
                disabled={isLoading}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowPasswordRequirements(true)}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  password && !passwordValidation.valid ? 'border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="Enter a strong password"
                disabled={isLoading}
              />

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordValidation.valid ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {getPasswordStrengthLabel()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${getPasswordStrength()}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Password Confirm Input */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  passwordMatchError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : passwordConfirm && !passwordMatchError ? 'border-green-300 focus:ring-green-500 focus:border-green-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="Re-enter your password"
                disabled={isLoading}
              />
              {passwordMatchError && (
                <p className="mt-1 text-sm text-red-600">{passwordMatchError}</p>
              )}
              {passwordConfirm && !passwordMatchError && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Passwords match
                </p>
              )}
            </div>
          </div>

          {/* Password Requirements */}
          {(showPasswordRequirements || password) && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
              <p className="text-xs font-semibold text-blue-900 mb-2">Password requirements:</p>
              <ul className="space-y-1">
                <li className={`text-xs flex items-center ${
                  password.length >= 8 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  <span className="mr-2">{password.length >= 8 ? '✓' : '○'}</span>
                  At least 8 characters long
                </li>
                <li className={`text-xs flex items-center ${
                  /[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-600'
                }`}>
                  <span className="mr-2">{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                  At least one uppercase letter (A-Z)
                </li>
                <li className={`text-xs flex items-center ${
                  /[a-z]/.test(password) ? 'text-green-600' : 'text-gray-600'
                }`}>
                  <span className="mr-2">{/[a-z]/.test(password) ? '✓' : '○'}</span>
                  At least one lowercase letter (a-z)
                </li>
                <li className={`text-xs flex items-center ${
                  /[0-9]/.test(password) ? 'text-green-600' : 'text-gray-600'
                }`}>
                  <span className="mr-2">{/[0-9]/.test(password) ? '✓' : '○'}</span>
                  At least one number (0-9)
                </li>
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !!emailError || !passwordValidation.valid || !!passwordMatchError}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
