import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockApi, renderApp, signIn } from '../../test/render';

const saved = { id: 'p1', name: 'Rowan Ellery', headline: 'Ceramicist', bio: 'Throws stoneware.', interests: ['clay', 'kilns'], photoUrl: null };

describe('profile page', () => {
  beforeEach(signIn);

  it('fills the form from the saved profile', async () => {
    mockApi({ 'GET /profile/me': { body: saved } });
    renderApp('/profile');
    expect(await screen.findByLabelText('Name')).toHaveValue('Rowan Ellery');
    expect(screen.getByLabelText('Interests, separated by commas')).toHaveValue('clay, kilns');
  });

  it('creates a profile and confirms the save', async () => {
    let exists = false;
    const calls = mockApi({
      'GET /profile/me': () => (exists ? { body: saved } : { status: 404, body: { error: 'Profile not found' } }),
      'POST /profile': () => { exists = true; return { body: saved }; },
    });
    const { user } = renderApp('/profile');
    await user.type(await screen.findByLabelText('Name'), 'Rowan Ellery');
    await user.type(screen.getByLabelText('Interests, separated by commas'), 'clay, kilns');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Profile saved.');
    const post = calls.find((call) => call.method === 'POST')!;
    const body = await post.request.formData();
    expect(body.get('name')).toBe('Rowan Ellery');
    expect(body.get('interests')).toBe('clay, kilns');
    expect(await screen.findByRole('heading', { name: 'Your profile' })).toBeInTheDocument();
  });

  it('keeps the draft when the save is rejected', async () => {
    mockApi({
      'GET /profile/me': { body: saved },
      'POST /profile': { status: 400, body: { error: 'Invalid profile fields' } },
    });
    const { user } = renderApp('/profile');
    const headline = await screen.findByLabelText('Headline');
    await user.clear(headline);
    await user.type(headline, 'Potter');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid profile fields');
    expect(headline).toHaveValue('Potter');
  });

  it('asks before deleting and then shows an empty form', async () => {
    let exists = true;
    mockApi({
      'GET /profile/me': () => (exists ? { body: saved } : { status: 404, body: { error: 'Profile not found' } }),
      'DELETE /profile': () => { exists = false; return { body: { message: 'Deleted' } }; },
    });
    const { user } = renderApp('/profile');
    await user.click(await screen.findByRole('button', { name: 'Delete profile' }));
    expect(screen.getByRole('alertdialog', { name: 'Delete your profile?' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete profile' }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));
    expect(await screen.findByRole('heading', { name: 'Create your profile' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });
});
