import { useGetFeedQuery, useLikeProfileMutation, useUnlikeProfileMutation } from '../../services/api';
import type { MemberProfile } from '../../services/api';
import { useState, useEffect, useRef } from 'react';

export default function Feed() {
  const [page, setPage] = useState(1);
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const locked = useRef(new Set<string>());
  const [message, setMessage] = useState('');
  const { currentData: data, isFetching, isError, refetch } = useGetFeedQuery(page);
  const [like] = useLikeProfileMutation();
  const [unlike] = useUnlikeProfileMutation();
  useEffect(() => {
    if (data) setProfiles((previous) => {
      const merged = page === 1 ? data : [...previous, ...data];
      return Array.from(new Map(merged.map((item) => [item.id, item])).values());
    });
  }, [data, page]);
  const toggle = async (profile: MemberProfile) => {
    if (locked.current.has(profile.id)) return;
    locked.current.add(profile.id);
    setPending(new Set(locked.current));
    setMessage('');
    try {
      if (profile.likedByCurrentUser) await unlike(profile.id).unwrap();
      else await like(profile.id).unwrap();
      setProfiles((previous) => previous.map((item) => item.id === profile.id ? {
        ...item, likedByCurrentUser: !profile.likedByCurrentUser,
        likeCount: Math.max(0, item.likeCount + (profile.likedByCurrentUser ? -1 : 1)),
      } : item));
    } catch { setMessage('Your change was not saved. Please try again.'); }
    finally { locked.current.delete(profile.id); setPending(new Set(locked.current)); }
  };
  return (
    <main className="max-w-3xl mx-auto px-5 py-10">
      <p className="text-sm text-slate-500 uppercase tracking-widest">Member directory</p>
      <h1 className="text-4xl font-bold mt-2 mb-3">People and interests</h1>
      <p className="text-slate-600 mb-8">Explore profiles and keep track of the people you appreciate.</p>
      {message && <p role="alert" className="mb-4 text-red-700">{message}</p>}
      {isError && <p role="alert">Profiles could not be loaded. <button onClick={() => refetch()}>Retry</button></p>}
      {isFetching && <p role="status">Loading profiles…</p>}
      {!isFetching && !isError && profiles.length === 0 && <p>No member profiles yet.</p>}
      <div className="space-y-5">
        {profiles.map((profile) => <article key={profile.id} className="bg-white border border-slate-200 p-6 rounded-2xl">
          <div className="flex justify-between gap-4">
            <div><h2 className="text-xl font-bold">{profile.name}</h2><p className="text-slate-600">{profile.headline}</p></div>
            {profile.photoUrl && <img src={profile.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover" />}
          </div>
          <p className="mt-4">{profile.bio}</p>
          <p className="text-sm text-slate-500 mt-3">{profile.interests.join(' · ')}</p>
          <button className="mt-5 px-4 py-2 rounded-lg border border-slate-300 disabled:opacity-50"
            aria-label={`Like ${profile.name}`} aria-pressed={profile.likedByCurrentUser}
            disabled={pending.has(profile.id)} onClick={() => toggle(profile)}>
            {profile.likedByCurrentUser ? 'Liked' : 'Like'} · {profile.likeCount}
          </button>
        </article>)}
      </div>
      {!isError && data && data.length === 5 && <button className="mt-6 px-4 py-2 border rounded-lg"
        disabled={isFetching} onClick={() => setPage((value) => value + 1)}>Load more</button>}
    </main>
  );
}
