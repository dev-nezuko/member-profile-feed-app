import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  errorMessage,
  useDeleteProfileMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  type OwnProfile,
} from '../../services/api';
import ProfileCard from '../../components/ProfileCard';

interface Draft { name: string; headline: string; bio: string; interests: string; }
const emptyDraft: Draft = { name: '', headline: '', bio: '', interests: '' };

function usePreviewUrl(file: File | undefined) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

const draftFrom = (profile: OwnProfile | undefined): Draft => (profile
  ? { name: profile.name, headline: profile.headline, bio: profile.bio, interests: profile.interests.join(', ') }
  : emptyDraft);

export default function Profile() {
  const { data: loaded, isLoading, error: loadError } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [deleteProfile, { isLoading: isDeleting }] = useDeleteProfileMutation();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [draftSource, setDraftSource] = useState<OwnProfile>();
  const [photo, setPhoto] = useState<File>();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const preview = usePreviewUrl(photo);
  const isNewMember = Boolean(loadError && 'status' in loadError && loadError.status === 404);
  // RTK Query keeps the last good result after a refetch fails, so a 404 (no profile yet, or just deleted) wins.
  const data = isNewMember ? undefined : loaded;

  // Reset the form when a different saved profile arrives (first load, save, delete), during render rather than in an effect.
  if (data !== draftSource) {
    setDraftSource(data);
    setDraft(draftFrom(data));
  }

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

  if (isLoading) return <p role="status" className="max-w-5xl mx-auto px-4 sm:px-6 py-10 text-muted">Loading your profile…</p>;
  if (loadError && !isNewMember) {
    return <p role="alert" className="max-w-5xl mx-auto px-4 sm:px-6 py-10 notice notice-error">Your profile could not be loaded. Please refresh the page.</p>;
  }

  const photoSrc = preview ?? data?.photoUrl ?? undefined;
  const previewInterests = [...new Set(draft.interests.split(',').map((tag) => tag.trim()).filter(Boolean))];
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="mb-8">
        <p className="text-rust-deep font-bold uppercase tracking-[0.18em] text-sm">Member board</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold mt-2">{data ? 'Your profile' : 'Create your profile'}</h1>
        <p className="text-muted mt-3 max-w-xl">This is what other members see in the feed. Only your name is required.</p>
      </header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <form onSubmit={handleSubmit} className="bg-card border border-line rounded-3xl p-5 sm:p-8 space-y-5">
          {error && <p role="alert" className="notice notice-error">{error}</p>}
          <label className="block">
            <span className="field-label">Name</span>
            <input className="field" required maxLength={100} autoComplete="name" value={draft.name}
              onChange={(event) => edit('name', event.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Headline</span>
            <input className="field" maxLength={200} value={draft.headline}
              onChange={(event) => edit('headline', event.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Bio</span>
            <textarea className="field" rows={5} maxLength={2000} value={draft.bio}
              onChange={(event) => edit('bio', event.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Interests, separated by commas</span>
            <input className="field" maxLength={1000} value={draft.interests}
              onChange={(event) => edit('interests', event.target.value)} />
          </label>
          <div>
            <label className="block">
              <span className="field-label">Photo</span>
              <input type="file" accept="image/jpeg,image/png" aria-describedby="photo-hint"
                className="block w-full text-sm file:mr-3 file:rounded-full file:border-[1.5px] file:border-line file:bg-card file:px-4 file:py-2 file:font-bold"
                onChange={(event) => { setPhoto(event.target.files?.[0]); setStatus(''); }} />
            </label>
            <span id="photo-hint" className="field-hint">JPEG or PNG, up to 2 MB. Leave empty to keep the current photo.</span>
          </div>

          {status && <p role="status" className="notice notice-ok">{status}</p>}

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={isSaving} className="btn btn-primary">{isSaving ? 'Saving…' : 'Save'}</button>
            {data && (
              <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-quiet text-danger">Delete profile</button>
            )}
          </div>
        </form>

        <aside aria-label="Preview" className="lg:sticky lg:top-6">
          <p className="field-label text-muted">Preview</p>
          <ProfileCard name={draft.name || 'Your name'} headline={draft.headline} bio={draft.bio}
            interests={previewInterests} photoUrl={photoSrc} />
        </aside>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description"
            className="bg-card rounded-3xl p-6 sm:p-8 w-full max-w-sm">
            <h2 id="delete-title" className="text-2xl font-extrabold">Delete your profile?</h2>
            <p id="delete-description" className="text-muted mt-2">Your profile, photo and the likes it received will be removed.</p>
            <div className="flex flex-wrap justify-end gap-3 mt-6">
              <button type="button" autoFocus onClick={() => setConfirmDelete(false)} className="btn btn-quiet">Cancel</button>
              <button type="button" disabled={isDeleting} onClick={handleDelete} className="btn btn-danger">
                {isDeleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
