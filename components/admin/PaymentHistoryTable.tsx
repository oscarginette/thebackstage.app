/**
 * PaymentHistoryTable Component
 *
 * Admin component for viewing payment history with filters and pagination.
 * Displays both Stripe payments and manual payments.
 *
 * Clean Architecture: Client component with API orchestration.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, DollarSign, Calendar, Filter, Download } from 'lucide-react';
import Toast from '@/components/ui/Toast';

interface PaymentHistoryEntry {
  id: string;
  customer_id: number;
  customer_email: string;
  customer_name: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  paid: boolean;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_notes: string | null;
  manually_created: boolean;
  created_by_admin_email: string | null;
  created_by_admin_name: string | null;
  billing_reason: string | null;
  subscription_id: string | null;
  created: string;
  description: string | null;
}

interface PaymentHistoryTableProps {
  onAddPayment?: () => void;
}

export default function PaymentHistoryTable({ onAddPayment }: PaymentHistoryTableProps) {
  const [payments, setPayments] = useState<PaymentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterManual, setFilterManual] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch payment history
  const fetchPayments = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (filterMethod !== 'all') {
        params.append('payment_method', filterMethod);
      }

      if (filterManual === 'manual') {
        params.append('manually_created', 'true');
      } else if (filterManual === 'stripe') {
        params.append('manually_created', 'false');
      }

      const response = await fetch(`/api/admin/payments?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();

      setPayments(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setToast({ message: 'Failed to load payment history', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchPayments();
  }, [page, filterMethod, filterManual]);

  // Filter payments by search term
  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments;

    const term = searchTerm.toLowerCase();
    return payments.filter(
      (payment) =>
        payment.customer_email.toLowerCase().includes(term) ||
        payment.customer_name?.toLowerCase().includes(term) ||
        payment.payment_reference?.toLowerCase().includes(term) ||
        payment.id.toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  // Format amount in EUR
  const formatAmount = (amountInCents: number, currency: string) => {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get payment method badge
  const getPaymentMethodBadge = (payment: PaymentHistoryEntry) => {
    if (payment.manually_created) {
      const method = payment.payment_method || 'manual';
      const colors: Record<string, string> = {
        bank_transfer: 'bg-blue-100 text-blue-800',
        paypal: 'bg-purple-100 text-purple-800',
        cash: 'bg-green-100 text-green-800',
        crypto: 'bg-orange-100 text-orange-800',
        other: 'bg-gray-100 text-gray-800',
      };
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${colors[method] || colors.other}`}>
          {method.replace('_', ' ').toUpperCase()}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
        STRIPE
      </span>
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      open: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
      void: 'bg-red-100 text-red-800',
      uncollectible: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.draft}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
          <p className="text-sm text-gray-600 mt-1">
            Total: {total} payments
          </p>
        </div>
        {onAddPayment && (
          <button
            onClick={onAddPayment}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <DollarSign size={18} />
            Add Manual Payment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by email, name, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Payment Methods</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="cash">Cash</option>
              <option value="crypto">Crypto</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Manual/Stripe Filter */}
          <div>
            <select
              value={filterManual}
              onChange={(e) => setFilterManual(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Sources</option>
              <option value="manual">Manual Only</option>
              <option value="stripe">Stripe Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.customer_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{payment.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatAmount(payment.amount_paid, payment.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentMethodBadge(payment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(payment.paid_at)}</div>
                      <div className="text-xs text-gray-500">
                        Created: {formatDate(payment.created)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {payment.payment_reference || payment.id}
                      </div>
                      {payment.payment_notes && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={payment.payment_notes}>
                          {payment.payment_notes}
                        </div>
                      )}
                      {payment.manually_created && payment.created_by_admin_email && (
                        <div className="text-xs text-indigo-600 mt-1">
                          by {payment.created_by_admin_email}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
