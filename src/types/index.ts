export interface AdminProfile {
  id: string;
  phone: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

export interface LedgerSummary {
  platform_earnings_paise: number;
  booking_fees_paise: number;
  listing_fees_paise: number;
  pending_payouts_paise: number;
  completed_payouts_paise: number;
  total_transactions: number;
}

export interface VehicleDocument {
  id: string;
  type: 'RC' | 'INSURANCE' | 'POLLUTION';
  status: string;
  s3_key: string;
  url: string | null;
  expiry_date?: string | null;
  file_name?: string | null;
  file_size_bytes?: number | null;
  uploaded_at: string;
}

export interface VehicleInspectDetails {
  vehicle?: {
    id: string;
    make: string;
    model: string;
    year?: number;
    name?: string;
    status: string;
    daily_rate?: number;
    hourly_rate?: number;
    address?: string;
    registration_number?: string;
    created_at: string;
  };
  host?: {
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    phone: string;
    email?: string;
    kyc_status?: string;
    status?: string;
    city?: string;
    payout_method?: string;
    bank_account_number?: string;
    bank_ifsc?: string;
  } | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    status?: string;
    booking_id: string;
    booking_status: string;
    start_time: string;
    end_time: string;
  } | null;
  documents: VehicleDocument[];
  images: string[];
}

export interface VehicleItem {
  id: string;
  host_id: string;
  host_name?: string;
  host_phone?: string;
  make: string;
  model: string;
  year?: number;
  name?: string;
  description?: string;
  daily_rate?: number;
  hourly_rate?: number;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'OFFLINE';
  cover_photo_url?: string | null;
  photos?: string[];
  photo_categories?: {
    cover?: string;
    interior?: string;
    rear_trunk?: string;
    other?: string[];
  };
  address?: string;
  rejection_reason?: string | null;
  created_at: string;
  host?: {
    id: string;
    phone: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    kyc_status?: string;
    city?: string;
  } | null;
}

export interface UserItem {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  role: 'CUSTOMER' | 'HOST' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  first_name?: string;
  last_name?: string;
  kyc_status?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'REJECTED';
  onboarding_completed?: boolean;
  onboarding_step?: number;
  created_at: string;
}

export interface HostKycDetails {
  user: UserItem;
  profile: {
    first_name: string;
    last_name: string;
    dob: string;
    city: string;
    bio: string | null;
    avatar_url: string | null;
    payout_method: 'UPI' | 'BANK';
    bank_account_number: string | null;
    bank_ifsc: string | null;
    bank_account_name: string | null;
    step: number;
    is_completed: boolean;
  } | null;
  kyc: {
    id: string;
    legal_name: string;
    upi_vpa: string;
    registered_name: string | null;
    status: string;
    verified_at: string | null;
    created_at: string;
  } | null;
  vehicles: Array<{
    id: string;
    registration_number: string;
    make: string;
    model: string;
    year?: number;
    status: string;
    city?: string;
    pricing_daily_paise: number;
    documents: Array<{
      id: string;
      type: string;
      status: string;
      expiry_date?: string | null;
      file_name?: string | null;
      file_size_bytes?: number | null;
      rejection_reason?: string | null;
      uploaded_at: string;
      url: string | null;
    }>;
    images: string[];
  }>;
}

export interface TripItem {
  id: string;
  booking_code?: string;
  status: 'PAYMENT_PENDING' | 'CONFIRMED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  start_time: string;
  end_time: string;
  total_price_paise: number;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    name?: string;
  };
  customer?: {
    id: string;
    phone: string;
    first_name?: string;
  };
  host?: {
    id: string;
    phone: string;
    first_name?: string;
  };
  created_at: string;
}

export interface PayoutItem {
  id: string;
  host_id: string;
  booking_id?: string;
  amount_paise: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  pg_payout_id?: string | null;
  created_at: string;
  host?: {
    first_name?: string;
    phone?: string;
    payout_vpa?: string;
  };
}

export interface AuditLogItem {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_phone?: string | null;
  action: string;
  target_id?: string | null;
  details?: Record<string, any> | null;
  created_at: string;
}
