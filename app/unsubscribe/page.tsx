'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already' | 'resubscribing' | 'resubscribed'>('loading');
  const [email, setEmail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid unsubscribe link');
      return;
    }

    // Llamar al endpoint de unsubscribe
    fetch(`/api/unsubscribe?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmail(data.email);
          if (data.message === 'Already unsubscribed') {
            setStatus('already');
          } else {
            setStatus('success');
          }
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Failed to unsubscribe');
        }
      })
      .catch(err => {
        setStatus('error');
        setErrorMessage('Network error');
      });
  }, [token]);

  const handleResubscribe = () => {
    if (!token) return;

    setStatus('resubscribing');

    fetch(`/api/resubscribe?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmail(data.email);
          setStatus('resubscribed');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Failed to resubscribe');
        }
      })
      .catch(err => {
        setStatus('error');
        setErrorMessage('Network error');
      });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">The Backstage</h1>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Processing...</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div>
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-4">Unsubscribed Successfully</h2>
            <p className="text-gray-600 mb-2">
              {email && (
                <>
                  <span className="font-medium">{email}</span> has been removed from the mailing list.
                </>
              )}
            </p>
            <p className="text-gray-500 text-sm">
              You won't receive any more emails about new tracks.
            </p>
          </div>
        )}

        {/* Already unsubscribed */}
        {status === 'already' && (
          <div>
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-4">Already Unsubscribed</h2>
            <p className="text-gray-600 mb-6">
              {email && (
                <>
                  <span className="font-medium">{email}</span> is already unsubscribed.
                </>
              )}
            </p>
            <button
              onClick={handleResubscribe}
              className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors font-medium"
            >
              Changed your mind? Resubscribe
            </button>
          </div>
        )}

        {/* Resubscribing */}
        {status === 'resubscribing' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Re-subscribing...</p>
          </div>
        )}

        {/* Resubscribed */}
        {status === 'resubscribed' && (
          <div>
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-4">Welcome Back!</h2>
            <p className="text-gray-600 mb-2">
              {email && (
                <>
                  <span className="font-medium">{email}</span> has been re-subscribed.
                </>
              )}
            </p>
            <p className="text-gray-500 text-sm">
              You'll start receiving emails about new tracks again.
            </p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div>
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-4">Error</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <p className="text-gray-500 text-sm">
              If you continue to have issues, please contact support.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <a
            href="https://www.thebackstage.app"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Visit thebackstage.app
          </a>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">The Backstage</h1>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
