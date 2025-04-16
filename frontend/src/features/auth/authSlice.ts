import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Session { token: string; userId: string; }

function storedSession(): Session | null {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  return token && userId ? { token, userId } : null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { session: storedSession() },
  reducers: {
    signedIn(state, action: PayloadAction<Session>) {
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('userId', action.payload.userId);
      state.session = action.payload;
    },
    signedOut(state) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      state.session = null;
    },
  },
});

export const { signedIn, signedOut } = authSlice.actions;
export const authReducer = authSlice.reducer;
