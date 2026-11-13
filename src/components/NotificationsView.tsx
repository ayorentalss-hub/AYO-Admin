import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  User,
  Car,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Smartphone,
  Eye,
  History,
} from 'lucide-react';
import { api } from '../api/client';
import { type UserItem } from '../types';

type TargetAudience = 'ALL' | 'HOSTS' | 'CUSTOMERS' | 'USER';

interface HistoryItem {
  id: string;
  title: string;
  message: string;
  imageUrl?: string | null;
  target: string;
  targetDescription?: string;
  recipientId?: string | null;
  recipientRole?: string;
  createdAt: string;
}

const PRESET_ROUTES = [
  { label: 'Default Home Screen', value: 'FLUTTER_NOTIFICATION_CLICK' },
  { label: 'Offers & Coupons (/coupons)', value: 'APP_ROUTE_COUPONS' },
  { label: 'My Bookings / Trips (/trips)', value: 'APP_ROUTE_TRIPS' },
  { label: 'Host Fleet & Vehicles (/vehicles)', value: 'APP_ROUTE_VEHICLES' },
  { label: 'KYC Verification Page (/kyc)', value: 'APP_ROUTE_KYC' },
  { label: 'Wallet & Payouts (/payouts)', value: 'APP_ROUTE_PAYOUTS' },
];

export const NotificationsView: React.FC = () => {
  // Form State
  const [target, setTarget] = useState<TargetAudience>('ALL');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('FLUTTER_NOTIFICATION_CLICK');
  const [customRoute, setCustomRoute] = useState<string>('');

  // Specific User Search & Selection
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserItem[]>([]);
  const [searchingUsers, setSearchingUsers] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Sending & Confirmation State
  const [sending, setSending] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Broadcast History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 20;

  // Search users with debounce
  useEffect(() => {
    if (target !== 'USER' || !userSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await api.getUsers(userSearchQuery.trim(), '', 1, 8);
        setSearchResults(res.items || []);
      } catch (e) {
        console.error('Failed to search users:', e);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchQuery, target]);

  // Fetch History
  const fetchHistory = async (targetPage = page) => {
    setHistoryLoading(true);
    try {
      const res = await api.getNotificationHistory(targetPage, pageSize);
      setHistory(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (e) {
      console.error('Failed to fetch notification history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  // Handle Form Submit
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusFeedback(null);

    if (!title.trim()) {
      setStatusFeedback({ type: 'error', text: 'Notification title is required.' });
      return;
    }
    if (!message.trim()) {
      setStatusFeedback({ type: 'error', text: 'Notification message body is required.' });
      return;
    }
    if (target === 'USER' && !selectedUser) {
      setStatusFeedback({ type: 'error', text: 'Please search and select a specific user.' });
      return;
    }

    setConfirmModalOpen(true);
  };

  const executeSendNotification = async () => {
    setConfirmModalOpen(false);
    setSending(true);
    setStatusFeedback(null);

    const clickAction = selectedRoute === 'CUSTOM' ? customRoute : selectedRoute;

    try {
      const res = await api.sendNotification({
        target,
        user_id: target === 'USER' ? selectedUser?.id : undefined,
        title: title.trim(),
        message: message.trim(),
        image_url: imageUrl.trim() || undefined,
        data: {
          click_action: clickAction,
          route: clickAction,
        },
      });

      setStatusFeedback({
        type: 'success',
        text: res.message || 'Push notification sent successfully!',
      });

      // Clear form on success
      setTitle('');
      setMessage('');
      setImageUrl('');
      setSelectedUser(null);
      setUserSearchQuery('');

      // Refresh history
      fetchHistory(1);
      setPage(1);
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        text: err?.message || 'Failed to dispatch notification.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleReuseHistory = (item: HistoryItem) => {
    setTitle(item.title);
    setMessage(item.message);
    setImageUrl(item.imageUrl || '');
    setStatusFeedback({
      type: 'success',
      text: `Loaded template: "${item.title}". You can modify and send it.`,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const targetLabel =
    target === 'ALL'
      ? 'All Users (Everyone)'
      : target === 'HOSTS'
      ? 'All Hosts'
      : target === 'CUSTOMERS'
      ? 'All Customers'
      : selectedUser
      ? `${selectedUser.name || selectedUser.phone} (${selectedUser.role})`
      : 'Specific User';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-red-500" />
            Push Notification Dispatcher
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Broadcast high-priority push notifications with banners and custom deep links to all users, specific roles, or individual accounts.
          </p>
        </div>
        <button
          onClick={() => fetchHistory(page)}
          disabled={historyLoading}
          className="flex items-center space-x-1.5 py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Status Feedback Banner */}
      {statusFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between transition ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
              : 'bg-red-950/40 border-red-800/40 text-red-300'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {statusFeedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="font-medium">{statusFeedback.text}</span>
          </div>
          <button
            onClick={() => setStatusFeedback(null)}
            className="text-zinc-500 hover:text-white text-base font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Grid: Composer on Left, Live Mobile Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COMPOSER FORM (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-5">
          <form onSubmit={handleInitiateSend} className="space-y-5">
            {/* 1. Target Audience Selection */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                1. Select Target Audience
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'ALL', label: 'All Users', desc: 'Everyone', icon: Users },
                  { id: 'HOSTS', label: 'Hosts Only', desc: 'Vehicle Owners', icon: Car },
                  { id: 'CUSTOMERS', label: 'Customers Only', desc: 'App Renters', icon: User },
                  { id: 'USER', label: 'Specific User', desc: 'Single Account', icon: Search },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = target === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTarget(t.id as TargetAudience);
                        if (t.id !== 'USER') {
                          setSelectedUser(null);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-red-500/10 border-red-500 text-white shadow-md shadow-red-950/40'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-red-400' : 'text-zinc-500'}`} />
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-red-500' : 'bg-transparent'}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{t.label}</p>
                        <p className="text-[10px] text-zinc-500">{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1.1 User Selector (Only when target === 'USER') */}
            {target === 'USER' && (
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <label className="block text-xs font-semibold text-zinc-300">
                  Search & Select User (Host or Customer)
                </label>

                {selectedUser ? (
                  <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-700 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 font-bold flex items-center justify-center text-xs">
                        {(selectedUser.name || selectedUser.phone || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{selectedUser.name || 'Unnamed User'}</p>
                        <p className="text-[11px] text-zinc-400">{selectedUser.phone} • {selectedUser.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {selectedUser.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                        title="Remove Selected User"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Type name, phone (+91...) or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                    />
                    {searchingUsers && (
                      <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                    )}

                    {searchResults.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl max-h-48 overflow-y-auto shadow-2xl divide-y divide-zinc-800">
                        {searchResults.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedUser(u);
                              setUserSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="p-2.5 hover:bg-zinc-800 cursor-pointer flex items-center justify-between text-xs transition"
                          >
                            <div>
                              <p className="text-white font-semibold">{u.name || 'Unnamed'}</p>
                              <p className="text-zinc-400 text-[11px]">{u.phone} • {u.email || 'No email'}</p>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                              {u.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. Notification Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  2. Notification Title *
                </label>
                <span className="text-[10px] text-zinc-500">{title.length}/60 chars</span>
              </div>
              <input
                type="text"
                required
                maxLength={60}
                placeholder="e.g. 🪔 Diwali Special 20% OFF or 🚗 Host Paper Reminder"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-medium"
              />
            </div>

            {/* 3. Notification Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  3. Message Body *
                </label>
                <span className="text-[10px] text-zinc-500">{message.length}/240 chars</span>
              </div>
              <textarea
                required
                rows={3}
                maxLength={240}
                placeholder="Write the message that users will read in their notification popup..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none leading-relaxed"
              />
            </div>

            {/* 4. Banner Image URL (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                  4. Image / Banner URL (Optional)
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    Clear Image
                  </button>
                )}
              </div>
              <input
                type="url"
                placeholder="https://images.unsplash.com/... or CDN banner link"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            {/* 5. Deep Link / Action Route */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                5. On Click Action (Screen to Open)
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              >
                {PRESET_ROUTES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
                <option value="CUSTOM">Custom Screen / Route...</option>
              </select>

              {selectedRoute === 'CUSTOM' && (
                <input
                  type="text"
                  placeholder="e.g. /promotions/weekend-deal"
                  value={customRoute}
                  onChange={(e) => setCustomRoute(e.target.value)}
                  className="mt-2 w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
                />
              )}
            </div>

            {/* Send Button */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <p className="text-[11px] text-zinc-400">
                Target: <strong className="text-white">{targetLabel}</strong>
              </p>
              <button
                type="submit"
                disabled={sending || (target === 'USER' && !selectedUser)}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 transition flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Dispatch Notification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* LIVE MOBILE PREVIEW (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                <div className="flex items-center space-x-2 text-zinc-300">
                  <Smartphone className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Live Mobile Tray Preview</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Live Sync
                </span>
              </div>

              {/* Phone Mockup Window */}
              <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-4 shadow-2xl relative overflow-hidden space-y-4">
                {/* Phone Header Bar */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pb-1 border-b border-zinc-900">
                  <span>9:41 AM</span>
                  <div className="flex items-center space-x-1.5">
                    <span>5G</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* The Push Notification Card */}
                <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-3.5 shadow-xl space-y-2.5">
                  {/* Notification App Header */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-[10px]">
                        A
                      </div>
                      <span className="font-bold text-white tracking-wide">AYO Rentals</span>
                      <span className="text-zinc-500 text-[10px]">• now</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">FCM</span>
                  </div>

                  {/* Notification Content */}
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">
                      {title.trim() || 'Enter notification title...'}
                    </p>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      {message.trim() || 'Your message body will be displayed here as it appears on customer phones.'}
                    </p>
                  </div>

                  {/* Banner Image Preview */}
                  {imageUrl.trim() && (
                    <div className="relative rounded-xl overflow-hidden border border-zinc-800 mt-2 aspect-video bg-zinc-950">
                      <img
                        src={imageUrl.trim()}
                        alt="Push Notification Banner Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Mock Action Pill */}
                  <div className="pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Tap to open:</span>
                    <span className="text-red-400 font-medium font-mono truncate max-w-[160px]">
                      {selectedRoute === 'CUSTOM' ? customRoute || '/custom' : selectedRoute}
                    </span>
                  </div>
                </div>

                <p className="text-center text-[10px] text-zinc-600">
                  Delivered via Firebase High-Priority System Tray
                </p>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-4 p-3 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 text-[11px] text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Notification Best Practices:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-400 text-[10px]">
                <li>Use emojis in titles to boost user open rates (CTR).</li>
                <li>Keep titles under 50 characters for clean 1-line display.</li>
                <li>Images should have 16:9 aspect ratio (e.g. 1200×675 px).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT NOTIFICATIONS / BROADCAST HISTORY TABLE */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2 text-white">
            <History className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold">Broadcast Campaigns & Dispatch History</h3>
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            Total Campaigns: <strong className="text-white">{totalCount}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Target Audience</th>
                <th className="py-3 px-4">Title & Message</th>
                <th className="py-3 px-4">Banner</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {historyLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading broadcast history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No broadcast notifications dispatched yet. Use the composer above to send your first message.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.target === 'ALL'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : item.target === 'HOSTS' || item.recipientRole === 'HOST'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : item.target === 'CUSTOMERS' || item.recipientRole === 'CUSTOMER'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {item.targetDescription || item.target || 'ALL'}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{item.message}</p>
                    </td>
                    <td className="py-3 px-4">
                      {item.imageUrl ? (
                        <a
                          href={item.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:underline"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>View Image</span>
                        </a>
                      ) : (
                        <span className="text-zinc-600 text-[11px]">No Banner</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        Delivered
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleReuseHistory(item)}
                        className="py-1 px-2.5 rounded-lg text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                        title="Load this message in composer"
                      >
                        Reuse Template
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalCount > 0 && (
          <div className="px-2 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} campaigns
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION SAFETY MODAL */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-500">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Broadcast Dispatch</h3>
                <p className="text-xs text-zinc-400">This will pop up on user phone screens immediately.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
              <p className="text-zinc-400">
                Target Audience: <strong className="text-white">{targetLabel}</strong>
              </p>
              <p className="text-zinc-400">
                Title: <strong className="text-white">{title}</strong>
              </p>
              <p className="text-zinc-400 line-clamp-2">
                Message: <span className="text-zinc-300">{message}</span>
              </p>
              {imageUrl && (
                <p className="text-zinc-400">
                  Banner: <span className="text-emerald-400">Image Attached</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={executeSendNotification}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30"
              >
                Yes, Dispatch Now →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
