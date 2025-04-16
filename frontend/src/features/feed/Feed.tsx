import { useMemo, useRef, useState } from 'react';
import ProfileCard from '../../components/ProfileCard';
import {
  useGetFeedInfiniteQuery,
  useLikeProfileMutation,
  useUnlikeProfileMutation,
  type LikeSummary,
  type MemberProfile,
} from '../../services/api';

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" strokeLinejoin="round" />
    </svg>
  );
}

function CardSkeleton() {
  return (
    <div aria-hidden="true" className="bg-card border border-line rounded-3xl p-6 animate-pulse">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-2xl bg-line" />
        <div className="flex-1 space-y-2 pt-1"><div className="h-5 w-1/2 rounded bg-line" /><div className="h-4 w-1/3 rounded bg-line" /></div>
      </div>
      <div className="h-4 w-5/6 rounded bg-line mt-5" />
    </div>
  );
}

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
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="mb-8">
        <p className="text-rust-deep font-bold uppercase tracking-[0.18em] text-sm">Member board</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold mt-2">Who's here</h1>
        <p className="text-muted mt-3 max-w-xl">Newest members first. Like a profile to let someone know you appreciate what they shared.</p>
      </header>
      {message && <p role="alert" className="notice notice-error mb-5">{message}</p>}
      {isLoading && (
        <div className="space-y-5">
          <p role="status" className="sr-only">Loading profiles…</p>
          <CardSkeleton /><CardSkeleton />
        </div>
      )}
      {!isLoading && !isError && profiles.length === 0 && (
        <div className="border-2 border-dashed border-line rounded-3xl p-8 text-center">
          <p className="font-display text-2xl font-extrabold">No member profiles yet.</p>
          <p className="text-muted mt-2">When other members save a profile, it will appear here.</p>
        </div>
      )}
      <div className="space-y-5">
        {profiles.map((profile) => (
          <ProfileCard key={profile.id} {...profile} footer={(
            <button type="button" aria-label={`Like ${profile.name}`} aria-pressed={profile.likedByCurrentUser}
              disabled={pending.has(profile.id)} onClick={() => toggle(profile)}
              className={`btn ${profile.likedByCurrentUser ? 'bg-rust-wash text-rust-deep border-rust/40' : 'btn-quiet'}`}>
              <HeartIcon filled={profile.likedByCurrentUser} />
              <span>{profile.likedByCurrentUser ? 'Liked' : 'Like'}</span>
              <span className="tabular-nums">{profile.likeCount}</span>
            </button>
          )} />
        ))}
      </div>
      {isError && (
        <div role="alert" className="notice notice-error mt-6 flex flex-wrap items-center justify-between gap-3">
          <span>Profiles could not be loaded.</span>
          <button type="button" className="btn btn-quiet bg-card" onClick={retry}>Retry</button>
        </div>
      )}
      {isFetchingNextPage && <p role="status" className="mt-6 text-muted">Loading more profiles…</p>}
      {!isError && hasNextPage && !isFetchingNextPage && (
        <div className="mt-8 text-center">
          <button type="button" className="btn btn-quiet bg-card" onClick={() => fetchNextPage()}>Load more</button>
        </div>
      )}
    </main>
  );
}
