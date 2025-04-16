import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteProfileMutation
} from '../../services/api';
import { useState, useEffect } from 'react';

export default function Profile() {
  const { data, isLoading } = useGetProfileQuery(undefined);
  const [updateProfile] = useUpdateProfileMutation();
  const [deleteProfile] = useDeleteProfileMutation();

  const [form, setForm] = useState<{
    name: string;
    bio: string;
    headline: string;
    interests: string;
    photoFile?: File;
    photoUrl?: string;
  }>({
    name: '',
    bio: '',
    headline: '',
    interests: '',
    photoUrl: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || '',
        bio: data.bio || '',
        headline: data.headline || '',
        interests: data.interests?.join(', ') || '',
        photoUrl: data.photoUrl || '',
      });
    }
  }, [data]);

  useEffect(() => {
    if (successMessage) {
      setSuccessMessage('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('headline', form.headline);
    formData.append('bio', form.bio);
    formData.append('interests', form.interests);

    if (form.photoFile) {
      formData.append('photo', form.photoFile);
    }

    try {
      await updateProfile(formData);
      setSuccessMessage('Profile saved successfully!');
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    await deleteProfile(undefined);
    setForm({
      name: '',
      bio: '',
      headline: '',
      interests: '',
      photoFile: undefined,
      photoUrl: '',
    });
    setConfirmDelete(false);
  };

  return isLoading ? (
    <p className='p-6'>Loading...</p>
  ) : (
    <div className='max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded-lg'>
      <h2 className='text-2xl font-bold mb-6'>Your Profile</h2>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <input
          className='w-full border rounded px-3 py-2'
          placeholder='Name'
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className='w-full border rounded px-3 py-2'
          placeholder='Headline'
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
        />
        <textarea
          className='w-full border rounded px-3 py-2'
          placeholder='Bio'
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
        <input
          className='w-full border rounded px-3 py-2'
          placeholder='Interests (comma separated)'
          value={form.interests}
          onChange={(e) => setForm({ ...form, interests: e.target.value })}
        />
        <div>
          <label
            htmlFor='photo'
            className='block cursor-pointer w-24 h-24 rounded overflow-hidden border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:border-blue-500 transition'
          >
            {form.photoFile ? (
              <img src={URL.createObjectURL(form.photoFile)} alt='Preview' className='object-cover w-full h-full' />
            ) : form.photoUrl ? (
              <img src={form.photoUrl} alt='Saved' className='object-cover w-full h-full' />
            ) : (
              <span className='text-sm text-gray-400'>Upload</span>
            )}
          </label>
          <input
            id='photo'
            type='file'
            accept='image/*'
            className='hidden'
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setForm((prev) => ({ ...prev, photoFile: file }));
              }
            }}
          />
        </div>

        {successMessage && (
          <div className='text-green-600 text-sm font-medium'>{successMessage}</div>
        )}

        <div className='flex space-x-3 pt-4'>
          <button
            type='submit'
            className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center'
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : null}
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>

          <button
            type='button'
            onClick={() => setConfirmDelete(true)}
            className='bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600'
          >
            Delete
          </button>
        </div>
      </form>

      {confirmDelete && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-96 text-center'>
            <h3 className='text-lg font-semibold mb-4'>Are you sure?</h3>
            <p className='text-gray-600 mb-6'>This will permanently delete your profile.</p>
            <div className='flex justify-center space-x-4'>
              <button
                onClick={handleDelete}
                className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700'
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className='bg-gray-300 px-4 py-2 rounded hover:bg-gray-400'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
