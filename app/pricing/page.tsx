'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Price {
  id: string;
  amount: number;
  currency: string;
  formatted: string;
  discountPercentage?: number;
  savingsEur?: number;
  monthlyEquivalent?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  features: Array<{ name: string }>;
  limits: {
    maxContacts: number;
    maxMonthlyEmails: number | null;
    maxActiveGates: number;
  };
  pricing: {
    monthly: Price | null;
    yearly: Price | null;
  };
  tier: number;
  active: boolean;
}

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const response = await fetch('/api/products');

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Choose the perfect plan for your music business
          </p>

          {/* Billing Period Toggle */}
          <div className="flex justify-center items-center gap-4">
            <span
              className={`text-sm transition-all ${
                billingPeriod === 'monthly'
                  ? 'font-semibold text-gray-900 dark:text-white'
                  : 'text-gray-500'
              }`}
            >
              Monthly
            </span>

            <button
              onClick={() =>
                setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')
              }
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{
                backgroundColor: billingPeriod === 'yearly' ? '#3b82f6' : '#d1d5db',
              }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>

            <span
              className={`text-sm transition-all ${
                billingPeriod === 'yearly'
                  ? 'font-semibold text-gray-900 dark:text-white'
                  : 'text-gray-500'
              }`}
            >
              Yearly
            </span>

            {billingPeriod === 'yearly' && (
              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading pricing...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <PricingCard
                key={product.id}
                product={product}
                billingPeriod={billingPeriod}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PricingCard({
  product,
  billingPeriod,
}: {
  product: Product;
  billingPeriod: 'monthly' | 'yearly';
}) {
  const pricing = product.pricing[billingPeriod];
  const isFree = product.name.toLowerCase() === 'free';
  const isPopular = product.name.toLowerCase() === 'pro';

  if (!pricing) {
    return null;
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 relative ${
        isPopular ? 'ring-2 ring-blue-500 transform scale-105' : ''
      }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-blue-600 px-4 py-1 text-xs font-medium text-white">
            Most Popular
          </span>
        </div>
      )}

      {/* Plan Name */}
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {product.name}
      </h3>

      {/* Pricing */}
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">
            €{pricing.amount.toFixed(2)}
          </span>
          <span className="ml-2 text-gray-500">
            /{billingPeriod === 'yearly' ? 'year' : 'month'}
          </span>
        </div>

        {/* Yearly Savings */}
        {billingPeriod === 'yearly' && !isFree && pricing.savingsEur && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-green-600 font-medium">
              Save €{pricing.savingsEur.toFixed(2)}/year ({pricing.discountPercentage}%
              off)
            </p>
            {pricing.monthlyEquivalent && (
              <p className="text-xs text-gray-500">{pricing.monthlyEquivalent}</p>
            )}
          </div>
        )}
      </div>

      {/* Limits */}
      <div className="mb-6 space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">
            {product.limits.maxContacts.toLocaleString()}
          </span>{' '}
          contacts
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">
            {product.limits.maxMonthlyEmails === null
              ? 'Unlimited'
              : product.limits.maxMonthlyEmails.toLocaleString()}
          </span>{' '}
          emails/month
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">Unlimited</span> download gates
        </p>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6">
        {product.features.map((feature, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
          >
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
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
            <span>{feature.name}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Link
        href="/signup"
        className={`block w-full text-center px-4 py-3 rounded-lg font-medium transition-colors ${
          isPopular
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}
