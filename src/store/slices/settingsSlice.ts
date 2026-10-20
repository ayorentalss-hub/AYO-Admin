import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';

interface SettingsState {
  listingFeeInr: number;
  listingFeePaise: number;
  listingFeeBypass: boolean;
  currency: string;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  listingFeeInr: 499,
  listingFeePaise: 49900,
  listingFeeBypass: false,
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
  async (dto: { listing_fee_inr?: number; listing_fee_paise?: number; listing_fee_bypass?: boolean }) => {
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
