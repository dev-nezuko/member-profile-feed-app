import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppRoutes } from '../App';
import { makeStore } from '../app/store';

export interface MockRoute { status?: number; body?: unknown; }
export type Routes = Record<string, MockRoute | ((request: Request) => MockRoute)>;

export interface Call { method: string; path: string; request: Request; }

/** Stubs fetch with a table keyed by "METHOD /path?query" relative to the API base URL. */
export function mockApi(routes: Routes) {
  const calls: Call[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: Request) => {
    const url = new URL(input.url);
    const path = url.pathname.replace(/^\/api/, '') + url.search;
    const key = `${input.method} ${path}`;
    calls.push({ method: input.method, path, request: input });
    const route = routes[key];
    if (!route) throw new Error(`Unexpected request ${key}`);
    const { status = 200, body = {} } = typeof route === 'function' ? route(input) : route;
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  }));
  return calls;
}

export function signIn() {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('userId', 'member-1');
}

export function renderApp(path: string) {
  const store = makeStore();
  const user = userEvent.setup();
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  );
  return { store, user, ...view };
}

export const member = (id: string, name: string, extra: Record<string, unknown> = {}) => ({
  id, name, headline: `${name}'s headline`, bio: `${name} writes a short bio.`, photoUrl: null,
  interests: ['maps', 'tea'], likeCount: 0, likedByCurrentUser: false, ...extra,
});
