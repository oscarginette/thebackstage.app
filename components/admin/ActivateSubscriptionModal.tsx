'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface ActivateSubscriptionModalProps {
  userCount: number;
  onClose: () => void;
  onConfirm: (plan: string, billingCycle: 'monthly' | 'annual', durationMonths: number) => void;
  loading: boolean;
}

type PlanType = 'free' | 'pro' | 'business' | 'unlimited';
type BillingCycle = 'monthly' | 'annual';

const PLAN_INFO = {
  free: {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    contacts: 100,
    emails: 500,
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    contacts: 1000,
    emails: 5000,
  },
  business: {
    name: 'Business',
    monthlyPrice: 29.99,
    annualPrice: 299.99,
    contacts: 5000,
    emails: 25000,
  },
  unlimited: {
    name: 'Unlimited',
    monthlyPrice: 49.99,
    annualPrice: 499.99,
    contacts: 10000,
    emails: 'Unlimited',
  },
};

export default function ActivateSubscriptionModal({
  userCount,
  onClose,
  onConfirm,
  loading,
}: ActivateSubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [durationMonths, setDurationMonths] = useState(1);

  const handleConfirm = () => {
    onConfirm(selectedPlan, billingCycle, durationMonths);
  };

  const planInfo = PLAN_INFO[selectedPlan];
  const price = billingCycle === 'monthly' ? planInfo.monthlyPrice : planInfo.annualPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E8E6DF] bg-gradient-to-br from-[#FF5500]/5 to-orange-50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1c1c1c]">Activate Subscription</h2>
              <p className="text-sm text-gray-600 mt-1">
                Activating for {userCount} user{userCount > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-bold text-[#1c1c1c] mb-3">
              Subscription Plan
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(PLAN_INFO) as PlanType[]).map((plan) => {
                const info = PLAN_INFO[plan];
                const isSelected = selectedPlan === plan;
                return (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    disabled={loading}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all text-left
                      ${isSelected
                        ? 'border-[#FF5500] bg-[#FF5500]/5'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#FF5500] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="font-bold text-[#1c1c1c] text-sm uppercase tracking-wider">
                      {info.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {info.contacts.toLocaleString()} contacts
                    </div>
                    <div className="text-xs text-gray-500">
                      {typeof info.emails === 'number' ? `${info.emails.toLocaleString()} emails/mo` : info.emails}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Billing Cycle */}
          <div>
            <label className="block text-sm font-bold text-[#1c1c1c] mb-3">
              Billing Cycle
            </label>
            <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                disabled={loading}
                className={`
                  flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all
                  ${billingCycle === 'monthly'
                    ? 'bg-white text-[#1c1c1c] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                disabled={loading}
                className={`
                  flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all
                  ${billingCycle === 'annual'
                    ? 'bg-white text-[#1c1c1c] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                Annual
                <span className="ml-1 text-xs text-emerald-600">(Save 17%)</span>
              </button>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-bold text-[#1c1c1c] mb-3">
              Duration (months)
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={durationMonths}
              onChange={(e) => setDurationMonths(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF5500] focus:outline-none transition-colors font-semibold text-[#1c1c1c]"
            />
          </div>

          {/* Price Summary */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Plan Price</span>
              <span className="font-bold text-[#1c1c1c]">
                €{price.toFixed(2)} / {billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Duration</span>
              <span className="font-bold text-[#1c1c1c]">
                {durationMonths} month{durationMonths > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Users</span>
              <span className="font-bold text-[#1c1c1c]">{userCount}</span>
            </div>
            <div className="h-px bg-gray-300 my-3"></div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1c1c1c]">Total</span>
              <span className="text-2xl font-bold text-[#FF5500]">
                €{(price * (billingCycle === 'annual' ? durationMonths / 12 : durationMonths) * userCount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E8E6DF] bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#FF5500] text-white hover:bg-[#e64d00] transition-colors shadow-lg shadow-[#FF5500]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Activating...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirm Activation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
