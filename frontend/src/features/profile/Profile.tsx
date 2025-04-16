import { useEffect, useState, type FormEvent } from 'react';
import {
  errorMessage,
  useDeleteProfileMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
} from '../../services/api';

interface Draft { name: string; headline: string; bio: string; interests: string; }
const emptyDraft: Draft = { name: '', headline: '', bio: '', interests: '' };

function usePreviewUrl(file: File | undefined) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!file) { setUrl(undefined); return undefined; }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

export default function Profile() {
  const { data: loaded, isLoading, error: loadError } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [deleteProfile, { isLoading: isDeleting }] = useDeleteProfileMutation();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [photo, setPhoto] = useState<File>();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const preview = usePreviewUrl(photo);
  const isNewMember = Boolean(loadError && 'status' in loadError && loadError.status === 404);
  // RTK Query keeps the last good result after a refetch fails, so a 404 (no profile yet, or just deleted) wins.
  const data = isNewMember ? undefined : loaded;

  useEffect(() => {
    setDraft(data ? { name: data.name, headline: data.headline, bio: data.bio, interests: data.interests.join(', ') } : emptyDraft);
  }, [data]);

  const edit = (field: keyof Draft, value: string) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setStatus('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setStatus('');
    const body = new FormData();
    for (const [field, value] of Object.entries(draft)) body.append(field, value);
    if (photo) body.append('photo', photo);
    try {
      await updateProfile(body).unwrap();
      setPhoto(undefined);
      setStatus('Profile saved.');
    } catch (failure) {
      setError(errorMessage(failure, 'Profile was not saved. Your draft is still here.'));
    }
  };

  const handleDelete = async () => {
    setError('');
    try {
      await deleteProfile().unwrap();
      setPhoto(undefined);
      setStatus('Profile deleted.');
    } catch (failure) {
      setError(errorMessage(failure, 'Profile was not deleted. Please try again.'));
    } finally {
      setConfirmDelete(false);
    }
  };

  useEffect(() => {
    if (!confirmDelete) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setConfirmDelete(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [confirmDelete]);

  if (isLoading) return <p role="status" className="p-6">Loading your profile…</p>;
  if (loadError && !isNewMember) return <p role="alert" className="p-6">Your profile could not be loaded. Please refresh the page.</p>;

  const photoSrc = preview ?? data?.photoUrl ?? undefined;
  return (
    <main className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-6">{data ? 'Your profile' : 'Create your profile'}</h1>
      {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-sm mb-1">Name</span>
          <input className="w-full border rounded px-3 py-2" required maxLength={100} value={draft.name}
            onChange={(event) => edit('name', event.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Headline</span>
          <input className="w-full border rounded px-3 py-2" maxLength={200} value={draft.headline}
            onChange={(event) => edit('headline', event.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Bio</span>
          <textarea className="w-full border rounded px-3 py-2" rows={4} maxLength={2000} value={draft.bio}
            onChange={(event) => edit('bio', event.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Interests, separated by commas</span>
          <input className="w-full border rounded px-3 py-2" maxLength={1000} value={draft.interests}
            onChange={(event) => edit('interests', event.target.value)} />
        </label>
        <div className="flex items-center gap-4">
          {photoSrc
            ? <img src={photoSrc} alt="Your profile photo" className="w-24 h-24 rounded object-cover" />
            : <span className="w-24 h-24 rounded border border-dashed grid place-items-center text-sm">No photo</span>}
          <label className="block">
            <span className="block text-sm mb-1">Photo (JPEG or PNG, up to 2 MB)</span>
            <input type="file" accept="image/jpeg,image/png"
              onChange={(event) => { setPhoto(event.target.files?.[0]); setStatus(''); }} />
          </label>
        </div>

        {status && <p role="status" className="text-green-700 text-sm font-medium">{status}</p>}

        <div className="flex space-x-3 pt-4">
          <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          {data && (
            <button type="button" onClick={() => setConfirmDelete(true)} className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800">
              Delete profile
            </button>
          )}
        </div>
      </form>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description"
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
            <h2 id="delete-title" className="text-lg font-semibold mb-4">Delete your profile?</h2>
            <p id="delete-description" className="text-gray-600 mb-6">Your profile, photo and the likes it received will be removed.</p>
            <div className="flex justify-center space-x-4">
              <button type="button" autoFocus onClick={() => setConfirmDelete(false)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
              <button type="button" disabled={isDeleting} onClick={handleDelete} className="bg-red-700 text-white px-4 py-2 rounded">
                {isDeleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
