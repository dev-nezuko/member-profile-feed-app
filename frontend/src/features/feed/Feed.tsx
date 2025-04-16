import { useGetFeedQuery, useLikeProfileMutation, useUnlikeProfileMutation } from '../../services/api';
import { useState, useEffect } from 'react';

export default function Feed() {
  const [page, setPage] = useState(1);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading } = useGetFeedQuery(page);
  const [like] = useLikeProfileMutation();
  const [unlike] = useUnlikeProfileMutation();

  useEffect(() => {
    if (data) {
      setProfiles((prev) => {
        return page === 1 ? data : [...prev, ...data];
      });

      if (data.length < 5) setHasMore(false);
    }
  }, [data, page]);

  const handleLikeToggle = async (profileId: string, liked: boolean, index: number) => {
    const updated = [...profiles];
    const profileCopy = { ...updated[index] }; // ✅ clone to make it writable

    profileCopy.likedByCurrentUser = !liked;
    profileCopy.likeCount += liked ? -1 : 1;

    updated[index] = profileCopy;
    setProfiles(updated);

    try {
      if (liked) {
        await unlike(profileId);
      } else {
        await like(profileId);
      }
    } catch {
      profileCopy.likedByCurrentUser = liked;
      profileCopy.likeCount += liked ? 1 : -1;
      updated[index] = profileCopy;
      setProfiles(updated);
    }
  };

  return (
    <div className='max-w-3xl mx-auto mt-8'>
      <h2 className='text-2xl font-bold mb-4'>Public Feed</h2>
      <div className='space-y-6'>
        {profiles.map((p, index) => (
          <div key={p.id} className='bg-white p-4 shadow rounded-lg'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-lg font-semibold'>{p.name}</h3>
                <p className='text-sm text-gray-600'>{p.headline}</p>
              </div>
              {p.photoUrl && <img src={p.photoUrl} alt='profile' className='w-16 h-16 rounded-full object-cover' />}
            </div>
            <p className='mt-2'>{p.bio}</p>
            <p className='text-sm text-gray-500 mt-1'>Interests: {p.interests.join(', ')}</p>
            <div className='mt-3'>
              <button
                onClick={() => handleLikeToggle(p.id, p.likedByCurrentUser, index)}
                className='flex items-center space-x-1'
              >
                <span className={`text-2xl ${p.likedByCurrentUser ? 'text-red-600' : 'text-gray-400'}`}>
                  {p.likedByCurrentUser ? '❤️' : '🤍'}
                </span>
                <span className='text-sm text-gray-600'>{p.likeCount}</span>
              </button>
            </div>
          </div>
        ))}

        {hasMore && (
          <div className='text-center pt-6'>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={isLoading}
              className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
