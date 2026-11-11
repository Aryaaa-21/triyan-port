import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Waitlist } from './waitlist';
import { ShirtSilhouette } from './silhouette';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const fillAndSubmit = (email: string, consent: boolean) => {
  const input = screen.getByPlaceholderText('your email');
  fireEvent.change(input, { target: { value: email } });
  const box = screen.getByRole('checkbox') as HTMLInputElement;
  if (box.checked !== consent) fireEvent.click(box);
  fireEvent.submit(input.closest('form')!);
};

describe('Waitlist', () => {
  it('joins with an address and explicit consent', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: { joined: true } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    render(<Waitlist />);
    fillAndSubmit('Reader@Example.test', true);
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/entered/i));
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/public/waitlist');
    expect(JSON.parse(String(init.body))).toMatchObject({
      email: 'reader@example.test',
      consent: true,
    });
  });

  it('asks for consent before sending anything', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    render(<Waitlist />);
    fillAndSubmit('reader@example.test', false);
    expect(screen.getByRole('alert').textContent).toMatch(/tick the box/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects an incomplete address', () => {
    vi.stubGlobal('fetch', vi.fn());
    render(<Waitlist />);
    fillAndSubmit('nope', true);
    expect(screen.getByRole('alert').textContent).toMatch(/complete/i);
  });

  it('reports a failure instead of pretending to succeed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })));
    render(<Waitlist />);
    fillAndSubmit('reader@example.test', true);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/could not/i));
    expect(screen.queryByText(/you have entered/i)).toBeNull();
  });

  it('is visibly closed, and sends nothing, when not open', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    render(<Waitlist open={false} />);
    expect((screen.getByRole('button', { name: /join/i }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getByText(/not open yet/i)).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('ShirtSilhouette', () => {
  it('is described as a drawing of a shape, not a product', () => {
    render(<ShirtSilhouette />);
    expect(screen.getByRole('img', { name: /line drawing/i })).toBeTruthy();
  });
});
