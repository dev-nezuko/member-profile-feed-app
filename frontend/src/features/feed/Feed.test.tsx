import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { member, mockApi, renderApp, signIn } from '../../test/render';

const FEED = 'GET /profile/feed?page=1&limit=5';

describe('feed', () => {
  beforeEach(signIn);

  it('lists members with their interests and like counts', async () => {
    mockApi({ [FEED]: { body: [member('p1', 'Tamsin Vale', { likeCount: 3 }), member('p2', 'Ilse Marrow')] } });
    renderApp('/');
    const card = (await screen.findByRole('heading', { name: 'Tamsin Vale' })).closest('article')!;
    expect(within(card).getByText(/maps/)).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: /Like Tamsin Vale/ })).toHaveTextContent('3');
    expect(screen.getByRole('heading', { name: 'Ilse Marrow' })).toBeInTheDocument();
  });

  it('uses the count the API returns after a like', async () => {
    mockApi({
      [FEED]: { body: [member('p1', 'Tamsin Vale', { likeCount: 4 })] },
      'POST /profile/p1/like': { body: { likeCount: 7, likedByCurrentUser: true } },
    });
    const { user } = renderApp('/');
    const button = await screen.findByRole('button', { name: /Like Tamsin Vale/ });
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveTextContent('7');
  });

  it('keeps the old state and explains when a like fails', async () => {
    mockApi({
      [FEED]: { body: [member('p1', 'Tamsin Vale', { likeCount: 1, likedByCurrentUser: true })] },
      'DELETE /profile/p1/unlike': { status: 500, body: { error: 'Request could not be completed' } },
    });
    const { user } = renderApp('/');
    const button = await screen.findByRole('button', { name: /Like Tamsin Vale/ });
    await user.click(button);
    expect(await screen.findByRole('alert')).toHaveTextContent('Your change was not saved');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveTextContent('1');
  });

  it('loads the next page and offers a retry when loading fails', async () => {
    let failSecondPage = true;
    mockApi({
      [FEED]: { body: ['a', 'b', 'c', 'd', 'e'].map((id) => member(id, `Member ${id.toUpperCase()}`)) },
      'GET /profile/feed?page=2&limit=5': () => (failSecondPage
        ? { status: 500, body: { error: 'Request could not be completed' } }
        : { body: [member('f', 'Member F')] }),
    });
    const { user } = renderApp('/');
    await user.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
    failSecondPage = false;
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: 'Member F' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(6);
  });
});
