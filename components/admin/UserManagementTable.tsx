/**
 * UserManagementTable Component
 *
 * Admin component for bulk user management and plan activation.
 * Provides search, filtering, and bulk plan assignment.
 *
 * Clean Architecture: Client component with API orchestration.
 */

'use client';

import { useState, useMemo } from 'react';
import { Search, Users, Calendar, Mail, UserCheck } from 'lucide-react';
import Toast from '@/components/ui/Toast';

interface UserData {
  id: number;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  active: boolean;
  createdAt: string;
  subscriptionPlan: string;
  monthlyQuota: number;
}

interface UserManagementTableProps {
  users: UserData[];
  onRefresh: () => void;
}

type PlanType = 'free' | 'pro' | 'business' | 'unlimited';

const PLAN_LIMITS = {
  free: { contacts: 100, emails: 1000 },
  pro: { contacts: 5000, emails: 10000 },
  business: { contacts: 25000, emails: 50000 },
  unlimited: { contacts: 999999999, emails: 999999999 },
};

export default function UserManagementTable({ users, onRefresh }: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [durationMonths, setDurationMonths] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;

    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(term) ||
        user.name?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  // Handle individual checkbox toggle
  const handleSelectUser = (userId: number, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Handle bulk activation
  const handleBulkActivate = async () => {
    if (selectedUsers.size === 0) {
      setToast({ message: 'Please select at least one user', type: 'error' });
      return;
    }

    const confirmed = confirm(
      `Activate ${selectedPlan.toUpperCase()} plan for ${selectedUsers.size} user(s) for ${durationMonths} month(s)?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const response = await fetch('/api/admin/users/bulk-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          plan: selectedPlan,
          durationMonths,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate users');
      }

      const data = await response.json();

      setToast({
        message: `Successfully activated ${data.activatedCount} user(s)`,
        type: 'success',
      });

      setSelectedUsers(new Set());
      onRefresh();
    } catch (err) {
      console.error('Bulk activation error:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to activate users',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Bulk Actions */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          {/* Search */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email or name..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#FF5500] transition-colors"
              />
            </div>
          </div>

          {/* Plan Selector */}
          <div className="w-full lg:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as PlanType)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#FF5500] transition-colors bg-white"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </div>

          {/* Duration */}
          <div className="w-full lg:w-32">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <input
              type="number"
              value={durationMonths}
              onChange={(e) => setDurationMonths(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="12"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#FF5500] transition-colors"
            />
          </div>

          {/* Activate Button */}
          <button
            onClick={handleBulkActivate}
            disabled={loading || selectedUsers.size === 0}
            className="px-6 py-3 bg-[#FF5500] text-white rounded-xl hover:bg-[#e64d00] transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            <UserCheck className="w-4 h-4" />
            {loading ? 'Activating...' : `Activate (${selectedUsers.size})`}
          </button>
        </div>

        {/* Plan Details */}
        {selectedPlan && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-sm text-blue-900">
              <span className="font-bold">{selectedPlan.toUpperCase()} Plan:</span> Up to{' '}
              {PLAN_LIMITS[selectedPlan].contacts.toLocaleString()} contacts,{' '}
              {PLAN_LIMITS[selectedPlan].emails.toLocaleString()} emails/month
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-[#FF5500] border-gray-300 rounded focus:ring-[#FF5500]"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Quota
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedUsers.has(user.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                      className="w-4 h-4 text-[#FF5500] border-gray-300 rounded focus:ring-[#FF5500]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FF5500] to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.email}
                        </div>
                        {user.name && (
                          <div className="text-xs text-gray-500">{user.name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        user.subscriptionPlan === 'unlimited'
                          ? 'bg-purple-100 text-purple-800'
                          : user.subscriptionPlan === 'business'
                          ? 'bg-blue-100 text-blue-800'
                          : user.subscriptionPlan === 'pro'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.subscriptionPlan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {user.monthlyQuota.toLocaleString()}/month
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        user.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              {searchTerm ? 'No users found matching your search' : 'No users found'}
            </p>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
