import type { AuditLogItem, HostKycDetails, LedgerSummary, PayoutItem, TripItem, UserItem, VehicleDocument, VehicleItem } from '../types';

const STORAGE_KEY_TOKEN = 'ayo_admin_token';
const STORAGE_KEY_BASE_URL = 'ayo_admin_base_url';

export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_BASE_URL);
    if (saved) return saved;
  }
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://ayo-platform-api-1015630533512.europe-west1.run.app/api/v1'
  );
};

export const setBaseUrl = (url: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_BASE_URL, url);
  }
};

export const getToken = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_TOKEN) || '';
};

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  }
};

export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl().replace(/\/+$/, '');
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(baseUrl.includes('ngrok') ? { 'ngrok-skip-browser-warning': 'true' } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  let json: any = null;

  // Handle HTML interstitial (e.g. ngrok free warning or server restart HTML error)
  const isHtml = text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html');
  if (isHtml) {
    throw new Error('Backend returned HTML instead of JSON. Ensure backend server is running on port 3000.');
  }

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { message: text };
  }

  if (!res.ok) {
    const errorMsg = json?.error?.message || json?.message || `HTTP ${res.status}: ${res.statusText}`;
    if (res.status === 401) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ayo_auth_unauthorized', { detail: { message: errorMsg } }));
      }
    }
    throw new Error(errorMsg);
  }

  return (json?.data !== undefined ? json.data : json) as T;
}

export const api = {
  // Auth
  adminLogin: async (credentials: { email?: string; password?: string; phone?: string; otp?: string }) => {
    return request<{ access_token: string; role: string; user: any }>('/auth/admin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  quickLogin: async (role: 'ADMIN' | 'HOST' | 'CUSTOMER' = 'ADMIN') => {
    return request<{ access_token: string; role: string; user: any }>('/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },

  getProfile: async () => {
    return request<any>('/admin/profile');
  },

  // Dashboard & Financials
  getLedger: async () => {
    return request<LedgerSummary>('/admin/ledger');
  },

  getAlerts: async () => {
    return request<any[]>('/admin/alerts');
  },

  retryRefunds: async () => {
    return request<any>('/admin/refunds/retry', { method: 'POST' });
  },

  // Vehicles Fleet Management
  getPendingVehicles: async (page = 1, limit = 20) => {
    return request<{ items: VehicleItem[]; total: number; page: number; limit: number }>(
      `/admin/vehicles/pending?page=${page}&limit=${limit}`,
    );
  },

  getAllVehicles: async (status = 'ALL', page = 1, limit = 20) => {
    const query = status && status !== 'ALL' ? `?status=${status}&page=${page}&limit=${limit}` : `?page=${page}&limit=${limit}`;
    return request<{ items: VehicleItem[]; total: number; page: number; limit: number }>(`/admin/vehicles${query}`);
  },

  getVehicleDocuments: async (id: string) => {
    return request<VehicleDocument[]>(`/admin/vehicles/${id}/documents`);
  },

  approveVehicle: async (id: string) => {
    return request<any>(`/admin/vehicles/${id}/approve`, { method: 'POST' });
  },

  rejectVehicle: async (id: string, reason: string) => {
    return request<any>(`/admin/vehicles/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Users & Hosts Moderation
  getUsers: async (q = '', role = '', page = 1, limit = 20) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (role && role !== 'ALL') params.set('role', role);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return request<{ items: UserItem[]; total: number; page: number; limit: number }>(`/admin/users?${params.toString()}`);
  },

  setUserStatus: async (id: string, action: 'activate' | 'suspend' | 'block') => {
    return request<any>(`/admin/users/${id}/${action}`, { method: 'POST' });
  },

  getHostKyc: async (id: string) => {
    return request<HostKycDetails>(`/admin/hosts/${id}/kyc`);
  },

  approveHostKyc: async (id: string) => {
    return request<any>(`/admin/hosts/${id}/kyc/approve`, { method: 'POST' });
  },

  rejectHostKyc: async (id: string) => {
    return request<any>(`/admin/hosts/${id}/kyc/reject`, { method: 'POST' });
  },

  // Trips
  getTrips: async (status = '') => {
    const query = status ? `?status=${status}` : '';
    return request<TripItem[]>(`/admin/trips${query}`);
  },

  forceTrip: async (id: string, action: 'complete' | 'cancel', reason: string) => {
    return request<any>(`/admin/trips/${id}/force-${action}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Payouts
  getPayouts: async () => {
    return request<PayoutItem[]>('/admin/payouts');
  },

  markPayoutPaid: async (id: string, reference: string) => {
    return request<any>(`/admin/payouts/${id}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify({ reference }),
    });
  },

  // Immutable Audit Logs
  getAuditLogs: async (action = 'ALL', page = 1, limit = 50) => {
    const query = action && action !== 'ALL' ? `?action=${action}&page=${page}&limit=${limit}` : `?page=${page}&limit=${limit}`;
    return request<{ items: AuditLogItem[]; total: number; page: number; limit: number; total_pages: number }>(
      `/admin/audit-logs${query}`,
    );
  },

  // Settings & Security
  getSettings: async () => {
    return request<{ listing_fee_paise: number; listing_fee_inr: number; listing_fee_bypass: boolean; currency: string; updated_at?: string }>('/admin/settings');
  },

  updateSettings: async (dto: { listing_fee_inr?: number; listing_fee_paise?: number; listing_fee_bypass?: boolean }) => {
    return request<any>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  changePassword: async (dto: { old_password?: string; new_password?: string }) => {
    return request<any>('/admin/change-password', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};
