/**
 * Upgrade Page
 *
 * Two-step upgrade flow:
 * 1. Plan selection
 * 2. Payment instructions
 *
 * Clean Architecture: Presentation layer (orchestrates components, minimal logic).
 * SOLID Principles:
 * - SRP: Delegates to specialized components (PlanCard, PaymentInstructions)
 * - OCP: Easy to extend with new payment methods or plans
 * - DIP: Depends on hooks abstraction (usePricingPlans)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { PATHS } from '@/lib/paths';
import { usePricingPlans, getYearlyDiscountPercentage, type PlanWithCalculatedPrice } from '@/hooks/usePricingPlans';
import PlanCard from '@/components/upgrade/PlanCard';
import PaymentInstructions from '@/components/upgrade/PaymentInstructions';

interface SelectedPlan {
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  contacts: number;
  emails: number | string;
}

export default function UpgradePage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);

  // Get plans with calculated prices from hook
  const plans = usePricingPlans(billingPeriod);
  const discountPercentage = getYearlyDiscountPercentage();

  const handleSelectPlan = (plan: PlanWithCalculatedPrice) => {
    setSelectedPlan({
      name: plan.name,
      price: plan.calculatedPrice,
      period: billingPeriod,
      contacts: plan.contacts,
      emails: plan.emails,
    });
    setStep(2);
  };

  const toggleBillingPeriod = () => {
    setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly');
  };

  const isYearly = billingPeriod === 'yearly';

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1c1c1c] selection:bg-[#FF5500] selection:text-white overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-aurora-light"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
        {/* Back Link */}
        {step === 1 ? (
          <Link
            href={PATHS.DASHBOARD.ROOT}
            className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-[#FF5500] transition-colors mb-4 group"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Volver al Dashboard
          </Link>
        ) : (
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-[#FF5500] transition-colors mb-4 group"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Volver a Planes
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                step === 1 ? 'bg-[#FF5500] text-white' : 'bg-green-500 text-white'
              }`}
            >
              {step === 1 ? '1' : <Check className="w-3 h-3" />}
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                step === 2 ? 'bg-[#FF5500] text-white' : 'bg-gray-300 text-gray-500'
              }`}
            >
              2
            </div>
          </div>

          {/* Title and Description */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 1 ? 'Elige tu Plan' : 'Completa el Pago'}
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            {step === 1
              ? 'Selecciona el plan perfecto para tu negocio musical'
              : 'Sigue las instrucciones para activar tu plan'}
          </p>

          {/* Billing Period Toggle - Only in Step 1 */}
          {step === 1 && (
            <div className="flex justify-center items-center gap-3 mb-4">
              <span
                className={`text-sm transition-all ${
                  billingPeriod === 'monthly'
                    ? 'font-semibold text-gray-900'
                    : 'text-gray-500'
                }`}
              >
                Mensual
              </span>

              <button
                onClick={toggleBillingPeriod}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:ring-offset-2"
                style={{
                  backgroundColor: isYearly ? '#FF5500' : '#d1d5db',
                }}
                aria-label="Toggle billing period"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              <span
                className={`text-sm transition-all ${
                  isYearly ? 'font-semibold text-gray-900' : 'text-gray-500'
                }`}
              >
                Anual
              </span>

              {isYearly && (
                <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800">
                  Ahorra {discountPercentage}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Step 1: Plan Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billingPeriod={billingPeriod}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        )}

        {/* Step 2: Payment Instructions */}
        {step === 2 && selectedPlan && (
          <PaymentInstructions selectedPlan={selectedPlan} />
        )}
      </div>
    </div>
  );
}
