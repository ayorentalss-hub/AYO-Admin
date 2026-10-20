import React from 'react';
import { LayoutDashboard, Car, Users, Navigation, CreditCard, X, Shield, Settings } from 'lucide-react';

export type TabType = 'dashboard' | 'vehicles' | 'users' | 'trips' | 'payouts' | 'audit' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingCount = 0,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Financial Ledger',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'vehicles' as TabType,
      label: 'Fleet & Approvals',
      icon: Car,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'users' as TabType,
      label: 'Users & Host KYC',
      icon: Users,
      badge: null,
    },
    {
      id: 'trips' as TabType,
      label: 'Trips & Monitoring',
      icon: Navigation,
      badge: null,
    },
    {
      id: 'payouts' as TabType,
      label: 'Host Payouts',
      icon: CreditCard,
      badge: null,
    },
    {
      id: 'audit' as TabType,
      label: 'Audit Trail',
      icon: Shield,
      badge: null,
    },
    {
      id: 'settings' as TabType,
      label: 'Settings & Security',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelect = (id: TabType) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  const content = (
    <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Operations
          </p>
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Security & System Info Footer */}
      <div className="pt-4 border-t border-slate-800/80 px-3 space-y-2">
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Single-Device Session Active</span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono">AYO Platform Admin v1.2</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0 min-h-[calc(100vh-73px)]">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/70 backdrop-blur-sm flex">
          <div className="w-72 max-w-[80vw] bg-slate-900 h-full border-r border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
};
