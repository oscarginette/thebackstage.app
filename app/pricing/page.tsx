/**
 * Public Pricing Page
 *
 * Displays pricing plans for users to choose from.
 * Clean Architecture: Fetches from API route, no direct DB access.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Zap, ArrowRight } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: 'month' | 'year';
  currency: string;
  features: string[];
  limits: {
    gates: number | 'unlimited';
    contacts: number;
    emailsPerMonth: number;
  };
  highlighted: boolean;
  badge?: string;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pricing');

      if (!response.ok) {
        throw new Error('Failed to fetch pricing');
      }

      const data = await response.json();
      setPlans(data.plans);
    } catch (err) {
      console.error('Error fetching pricing:', err);
      setError('Failed to load pricing plans. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDFCF9] via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-gray-200 border-t-[#FF5500] animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDFCF9] via-white to-blue-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl font-bold">!</span>
          </div>
          <h3 className="text-xl font-bold text-red-900 mb-2">Error Loading Pricing</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={fetchPricing}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCF9] via-white to-blue-50 py-16 px-4 sm:px-6 lg:px-8">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF5500]/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[150px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF5500]/10 rounded-full mb-6">
            <Zap className="w-4 h-4 text-[#FF5500]" />
            <span className="text-xs font-bold text-[#FF5500] uppercase tracking-wider">
              Simple, Transparent Pricing
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6">
            Choose Your Plan
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            All plans include unlimited download gates. Scale your audience with the plan that fits your needs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/60 backdrop-blur-xl rounded-3xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                plan.highlighted
                  ? 'border-[#FF5500] shadow-xl shadow-[#FF5500]/10'
                  : 'border-gray-200 shadow-lg'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1.5 bg-gradient-to-r from-[#FF5500] to-orange-600 text-white text-xs font-bold rounded-full shadow-lg">
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600">/{plan.billingPeriod}</span>
                  </div>
                </div>

                {/* Limits Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contacts:</span>
                      <span className="font-bold text-gray-900">
                        {plan.limits.contacts.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Emails/month:</span>
                      <span className="font-bold text-gray-900">
                        {plan.limits.emailsPerMonth.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  href="/auth/signup"
                  className={`block w-full py-4 rounded-xl font-bold text-center transition-all ${
                    plan.highlighted
                      ? 'bg-[#FF5500] text-white hover:bg-[#e64d00] shadow-lg shadow-[#FF5500]/20'
                      : 'bg-gray-900 text-white hover:bg-black'
                  }`}
                >
                  Get Started
                  <ArrowRight className="inline-block w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border-2 border-gray-200 p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            All plans include unlimited download gates
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            The main difference between plans is the number of contacts you can manage and emails you can send per month.
            Create as many download gates as you need on any plan.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-[#FF5500] text-white rounded-xl hover:bg-[#e64d00] transition-colors font-bold shadow-lg"
            >
              Start Free Trial
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors font-bold"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
