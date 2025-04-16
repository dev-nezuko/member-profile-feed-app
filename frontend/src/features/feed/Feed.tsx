import { useMemo, useRef, useState } from 'react';
import {
  useGetFeedInfiniteQuery,
  useLikeProfileMutation,
  useUnlikeProfileMutation,
  type LikeSummary,
  type MemberProfile,
} from '../../services/api';

export default function Feed() {
  const { data, isLoading, isFetchingNextPage, isError, hasNextPage, fetchNextPage, refetch } = useGetFeedInfiniteQuery();
  const [likes, setLikes] = useState<Record<string, LikeSummary>>({});
  const [pending, setPending] = useState<Set<string>>(new Set());
  const locked = useRef(new Set<string>());
  const [message, setMessage] = useState('');
  const [like] = useLikeProfileMutation();
  const [unlike] = useUnlikeProfileMutation();

  // Offset pages can overlap when someone joins between requests, so keep the first copy of each profile.
  const profiles = useMemo(() => {
    const byId = new Map<string, MemberProfile>();
    for (const profile of data?.pages.flat() ?? []) if (!byId.has(profile.id)) byId.set(profile.id, profile);
    return [...byId.values()].map((profile) => ({ ...profile, ...likes[profile.id] }));
  }, [data, likes]);

  const toggle = async (profile: MemberProfile) => {
    if (locked.current.has(profile.id)) return;
    locked.current.add(profile.id);
    setPending(new Set(locked.current));
    setMessage('');
    try {
      const summary = profile.likedByCurrentUser
        ? await unlike(profile.id).unwrap()
        : await like(profile.id).unwrap();
      setLikes((previous) => ({ ...previous, [profile.id]: summary }));
    } catch {
      setMessage('Your change was not saved. Please try again.');
    } finally {
      locked.current.delete(profile.id);
      setPending(new Set(locked.current));
    }
  };

  const retry = () => (data ? fetchNextPage() : refetch());

  return (
    <main className="max-w-3xl mx-auto px-5 py-10">
      <p className="text-sm text-slate-500 uppercase tracking-widest">Member directory</p>
      <h1 className="text-4xl font-bold mt-2 mb-3">People and interests</h1>
      <p className="text-slate-600 mb-8">Explore profiles and keep track of the people you appreciate.</p>
      {message && <p role="alert" className="mb-4 text-red-700">{message}</p>}
      {isLoading && <p role="status">Loading profiles…</p>}
      {!isLoading && !isError && profiles.length === 0 && <p>No member profiles yet.</p>}
      <div className="space-y-5">
        {profiles.map((profile) => <article key={profile.id} className="bg-white border border-slate-200 p-6 rounded-2xl">
          <div className="flex justify-between gap-4">
            <div><h2 className="text-xl font-bold">{profile.name}</h2><p className="text-slate-600">{profile.headline}</p></div>
            {profile.photoUrl && <img src={profile.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover" />}
          </div>
          <p className="mt-4">{profile.bio}</p>
          <p className="text-sm text-slate-500 mt-3">{profile.interests.join(' · ')}</p>
          <button type="button" className="mt-5 px-4 py-2 rounded-lg border border-slate-300 disabled:opacity-50"
            aria-label={`Like ${profile.name}`} aria-pressed={profile.likedByCurrentUser}
            disabled={pending.has(profile.id)} onClick={() => toggle(profile)}>
            {profile.likedByCurrentUser ? 'Liked' : 'Like'} · {profile.likeCount}
          </button>
        </article>)}
      </div>
      {isError && (
        <p role="alert" className="mt-6">
          Profiles could not be loaded. <button type="button" onClick={retry}>Retry</button>
        </p>
      )}
      {isFetchingNextPage && <p role="status" className="mt-6">Loading more profiles…</p>}
      {!isError && hasNextPage && !isFetchingNextPage && (
        <button type="button" className="mt-6 px-4 py-2 border rounded-lg" onClick={() => fetchNextPage()}>Load more</button>
      )}
    </main>
  );
}
