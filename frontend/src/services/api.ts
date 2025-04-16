import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { signedOut } from '../features/auth/authSlice';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface MemberProfile {
  id: string; name: string; headline: string; bio: string; photoUrl?: string | null;
  interests: string[]; likeCount: number; likedByCurrentUser: boolean;
}
export interface OwnProfile {
  id: string; name: string; headline: string; bio: string; photoUrl?: string | null; interests: string[];
}
export interface Credentials { email: string; password: string; }
interface LoginResult { token: string; userId: string; }
export interface LikeSummary { likeCount: number; likedByCurrentUser: boolean; }

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { session: { token: string } | null } }).auth.session?.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// Tokens expire after an hour; a 401 on an authenticated call ends the session instead of leaving a broken page.
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, queryApi, extraOptions) => {
  const result = await rawBaseQuery(args, queryApi, extraOptions);
  const url = typeof args === 'string' ? args : args.url;
  if (result.error?.status === 401 && !url.startsWith('auth/')) {
    queryApi.dispatch(signedOut());
    queryApi.dispatch(api.util.resetApiState());
  }
  return result;
};

export function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { error?: unknown } }).data;
    if (typeof data?.error === 'string') return data.error;
  }
  return fallback;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['OwnProfile'],
  endpoints: (builder) => ({
    signup: builder.mutation<LoginResult, Credentials>({ query: (body) => ({ url: 'auth/signup', method: 'POST', body }) }),
    login: builder.mutation<LoginResult, Credentials>({ query: (body) => ({ url: 'auth/login', method: 'POST', body }) }),
    getProfile: builder.query<OwnProfile, void>({ query: () => 'profile/me', providesTags: ['OwnProfile'] }),
    updateProfile: builder.mutation<OwnProfile, FormData>({
      query: (body) => ({ url: 'profile', method: 'POST', body }),
      invalidatesTags: ['OwnProfile'],
    }),
    deleteProfile: builder.mutation<{ message: string }, void>({
      query: () => ({ url: 'profile', method: 'DELETE' }),
      invalidatesTags: ['OwnProfile'],
    }),
    getFeed: builder.query<MemberProfile[], number>({ query: (page = 1) => `profile/feed?page=${page}&limit=5` }),
    likeProfile: builder.mutation<LikeSummary, string>({ query: (id) => ({ url: `profile/${id}/like`, method: 'POST' }) }),
    unlikeProfile: builder.mutation<LikeSummary, string>({ query: (id) => ({ url: `profile/${id}/unlike`, method: 'DELETE' }) }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteProfileMutation,
  useGetFeedQuery,
  useLikeProfileMutation,
  useUnlikeProfileMutation,
} = api;
