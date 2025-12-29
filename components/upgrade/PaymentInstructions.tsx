/**
 * PaymentInstructions Component
 *
 * Displays payment instructions for PayPal and WhatsApp confirmation.
 * Follows SRP: Only responsible for displaying payment instructions.
 *
 * Clean Architecture: Presentation component (UI only).
 */

import { useState } from 'react';
import { Mail, MessageCircle, Copy, Check } from 'lucide-react';

interface SelectedPlan {
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  contacts: number;
  emails: number | string;
}

interface PaymentInstructionsProps {
  selectedPlan: SelectedPlan;
}

const PAYPAL_EMAIL = 'geebeat@hotmail.com';
const WHATSAPP_NUMBER = '+34 690 862 313';
const WHATSAPP_LINK = 'https://wa.me/34690862313';
const COPY_FEEDBACK_DURATION_MS = 2000;

export default function PaymentInstructions({ selectedPlan }: PaymentInstructionsProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopyText = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    setTimeout(() => setCopiedText(null), COPY_FEEDBACK_DURATION_MS);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Plan Summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border-2 border-[#FF5500]">
          <h2 className="text-sm font-bold text-gray-900 mb-3">
            Plan: {selectedPlan.name}
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">Precio</p>
              <p className="text-lg font-bold text-[#FF5500]">
                €{selectedPlan.price.toFixed(2)}/
                {selectedPlan.period === 'yearly' ? 'año' : 'mes'}
              </p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">Contactos</p>
              <p className="text-sm font-semibold text-gray-900">
                {selectedPlan.contacts.toLocaleString()}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">Emails/mes</p>
              <p className="text-sm font-semibold text-gray-900">
                {typeof selectedPlan.emails === 'number'
                  ? selectedPlan.emails.toLocaleString()
                  : selectedPlan.emails}
              </p>
            </div>
          </div>
        </div>

        {/* PayPal Payment */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border-2 border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h3 className="text-sm font-bold text-gray-900">PayPal</h3>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Envía a:</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono font-semibold text-gray-900 flex-1">
                  {PAYPAL_EMAIL}
                </p>
                <button
                  onClick={() => handleCopyText(PAYPAL_EMAIL, 'email')}
                  className="px-2 py-1 bg-[#FF5500] text-white rounded text-xs hover:bg-[#E54D00] transition-colors"
                >
                  {copiedText === 'email' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Importe:</p>
              <div className="flex items-center gap-2 bg-[#FF5500]/10 rounded-lg p-2 border border-[#FF5500]">
                <p className="text-xl font-bold text-[#FF5500] flex-1">
                  €{selectedPlan.price.toFixed(2)}
                </p>
                <button
                  onClick={() =>
                    handleCopyText(selectedPlan.price.toFixed(2), 'amount')
                  }
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                >
                  {copiedText === 'amount' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Confirmation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border-2 border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h3 className="text-sm font-bold text-gray-900">WhatsApp</h3>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Envía confirmación a:</p>
              <p className="text-sm font-mono font-semibold text-gray-900">
                {WHATSAPP_NUMBER}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-700 mb-2 font-medium">Incluye:</p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-start gap-1">
                  <span className="text-[#FF5500]">•</span>
                  <span>ID transacción PayPal</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-[#FF5500]">•</span>
                  <span>Tu email</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-[#FF5500]">•</span>
                  <span>Plan: {selectedPlan.name}</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-[#FF5500]">•</span>
                  <span>€{selectedPlan.price.toFixed(2)}</span>
                </li>
              </ul>
            </div>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-3 h-3" />
              Abrir WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Activation Note */}
      <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Nota:</strong> Tu plan se activará en máximo 24h tras confirmar
          por WhatsApp.
        </p>
      </div>
    </div>
  );
}
