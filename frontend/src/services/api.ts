import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface MemberProfile {
  id: string; name: string; headline: string; bio: string; photoUrl?: string;
  interests: string[]; likeCount: number; likedByCurrentUser: boolean;
  likes?: { likedById: string }[];
}
interface LoginResult { token: string; userId: string; }
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    signup: builder.mutation<LoginResult, {email: string; password: string}>({ query: (data) => ({ url: 'auth/signup', method: 'POST', body: data }) }),
    login: builder.mutation<LoginResult, {email: string; password: string}>({ query: (data) => ({ url: 'auth/login', method: 'POST', body: data }) }),
    getProfile: builder.query<MemberProfile, void>({ query: () => 'profile/me' }),
    updateProfile: builder.mutation({ query: (data) => ({ url: 'profile', method: 'POST', body: data }) }),
    deleteProfile: builder.mutation({ query: () => ({ url: 'profile', method: 'DELETE' }) }),
    getFeed: builder.query<MemberProfile[], number>({
      query: (page = 1) => `profile/feed?page=${page}&limit=5`,
      transformResponse: (res: MemberProfile[]) => {
        const userId = localStorage.getItem('userId');
        return res.map((p) => {
          const clone = structuredClone(p);
          clone.likedByCurrentUser = Boolean(p.likes?.some((like: { likedById: string }) => like.likedById === userId));
          return clone;
        });
      }
    }),    
    likeProfile: builder.mutation({ query: (id: string) => ({ url: `profile/${id}/like`, method: 'POST' }) }),
    unlikeProfile: builder.mutation({ query: (id: string) => ({ url: `profile/${id}/unlike`, method: 'DELETE' }) }),
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
