'use client';

import { useState, useMemo } from 'react';
import { Mail, Shield, Calendar, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { USER_ROLES } from '@/domain/types/user-roles';
import DataTableFilters, { FilterDefinition, ActiveFilters } from '@/components/dashboard/DataTableFilters';

interface UserQuota {
  emailsSentToday: number;
  monthlyLimit: number;
  remaining: number;
  lastResetDate: string;
}

interface UserData {
  id: number;
  email: string;
  role: 'user' | 'admin';
  active: boolean;
  createdAt: string;
  quota: UserQuota | null;
}

interface UserTableProps {
  users: UserData[];
  onRefresh: () => void;
}

/**
 * User Table Filter Definitions
 */
const USER_TABLE_FILTERS: FilterDefinition[] = [
  {
    key: 'role',
    label: 'Role',
    type: 'select',
    options: [
      { label: 'Admin', value: USER_ROLES.ADMIN },
      { label: 'Artist', value: USER_ROLES.ARTIST },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
  {
    key: 'quotaUsage',
    label: 'Quota Usage',
    type: 'select',
    options: [
      { label: 'Over Limit', value: 'over' },
      { label: 'Near Limit (>80%)', value: 'near' },
      { label: 'Normal', value: 'normal' },
    ],
  },
];

export default function UserTable({ users, onRefresh }: UserTableProps) {
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [newQuota, setNewQuota] = useState<string>('');
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});

  const handleEditQuota = (user: UserData) => {
    setEditingUserId(user.id);
    setNewQuota(user.quota?.monthlyLimit.toString() || '50');
    setError(null);
  };

  const handleSaveQuota = async (userId: number) => {
    try {
      setLoading(userId);
      setError(null);

      const monthlyLimit = parseInt(newQuota, 10);

      if (isNaN(monthlyLimit) || monthlyLimit <= 0 || monthlyLimit > 10000) {
        throw new Error('Quota must be between 1 and 10,000');
      }

      const response = await fetch(`/api/admin/users/${userId}/quota`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyLimit }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quota');
      }

      setEditingUserId(null);
      onRefresh();
    } catch (err) {
      console.error('Save quota error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update quota');
    } finally {
      setLoading(null);
    }
  };

  const handleToggleActive = async (userId: number, currentActive: boolean) => {
    const confirmed = confirm(
      `Are you sure you want to ${currentActive ? 'deactivate' : 'activate'} this user?`
    );

    if (!confirmed) return;

    try {
      setLoading(userId);
      setError(null);

      const response = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle user status');
      }

      onRefresh();
    } catch (err) {
      console.error('Toggle active error:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle user status');
    } finally {
      setLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setNewQuota('');
    setError(null);
  };

  /**
   * Filter Predicates
   * Defines how to apply filters to user data
   */
  const filterPredicates: Record<string, (user: UserData, value: string | string[]) => boolean> = {
    role: (user, value) => {
      return user.role === value;
    },
    status: (user, value) => {
      if (value === 'active') {
        return user.active === true;
      } else if (value === 'inactive') {
        return user.active === false;
      }
      return true;
    },
    quotaUsage: (user, value) => {
      if (!user.quota) return value === 'normal';

      const usagePercentage = (user.quota.emailsSentToday / user.quota.monthlyLimit) * 100;

      if (value === 'over') {
        return user.quota.emailsSentToday >= user.quota.monthlyLimit;
      } else if (value === 'near') {
        return usagePercentage > 80 && usagePercentage < 100;
      } else if (value === 'normal') {
        return usagePercentage <= 80;
      }
      return true;
    },
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key: string, value: string | string[] | null) => {
    const newFilters = { ...activeFilters };

    if (value === null) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    setActiveFilters(newFilters);
  };

  /**
   * Apply filters to user data
   */
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Apply all active filters (AND logic)
    if (Object.keys(activeFilters).length > 0) {
      result = result.filter((user) => {
        return Object.entries(activeFilters).every(([key, value]) => {
          const predicate = filterPredicates[key];
          if (!predicate) return true;
          return predicate(user, value);
        });
      });
    }

    return result;
  }, [users, activeFilters]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <DataTableFilters
        filters={USER_TABLE_FILTERS}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        totalCount={users.length}
        filteredCount={filteredUsers.length}
      />

      {/* Table */}
      <div className="w-full bg-card backdrop-blur-xl rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-black/[0.02] dark:shadow-white/[0.02] flex flex-col">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800/40 p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
            <Button
              onClick={() => setError(null)}
              variant="ghost"
              size="xs"
              className="ml-auto text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              Dismiss
            </Button>
          </div>
        )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-8 py-5 text-left text-[11px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                User Account
              </th>
              <th className="px-8 py-5 text-left text-[11px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                Role
              </th>
              <th className="px-8 py-5 text-left text-[11px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                Quota Usage
              </th>
              <th className="px-8 py-5 text-left text-[11px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                Monthly Limit
              </th>
              <th className="px-8 py-5 text-left text-[11px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                Status
              </th>
              <th className="px-8 py-5 text-right text-[11px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className={`group transition-colors duration-300 hover:bg-muted/40 ${!user.active ? 'opacity-60' : ''}`}
              >
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <div className="text-sm font-bold text-foreground">{user.email}</div>
                    <div className="text-[10px] font-mono text-foreground/40">ID: {user.id}</div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.role === USER_ROLES.ADMIN
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : 'bg-secondary text-foreground/50'
                    }`}
                  >
                    {user.role === USER_ROLES.ADMIN && <Shield className="w-3 h-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                     <Mail className="w-4 h-4 text-foreground/30" />
                     {user.quota ? user.quota.emailsSentToday.toLocaleString() : '-'}
                  </div>
                </td>
                <td className="px-8 py-5">
                  {editingUserId === user.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newQuota}
                        onChange={(e) => setNewQuota(e.target.value)}
                        min="1"
                        max="10000"
                        className="w-24 px-3 py-1.5 border border-primary/30 rounded-lg text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                        disabled={loading === user.id}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveQuota(user.id)}
                        disabled={loading === user.id}
                        className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90"
                      >
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading === user.id}
                        className="p-1.5 bg-secondary text-foreground/50 rounded-lg hover:bg-secondary/80"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-foreground/50">{user.quota?.monthlyLimit.toLocaleString() || '-'}</span>
                  )}
                </td>
                <td className="px-8 py-5">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    user.active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {user.active ? 'Active' : 'Inactive'}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  {editingUserId !== user.id && (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleEditQuota(user)}
                        disabled={loading === user.id}
                        variant="secondary"
                        size="xs"
                      >
                        Edit Limit
                      </Button>
                      <Button
                        onClick={() => handleToggleActive(user.id, user.active)}
                        disabled={loading === user.id}
                        variant={user.active ? 'danger' : 'primary'}
                        size="xs"
                      >
                        {user.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-foreground/40">
            <p className="font-serif italic">
              {users.length === 0 ? 'No users found.' : 'No users match the selected filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
