'use client';

import React, { useState, useEffect, Component, type ErrorInfo, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { Header } from './components/Header';
import { Sidebar, type TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { VehiclesView } from './components/VehiclesView';
import { UsersView } from './components/UsersView';
import { TripsView } from './components/TripsView';
import { PayoutsView } from './components/PayoutsView';
import { AuditLogsView } from './components/AuditLogsView';
import { SettingsView } from './components/SettingsView';
import { LoginPage } from './components/LoginPage';
import { type LedgerSummary } from './types';
import { api, getToken, clearToken } from './api/client';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold">Something went wrong</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center space-x-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={() => {
                  clearToken();
                  localStorage.clear();
                  window.location.reload();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center justify-center space-x-1.5 transition shadow-lg shadow-red-950/40"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Reset & Log In</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const getInitialTab = (): TabType => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace(/^#\/?/, '') as TabType;
    const validTabs: TabType[] = ['dashboard', 'vehicles', 'users', 'trips', 'payouts', 'audit', 'settings'];
    if (validTabs.includes(hash)) return hash;
    const saved = localStorage.getItem('ayo_admin_active_tab') as TabType;
    if (validTabs.includes(saved)) return saved;
  }
  return 'dashboard';
};

export const AdminDashboardApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(getToken()));
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [ledger, setLedger] = useState<LedgerSummary | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ayo_admin_active_tab', tab);
      window.location.hash = tab;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '') as TabType;
      const validTabs: TabType[] = ['dashboard', 'vehicles', 'users', 'trips', 'payouts', 'audit', 'settings'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogout = () => {
    clearToken();
    setIsAuthenticated(false);
    setLedger(null);
    setAlerts([]);
    setPendingCount(0);
  };

  useEffect(() => {
    const onAuthUnauthorized = () => {
      handleLogout();
    };
    window.addEventListener('ayo_auth_unauthorized', onAuthUnauthorized);
    return () => window.removeEventListener('ayo_auth_unauthorized', onAuthUnauthorized);
  }, []);

  const fetchGlobalStats = async () => {
    if (!getToken()) {
      handleLogout();
      return;
    }
    try {
      setIsLoading(true);
      const [ledgerData, alertsData, pendingData] = await Promise.allSettled([
        api.getLedger(),
        api.getAlerts(),
        api.getPendingVehicles(1, 10),
      ]);

      if (ledgerData.status === 'fulfilled') setLedger(ledgerData.value);
      if (alertsData.status === 'fulfilled') {
        const val = alertsData.value;
        const list = Array.isArray(val) ? val : Array.isArray((val as any)?.alerts) ? (val as any).alerts : [];
        setAlerts(list);
      }
      if (pendingData.status === 'fulfilled') setPendingCount(pendingData.value?.total || 0);
    } catch (err) {
      console.error('Stats fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchGlobalStats();
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    fetchGlobalStats();
  };

  // If not logged in, render the dedicated Admin Login Page!
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <Header
          onRefresh={fetchGlobalStats}
          isLoading={isLoading}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            pendingCount={pendingCount}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />

          <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {activeTab === 'dashboard' && (
              <DashboardView ledger={ledger} alerts={alerts} onRefresh={fetchGlobalStats} />
            )}

            {activeTab === 'vehicles' && <VehiclesView onRefreshStats={fetchGlobalStats} />}

            {activeTab === 'users' && <UsersView />}

            {activeTab === 'trips' && <TripsView />}

            {activeTab === 'payouts' && <PayoutsView />}

            {activeTab === 'audit' && <AuditLogsView />}

            {activeTab === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AdminDashboardApp />
    </Provider>
  );
};

export default App;
