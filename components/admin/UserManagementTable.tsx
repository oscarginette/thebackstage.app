'use client';

import { useState } from 'react';
import { UserCheck, Mail, Calendar, Users, Shield } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import DataTable from '@/components/dashboard/DataTable';
import ActivateSubscriptionModal from './ActivateSubscriptionModal';
import { useActivateSubscription } from '@/hooks/useActivateSubscription';
import { SUBSCRIPTION_PLANS } from '@/domain/types/subscriptions';
import { USER_ROLES } from '@/domain/types/user-roles';

interface UserQuota {
  emailsSentToday: number;
  monthlyLimit: number;
  remaining: number;
  lastResetDate: string;
}

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
  quota: UserQuota | null;
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);

  // Inline editing state
  const [editingQuotaUserId, setEditingQuotaUserId] = useState<number | null>(null);
  const [editingQuotaValue, setEditingQuotaValue] = useState<number>(0);

  // Use custom hook for activation logic
  const { activate, loading: activating } = useActivateSubscription();

  // Handle bulk activation
  const handleActivateSubscription = async (plan: string, billingCycle: 'monthly' | 'annual', durationMonths: number) => {
    try {
      const result = await activate({
        userIds: selectedUsers,
        plan,
        billingCycle,
        durationMonths,
      });

      if (result.success) {
        setToast({
          message: `Successfully activated ${result.activatedCount} user(s) with ${plan} plan`,
          type: 'success',
        });

        setSelectedUsers([]);
        setShowActivationModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Bulk activation error:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to activate users',
        type: 'error',
      });
    }
  };

  // Handle quota inline editing
  const handleQuotaDoubleClick = (userId: number, currentQuota: number) => {
    setEditingQuotaUserId(userId);
    setEditingQuotaValue(currentQuota);
  };

  const handleQuotaSave = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/quota`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyQuota: editingQuotaValue }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quota');
      }

      setToast({
        message: 'Quota updated successfully',
        type: 'success',
      });

      setEditingQuotaUserId(null);
      onRefresh();
    } catch (err) {
      console.error('Update quota error:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to update quota',
        type: 'error',
      });
    }
  };

  const handleQuotaCancel = () => {
    setEditingQuotaUserId(null);
    setEditingQuotaValue(0);
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
               {user.role === USER_ROLES.ADMIN && (
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
      className: 'w-28 flex-none',
      accessor: (user: UserData) => (
        <span
          className={`px-3 py-1 inline-flex text-[10px] uppercase tracking-wider font-bold rounded-full ${
            user.subscriptionPlan === SUBSCRIPTION_PLANS.UNLIMITED
              ? 'bg-purple-100 text-purple-700'
              : user.subscriptionPlan === SUBSCRIPTION_PLANS.BUSINESS
              ? 'bg-blue-100 text-blue-700'
              : user.subscriptionPlan === SUBSCRIPTION_PLANS.PRO
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
      accessor: (user: UserData) => {
        const isEditing = editingQuotaUserId === user.id;

        return isEditing ? (
          <input
            type="number"
            value={editingQuotaValue}
            onChange={(e) => setEditingQuotaValue(parseInt(e.target.value) || 0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuotaSave(user.id);
              if (e.key === 'Escape') handleQuotaCancel();
            }}
            onBlur={() => handleQuotaCancel()}
            autoFocus
            className="w-28 px-3 py-1 border-2 border-[#FF5500] rounded-lg text-sm font-semibold focus:outline-none"
          />
        ) : (
          <div
            onDoubleClick={() => handleQuotaDoubleClick(user.id, user.monthlyQuota)}
            className="flex items-center gap-2 text-sm text-[#1c1c1c] font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
            title="Double-click to edit"
          >
            <Mail className="w-4 h-4 text-gray-400" />
            {user.monthlyQuota.toLocaleString()}
            <span className="text-xs text-gray-400 font-normal">/mo</span>
          </div>
        );
      },
    },
    {
      header: 'Email Usage',
      className: 'flex-1 min-w-[180px]',
      accessor: (user: UserData) => {
        if (!user.quota) {
          return <span className="text-xs text-gray-400">No data</span>;
        }

        const sent = user.quota.emailsSentToday;
        const limit = user.quota.monthlyLimit;
        const percentage = limit > 0 ? Math.round((sent / limit) * 100) : 0;
        const resetDate = new Date(user.quota.lastResetDate);
        const isWarning = percentage >= 80;
        const isDanger = percentage >= 95;

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#1c1c1c]">
                {sent.toLocaleString()} / {limit.toLocaleString()}
              </span>
              <span className={`text-[10px] font-bold ${
                isDanger ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-gray-500'
              }`}>
                ({percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isDanger ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400">
              Resets {resetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Activated',
      className: 'flex-1 min-w-[120px]',
      accessor: (user: UserData) => (
        <div className="text-xs text-gray-500">
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
        <div className="text-xs text-gray-500">
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
      className: 'w-32 flex-none pr-4',
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
          loading={activating}
        />
      )}
    </div>
  );
}
