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

export interface VehiclePhotoMetaItem {
  url: string;
  raw_url?: string;
  signed_url?: string | null;
  category: 'cover' | 'exterior' | 'interior' | 'rear_trunk' | 'other';
  status: 'PENDING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  rejection_reason?: string | null;
  reviewedAt?: string | null;
  reviewed_at?: string | null;
  reviewedBy?: string | null;
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
  photos_meta?: VehiclePhotoMetaItem[];
  photo_verifications?: {
    cover: VehiclePhotoMetaItem[];
    exterior: VehiclePhotoMetaItem[];
    interior: VehiclePhotoMetaItem[];
  };
  expires_in?: number;
}

export interface PlatformSettings {
  listing_fee_paise: number;
  listing_fee_inr: number;
  car_listing_fee_inr?: number;
  car_listing_fee_paise?: number;
  bike_listing_fee_inr?: number;
  bike_listing_fee_paise?: number;
  listing_fee_bypass: boolean;
  customer_kyc_bypass?: boolean;
  car_convenience_fee_inr?: number;
  car_convenience_fee_percent?: number;
  bike_convenience_fee_inr?: number;
  bike_convenience_fee_percent?: number;
  convenience_fee_inr?: number;
  convenience_fee_percent?: number;
  refundable_deposit_inr?: number;
  cover_plus_fee_inr?: number;
  standard_cover_fee_inr?: number;
  unlimited_km_multiplier?: number;
  extra_km_default_rate_inr?: number;
  currency: string;
  updated_at?: string;
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
  avatar_url?: string | null;
  avatarUrl?: string | null;
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
    email?: string | null;
    dob: string;
    city: string;
    bio: string | null;
    avatar_url: string | null;
    avatarUrl?: string | null;
    payout_method: 'UPI' | 'BANK';
    bank_account_number: string | null;
    bank_ifsc: string | null;
    bank_account_name: string | null;
    driving_licence_number?: string | null;
    driving_licence_url?: string | null;
    driving_licence_front_url?: string | null;
    driving_licence_back_url?: string | null;
    selfie_url?: string | null;
    documents?: {
      dl_front?: { title: string; status: string; url: string | null };
      dl_back?: { title: string; status: string; url: string | null };
      selfie?: { title: string; status: string; url: string | null };
    };
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
  reference?: string | null;
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

export interface PaymentItem {
  id: string;
  payment_id: string | null;
  order_id: string | null;
  purpose: 'LISTING_FEE' | 'BOOKING';
  amount_paise: number;
  amount_rupees: number;
  status: 'CREATED' | 'CAPTURED' | 'FAILED' | 'REFUND_PENDING' | 'REFUNDED';
  user?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  } | null;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    name?: string;
    registration_number?: string;
  } | null;
  booking_id?: string | null;
  refund_id?: string | null;
  created_at: string;
}

export interface CouponItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_type: 'FLAT' | 'PERCENT';
  discount_value: number;
  max_discount_inr: number | null;
  min_trip_amount_inr: number;
  is_active: boolean;
  usage_limit: number | null;
  used_count: number;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCouponInput {
  code: string;
  title: string;
  description?: string;
  discount_type?: 'FLAT' | 'PERCENT';
  discount_value: number;
  max_discount_inr?: number;
  min_trip_amount_inr?: number;
  usage_limit?: number;
  valid_until?: string;
  is_active?: boolean;
}

export interface CouponUsageItem {
  usage_id: string;
  user_id: string;
  booking_id: string | null;
  coupon_code: string;
  discount_type: string;
  discount_inr: number;
  original_amount_inr: number;
  discounted_amount_inr: number;
  used_at: string;
}

