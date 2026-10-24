import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';

import type { PlatformSettings } from '../../types';

interface SettingsState {
  listingFeeInr: number;
  listingFeePaise: number;
  listingFeeBypass: boolean;
  convenienceFeeInr: number;
  refundableDepositInr: number;
  coverPlusFeeInr: number;
  standardCoverFeeInr: number;
  unlimitedKmMultiplier: number;
  extraKmDefaultRateInr: number;
  currency: string;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  listingFeeInr: 499,
  listingFeePaise: 49900,
  listingFeeBypass: false,
  convenienceFeeInr: 791,
  refundableDepositInr: 1000,
  coverPlusFeeInr: 1919,
  standardCoverFeeInr: 499,
  unlimitedKmMultiplier: 1.2,
  extraKmDefaultRateInr: 11,
  currency: 'INR',
  updatedAt: null,
  loading: false,
  error: null,
};

export const fetchSettingsThunk = createAsyncThunk('settings/fetchSettings', async () => {
  return await api.getSettings();
});

export const updateSettingsThunk = createAsyncThunk(
  'settings/updateSettings',
  async (dto: Partial<PlatformSettings>) => {
    return await api.updateSettings(dto);
  },
);

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettingsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettingsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.listingFeeInr = action.payload.listing_fee_inr;
        state.listingFeePaise = action.payload.listing_fee_paise;
        state.listingFeeBypass = action.payload.listing_fee_bypass;
        if (action.payload.convenience_fee_inr !== undefined) {
          state.convenienceFeeInr = action.payload.convenience_fee_inr;
        }
        if (action.payload.refundable_deposit_inr !== undefined) {
          state.refundableDepositInr = action.payload.refundable_deposit_inr;
        }
        if (action.payload.cover_plus_fee_inr !== undefined) {
          state.coverPlusFeeInr = action.payload.cover_plus_fee_inr;
        }
        if (action.payload.standard_cover_fee_inr !== undefined) {
          state.standardCoverFeeInr = action.payload.standard_cover_fee_inr;
        }
        if (action.payload.unlimited_km_multiplier !== undefined) {
          state.unlimitedKmMultiplier = action.payload.unlimited_km_multiplier;
        }
        if (action.payload.extra_km_default_rate_inr !== undefined) {
          state.extraKmDefaultRateInr = action.payload.extra_km_default_rate_inr;
        }
        state.currency = action.payload.currency || 'INR';
        state.updatedAt = action.payload.updated_at || null;
      })
      .addCase(fetchSettingsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch platform settings';
      })
      .addCase(updateSettingsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettingsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.listingFeeInr = action.payload.listing_fee_inr;
        state.listingFeePaise = action.payload.listing_fee_paise;
        state.listingFeeBypass = action.payload.listing_fee_bypass;
        if (action.payload.convenience_fee_inr !== undefined) {
          state.convenienceFeeInr = action.payload.convenience_fee_inr;
        }
        if (action.payload.refundable_deposit_inr !== undefined) {
          state.refundableDepositInr = action.payload.refundable_deposit_inr;
        }
        if (action.payload.cover_plus_fee_inr !== undefined) {
          state.coverPlusFeeInr = action.payload.cover_plus_fee_inr;
        }
        if (action.payload.standard_cover_fee_inr !== undefined) {
          state.standardCoverFeeInr = action.payload.standard_cover_fee_inr;
        }
        if (action.payload.unlimited_km_multiplier !== undefined) {
          state.unlimitedKmMultiplier = action.payload.unlimited_km_multiplier;
        }
        if (action.payload.extra_km_default_rate_inr !== undefined) {
          state.extraKmDefaultRateInr = action.payload.extra_km_default_rate_inr;
        }
        state.currency = action.payload.currency || 'INR';
        state.updatedAt = action.payload.updated_at || null;
      })
      .addCase(updateSettingsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update platform settings';
      });
  },
});

export default settingsSlice.reducer;
