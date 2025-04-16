import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi, renderApp, signIn } from '../../test/render';
import { authReducer, signedIn, signedOut } from './authSlice';

describe('auth slice', () => {
  it('persists the session on sign-in and clears it on sign-out', () => {
    const state = authReducer(undefined, signedIn({ token: 't', userId: 'u' }));
    expect(state.session).toEqual({ token: 't', userId: 'u' });
    expect(localStorage.getItem('token')).toBe('t');
    expect(authReducer(state, signedOut()).session).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
  });
});

describe('login and signup', () => {
  it('sends signed-out visitors to the login page', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
  });

  it('logs in, stores the session and opens the profile page', async () => {
    const calls = mockApi({
      'POST /auth/login': { body: { token: 'fresh-token', userId: 'member-1' } },
      'GET /profile/me': { status: 404, body: { error: 'Profile not found' } },
    });
    const { user, store } = renderApp('/login');
    await user.type(screen.getByLabelText('Email'), 'rowan@example.test');
    await user.type(screen.getByLabelText('Password'), 'local-test-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('heading', { name: 'Create your profile' })).toBeInTheDocument();
    expect(store.getState().auth.session).toEqual({ token: 'fresh-token', userId: 'member-1' });
    expect(await calls[0].request.json()).toEqual({ email: 'rowan@example.test', password: 'local-test-password' });
    expect(calls[1].request.headers.get('Authorization')).toBe('Bearer fresh-token');
  });

  it('shows the API error inline when signup fails', async () => {
    mockApi({ 'POST /auth/signup': { status: 409, body: { error: 'An account with this email already exists' } } });
    const { user } = renderApp('/signup');
    await user.type(screen.getByLabelText('Email'), 'rowan@example.test');
    await user.type(screen.getByLabelText('Password'), 'local-test-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('An account with this email already exists');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('logging out forgets the session and every cached response', async () => {
    signIn();
    mockApi({ 'GET /profile/feed?page=1&limit=5': { body: [] } });
    const { user, store } = renderApp('/');
    expect(await screen.findByText('No member profiles yet.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(screen.getByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
    expect(store.getState().auth.session).toBeNull();
    expect(store.getState().api.queries).toEqual({});
  });

  it('an expired token on a protected call ends the session', async () => {
    signIn();
    mockApi({ 'GET /profile/feed?page=1&limit=5': { status: 401, body: { error: 'Invalid or expired token' } } });
    const { store } = renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
    expect(store.getState().auth.session).toBeNull();
  });
});
