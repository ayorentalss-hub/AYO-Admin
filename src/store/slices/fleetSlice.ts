import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import type { VehicleItem } from '../../types';

interface FleetState {
  items: VehicleItem[];
  total: number;
  statusFilter: string;
  page: number;
  loading: boolean;
  lastFetched: number | null;
  error: string | null;
}

const initialState: FleetState = {
  items: [],
  total: 0,
  statusFilter: 'PENDING_REVIEW',
  page: 1,
  loading: false,
  lastFetched: null,
  error: null,
};

export const fetchVehiclesThunk = createAsyncThunk(
  'fleet/fetchVehicles',
  async ({ status, page }: { status: string; page: number }) => {
    const res = await api.getAllVehicles(status, page, 20);
    return { items: res.items || [], total: res.total || 0, status, page };
  },
);

export const fleetSlice = createSlice({
  name: 'fleet',
  initialState,
  reducers: {
    setStatusFilter(state, action: PayloadAction<string>) {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    invalidateFleet(state) {
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehiclesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehiclesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.statusFilter = action.payload.status;
        state.page = action.payload.page;
        state.lastFetched = Date.now();
      })
      .addCase(fetchVehiclesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch vehicles';
      });
  },
});

export const { setStatusFilter, setPage, invalidateFleet } = fleetSlice.actions;
export default fleetSlice.reducer;
