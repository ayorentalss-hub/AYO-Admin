import React, { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Ban, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import type { UserItem } from '../types';
import { api } from '../api/client';
import { HostKycModal } from './HostKycModal';
import { ConfirmModal, NotificationModal, type ToastNotification } from './Modal';

export const UsersView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'HOST' | 'CUSTOMER'>('ALL');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Modals state
  const [selectedHostKycId, setSelectedHostKycId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'success' | 'primary';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    action: async () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers(searchQuery, roleFilter, page, 20);
      setUsers(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const notify = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ isOpen: true, type, title, message });
  };

  const handleStatusChange = (user: UserItem, action: 'activate' | 'suspend' | 'block') => {
    const actionLabel = action === 'activate' ? 'Activate' : action === 'suspend' ? 'Suspend' : 'Block';
    const variant = action === 'activate' ? 'success' : action === 'suspend' ? 'warning' : 'danger';
    setConfirmState({
      isOpen: true,
      title: `${actionLabel} User Account`,
      message: `Are you sure you want to ${action} user ${user.name || user.phone}? ${
        action === 'block' ? 'This will cancel any pending trips and freeze inventory listings.' : ''
      }`,
      confirmText: actionLabel,
      variant,
      action: async () => {
        try {
          setConfirmLoading(true);
          await api.setUserStatus(user.id, action);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          notify('success', 'User Status Updated', `User ${user.name || user.phone} is now ${action}d.`);
          fetchUsers();
        } catch (err: any) {
          notify('error', 'Status Change Failed', err.message);
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  const totalPages = Math.ceil(total / 20) || 1;

  const getUserDisplayName = (u: UserItem) => {
    if (u.name && u.name.trim()) return u.name.trim();
    if (u.first_name || u.last_name) return `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return 'No Name Provided';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Users & Host KYC Moderation</h2>
          <p className="text-xs text-slate-400 mt-1">
            Search registered customers and hosts, inspect verified KYC documents, moderate accounts.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center space-x-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phone, email, name..."
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 w-56 font-mono"
            />
          </form>

          <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            {(['ALL', 'HOST', 'CUSTOMER'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRoleFilter(r);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  roleFilter === r
                    ? 'bg-red-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r === 'HOST' ? 'Hosts Only' : 'Customers'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">User / Contact</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5">Host KYC & Documents</th>
                <th className="px-5 py-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isHost = u.role === 'HOST';
                  const displayName = getUserDisplayName(u);
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      {/* Name & Phone */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-2xl bg-slate-800 text-slate-200 font-bold flex items-center justify-center border border-slate-700 shadow-sm flex-shrink-0">
                            {displayName[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-[13px] tracking-tight">{displayName}</p>
                            <p className="text-slate-400 font-mono text-[11px]">{u.phone}</p>
                            {u.email && <p className="text-slate-500 text-[10px]">{u.email}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            u.role === 'HOST'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : u.role === 'ADMIN'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                              : u.status === 'SUSPENDED'
                              ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                              : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      {/* Host KYC & Inspection Button */}
                      <td className="px-5 py-4">
                        {isHost ? (
                          <div className="flex items-center space-x-2.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                u.kyc_status === 'VERIFIED'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : u.kyc_status === 'FAILED' || u.kyc_status === 'REJECTED'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {u.kyc_status || 'PENDING'}
                            </span>

                            <button
                              onClick={() => setSelectedHostKycId(u.id)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition flex items-center space-x-1.5 shadow-sm"
                            >
                              <FileText className="w-3.5 h-3.5 text-purple-400" />
                              <span>View Docs</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px]">Not Applicable</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {u.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleStatusChange(u, 'activate')}
                              className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition"
                              title="Activate User"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}

                          {u.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleStatusChange(u, 'suspend')}
                              className="p-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg transition"
                              title="Suspend User"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}

                          {u.status !== 'BLOCKED' && (
                            <button
                              onClick={() => handleStatusChange(u, 'block')}
                              className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                              title="Block User (Revoke Access)"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {users.length > 0 ? (page - 1) * 20 + 1 : 0} to {Math.min(page * 20, total)} of {total} registered users
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-white px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Host KYC Inspection Modal */}
      <HostKycModal
        hostId={selectedHostKycId}
        onClose={() => setSelectedHostKycId(null)}
        onRefresh={fetchUsers}
        onNotify={notify}
      />

      {/* Sleek Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        loading={confirmLoading}
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Notification Modal */}
      <NotificationModal toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
