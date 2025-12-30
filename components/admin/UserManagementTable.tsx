'use client';

import { useState } from 'react';
import { UserCheck, Mail, Calendar, Users, Shield } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import DataTable from '@/components/dashboard/DataTable';
import ActivateSubscriptionModal from './ActivateSubscriptionModal';

interface UserData {
  id: number;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  active: boolean;
  createdAt: string;
  subscriptionPlan: string;
  monthlyQuota: number;
  subscriptionStartedAt?: string;
  subscriptionExpiresAt?: string;
}

interface UserManagementTableProps {
  users: UserData[];
  onRefresh: () => void;
  loading?: boolean;
}

type PlanType = 'free' | 'pro' | 'business' | 'unlimited';

const PLAN_LIMITS = {
  free: { contacts: 100, emails: 1000 },
  pro: { contacts: 5000, emails: 10000 },
  business: { contacts: 25000, emails: 50000 },
  unlimited: { contacts: 999999999, emails: 999999999 },
};

export default function UserManagementTable({ users, onRefresh, loading }: UserManagementTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);

  // Handle bulk activation
  const handleActivateSubscription = async (plan: string, billingCycle: 'monthly' | 'annual', durationMonths: number) => {
    try {
      setActionLoading(true);

      const response = await fetch('/api/admin/users/bulk-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          plan,
          billingCycle,
          durationMonths,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate users');
      }

      const data = await response.json();

      setToast({
        message: `Successfully activated ${data.activatedCount} user(s) with ${plan} plan`,
        type: 'success',
      });

      setSelectedUsers([]);
      setShowActivationModal(false);
      onRefresh();
    } catch (err) {
      console.error('Bulk activation error:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to activate users',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = [
    {
      header: 'User',
      className: 'flex-[2] min-w-[240px]',
      accessor: (user: UserData) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF5500] to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-bold text-[#1c1c1c]">{user.email}</div>
            <div className="flex items-center gap-2">
               {user.role === 'admin' && (
                 <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                   <Shield className="w-3 h-3" /> Admin
                 </span>
               )}
               {user.name && <span className="text-xs text-gray-500">{user.name}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Plan',
      className: 'flex-1 min-w-[120px]',
      accessor: (user: UserData) => (
        <span
          className={`px-3 py-1 inline-flex text-[10px] uppercase tracking-wider font-bold rounded-full ${
            user.subscriptionPlan === 'unlimited'
              ? 'bg-purple-100 text-purple-700'
              : user.subscriptionPlan === 'business'
              ? 'bg-blue-100 text-blue-700'
              : user.subscriptionPlan === 'pro'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {user.subscriptionPlan}
        </span>
      ),
    },
    {
      header: 'Quota',
      className: 'flex-1 min-w-[140px]',
      accessor: (user: UserData) => (
        <div className="flex items-center gap-2 text-sm text-[#1c1c1c] font-medium">
          <Mail className="w-4 h-4 text-gray-400" />
          {user.monthlyQuota.toLocaleString()}
          <span className="text-xs text-gray-400 font-normal">/mo</span>
        </div>
      ),
    },
    {
      header: 'Activated',
      className: 'flex-1 min-w-[120px]',
      accessor: (user: UserData) => (
        <div className="text-sm text-gray-500">
          {user.subscriptionStartedAt ? formatDate(user.subscriptionStartedAt) : (
            <span className="text-xs text-gray-400">Never</span>
          )}
        </div>
      ),
    },
    {
      header: 'Expires',
      className: 'flex-1 min-w-[120px]',
      accessor: (user: UserData) => (
        <div className="text-sm text-gray-500">
          {user.subscriptionExpiresAt ? (
            <span className={new Date(user.subscriptionExpiresAt) < new Date() ? 'text-red-600 font-semibold' : ''}>
              {formatDate(user.subscriptionExpiresAt)}
            </span>
          ) : (
            <span className="text-xs text-emerald-600 font-semibold">Active</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      className: 'w-32 flex-none',
      accessor: (user: UserData) => (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
          user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {user.active ? 'Active' : 'Inactive'}
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        searchFields={(user) => `${user.email} ${user.name || ''}`}
        searchPlaceholder="Search users..."
        emptyMessage="No users found matching your search."
        emptyIcon={<Users className="w-16 h-16 text-gray-300" />}
        selectable={true}
        getItemId={(user) => user.id}
        selectedIds={selectedUsers}
        onSelectionChange={setSelectedUsers}
        actions={
          <button
            onClick={() => setShowActivationModal(true)}
            disabled={selectedUsers.length === 0}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-lg
              ${selectedUsers.length > 0
                ? 'bg-[#FF5500] text-white hover:bg-[#e64d00] shadow-[#FF5500]/20'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              }
            `}
          >
            <UserCheck className="w-4 h-4" />
            Activate ({selectedUsers.length})
          </button>
        }
      />

      {/* Activation Modal */}
      {showActivationModal && (
        <ActivateSubscriptionModal
          userCount={selectedUsers.length}
          onClose={() => setShowActivationModal(false)}
          onConfirm={handleActivateSubscription}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
