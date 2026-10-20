import React from 'react';
import { LogOut, RefreshCw, Menu } from 'lucide-react';
import { clearToken } from '../api/client';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isLoading,
  onLogout,
  onToggleMobileMenu,
}) => {
  const handleLogout = () => {
    clearToken();
    if (onLogout) onLogout();
  };

  return (
    <header className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-30 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3 sm:space-x-4">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition border border-zinc-800"
            title="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-950/50 text-white font-black text-xl tracking-wider border border-red-500/30">
          A
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">AYO Platform Admin</h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
              Live Session
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-none">
            Fleet Control, Moderation & Financial Operations
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition border border-zinc-800 cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-500' : ''}`} />
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-red-600/10 text-red-400 hover:text-white hover:bg-red-600 transition border border-red-500/20 text-xs font-bold cursor-pointer shadow-sm"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
