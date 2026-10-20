import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import type { LedgerSummary } from '../../types';

interface StatsState {
  ledger: LedgerSummary | null;
  alerts: any[];
  pendingCount: number;
  loading: boolean;
  lastFetched: number | null;
  error: string | null;
}

const initialState: StatsState = {
  ledger: null,
  alerts: [],
  pendingCount: 0,
  loading: false,
  lastFetched: null,
  error: null,
};

export const fetchStatsThunk = createAsyncThunk('stats/fetchStats', async () => {
  const [ledgerData, alertsData, pendingData] = await Promise.allSettled([
    api.getLedger(),
    api.getAlerts(),
    api.getPendingVehicles(1, 10),
  ]);

  let ledger: LedgerSummary | null = null;
  let alerts: any[] = [];
  let pendingCount = 0;

  if (ledgerData.status === 'fulfilled') ledger = ledgerData.value;
  if (alertsData.status === 'fulfilled') {
    const val = alertsData.value;
    alerts = Array.isArray(val) ? val : Array.isArray((val as any)?.alerts) ? (val as any).alerts : [];
  }
  if (pendingData.status === 'fulfilled') pendingCount = pendingData.value?.total || 0;

  return { ledger, alerts, pendingCount };
});

export const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.ledger = action.payload.ledger;
        state.alerts = action.payload.alerts;
        state.pendingCount = action.payload.pendingCount;
        state.lastFetched = Date.now();
      })
      .addCase(fetchStatsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch global statistics';
      });
  },
});

export default statsSlice.reducer;
