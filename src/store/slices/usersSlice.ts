import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import type { UserItem } from '../../types';

interface UsersState {
  items: UserItem[];
  total: number;
  searchQuery: string;
  roleFilter: string;
  page: number;
  loading: boolean;
  lastFetched: number | null;
  error: string | null;
}

const initialState: UsersState = {
  items: [],
  total: 0,
  searchQuery: '',
  roleFilter: 'ALL',
  page: 1,
  loading: false,
  lastFetched: null,
  error: null,
};

export const fetchUsersThunk = createAsyncThunk(
  'users/fetchUsers',
  async ({ q, role, page }: { q: string; role: string; page: number }) => {
    const res = await api.getUsers(q, role, page, 20);
    return { items: res.items || [], total: res.total || 0, q, role, page };
  },
);

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.page = 1;
    },
    setRoleFilter(state, action: PayloadAction<string>) {
      state.roleFilter = action.payload;
      state.page = 1;
    },
    setUsersPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    invalidateUsers(state) {
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.searchQuery = action.payload.q;
        state.roleFilter = action.payload.role;
        state.page = action.payload.page;
        state.lastFetched = Date.now();
      })
      .addCase(fetchUsersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      });
  },
});

export const { setSearchQuery, setRoleFilter, setUsersPage, invalidateUsers } = usersSlice.actions;
export default usersSlice.reducer;
