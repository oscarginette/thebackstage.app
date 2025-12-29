/**
 * PlanCard Component
 *
 * Displays a single pricing plan with features and selection button.
 * Follows SRP: Only responsible for displaying one plan.
 *
 * Clean Architecture: Presentation component (UI only, no business logic).
 */

import { Check, ArrowRight } from 'lucide-react';
import { PlanWithCalculatedPrice } from '@/hooks/usePricingPlans';

interface PlanCardProps {
  plan: PlanWithCalculatedPrice;
  billingPeriod: 'monthly' | 'yearly';
  onSelect: (plan: PlanWithCalculatedPrice) => void;
}

export default function PlanCard({ plan, billingPeriod, onSelect }: PlanCardProps) {
  const isYearly = billingPeriod === 'yearly';
  const showDiscount = isYearly && plan.basePrice > 0;

  return (
    <div
      className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 relative border-2 transition-all hover:shadow-2xl ${
        plan.popular ? 'border-[#FF5500] transform scale-105' : 'border-gray-200'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-[#FF5500] px-4 py-1 text-xs font-medium text-white">
            Más Popular
          </span>
        </div>
      )}

      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
      <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-900">
            €{plan.calculatedPrice.toFixed(2)}
          </span>
          <span className="ml-2 text-gray-500">/{isYearly ? 'año' : 'mes'}</span>
        </div>

        {showDiscount && (
          <p className="mt-2 text-sm text-green-600 font-medium">Ahorra 20%</p>
        )}
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan)}
        className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
          plan.popular
            ? 'bg-[#FF5500] text-white hover:bg-[#E54D00]'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        Seleccionar Plan
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
